import ts from "typescript/lib/tsserverlibrary";
import { getCommentAtPosition } from './comment';
import { Ctx } from "./context";
import {
    pluginNodeReferenceEntries,
    getNamespacePluginsReferences,
    implementationNodeReferenceEntries
} from "./plugins";

function init() {
    function create(info: ts.server.PluginCreateInfo) {
        const ctx = new Ctx(info);

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

        proxy.findReferences = (fileName: string, position: number): ts.ReferencedSymbol[] | undefined => {
            const prior = info.languageService.findReferences(fileName, position);

            const comment = getCommentAtPosition(ctx, fileName, position);
            if (comment) return getNamespacePluginsReferences(ctx, comment);

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
                    ...pluginNodeReferenceEntries(ctx, node),
                    ...implementationNodeReferenceEntries(ctx, node)
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

        // proxy.getQuickInfoAtPosition = (fileName: string, position: number): ts.QuickInfo | undefined => {
        //     const prior = info.languageService.getQuickInfoAtPosition(fileName, position);
        //     if (prior) return prior; // <-- do not proxy, if element is recognized

        //     const comment = getCommentAtPosition(ctx, fileName, position);
        //     if (!comment) return undefined; // <-- this is not a comment, skip

        //     return comment.getQuickInfo();
        // }

        // proxy.getDocumentHighlights = (fileName: string, position: number, filesToSearch: string[]): ts.DocumentHighlights[] | undefined => {
        //     const prior = info.languageService.getDocumentHighlights(fileName, position, filesToSearch);
        //     if (prior) return prior; // <-- do not proxy, if element is recognized

        //     const comment = getCommentAtPosition(ctx, fileName, position);
        //     if (!comment) return undefined; // <-- this is not a comment, skip

        //     return [{
        //         fileName: fileName,
        //         highlightSpans: [{
        //             textSpan: comment.getTextSpan(),
        //             kind: ts.HighlightSpanKind.reference
        //         }]
        //     }];
        // };

        return proxy;
    }

    return { create };
}

export = init;
