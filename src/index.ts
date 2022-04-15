function init(modules: { typescript: typeof import("typescript/lib/tsserverlibrary") }) {
  const ts = modules.typescript;

  function create(info: ts.server.PluginCreateInfo) {
    const cache = {};

    const getSourceFile = (fileName: string): ts.SourceFile | undefined => {
      const program = info.project.getLanguageService().getProgram();
      return program ? program.getSourceFile(fileName) : undefined;
    }

    const getNode = (fileName: string, position: number): ts.Node | undefined => {
      const sourceFile = getSourceFile(fileName);
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

    const getAllNodes = (fileName: string, cond: (n: ts.Node) => boolean): ReadonlyArray<ts.Node> => {
      const sourceFile = getSourceFile(fileName);
      if (!sourceFile) return [];

      const result: ts.Node[] = [];
      const find = (node: ts.Node) => {
        if (cond(node)) {
          result.push(node);
          return;
        } else {
          for (let i = 0; i < node.getChildren().length; i++) {
            find(node.getChildren()[i]);
          }
        }
      }

      find(sourceFile);

      return result;
    };

    const getAllNamespaceComments = (fileName: string): ReadonlyArray<ts.Node> => {
      return getAllNodes(fileName, (n) => n.kind === ts.SyntaxKind.JSDocTag);
    }

    const getNamespaceComment = (fileName: string, position: number): Readonly<ts.Node> | undefined => {
      const node = getNode(fileName, position);
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

      return node;
    }

    const getCommentTextSpan = (comment: ts.Node, namespace: string, nIndex: number): ts.TextSpan => {
      return {
        start: comment.pos + nIndex,
        length: namespace.length
      };
    };

    const getCommentDefinition = (comment: ts.Node, namespace: string, nIndex: number): ts.DefinitionInfo => {
      return {
        kind: ts.ScriptElementKind.unknown,
        name: namespace,
        containerKind: ts.ScriptElementKind.unknown,
        containerName: namespace,
        fileName: comment.getSourceFile().fileName,
        textSpan: getCommentTextSpan(comment, namespace, nIndex),
      }
    };

    const getCommentDisplayParts = (namespace: string): ts.SymbolDisplayPart[] => {
      return [{
        kind: 'text',
        text: namespace
      }];
    };

    const getNamespacePluginsReferences = (comment: ts.Node, namespace: string, nIndex: number): ts.ReferencedSymbol[] | undefined => {
      const program = info.project.getLanguageService().getProgram();
      if (!program) return undefined;

      const sourceFiles = program.getSourceFiles();
      if (!sourceFiles) return undefined;

      const pluginFiles = sourceFiles.filter((sourceFile) => sourceFile.fileName.includes('.plugin'));
      if (!pluginFiles.length) return undefined;

      const plugins: ts.ReferencedSymbol[] = [];
      pluginFiles.forEach((sourceFile) => {
        const namespaceIndex = sourceFile.getFullText().indexOf(namespace);

        if (namespaceIndex !== -1) {
          // We found a reference to the namespace

          plugins.push({
            definition: {
              ...getCommentDefinition(comment, namespace, nIndex),
              displayParts: getCommentDisplayParts(namespace)
            },
            references: [{
              textSpan: {
                start: namespaceIndex,
                length: namespace.length
              },
              fileName: sourceFile.fileName,
              isWriteAccess: true,
              isDefinition: false,
            }]
          });
        }
      });

      return plugins;
    }

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

    // proxy.getReferencesAtPosition = (fileName: string, position: number): ts.ReferenceEntry[] | undefined => {
    //   const comment = getNamespaceComment(fileName, position);
    //   if (!comment) return undefined; // <-- this is not a comment, skip

    //   const namespace = comment.getText().slice(11).trim();
    //   getNamespacePluginsFromCache(namespace);
    // }

    proxy.findReferences = (fileName: string, position: number): ts.ReferencedSymbol[] | undefined => {
      const prior = info.languageService.findReferences(fileName, position);

      const comment = getNamespaceComment(fileName, position);
      if (!comment) return prior; // <-- this is not a comment, skip

      const regex = /[A-z1-9/]*/.exec(comment.getText().slice(11).trim());
      if (!regex) return prior; // <-- this is some faulty comment, skip

      const namespace = regex[0];
      const nIndex = comment.getText().indexOf(namespace);

      return getNamespacePluginsReferences(comment, namespace, nIndex);
    };

    proxy.getDefinitionAndBoundSpan = (fileName: string, position: number, ...rest): ts.DefinitionInfoAndBoundSpan | undefined => {
      const prior = info.languageService.getDefinitionAndBoundSpan(fileName, position, ...rest);

      const comment = getNamespaceComment(fileName, position);
      if (!comment) return prior; // <-- this is not a comment, skip

      const regex = /[A-z1-9/]*/.exec(comment.getText().slice(11).trim());
      if (!regex) return prior; // <-- this is some faulty comment, skip

      const namespace = regex[0];
      const nIndex = comment.getText().indexOf(namespace);

      return {
        textSpan: getCommentTextSpan(comment, namespace, nIndex),
        definitions: [getCommentDefinition(comment, namespace, nIndex)]
      };
    };

    proxy.getQuickInfoAtPosition = (fileName: string, position: number): ts.QuickInfo | undefined => {
      const prior = info.languageService.getQuickInfoAtPosition(fileName, position);
      if (prior) return prior; // <-- do not proxy, if element is recognized

      const comment = getNamespaceComment(fileName, position);
      if (!comment) return undefined; // <-- this is not a comment, skip

      const regex = /[A-z1-9/]*/.exec(comment.getText().slice(11).trim());
      if (!regex) return undefined; // <-- this is some faulty comment, skip

      const namespace = regex[0];
      const nIndex = comment.getText().indexOf(namespace);

      return {
        kind: ts.ScriptElementKind.unknown,
        kindModifiers: "",
        textSpan: {
          start: comment.pos + nIndex,
          length: namespace.length
        },
        displayParts: getCommentDisplayParts(namespace),
        documentation: [],
        tags: []
      }
    }

    proxy.getDocumentHighlights = (fileName: string, position: number, filesToSearch: string[]): ts.DocumentHighlights[] | undefined => {
      const prior = info.languageService.getDocumentHighlights(fileName, position, filesToSearch);
      if (prior) return prior; // <-- do not proxy, if element is recognized

      const comment = getNamespaceComment(fileName, position);
      if (!comment) return undefined; // <-- this is not a comment, skip

      const regex = /[A-z1-9/]*/.exec(comment.getText().slice(11).trim());
      if (!regex) return undefined; // <-- this is some faulty comment, skip

      const namespace = regex[0];
      const nIndex = comment.getText().indexOf(namespace);

      return [{
        fileName: fileName,
        highlightSpans: [{
          textSpan: {
            start: comment.pos + nIndex,
            length: namespace.length
          },
          kind: ts.HighlightSpanKind.reference
        }]
      }];
    };

    return proxy;
  }

  return { create };
}

export = init;
