import ts from "typescript/lib/tsserverlibrary";
import { Ctx } from "./util/context";

import {
    CLASS_PLUGIN_METHOD_TYPE,
    CLASS_PLUGIN_PROPERTY_TYPE,
    CLASS_PLUGIN_STATIC_TYPE,
    FUNCTION_PLUGIN_TYPE,
    PluginTargetConfig
} from "./util/config";


export function isNamespaceJSDocTag(tag: ts.JSDocTag): tag is ts.JSDocTag {
    return tag.tagName.escapedText === "namespace";
}

export class NamespaceDeclaration {
    node: ts.Node;
    ctx: Ctx;
    namespace: string = '';
    nIndex: number = -1;
    heritage: ts.ClassDeclaration[] = [];
    isFunctionDeclaration: boolean;

    constructor(
        ctx: Ctx,
        commentNode: ts.Node,
    ) {
        this.ctx = ctx;
        this.node = commentNode;

        const targetMainType = this.node.parent.parent;

        if (!ts.isClassDeclaration(targetMainType)) {
            this.isFunctionDeclaration = true;
            return;
        }

        this.isFunctionDeclaration = false;
        this.heritage = this.ctx.nodeUtils.getClassNodeHeritage(targetMainType);
    }

    getNamespaceString(): string {
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

        const namespace = this.getNamespaceString();
        const nIndex = this.node.getText().indexOf(namespace);
        this.nIndex = nIndex;
        return nIndex;
    }

    getTextSpan = (): ts.TextSpan => {
        const namespace = this.getNamespaceString();
        const nIndex = this.getNamespaceIndex();

        return {
            start: this.node.pos + nIndex,
            length: namespace.length
        }
    }

    getDisplayParts(): ts.SymbolDisplayPart[] {
        const namespace = this.getNamespaceString();

        return [{
            kind: 'text',
            text: namespace
        }];
    }

    getDefinition(): ts.DefinitionInfo {
        const namespace = this.getNamespaceString();

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
        // ^^^ TODO: assume heritageClauses may be present

        if (ts.isClassDeclaration(targetMainType)) {
            const name = node.getText();

            const target = node.parent;
            const isStatic = target.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword);

            if (isStatic) {
                return { name, type: CLASS_PLUGIN_STATIC_TYPE };
            }

            if (ts.isPropertyDeclaration(target)) {
                if (target.initializer && ts.isArrowFunction(target.initializer)) {
                    // ^^^ special case for arrow functions !!!
                    return { name, type: CLASS_PLUGIN_METHOD_TYPE };
                }

                return { name, type: CLASS_PLUGIN_PROPERTY_TYPE };
            }

            if (ts.isMethodDeclaration(target)) {
                return { name, type: CLASS_PLUGIN_METHOD_TYPE };
            }

            return undefined;
        }

        if (
            ts.isFunctionDeclaration(targetMainType)
            || ts.isVariableDeclaration(targetMainType)
        ) {
            return { name: 'unknown', type: FUNCTION_PLUGIN_TYPE };
        }

        return undefined;
    }

    getNamespaceReference() {
        return this.ctx.nodeUtils.getReferenceForNode(this.node, this.getTextSpan);
    }

    getNodesByTargetConfig(config: PluginTargetConfig): ts.Node[] {
        const { type, name } = config;
        const targetMainType = this.node.parent.parent;

        if (
            type === FUNCTION_PLUGIN_TYPE
        ) {
            if (
                ts.isFunctionDeclaration(targetMainType)
                || ts.isVariableDeclaration(targetMainType)
            ) {
                return [targetMainType];
            }

            return [];
        }

        if (!ts.isClassDeclaration(targetMainType)) {
            return [];
        }

        const multipleResults = [];

        for (let i = 0; i < this.heritage.length; i++) {
            const classDec = this.heritage[i];
            
            const matchingTargets = this.ctx.nodeUtils.getNodeChildByCondition(classDec, (node) => {
                if (
                    !ts.isIdentifier(node)
                    || (name && node.escapedText !== name)
                ) {
                    return false;
                }
    
                const parent = node.parent;
                const isStatic = !!parent.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword);
    
                if (isStatic) {
                    return type === CLASS_PLUGIN_STATIC_TYPE;
                }
    
                return (
                    (
                        type === CLASS_PLUGIN_METHOD_TYPE
                        && (
                            ts.isMethodDeclaration(parent)
                            || ts.isPropertyDeclaration(parent)
                            // ^^^ special case for arrow functions !!!
                        )
                    ) || (
                        type === CLASS_PLUGIN_PROPERTY_TYPE
                        && ts.isPropertyDeclaration(parent)
                    )
                );
            });

            multipleResults.push(...matchingTargets);
        }

        return multipleResults;
    }

    getNodeByTargetConfig(config: PluginTargetConfig): ts.Node | undefined {
        const [result] = this.getNodesByTargetConfig(config);
        return result;
    }

    static constructFromNode(ctx: Ctx, node: ts.Node): NamespaceDeclaration | undefined {
        let namespaceDeclarationNode: ts.Node | undefined;

        ctx.nodeUtils.getParentNodeByCondition(node, (parent) => {
            const [jsDocTag] = ts.getAllJSDocTags(parent, isNamespaceJSDocTag);

            if (!jsDocTag) {
                return false;
            }

            namespaceDeclarationNode = jsDocTag;
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
        // vvv Forced to use this, as there is not built-in check for JsDocTag
        node.kind !== ts.SyntaxKind.JSDocTag
        || (node as ts.JSDocTag).tagName.escapedText !== 'namespace'
    ) {
        return undefined;
    }

    return new NamespaceDeclaration(ctx, node);
}
