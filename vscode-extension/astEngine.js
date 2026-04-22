const ts = require("typescript");

const AST_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx"]);

function getScriptKind(filePath) {
  const lowered = filePath.toLowerCase();
  if (lowered.endsWith(".tsx")) return ts.ScriptKind.TSX;
  if (lowered.endsWith(".jsx")) return ts.ScriptKind.JSX;
  if (lowered.endsWith(".ts")) return ts.ScriptKind.TS;
  return ts.ScriptKind.JS;
}

function detectCategory(description) {
  if (description.includes("Spreco AI")) return "Spreco AI";
  if (description.includes("DB") || description.includes("query") || description.includes("N+1")) {
    return "Inefficienza DB";
  }
  return "Frontend Bloat";
}

function createFinding({ findings, seenKeys, file, sourceFile, node, description }) {
  const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
  const dedupeKey = `${file}:${line}:${description}`;
  if (seenKeys.has(dedupeKey)) return;
  seenKeys.add(dedupeKey);

  findings.push({
    id: `vuln-${findings.length + 1}`,
    filename: file,
    line,
    category: detectCategory(description),
    description,
  });
}

function isMapCallExpression(node) {
  return (
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === "map" &&
    node.arguments.length > 0
  );
}

function isJsxLike(node) {
  return ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node);
}

function getReturnedJsxNodes(callback) {
  const jsxNodes = [];

  if (ts.isArrowFunction(callback) && callback.body && isJsxLike(callback.body)) {
    jsxNodes.push(callback.body);
    return jsxNodes;
  }

  const body = callback.body;
  const visit = (node) => {
    if (ts.isReturnStatement(node) && node.expression && isJsxLike(node.expression)) {
      jsxNodes.push(node.expression);
    }
    ts.forEachChild(node, visit);
  };

  if (body) visit(body);
  return jsxNodes;
}

function jsxNodeHasKey(jsxNode) {
  if (ts.isJsxElement(jsxNode)) {
    return jsxNode.openingElement.attributes.properties.some(
      (a) => ts.isJsxAttribute(a) && a.name.text === "key"
    );
  }

  if (ts.isJsxSelfClosingElement(jsxNode)) {
    return jsxNode.attributes.properties.some(
      (a) => ts.isJsxAttribute(a) && a.name.text === "key"
    );
  }

  if (ts.isJsxFragment(jsxNode)) {
    return false;
  }

  return true;
}

function analyzeAstFile(filePath, content) {
  const lowered = filePath.toLowerCase();
  if (![...AST_EXTENSIONS].some((ext) => lowered.endsWith(ext))) {
    return { findings: [], counts: { frontend: 0, db: 0, ai: 0 } };
  }

  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(filePath)
  );

  const findings = [];
  const seenFindingKeys = new Set();

  let dbLoopCount = 0;
  let aiCallCount = 0;
  let aiCallSites = 0;
  let frontBloatCount = 0;

  function isAiCall(node) {
    const text = node.getText(sourceFile);
    return /openai|gemini|anthropic|chat\.completions|generateContent/i.test(text);
  }

  function isDbCall(node) {
    const text = node.getText(sourceFile);
    return /select\(|query\(|execute\(|findMany\(|prisma\.|supabase\.|mysql|postgres|mongodb/i.test(text);
  }

  function visit(node, inLoop = false) {
    if (ts.isImportDeclaration(node)) {
      const imp = node.moduleSpecifier.getText(sourceFile).replace(/["']/g, "");
      if (/lodash|moment|chart\.js|aws-sdk|firebase|three|antd/i.test(imp)) {
        frontBloatCount += 1;
        createFinding({
          findings,
          seenKeys: seenFindingKeys,
          file: filePath,
          sourceFile,
          node,
          description: `Frontend Bloat: dipendenza pesante importata (${imp}).`,
        });
      }
    }

    if (ts.isCallExpression(node)) {
      const text = node.getText(sourceFile);
      if (/SELECT\s+\*/i.test(text)) {
        dbLoopCount += 1;
        createFinding({
          findings,
          seenKeys: seenFindingKeys,
          file: filePath,
          sourceFile,
          node,
          description: "Inefficienza DB: query con SELECT * non ottimizzata.",
        });
      }

      if (inLoop && isDbCall(node)) {
        dbLoopCount += 1;
        createFinding({
          findings,
          seenKeys: seenFindingKeys,
          file: filePath,
          sourceFile,
          node,
          description: "Inefficienza DB: possibile query N+1 dentro un loop.",
        });
      }

      if (isAiCall(node)) {
        aiCallSites += 1;
        if (inLoop) {
          aiCallCount += 1;
          createFinding({
            findings,
            seenKeys: seenFindingKeys,
            file: filePath,
            sourceFile,
            node,
            description: "Spreco AI: chiamata a modello AI dentro un loop.",
          });
        }
      }

      const tempArg = node.arguments.find((arg) => /temperature\s*:\s*([0-9.]+)/i.test(arg.getText(sourceFile)));
      if (tempArg && /temperature\s*:\s*([1-9]|\d{2,})/i.test(tempArg.getText(sourceFile))) {
        aiCallCount += 1;
        createFinding({
          findings,
          seenKeys: seenFindingKeys,
          file: filePath,
          sourceFile,
          node,
          description: "Spreco AI: temperatura alta aumenta token inutili e variabilita di output.",
        });
      }

      if (isMapCallExpression(node)) {
        const callback = node.arguments[0];
        if (callback && (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback))) {
          const returnedJsxNodes = getReturnedJsxNodes(callback);
          for (const jsxNode of returnedJsxNodes) {
            if (!jsxNodeHasKey(jsxNode)) {
              frontBloatCount += 1;
              createFinding({
                findings,
                seenKeys: seenFindingKeys,
                file: filePath,
                sourceFile,
                node: jsxNode,
                description:
                  "Frontend Bloat: elemento JSX restituito da map() senza key, possibile re-render superfluo.",
              });
            }
          }
        }
      }
    }

    const loopNode =
      ts.isForStatement(node) ||
      ts.isForInStatement(node) ||
      ts.isForOfStatement(node) ||
      ts.isWhileStatement(node) ||
      ts.isDoStatement(node);

    ts.forEachChild(node, (child) => visit(child, inLoop || loopNode));
  }

  visit(sourceFile, false);

  if (aiCallSites >= 4) {
    aiCallCount += 1;
    findings.push({
      id: `vuln-${findings.length + 1}`,
      filename: filePath,
      line: 1,
      category: "Spreco AI",
      description: "Spreco AI: molte integrazioni modello senza evidente caching lato applicazione.",
    });
  }

  return {
    findings,
    counts: {
      frontend: frontBloatCount,
      db: dbLoopCount,
      ai: aiCallCount,
    },
  };
}

module.exports = {
  analyzeAstFile,
};
