import { NodeUtils } from './node-utils';
import ts from "typescript/lib/tsserverlibrary";

export class Ctx {
    nodeUtils: NodeUtils;
    info: ts.server.PluginCreateInfo;

    constructor(info: ts.server.PluginCreateInfo) {
        this.info = info;
        this.nodeUtils = new NodeUtils(info);
    }
}