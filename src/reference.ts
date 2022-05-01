import ts from "typescript/lib/tsserverlibrary";
import { NamespaceDeclaration } from "./declaration";
import { Ctx } from "./util/context";
import {
    CLASS_PLUGIN_METHOD_TYPE,
    CLASS_PLUGIN_PROPERTY_TYPE,
    CLASS_PLUGIN_STATIC_TYPE,
    FUNCTION_PLUGIN_TYPE,
    createNewPluginReferenceConfig,
    PluginReferenceConfig,
    PluginTargetConfig
} from "./util/config";

export class NamespaceReference {
    node: ts.Node;
    ctx: Ctx;
    config: PluginReferenceConfig;

    namespace?: ts.Node;

    constructor(ctx: Ctx, node: ts.Node, config: PluginReferenceConfig) {
        this.node = node;
        this.ctx = ctx;
        this.config = config;
    }

    getNamespaceString(): string {
        const namespace = this.getNamespace();

        if (!namespace) {
            return '';
        }

        // this removes all quotes
        return namespace.getText().replace(/['"]/gm, '');
    }

    getNamespace(): ts.Node | undefined {
        if (this.namespace) {
            return this.namespace
        }

        const [namespace] = this.ctx.nodeUtils.getNodeChildByCondition(
            this.node,
            (node) => (
                node.kind === ts.SyntaxKind.StringLiteral
                || node.kind === ts.SyntaxKind.Identifier
            ),
            1 // look for the first child only
        );

        this.namespace = namespace;
        return namespace;
    }

    getNamespaceReference(): ts.ReferenceEntry | undefined {
        const namespace = this.getNamespace();
        if (!namespace) return undefined;

        return this.ctx.nodeUtils.getReferenceForNode(
            namespace,
            (node: ts.Node): ts.TextSpan | undefined => {
                if (!node) {
                    return undefined;
                }

                const nIndex = node.getFullText().indexOf(node.getText());

                return {
                    start: node.pos + nIndex,
                    length: node.getText().length
                }
            }
        );
    }

    getImplDecReferenceByTargetConfig(targetConfig: PluginTargetConfig): ts.ReferenceEntry | undefined {
        const node = this.getImplDecByTargetConfig(targetConfig);
        if (!node) return undefined;
        return this.ctx.nodeUtils.getReferenceForNode(node);
    }

    getImplDecByTargetConfig(targetConfig: PluginTargetConfig): ts.Node | undefined {
        const { type, name } = targetConfig;
        const lookupResult = this.config[type];

        if (!lookupResult) {
            return undefined;
        }

        if (type === FUNCTION_PLUGIN_TYPE) {
            return this.config[type];
        }

        return this.config[type][name];
    }

    getTargetConfigForNode(lookupNode: ts.Node): PluginTargetConfig | undefined {
        const classMethodEntry = Object.entries(this.config[CLASS_PLUGIN_METHOD_TYPE]).find(([_, node]) => node === lookupNode);

        if (classMethodEntry) {
            return { type: CLASS_PLUGIN_METHOD_TYPE, name: classMethodEntry[0] };
        }

        const classPropertyEntry = Object.entries(this.config[CLASS_PLUGIN_PROPERTY_TYPE]).find(([_, node]) => node === lookupNode);

        if (classPropertyEntry) {
            return { type: CLASS_PLUGIN_PROPERTY_TYPE, name: classPropertyEntry[0] };
        }

        const classStaticEntry = Object.entries(this.config[CLASS_PLUGIN_STATIC_TYPE]).find(([_, node]) => node === lookupNode);

        if (classStaticEntry) {
            return { type: CLASS_PLUGIN_STATIC_TYPE, name: classStaticEntry[0] };
        }

        if (lookupNode === this.config[FUNCTION_PLUGIN_TYPE]) {
            return { type: FUNCTION_PLUGIN_TYPE, name: 'unknown' };
        }

        return undefined;
    }

    static constructFromNode(ctx: Ctx, node: ts.Node): NamespaceReference | undefined {
        // We need to find a property assignment,
        // which has another property assignment inside
        // which has an identifier (of member-* or function)

        let pluginReferenceConfig: PluginReferenceConfig = createNewPluginReferenceConfig();

        const pluginNamespaceDeclaration = ctx.nodeUtils.getParentNodeByCondition(node, (namespacePANode) => {
            const isPropertyAssignment = namespacePANode.kind === ts.SyntaxKind.PropertyAssignment;

            if (!isPropertyAssignment) {
                return false;
            }

            pluginReferenceConfig = createNewPluginReferenceConfig();
            // ^^^ reset for each parent (previous was not correct)

            const pluginTypeDeclarations = ctx.nodeUtils.getNodeChildByCondition(namespacePANode, (typePANode) => {
                const isPropertyAssignment = typePANode.kind === ts.SyntaxKind.PropertyAssignment;

                if (!isPropertyAssignment) {
                    return false;
                }

                const pluginTypeDeclarations = typePANode.getChildren().find((typeIdentifierNode) => {
                    const isIdentifier = typeIdentifierNode.kind === ts.SyntaxKind.StringLiteral
                        || typeIdentifierNode.kind === ts.SyntaxKind.Identifier;

                    if (!isIdentifier) {
                        return false;
                    }

                    const typeIdentifier = typeIdentifierNode.getText().replace(/['"]/gm, '');

                    if (typeIdentifier === FUNCTION_PLUGIN_TYPE) {
                        // ^^^ can only then be a function
                        pluginReferenceConfig[FUNCTION_PLUGIN_TYPE] = typeIdentifierNode;
                        return true;
                    }

                    if (
                        typeIdentifier === CLASS_PLUGIN_METHOD_TYPE
                        || typeIdentifier === CLASS_PLUGIN_PROPERTY_TYPE
                        || typeIdentifier === CLASS_PLUGIN_STATIC_TYPE
                    ) {
                        // vvv lookup pNode for plugin implementation references
                        const childMethodAssignments = ctx.nodeUtils.getNodeChildByCondition(typePANode, (implementationPANode) => {
                            const isPropertyAssignment = implementationPANode.kind === ts.SyntaxKind.PropertyAssignment;

                            if (!isPropertyAssignment) {
                                return false;
                            }

                            const pluginImplementationDeclarationNodes = implementationPANode.getChildren().find((implementationDeclarationNode) => {
                                const isIdentifier = implementationDeclarationNode.kind === ts.SyntaxKind.StringLiteral
                                    || implementationDeclarationNode.kind === ts.SyntaxKind.Identifier;

                                if (!isIdentifier) {
                                    return false;
                                }

                                const implementationDeclaration = implementationDeclarationNode.getText().replace(/['"]/gm, '');
                                pluginReferenceConfig[typeIdentifier][implementationDeclaration] = implementationDeclarationNode;

                                return true;
                            });

                            return !!pluginImplementationDeclarationNodes;
                        }, 3, false);

                        return childMethodAssignments.length > 0;
                    }

                    return false;
                });

                if (!pluginTypeDeclarations) {
                    return false;
                }

                return true;
            }, 3, false);

            return pluginTypeDeclarations.length > 0;
        });

        if (!pluginNamespaceDeclaration) return undefined;

        return new NamespaceReference(ctx, pluginNamespaceDeclaration, pluginReferenceConfig);
    }
}

export const getPluginsForNamespace = (ctx: Ctx, comment: NamespaceDeclaration): NamespaceReference[] => {
    const namespace = comment.getNamespace();

    const program = ctx.info.project.getLanguageService().getProgram();
    if (!program) return [];

    const sourceFiles = program.getSourceFiles();
    if (!sourceFiles) return [];

    const pluginFiles = sourceFiles.filter((sourceFile) => sourceFile.fileName.includes('.plugin'));
    if (!pluginFiles.length) return [];

    const plugins: NamespaceReference[] = [];

    for (const pluginFile of pluginFiles) {
        const namespaceNode = ctx.nodeUtils.getNodeChildByCondition(pluginFile, (node) => (
            (
                node.kind === ts.SyntaxKind.StringLiteral
                || node.kind === ts.SyntaxKind.Identifier
                // ^^^ is StringLiteral or Identifier
            ) && node.getText().indexOf(namespace) !== -1
        ));

        if (!namespaceNode.length) continue;

        let plugin: NamespaceReference | undefined;
        let i = 0;

        while (!plugin && i < namespaceNode.length) {
            // vvv constructing from node to ensure validation
            plugin = NamespaceReference.constructFromNode(ctx, namespaceNode[i]);
            i++;
        }

        if (!plugin) continue;

        plugins.push(plugin);
    }

    return plugins;
};

export const getNamespacePluginsReferences = (ctx: Ctx, comment: NamespaceDeclaration): ts.ReferencedSymbol[] => {
    const plugins = getPluginsForNamespace(ctx, comment);
    const validPluginReferences: ts.ReferencedSymbol[] = [];

    for (const plugin of plugins) {
        const reference = plugin.getNamespaceReference();

        if (!reference) {
            continue;
        }

        validPluginReferences.push({
            references: [reference],
            definition: {
                ...comment.getDefinition(),
                displayParts: comment.getDisplayParts()
            }
        });
    }

    return validPluginReferences;
}

export const pluginNodeReferenceEntries = (ctx: Ctx, node: ts.Node): ts.ReferenceEntry[] => {
    const references: ts.ReferenceEntry[] = [];

    const comment = NamespaceDeclaration.constructFromNode(ctx, node);
    if (!comment) return references;

    const targetConfig = comment.getTargetConfigForNode(node);
    if (!targetConfig) return references;

    const plugins = getPluginsForNamespace(ctx, comment);
    if (!plugins.length) return references;

    for (const plugin of plugins) {
        const reference = plugin.getImplDecReferenceByTargetConfig(targetConfig);
        if (!reference) continue;

        references.push(reference);
    }

    return references;
};

export const implementationNodeReferenceEntries = (ctx: Ctx, node: ts.Node): ts.ReferenceEntry[] => {
    const references: ts.ReferenceEntry[] = [];
    const plugin = NamespaceReference.constructFromNode(ctx, node);
    if (!plugin) return references;
    const namespace = plugin.getNamespaceString();
    if (!namespace) return references;
    const program = ctx.info.project.getLanguageService().getProgram();
    if (!program) return references;
    const sourceFiles = program.getSourceFiles();
    if (!sourceFiles) return references;
    const targetConfig = plugin.getTargetConfigForNode(node);

    for (const sourceFile of sourceFiles) {
        const nsMatch = new RegExp(`@namespace\\s+${namespace}`).exec(sourceFile.getFullText());
        if (!nsMatch) continue;

        const nsMatchString = nsMatch[0];
        const nsIndex = nsMatch.index + nsMatchString.indexOf(namespace);
        const nsDeclarationNode = ctx.nodeUtils.getFileNodeAtPosition(sourceFile.fileName, nsIndex);
        if (!nsDeclarationNode) continue;
        const nsDeclaration = NamespaceDeclaration.constructFromNode(ctx, nsDeclarationNode);
        if (!nsDeclaration) continue;

        let reference = undefined;

        if (!targetConfig) {
            const isNamespaceNode = node.getText().indexOf(namespace) !== -1;
            if (!isNamespaceNode) continue;
            reference = nsDeclaration.getNamespaceReference();
        } else {
            const nodeToReference = nsDeclaration.getNodeByTargetConfig(targetConfig);
            if (!nodeToReference) continue;
            reference = ctx.nodeUtils.getReferenceForNode(nodeToReference);
        }

        if (!reference) continue;
        references.push(reference);
    }

    return references;
};