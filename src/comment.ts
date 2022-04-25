import ts from "typescript/lib/tsserverlibrary";
import { Ctx } from "./context";

export class Comment {
    node: ts.Node;
    namespace: string = '';
    nIndex: number = -1;

    constructor(
        commentNode: ts.Node,
    ) {
        // TODO: validate?
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

    getTextSpan(): ts.TextSpan {
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
}

export const getCommentAtPosition = (ctx: Ctx, fileName: string, position: number): Comment | undefined => {
    const node = ctx.nodeUtils.getFileNodeAtPosition(fileName, position);
    if (!node) return undefined;

    // Make sure we are inside the comment
    if (position <= node.pos) {
        return undefined;
    }

    // Make sure we are inside the comment
    if (node.kind !== ts.SyntaxKind.JSDocTag) {
        return undefined;
    }

    // Has @namespace keyword
    if (!/@namespace/.test(node.getText())) {
        return undefined;
    }

    return new Comment(node);
}

export const getCommentForNode = (ctx: Ctx, node: ts.Node): Comment | undefined => {
    const parentContainingComment = ctx.nodeUtils.getParentNodeByCondition(node, (parent) => {
        const nIndex = parent.getFullText().indexOf('@namespace');
        return nIndex !== -1 && (parent.pos + nIndex) < node.pos;
    });

    if (!parentContainingComment) return undefined;

    const match = /@namespace +([A-z1-9/]*)/.exec(parentContainingComment.getFullText());
    if (!match) return undefined;

    const [, namespace] = match;
    if (!namespace) return undefined;

    // TODO: if other code has namespace in it, it could be matched instead
    const nIndex = parentContainingComment.getFullText().indexOf(namespace);
    const commentNode = ctx.nodeUtils.getFileNodeAtPosition(
        node.getSourceFile().fileName,
        nIndex + parentContainingComment.pos
    );

    if (!commentNode) return undefined;
    return new Comment(commentNode);
};
