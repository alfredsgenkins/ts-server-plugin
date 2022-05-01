import ts from "typescript/lib/tsserverlibrary";

export class NodeUtils {
    info: ts.server.PluginCreateInfo;

    constructor(info: ts.server.PluginCreateInfo) {
        this.info = info;
    }

    getSourceFile(fileName: string): ts.SourceFile | undefined {
        const program = this.info.project.getLanguageService().getProgram();
        return program ? program.getSourceFile(fileName) : undefined;
    }

    getFileNodeAtPosition(fileName: string, position: number): ts.Node | undefined {
        const sourceFile = this.getSourceFile(fileName);
        if (!sourceFile) return undefined;

        const find = (node: ts.Node): ts.Node | undefined => {
            if (position >= node.pos && position < node.end) {
                for (let i = 0; i < node.getChildren().length; i++) {
                    const childNode = node.getChildren()[i];
                    const foundNode = find(childNode);
                    if (foundNode) return foundNode;
                }

                return node;
            }
        }

        return find(sourceFile);
    };

    getParentNodeByCondition(
        node: ts.Node,
        cond: (n: ts.Node) => boolean,
        includeInitial: boolean = true
    ): ts.Node | undefined {
        if (!node) return undefined;
        if (includeInitial && cond(node)) return node;

        const parent = node.parent;
        if (parent && cond(parent)) {
            return parent;
        } else {
            return this.getParentNodeByCondition(parent, cond, false);
        }
    }

    getNodeChildByCondition(
        node: ts.Node,
        cond: (n: ts.Node) => boolean,
        maxDepth: number = Number.POSITIVE_INFINITY,
        validateNode: Boolean = true
    ): ts.Node[] {
        const result: ts.Node[] = [];

        const find = (node: ts.Node, depth: number, validateNode: Boolean) => {
            if (depth > maxDepth) return;

            if (validateNode && cond(node)) {
                result.push(node);
                return;
            } else {
                for (let i = 0; i < node.getChildren().length; i++) {
                    find(node.getChildren()[i], depth + 1, true);
                }
            }
        }

        find(node, 0, validateNode);

        return result;
    }

    getFileNodesByCondition(fileName: string, cond: (n: ts.Node) => boolean): ReadonlyArray<ts.Node> {
        const sourceFile = this.getSourceFile(fileName);
        if (!sourceFile) return [];
        return this.getNodeChildByCondition(sourceFile, cond);
    };
}