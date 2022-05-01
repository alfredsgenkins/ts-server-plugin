import ts from "typescript/lib/tsserverlibrary";
import { Ctx } from "./util/context";

import {
    CLASS_PLUGIN_METHOD_TYPE,
    CLASS_PLUGIN_PROPERTY_TYPE,
    CLASS_PLUGIN_STATIC_TYPE,
    FUNCTION_PLUGIN_TYPE,
    PluginTargetConfig
} from "./util/config";

export class NamespaceDeclaration {
    node: ts.Node;
    ctx: Ctx;
    namespace: string = '';
    nIndex: number = -1;

    constructor(
        ctx: Ctx,
        commentNode: ts.Node,
    ) {
        this.ctx = ctx;
        this.node = commentNode;
    }

    getNamespace(): string {
        if (this.namespace) {
            return this.namespace
        }

        const regex = /[A-z1-9/]+/.exec(this.node.getText().slice(11).trim());
        if (!regex) return this.namespace;

        const namespace = regex[0];
        this.namespace = namespace;
        return namespace;
    }

    getNamespaceIndex(): number {
        if (this.nIndex !== -1) {
            return this.nIndex;
        }

        const namespace = this.getNamespace();
        const nIndex = this.node.getText().indexOf(namespace);
        this.nIndex = nIndex;
        return nIndex;
    }

    getTextSpan = (): ts.TextSpan => {
        const namespace = this.getNamespace();
        const nIndex = this.getNamespaceIndex();

        return {
            start: this.node.pos + nIndex,
            length: namespace.length
        }
    }

    getDisplayParts(): ts.SymbolDisplayPart[] {
        const namespace = this.getNamespace();

        return [{
            kind: 'text',
            text: namespace
        }];
    }

    getDefinition(): ts.DefinitionInfo {
        const namespace = this.getNamespace();

        return {
            kind: ts.ScriptElementKind.unknown,
            name: namespace,
            containerKind: ts.ScriptElementKind.unknown,
            containerName: namespace,
            fileName: this.node.getSourceFile().fileName,
            textSpan: this.getTextSpan(),
        }
    }

    getQuickInfo(): ts.QuickInfo {
        return {
            kind: ts.ScriptElementKind.unknown,
            kindModifiers: "",
            textSpan: this.getTextSpan(),
            displayParts: this.getDisplayParts(),
            documentation: [],
            tags: []
        }
    }

    getTargetConfigForNode(node: ts.Node): PluginTargetConfig | undefined {
        const targetMainType = this.node.parent.parent;

        if (targetMainType.kind === ts.SyntaxKind.ClassDeclaration) {
            const name = node.getText();

            const target = node.parent;
            const isStatic = target.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword);

            if (isStatic) {
                return { name, type: CLASS_PLUGIN_STATIC_TYPE };
            }

            if (target.kind === ts.SyntaxKind.PropertyDeclaration) {
                // TODO: investigate arrow functions special case :/
                return { name, type: CLASS_PLUGIN_PROPERTY_TYPE };
            }

            if (target.kind === ts.SyntaxKind.MethodDeclaration) {
                return { name, type: CLASS_PLUGIN_METHOD_TYPE };
            }

            return undefined;
        }

        if (
            targetMainType.kind === ts.SyntaxKind.FunctionDeclaration
            || targetMainType.kind === ts.SyntaxKind.VariableDeclaration
        ) {
            return { name: 'unknown', type: FUNCTION_PLUGIN_TYPE };
        }

        return undefined;
    }

    getNamespaceReference() {
        return this.ctx.nodeUtils.getReferenceForNode(this.node, this.getTextSpan);
    }

    getNodeByTargetConfig(config: PluginTargetConfig): ts.Node | undefined {
        const { type, name } = config;
        const targetMainType = this.node.parent.parent;

        if (
            type === FUNCTION_PLUGIN_TYPE
        ) {
            if (
                targetMainType.kind === ts.SyntaxKind.FunctionDeclaration
                || targetMainType.kind === ts.SyntaxKind.VariableDeclaration
            ) {
                return targetMainType
            }

            return undefined;
        }

        if (targetMainType.kind !== ts.SyntaxKind.ClassDeclaration) {
            return undefined;
        }

        const matchingTarget = this.ctx.nodeUtils.getNodeChildByCondition(targetMainType, (node) => {
            if (
                node.kind !== ts.SyntaxKind.Identifier
                || node.getText() !== name
            ) {
                return false;
            }

            const parent = node.parent;

            if (!!parent.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword)) {
                return type === CLASS_PLUGIN_STATIC_TYPE;
            }

            return (
                (
                    type === CLASS_PLUGIN_METHOD_TYPE
                    && parent.kind === ts.SyntaxKind.MethodDeclaration
                ) || (
                    type === CLASS_PLUGIN_PROPERTY_TYPE
                    && parent.kind === ts.SyntaxKind.PropertyDeclaration
                )
            );
        });

        if (matchingTarget.length === 0) return undefined;

        return matchingTarget[0];
    }

    static constructFromNode(ctx: Ctx, node: ts.Node): NamespaceDeclaration | undefined {
        let namespaceDeclarationNode: ts.Node | undefined;

        ctx.nodeUtils.getParentNodeByCondition(node, (parent) => {
            const JSDocComment = parent.getChildren().find((child) => child.kind === ts.SyntaxKind.JSDocComment);

            if (!JSDocComment) return false;

            const JSDocNamespaceTag = JSDocComment.getChildren().find((child) => (
                child.kind === ts.SyntaxKind.JSDocTag
                && child.getText().indexOf('@namespace') !== -1
            ));

            if (!JSDocNamespaceTag) return false;

            namespaceDeclarationNode = JSDocNamespaceTag;

            return true;
        });

        if (!namespaceDeclarationNode) return undefined;

        return new NamespaceDeclaration(ctx, namespaceDeclarationNode);
    };
}

export const getCommentAtPosition = (ctx: Ctx, fileName: string, position: number): NamespaceDeclaration | undefined => {
    const node = ctx.nodeUtils.getFileNodeAtPosition(fileName, position);
    if (!node) return undefined;

    if (
        node.kind !== ts.SyntaxKind.JSDocTag
        || node.getText().indexOf('@namespace') === -1
    ) {
        return undefined;
    }

    return new NamespaceDeclaration(ctx, node);
}
