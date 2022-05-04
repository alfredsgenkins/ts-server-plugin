import ts from "typescript/lib/tsserverlibrary";
import { NamespaceDeclaration } from "./declaration";
import { NamespaceReference } from "./reference";
import { Ctx } from "./util/context";

type DeclarationCacheMap = Record<string, NamespaceDeclaration>;
type ReferenceCacheMap = Record<string, Array<NamespaceReference>>;
type FileToNamespaceMap = Record<string, Array<NamespaceReference | NamespaceDeclaration>>;

export class Cache {
    ctx: Ctx;

    hasCachedAll = false;

    declarationMap: DeclarationCacheMap = {};
    referenceMap: ReferenceCacheMap = {};
    fileToNamespaceMap: FileToNamespaceMap = {};

    // (cache) Lookup plugins by namespace
    // Provide error diagnostics (lookup plugins by namespace)
    // Update cache by filename

    constructor(
        ctx: Ctx
    ) {
        this.ctx = ctx;
    }

    cacheAllFiles(): void {
        const program = this.ctx.info.project.getLanguageService().getProgram();
        if (!program) return;
        const sourceFiles = program.getSourceFiles();
        if (!sourceFiles) return;

        if (sourceFiles.length > 0) {
            this.hasCachedAll = true;
        }

        for (const sourceFile of sourceFiles) {
            this.refreshBySourceFile(sourceFile);
        }
    }

    refreshBySourceFile(sourceFile: ts.SourceFile) {
        const fileName = sourceFile.fileName;

        if (fileName.indexOf('.plugin') !== -1) {
            // ^^^ This is a plugin
            const namespaceNodes = this.ctx.nodeUtils.getNodeChildByCondition(sourceFile, (node) => (
                ts.isStringLiteral(node)
                || ts.isIdentifier(node)
                // ^^^ is StringLiteral or Identifier
            ));

            if (!namespaceNodes.length) return;

            const plugins: NamespaceReference[] = [];

            namespaceNodes.forEach((namespaceNode) => {
                // vvv constructing from node to ensure validation
                const plugin = NamespaceReference.constructFromNode(this.ctx, namespaceNode);

                if (plugin) {
                    plugins.push(plugin);
                    const prevValue = this.referenceMap[plugin.getNamespaceString()] || [];
                    this.referenceMap[plugin.getNamespaceString()] = [...prevValue, plugin];
                }
            });

            const prevValue = this.fileToNamespaceMap[fileName] || [];
            this.fileToNamespaceMap[fileName] = [...prevValue, ...plugins];

            return;
        }

        // ^^^ This is a plugin
        const commentNodes = this.ctx.nodeUtils.getNodeChildByCondition(sourceFile, (node) => (
            node.kind === ts.SyntaxKind.JSDocTag
            && (node as ts.JSDocTag).tagName.escapedText === "namespace"
            // ^^^ is JSDoc namespace comment
        ));

        if (!commentNodes.length) return;

        const comments: NamespaceDeclaration[] = [];

        commentNodes.forEach((commentNode) => {
            // vvv constructing from node to ensure validation
            const comment = NamespaceDeclaration.constructFromNode(this.ctx, commentNode);

            if (comment) {
                comments.push(comment);
                this.declarationMap[comment.getNamespace()] = comment;
            }
        })

        const prevValue = this.fileToNamespaceMap[fileName] || [];
        this.fileToNamespaceMap[fileName] = [...prevValue, ...comments];
    }

    refreshFileCache(fileName: string) {
        const program = this.ctx.info.project.getLanguageService().getProgram();
        if (!program) return;
        const sourceFiles = program.getSourceFiles();
        if (!sourceFiles) return;
        const sourceFile = sourceFiles.find(s => s.fileName === fileName);
        if (!sourceFile) return;

        this.refreshBySourceFile(sourceFile);
    }

    getReferencesByNamespace(namespace: string): NamespaceReference[] {
        if (!this.hasCachedAll) {
            // ^^^ force cache all if not yet
            this.cacheAllFiles();
        }

        return this.referenceMap[namespace] || [];
    }

    getDeclarationByNamespace(namespace: string): NamespaceDeclaration {
        if (!this.hasCachedAll) {
            // ^^^ force cache all if not yet
            this.cacheAllFiles();
        }

        return this.declarationMap[namespace];
    }
}