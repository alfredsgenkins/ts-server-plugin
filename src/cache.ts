import ts from "typescript/lib/tsserverlibrary";
import { NamespaceDeclaration } from "./declaration";
import { NamespaceReference } from "./reference";
import { ClassPluginTypes, CLASS_PLUGIN_METHOD_TYPE, CLASS_PLUGIN_PROPERTY_TYPE, CLASS_PLUGIN_STATIC_TYPE, FUNCTION_PLUGIN_TYPE } from "./util/config";
import { Ctx } from "./util/context";
import { getAllThemeFiles } from "./util/parent-theme";

type DeclarationCacheMap = Record<string, NamespaceDeclaration>;
type ReferenceCacheMap = Record<string, Array<NamespaceReference>>;
type FileToNamespaceMap = Record<string, Array<NamespaceReference | NamespaceDeclaration>>;

export class Cache {
    ctx: Ctx;
    mosaicSourceFiles: ts.SourceFile[] | undefined;
    mosaicProgram: ts.Program | undefined;

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

    getProgramSourceFiles(): readonly ts.SourceFile[] {
        const program = this.ctx.info.project.getLanguageService().getProgram();
        if (!program) return [];
        const sourceFiles = program.getSourceFiles();
        if (!sourceFiles) return [];
        return sourceFiles;
    }

    getSourceFileByPath(fileName: string, tryCount = 0): ts.SourceFile | undefined {
        const program = this.ctx.info.project.getLanguageService().getProgram();
        if (!program || tryCount > 1) return;
        // ^^^ Allow only one try to get the source file

        const sourceFile = program.getSourceFile(fileName);

        if (sourceFile) {
            return sourceFile;
        }

        // vvv Add file as new source file
        this.ctx.info.project.addMissingFileRoot(fileName as ts.server.NormalizedPath);

        return this.getSourceFileByPath(fileName, tryCount + 1);
    }

    getMosaicSourceFiles(): ts.SourceFile[] {
        if (this.mosaicSourceFiles) {
            return this.mosaicSourceFiles;
        }

        const program = this.ctx.info.project.getLanguageService().getProgram();
        if (!program) return [];

        const themeFiles = getAllThemeFiles(program.getCurrentDirectory());

        const moreSourceFiles = themeFiles.reduce((acc, fileName) => {
            const sourceFile = this.getSourceFileByPath(fileName);

            if (!sourceFile) {
                return acc;
            }

            return[...acc, sourceFile];
        }, [] as ts.SourceFile[]);

        this.mosaicSourceFiles = moreSourceFiles;

        return this.mosaicSourceFiles;
    }

    getAllSourceFiles(): ts.SourceFile[] {
        return [
            ...this.getMosaicSourceFiles(),
            ...this.getProgramSourceFiles()
        ];
    }

    cacheAllFiles(): void {
        const allSourceFiles = this.getAllSourceFiles();

        if (allSourceFiles.length > 0) {
            this.hasCachedAll = true;
        }

        for (const sourceFile of allSourceFiles) {
            this.refreshBySourceFile(sourceFile);
        }
    }

    refreshBySourceFile(sourceFile: ts.SourceFile): void {
        const fileName = sourceFile.fileName;
        const prevDecOrRef = this.fileToNamespaceMap[fileName] || [];

        // vvv flush reference/declaration cache based on previous references in this file
        prevDecOrRef.forEach((decOrRef) => {
            const isRef = decOrRef instanceof NamespaceReference;
            const namespace = decOrRef.getNamespaceString();

            // vvv Flush declaration cache
            if (!isRef) {
                delete this.declarationMap[namespace];
                return;
            }

            if (!this.referenceMap[namespace]) {
                // ^^^ This namespace no longer exists ?
                // (fixed by caching namespace)
                return;
            }

            // vvv Flush reference cache (filter out ones not matching the current)
            this.referenceMap[namespace] = this.referenceMap[namespace].filter((ref) => {
                const isNotSameRef = ref !== decOrRef;
                return isNotSameRef;
            })
        })

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
                if (!namespaceNode.parent) {
                    return;
                }

                // vvv constructing from namespace node parent (PA node), to get only one plugin from all constructable targets
                const plugin = NamespaceReference.constructFromKnownPANode(this.ctx, namespaceNode.parent);

                if (!plugin) {
                    return;
                }

                plugins.push(plugin);

                // vvv need to check if node we constructed plugin is a real reference
                const prevValue = this.referenceMap[plugin.getNamespaceString()] || [];
                this.referenceMap[plugin.getNamespaceString()] = [...prevValue, plugin];
            });

            this.fileToNamespaceMap[fileName] = plugins;

            return;
        }

        // vvv This is NOT a plugin
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
                this.declarationMap[comment.getNamespaceString()] = comment;
            }
        })

        this.fileToNamespaceMap[fileName] = comments;
    }

    refreshFileCache(fileName: string) {
        const sourceFiles = this.getAllSourceFiles();
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

    getDiagnosticsByFile(fileName: string): ts.Diagnostic[] {
        const refsOrDecs = this.fileToNamespaceMap[fileName] || [];

        const diagnostics = refsOrDecs.reduce((
            acc: ts.Diagnostic[],
            refOrDec: NamespaceDeclaration | NamespaceReference
        ) => {
            if (refOrDec instanceof NamespaceDeclaration) {
                return acc;
            }

            const namespace = refOrDec.getNamespaceString();
            const declaration = this.getDeclarationByNamespace(namespace);
            const sourceFile = refOrDec.getNamespace()?.getSourceFile();
            if (!sourceFile) return acc;
            const textSpan = refOrDec.getNamespaceTextSpan();
            if (!textSpan) return acc;

            // TODO: implement config mapping, to validate methods

            if (!declaration) {
                return [
                    ...acc,
                    {
                        category: ts.DiagnosticCategory.Warning,
                        file: sourceFile,
                        messageText: "Such namespace is not declared",
                        code: 191919,
                        ...textSpan
                    }
                ];
            }

            const { config } = refOrDec;
            if (!config) return acc;
            if (config[FUNCTION_PLUGIN_TYPE]) return acc;

            const typeDiagnostics = [
                CLASS_PLUGIN_PROPERTY_TYPE,
                CLASS_PLUGIN_METHOD_TYPE,
                CLASS_PLUGIN_STATIC_TYPE,
            ].reduce((acc, type) => {
                const methodMap = config[type as ClassPluginTypes];

                const methodDiagnostics = Object.entries(methodMap).reduce(
                    (cAcc, [methodName, referenceMethod]) => {
                        const methodDec = declaration.getNodeByTargetConfig({
                            type: type as ClassPluginTypes,
                            name: methodName
                        });

                        if (!methodDec) {
                            return [
                                ...cAcc,
                                {
                                    start: referenceMethod.getStart(),
                                    length: referenceMethod.getText().length,
                                    category: ts.DiagnosticCategory.Warning,
                                    file: sourceFile,
                                    code: 191920,
                                    messageText: `Such method or property is not declared`
                                }
                            ];
                        }

                        return cAcc;
                    },
                    [] as ts.Diagnostic[]
                )

                return [...acc, ...methodDiagnostics];
            }, [] as ts.Diagnostic[]);

            return [...acc, ...typeDiagnostics];
        }, [] as ts.Diagnostic[]);

        return diagnostics;
    }
}