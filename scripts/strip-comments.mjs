import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("/Users/ngocduy/PROJECTS/TutorOps/frontend/node_modules/typescript");

const SKIP = new Set([
  "/Users/ngocduy/PROJECTS/TutorOps/frontend/src/vite-env.d.ts",
]);

function jsxEmptyExpressionRanges(text, kind) {
  const sf = ts.createSourceFile("x", text, ts.ScriptTarget.Latest, true, kind);
  const ranges = [];
  const walk = (node) => {
    if (
      ts.isJsxExpression(node) &&
      (!node.expression || node.expression.kind === ts.SyntaxKind.JsxEmptyExpression)
    ) {
      ranges.push([node.getStart(sf), node.getEnd()]);
    }
    node.forEachChild(walk);
  };
  sf.forEachChild(walk);
  return ranges;
}

function jsxTextRanges(text, kind) {
  const sf = ts.createSourceFile("x", text, ts.ScriptTarget.Latest, true, kind);
  const ranges = [];
  const walk = (node) => {
    if (ts.isJsxText(node)) ranges.push([node.getStart(sf), node.getEnd()]);
    node.forEachChild(walk);
  };
  sf.forEachChild(walk);
  return ranges;
}

function inside(ranges, pos) {
  for (const [s, e] of ranges) if (pos >= s && pos < e) return true;
  return false;
}

function findComments(text, kind, skipRanges) {
  const out = [];
  const n = text.length;
  let i = 0;
  const stack = [];

  const at = (k) => text[k];

  const scanString = (start, quote) => {
    let j = start + 1;
    while (j < n) {
      if (text[j] === "\\") j += 2;
      else if (text[j] === quote) return j + 1;
      else if (text[j] === "\n") return j;
      else j++;
    }
    return j;
  };

  const scanTemplate = (start) => {
    let j = start + 1;
    while (j < n) {
      if (text[j] === "\\") j += 2;
      else if (text[j] === "`") return j + 1;
      else if (text[j] === "$" && text[j + 1] === "{") {
        const end = scanSubstitution(j + 2);
        j = end;
      } else j++;
    }
    return j;
  };

  const scanSubstitution = (start) => {
    let depth = 1;
    let j = start;
    while (j < n && depth > 0) {
      const c = text[j];
      if (c === "'" || c === '"') j = scanString(j, c);
      else if (c === "`") j = scanTemplate(j);
      else if (c === "/" && text[j + 1] === "/") {
        while (j < n && text[j] !== "\n") j++;
      } else if (c === "/" && text[j + 1] === "*") {
        const e = text.indexOf("*/", j + 2);
        j = e === -1 ? n : e + 2;
      } else {
        if (c === "{") depth++;
        else if (c === "}") depth--;
        j++;
      }
    }
    return j;
  };

  while (i < n) {
    if (inside(skipRanges, i)) {
      i++;
      continue;
    }
    const c = at(i);
    const prev = i > 0 ? text[i - 1] : "";
    if (c === "'" || c === '"') {
      i = scanString(i, c);
    } else if (c === "`") {
      i = scanTemplate(i);
    } else if (c === "/" && prev === "\\") {
      i++;
    } else if (c === "/" && at(i + 1) === "/") {
      let e = i;
      while (e < n && text[e] !== "\n") e++;
      if (!inside(skipRanges, i)) out.push([i, e]);
      i = e;
    } else if (c === "/" && at(i + 1) === "*") {
      const close = text.indexOf("*/", i + 2);
      const e = close === -1 ? n : close + 2;
      if (!inside(skipRanges, i)) out.push([i, e]);
      i = e;
    } else {
      i++;
    }
  }
  return out;
}

function commentSpans(text, comments, jsxEmpty) {
  const spans = [];
  for (const [start, end] of comments) {
    if (text.slice(start, start + 3) === "///") continue;

    let s = start;
    let e = end;
    const lineStart = text.lastIndexOf("\n", s - 1) + 1;
    const nl1 = text.indexOf("\n", e);
    const endLineEnd = nl1 === -1 ? text.length : nl1;
    const beforeOk = text.slice(lineStart, s).trim() === "";
    const afterOk = text.slice(e, endLineEnd).trim() === "";

    if (beforeOk && afterOk) {
      s = lineStart;
      e = endLineEnd < text.length ? endLineEnd + 1 : endLineEnd;
    } else if (afterOk) {
      e = endLineEnd;
    } else if (beforeOk) {
      const nl0 = text.indexOf("\n", s);
      const firstLineEnd = nl0 === -1 ? text.length : nl0;
      if (text.slice(s, firstLineEnd).trim() === text.slice(s, firstLineEnd).trim() && end > firstLineEnd) {
        s = lineStart;
        e = end;
      } else {
        s = lineStart;
      }
    }
    spans.push([s, e]);
  }

  for (const [s0, e0] of jsxEmpty) {
    const lineStart = text.lastIndexOf("\n", s0 - 1) + 1;
    const nl = text.indexOf("\n", e0);
    const lineEnd = nl === -1 ? text.length : nl;
    const beforeOk = text.slice(lineStart, s0).trim() === "";
    const afterOk = text.slice(e0, lineEnd).trim() === "";
    if (beforeOk && afterOk) {
      spans.push([lineStart, lineEnd < text.length ? lineEnd + 1 : lineEnd]);
    } else if (afterOk) {
      spans.push([s0, lineEnd]);
    } else if (beforeOk) {
      spans.push([lineStart, e0]);
    } else {
      spans.push([s0, e0]);
    }
  }

  spans.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const span of spans) {
    const last = merged[merged.length - 1];
    if (last && span[0] <= last[1]) last[1] = Math.max(last[1], span[1]);
    else merged.push([...span]);
  }
  return merged;
}

for (const file of process.argv.slice(2)) {
  if (SKIP.has(file)) continue;
  const text = readFileSync(file, "utf8");
  const kind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const jsxEmpty = jsxEmptyExpressionRanges(text, kind);
  const jsxText = jsxTextRanges(text, kind);
  const comments = findComments(text, kind, jsxText);
  const spans = commentSpans(text, comments, jsxEmpty);
  if (!spans.length) continue;

  let out = "";
  let cursor = 0;
  for (const [s, e] of spans) {
    if (s < cursor) continue;
    out += text.slice(cursor, s);
    cursor = e;
  }
  out += text.slice(cursor);

  out = out
    .split("\n")
    .map((line) => (line.trim() === "" ? "" : line.replace(/[ \t]+$/, "")))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  writeFileSync(file, out);
  console.log(`${file}: removed ${spans.length}`);
}
