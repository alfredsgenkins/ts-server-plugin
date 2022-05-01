import ts from "typescript/lib/tsserverlibrary";
import { getCommentAtPosition } from './declaration';
import { Ctx } from "./util/context";
import {
    pluginNodeReferenceEntries,
    getNamespacePluginsReferences,
    implementationNodeReferenceEntries
} from "./reference";

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

        return proxy;
    }

    return { create };
}

export = init;
