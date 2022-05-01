import ts from "typescript/lib/tsserverlibrary";
import { Comment, getCommentForNode } from "./comment";
import { Ctx } from "./context";

export class NamespacePropertyAssignment {
    node: ts.Node;
    ctx: Ctx;

    namespace?: ts.Node;

    constructor(ctx: Ctx, node: ts.Node) {
        this.node = node;
        this.ctx = ctx;
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

    getTextSpan(): ts.TextSpan | undefined {
        const namespace = this.getNamespace();

        if (!namespace) {
            return undefined;
        }

        const nIndex = namespace.getFullText().indexOf(namespace.getText());

        return {
            start: namespace.pos + nIndex,
            length: namespace.getText().length
        }
    }

    getReference(): ts.ReferenceEntry | undefined {
        const textSpan = this.getTextSpan();

        if (!textSpan) {
            return undefined;
        }

        return {
            textSpan,
            fileName: this.node.getSourceFile().fileName,
            isWriteAccess: true, // TODO: get if this plugin is editable
            isDefinition: false,
        }
    }

    getMethodReference(name: string): ts.Node | undefined {
        const children = this.ctx.nodeUtils.getNodeChildByCondition(this.node.parent, (node) => (
            (
                node.kind === ts.SyntaxKind.StringLiteral
                || node.kind === ts.SyntaxKind.Identifier
            ) &&
            node.getText() === name
        ));

        return children[0];
    }

    static constructFromNode(ctx: Ctx, node: ts.Node): NamespacePropertyAssignment | undefined {
        // We need to find a property assignment,
        // which has another property assignment inside
        // which has an identifier (of member-* or function)

        const pluginNamespaceDeclaration = ctx.nodeUtils.getParentNodeByCondition(node, (namespacePANode) => {
            const isPropertyAssignment = namespacePANode.kind === ts.SyntaxKind.PropertyAssignment;

            if (!isPropertyAssignment) {
                return false;
            }

            const pluginTypeDeclarations = ctx.nodeUtils.getNodeChildByCondition(namespacePANode, (typePANode) => {
                const isPropertyAssignment = typePANode.kind === ts.SyntaxKind.PropertyAssignment;

                if (!isPropertyAssignment) {
                    return false;
                }

                const hasPluginTypeDeclaration = typePANode.getChildren().some((typeIdentifierNode) => {
                    const isIdentifier = typeIdentifierNode.kind === ts.SyntaxKind.StringLiteral
                        || typeIdentifierNode.kind === ts.SyntaxKind.Identifier;

                    if (!isIdentifier) {
                        return false;
                    }

                    const hasClassPropertyPlugins = !!typeIdentifierNode.getText().match(/^["']*(member-function|member-property|static-member)["']*$/gm);
                    // ^^^ is member-function, member-property or static-member

                    if (!hasClassPropertyPlugins) {
                        // ^^^ can only then be a function
                        const hasFunctionPlugins = !!typeIdentifierNode.getText().match(/^["']*(function)["']*$/gm);
                        return hasFunctionPlugins;
                    }

                    // lookup pNode for plugin implementation references
                    const childMethodAssignments = ctx.nodeUtils.getNodeChildByCondition(typePANode, (implementationPANode) => {
                        const isPropertyAssignment = implementationPANode.kind === ts.SyntaxKind.PropertyAssignment;
                        return isPropertyAssignment;
                    }, 3, false);

                    return childMethodAssignments.length > 0;
                });

                return hasPluginTypeDeclaration;
            }, 3, false);

            return pluginTypeDeclarations.length > 0;
        });

        if (!pluginNamespaceDeclaration) return undefined;

        return new NamespacePropertyAssignment(ctx, pluginNamespaceDeclaration);
    }
}

export const getPluginsForNamespace = (ctx: Ctx, comment: Comment): NamespacePropertyAssignment[] => {
    const namespace = comment.getNamespace();

    const program = ctx.info.project.getLanguageService().getProgram();
    if (!program) return [];

    const sourceFiles = program.getSourceFiles();
    if (!sourceFiles) return [];

    const pluginFiles = sourceFiles.filter((sourceFile) => sourceFile.fileName.includes('.plugin'));
    if (!pluginFiles.length) return [];

    const plugins: NamespacePropertyAssignment[] = [];

    for (const pluginFile of pluginFiles) {
        const namespaceNode = ctx.nodeUtils.getNodeChildByCondition(pluginFile, (node) => (
            (
                node.kind === ts.SyntaxKind.StringLiteral
                || node.kind === ts.SyntaxKind.Identifier
                // ^^^ is StringLiteral or Identifier
            ) && node.getText().indexOf(namespace) !== -1
        ));

        if (!namespaceNode) continue;

        let plugin: NamespacePropertyAssignment | undefined;
        let i = 0;

        while (!plugin && i < namespaceNode.length) {
            // vvv constructing from node to ensure validation
            plugin = NamespacePropertyAssignment.constructFromNode(ctx, namespaceNode[i]);
            i++;
        }

        if (!plugin) continue;

        plugins.push(plugin);
    }

    return plugins;
};

export const getNamespacePluginsReferences = (ctx: Ctx, comment: Comment): ts.ReferencedSymbol[] => {
    const plugins = getPluginsForNamespace(ctx, comment);
    const validPluginReferences: ts.ReferencedSymbol[] = [];

    for (const plugin of plugins) {
        const reference = plugin.getReference();

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

export const getPluginRefNodeForTargetNode = (ctx: Ctx, plugin: NamespacePropertyAssignment, targetNode: ts.Node): ts.Node | undefined => {
    let lookupString = '';

    if (targetNode.parent.kind === ts.SyntaxKind.VariableDeclaration) {
        // look for function plugin for function
        lookupString = 'function';
    } else if (
        targetNode.parent.kind === ts.SyntaxKind.MethodDeclaration
        || targetNode.parent.kind === ts.SyntaxKind.PropertyDeclaration
    ) {
        // look for property / method name
        lookupString = targetNode.getText();
    } else {
        // not supported node
        return;
    }

    // lookup method or property index
    const node = plugin.getMethodReference(lookupString);
    if (!node) return;

    return node;
};

export const getPluginReferenceForTargetNode = (ctx: Ctx, plugin: NamespacePropertyAssignment, targetNode: ts.Node): ts.ReferenceEntry | undefined => {
    const refNode = getPluginRefNodeForTargetNode(ctx, plugin, targetNode);
    if (!refNode) return;

    const [assignmentNode] = ctx.nodeUtils.getNodeChildByCondition(
        refNode.parent,
        (node) => node.kind === ts.SyntaxKind.Identifier,
        1
    );

    if (!assignmentNode) return;

    const assignmentIndex = assignmentNode.getFullText().indexOf(assignmentNode.getText());

    return {
        textSpan: {
            start: assignmentNode.pos + assignmentIndex,
            length: assignmentNode.getText().length
        },
        fileName: plugin.node.getSourceFile().fileName,
        isWriteAccess: true, // TODO: get if this plugin is editable
        isDefinition: false,
    };
}

export const pluginNodeReferenceEntries = (ctx: Ctx, node: ts.Node): ts.ReferenceEntry[] => {
    const references: ts.ReferenceEntry[] = [];

    const comment = getCommentForNode(ctx, node);
    if (!comment) return references;
    const plugins = getPluginsForNamespace(ctx, comment);
    if (!plugins.length) return references;

    for (const plugin of plugins) {
        const reference = getPluginReferenceForTargetNode(ctx, plugin, node);
        if (!reference) continue;
        references.push(reference);
    }

    return references;
};

export const implementationNodeReferenceEntries = (ctx: Ctx, node: ts.Node): ts.ReferenceEntry[] => {
    const references: ts.ReferenceEntry[] = [];
    const plugin = NamespacePropertyAssignment.constructFromNode(ctx, node);
    if (!plugin) return references;
    const namespace = plugin.getNamespaceString();
    if (!namespace) return references;
    const program = ctx.info.project.getLanguageService().getProgram();
    if (!program) return references;
    const sourceFiles = program.getSourceFiles();
    if (!sourceFiles) return references;

    for (const sourceFile of sourceFiles) {
        const nsMatch = new RegExp(`@namespace\\s+${namespace}`).exec(sourceFile.getFullText());
        if (!nsMatch) continue;

        const nsMatchString = nsMatch[0];
        const nsIndex = nsMatch.index + nsMatchString.indexOf(namespace);
        const nsNode = ctx.nodeUtils.getFileNodeAtPosition(sourceFile.fileName, nsIndex);

        // TODO: construct comment from it
    }

    return references;
};