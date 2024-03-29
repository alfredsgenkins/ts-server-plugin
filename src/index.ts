import ts from "typescript/lib/tsserverlibrary";
import {
    getCommentAtPosition,
    NamespaceDeclaration
} from './declaration';
import { Ctx } from "./util/context";
import {
    pluginNodeReferenceEntries,
    getNamespacePluginsReferences,
    implementationNodeReferenceEntries
} from "./reference";
import { Cache } from "./cache";
import { handleReferenceCompletions } from "./completions";

function init() {
    function create(info: ts.server.PluginCreateInfo) {
        const ctx = new Ctx(info);
        const cache = new Cache(ctx);

        // Diagnostic logging
        info.project.projectService.logger.info(
            "I'm getting set up now! Check the log for this message."
        );

        // ============================

        // Set up decorator object
        const proxy: ts.LanguageService = Object.create(null);
        for (let k of Object.keys(info.languageService) as Array<keyof ts.LanguageService>) {
            const x = info.languageService[k]!;
            // @ts-expect-error - JS runtime trickery which is tricky to type tersely
            proxy[k] = (...args: Array<{}>) => x.apply(info.languageService, args);
        }

        proxy.provideInlayHints = (fileName: string, span: ts.TextSpan): ts.InlayHint[] => {
            // vvv Ignore original inline hints
            return cache.getDeclarationInlayHintsForFile(fileName).filter((inlayHint) => {
                return inlayHint.position > span.start && inlayHint.position < span.start + span.length;
            });
        }

        proxy.getSemanticDiagnostics = (fileName: string): ts.Diagnostic[] => {
            const diagnostics = info.languageService.getSemanticDiagnostics(fileName);
            cache.refreshFileCache(fileName);
            return [...diagnostics, ...cache.getDiagnosticsByFile(fileName)];
        };

        proxy.findReferences = (fileName: string, position: number): ts.ReferencedSymbol[] | undefined => {
            const prior = info.languageService.findReferences(fileName, position);

            const comment = getCommentAtPosition(ctx, fileName, position);
            if (comment) return getNamespacePluginsReferences(ctx, cache, comment);

            if (!prior) return undefined;

            const additionalReferences: ts.ReferencedSymbol[] = [];

            for (let i = 0; i < prior.length; i++) {
                const { definition } = prior[i];
                const node = ctx.nodeUtils.getFileNodeAtPosition(
                    definition.fileName,
                    definition.textSpan.start
                );

                if (!node) continue;

                const definitionReferences = [
                    ...pluginNodeReferenceEntries(ctx, cache, node),
                    ...implementationNodeReferenceEntries(ctx, cache, node)
                ];

                definitionReferences.forEach((reference) => {
                    additionalReferences.push({
                        definition,
                        references: [reference]
                    });
                });
            }

            return [...prior, ...additionalReferences];
        };

        proxy.getDefinitionAndBoundSpan = (fileName: string, position: number, ...rest): ts.DefinitionInfoAndBoundSpan | undefined => {
            const prior = info.languageService.getDefinitionAndBoundSpan(fileName, position, ...rest);

            const comment = getCommentAtPosition(ctx, fileName, position);
            if (!comment) return prior; // <-- this is not a comment, skip

            return {
                textSpan: comment.getTextSpan(),
                definitions: [comment.getDefinition()]
            };
        };

        proxy.getCompletionsAtPosition = (
            fileName: string,
            position: number,
            ...rest
        ): ts.WithMetadata<ts.CompletionInfo> | undefined => {
            const prior = info.languageService.getCompletionsAtPosition(fileName, position, ...rest);
            return handleReferenceCompletions(fileName, position, prior, ctx, cache);
        }

        return proxy;
    }

    return { create };
}

export = init;
