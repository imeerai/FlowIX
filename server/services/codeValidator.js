// Post-generation code validator and auto-fixer
// Repairs common AI code generation errors before saving to DB using regex checks

// Void HTML elements that must be self-closed in JSX
const VOID_ELEMENTS = [
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
];

function selfCloseVoidElements(code, filePath, warnings, suffix) {
  const tagPattern = new RegExp(
    `<(${VOID_ELEMENTS.join("|")})(?=[\\s/>])`,
    "g",
  );
  const changedTags = new Set();
  let result = "";
  let lastIndex = 0;
  let match;

  while ((match = tagPattern.exec(code))) {
    let depth = 0;
    let quote = null;
    let end = -1;

    for (let index = tagPattern.lastIndex; index < code.length; index++) {
      const char = code[index];
      if (quote) {
        if (char === "\\") index++;
        else if (char === quote) quote = null;
      } else if (char === "'" || char === '"' || char === "`") {
        quote = char;
      } else if (char === "{") {
        depth++;
      } else if (char === "}") {
        if (depth === 0) break;
        depth--;
      } else if (char === "<" && depth === 0) {
        break;
      } else if (char === ">" && depth === 0) {
        end = index;
        break;
      }
    }

    if (end === -1) continue;
    tagPattern.lastIndex = end + 1;
    const opening = code.slice(match.index, end);
    if (/\/\s*$/.test(opening)) continue;
    result += code.slice(lastIndex, match.index) + opening.trimEnd() + " />";
    lastIndex = end + 1;
    changedTags.add(match[1]);
  }

  for (const tag of changedTags) {
    warnings.push(`${filePath}: Self-closed <${tag}> ${suffix}`);
  }
  return result + code.slice(lastIndex);
}

function replaceUnsupportedLucideSocialIcons(code, filePath, warnings) {
  const unsupported = new Set([
    "Facebook",
    "Github",
    "Instagram",
    "Linkedin",
    "Tiktok",
    "Twitter",
    "Youtube",
  ]);
  const importPattern =
    /import\s*\{([\s\S]*?)\}\s*from\s*(['"])lucide-react\2\s*;?/g;

  const removedNames = [];
  let normalizedCode = code.replace(importPattern, (match, specifier) => {
    const names = specifier
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
    const kept = [];

    for (const name of names) {
      const importedName = name.split(/\s+as\s+/i)[0];
      if (!unsupported.has(importedName)) {
        kept.push(name);
        continue;
      }

      removedNames.push(importedName);
      warnings.push(
        `${filePath}: Replaced unsupported Lucide social icon '${importedName}' with accessible text`,
      );
    }

    if (kept.length === 0) return "";
    return `import { ${kept.join(", ")} } from "lucide-react";`;
  });

  for (const importedName of removedNames) {
    const usagePattern = new RegExp(`<${importedName}\\b[^>]*/>`, "g");
    normalizedCode = normalizedCode.replace(
      usagePattern,
      `<span aria-label="${importedName}">${importedName}</span>`,
    );
  }

  return normalizedCode;
}

// Validate and auto-fix common AI-generated code issues
export function validateAndFixCode(code, filePath, context) {
  const warnings = [];
  const isCSS = filePath.endsWith(".css");
  const isJS = filePath.endsWith(".js") || filePath.endsWith(".jsx");

  // 1. Strip markdown code fences that some models wrap around code
  const fencePattern =
    /^```(?:jsx?|javascript|css|html|tsx?|react)?\s*\n([\s\S]*?)\n```\s*$/i;
  const fenceMatch = code.match(fencePattern);
  if (fenceMatch) {
    code = fenceMatch[1];
    warnings.push(`${filePath}: Stripped markdown code fences`);
  }

  // Handle cases where fences or conversational text appear at the start or end
  code = code.replace(/^[\s\S]*?```(?:jsx?|javascript|css|html|tsx?|react)?\s*\n/i, (match) => {
    warnings.push(`${filePath}: Stripped leading markdown code fence`);
    return "";
  });
  code = code.replace(/\n```[\s\S]*$/, "");

  if (isCSS) {
    // Remove conversational preamble before valid CSS tokens
    const cssStartMatch = code.match(/(?:@import|@keyframes|@media|@font-face|\/\*|:root|\*|html|body|\.[a-zA-Z0-9_-]+\s*\{|#[a-zA-Z0-9_-]+\s*\{)/);
    if (cssStartMatch && cssStartMatch.index > 0) {
      const leadingText = code.slice(0, cssStartMatch.index).trim();
      if (leadingText.length > 0) {
        code = code.slice(cssStartMatch.index);
        warnings.push(`${filePath}: Removed conversational preamble before CSS`);
      }
    }
    return { code: code.trim() + "\n", warnings };
  }

  if (!isJS) {
    return { code: code.trim() + "\n", warnings };
  }

  // Remove conversational preamble before valid JS/JSX tokens
  const jsStartMatch = code.match(/(?:import\s+|export\s+|const\s+|function\s+|class\s+|\/\*|\/\/|'use strict'|"use strict"|var\s+|let\s+)/);
  if (jsStartMatch && jsStartMatch.index > 0) {
    const leadingText = code.slice(0, jsStartMatch.index).trim();
    if (leadingText.length > 0) {
      code = code.slice(jsStartMatch.index);
      warnings.push(`${filePath}: Removed conversational preamble before JS/JSX`);
    }
  }

  // --- JS/JSX-specific fixes ---

  code = replaceUnsupportedLucideSocialIcons(code, filePath, warnings);

  // 2. Fix `class=` → `className=` in JSX (but not inside strings or comments)
  // Match class= that appears inside JSX tags (after < and before >)
  const classFixRegex = /(<[a-zA-Z][^>]*?)\bclass=/g;
  if (classFixRegex.test(code)) {
    code = code.replace(/(<[a-zA-Z][^>]*?)\bclass=/g, "$1className=");
    warnings.push(`${filePath}: Fixed 'class=' → 'className='`);
  }

  // 3. Fix `for=` → `htmlFor=` in JSX labels
  const forFixRegex = /(<label[^>]*?)\bfor=/gi;
  if (forFixRegex.test(code)) {
    code = code.replace(/(<label[^>]*?)\bfor=/gi, "$1htmlFor=");
    warnings.push(`${filePath}: Fixed 'for=' → 'htmlFor='`);
  }

  // 4. Self-close void elements that aren't self-closed
  code = selfCloseVoidElements(code, filePath, warnings, "elements");

  // 5. Ensure exactly one default export exists
  const defaultExportCount = (code.match(/export\s+default\s+/g) || []).length;
  if (defaultExportCount === 0 && !filePath.endsWith(".css")) {
    // Try to find the main function/component and add default export
    const funcMatch = code.match(/^function\s+([A-Z]\w*)\s*\(/m);
    const constMatch = code.match(/^const\s+([A-Z]\w*)\s*=\s*(?:\(|function)/m);
    const componentName = funcMatch?.[1] || constMatch?.[1];

    if (componentName) {
      // Check if there's already a named export
      const namedExportRegex = new RegExp(
        `export\\s+(function|const)\\s+${componentName}`,
      );
      if (namedExportRegex.test(code)) {
        // Convert `export function X` → `export default function X`
        code = code.replace(
          new RegExp(`export\\s+(function|const)\\s+${componentName}`),
          `export default $1 ${componentName}`,
        );
      } else {
        // Add default export at the end
        code = code.trimEnd() + `\n\nexport default ${componentName};\n`;
      }
      warnings.push(
        `${filePath}: Added missing default export for '${componentName}'`,
      );
    }
  }

  // 6. Remove stray HTML comments inside JSX return blocks
  // Pattern: <!-- comment --> which is invalid in JSX
  const htmlCommentRegex = /<!--[\s\S]*?-->/g;
  if (htmlCommentRegex.test(code)) {
    code = code.replace(htmlCommentRegex, "");
    warnings.push(`${filePath}: Removed HTML comments (invalid in JSX)`);
  }

  // 7. Fix common TypeScript syntax that slips in
  // Remove `: React.FC` or `: FC` type annotations from function declarations
  code = code.replace(/:\s*React\.FC(?:<[^>]*>)?\s*=/g, (match) => {
    warnings.push(`${filePath}: Removed TypeScript React.FC annotation`);
    return " =";
  });

  // Remove simple type annotations from function parameters like (props: any)
  // But be careful not to break destructured defaults like { name = 'default' }
  code = code.replace(
    /(\([^)]*?)\s*:\s*(?:string|number|boolean|any|object|void)\s*([,)])/g,
    (match, before, after) => {
      warnings.push(`${filePath}: Removed TypeScript type annotation`);
      return `${before}${after}`;
    },
  );

  // 8. Ensure React import exists if JSX is used
  const hasJSX = /<[A-Za-z]/.test(code);
  const hasReactImport = /import\s+React/.test(code);
  if (hasJSX && !hasReactImport) {
    code = `import React from 'react';\n${code}`;
    warnings.push(`${filePath}: Added missing React import`);
  }

  // 9. Fix import paths that point to incorrect folders/paths compared to what was planned
  if (context?.allPlannedFiles) {
    const fixResult = fixImportPaths(code, filePath, context.allPlannedFiles);
    code = fixResult.code;
    warnings.push(...fixResult.warnings);
  }

  return { code: code.trim() + "\n", warnings };
}

// Validate and fix code specifically for revision operations
export function validateRevisionContent(content, filePath, op) {
  if (op === "delete") return { content, warnings: [] };

  if (op === "create") {
    const result = validateAndFixCode(content, filePath);
    return { content: result.code, warnings: result.warnings };
  }

  // For update ops (search/replace content), only apply safe fixes
  // that won't break the partial context
  const warnings = [];

  // Fix class → className
  const classFixRegex = /(<[a-zA-Z][^>]*?)\bclass=/g;
  if (classFixRegex.test(content)) {
    content = content.replace(/(<[a-zA-Z][^>]*?)\bclass=/g, "$1className=");
    warnings.push(`${filePath}: Fixed 'class=' → 'className=' in replacement`);
  }

  // Fix for → htmlFor
  const forFixRegex = /(<label[^>]*?)\bfor=/gi;
  if (forFixRegex.test(content)) {
    content = content.replace(/(<label[^>]*?)\bfor=/gi, "$1htmlFor=");
    warnings.push(`${filePath}: Fixed 'for=' → 'htmlFor=' in replacement`);
  }

  // Self-close void elements
  content = selfCloseVoidElements(
    content,
    filePath,
    warnings,
    "in replacement",
  );

  return { content, warnings };
}

// --- Import Path Resolution Helpers ---

function getDir(p) {
  const parts = p.split("/");
  parts.pop();
  return parts.join("/") || "/";
}

function resolvePath(baseDir, relativePath) {
  const baseParts = baseDir.split("/").filter(Boolean);
  const relParts = relativePath.split("/").filter(Boolean);

  for (const part of relParts) {
    if (part === ".") {
      continue;
    } else if (part === "..") {
      baseParts.pop();
    } else {
      baseParts.push(part);
    }
  }
  return "/" + baseParts.join("/");
}

function getRelativePath(fromDir, toPath) {
  const fromParts = fromDir.split("/").filter(Boolean);
  const toParts = toPath.split("/").filter(Boolean);

  let commonLength = 0;
  while (
    commonLength < fromParts.length &&
    commonLength < toParts.length &&
    fromParts[commonLength] === toParts[commonLength]
  ) {
    commonLength++;
  }

  const upCount = fromParts.length - commonLength;
  const remainingTo = toParts.slice(commonLength);

  const relParts = [];
  for (let i = 0; i < upCount; i++) {
    relParts.push("..");
  }
  if (relParts.length === 0) {
    relParts.push(".");
  }
  relParts.push(...remainingTo);
  return relParts.join("/");
}

function cleanExtension(p) {
  return p.replace(/\.(js|jsx|css|ts|tsx)$/, "");
}

function fixImportPaths(code, filePath, allPlannedFiles) {
  const warnings = [];
  if (!allPlannedFiles || allPlannedFiles.length === 0) {
    return { code, warnings };
  }

  const currentDir = getDir(filePath);
  const plannedPaths = allPlannedFiles.map((f) =>
    f.path.startsWith("/") ? f.path : "/" + f.path,
  );

  // Matches lines like: import Header from './components/Header';
  // or import '../styles.css'; or require('./components/Header')
  const importRegex = /(from\s+['"]|import\s+['"])([^'"]+)(['"])/g;

  const newCode = code.replace(
    importRegex,
    (match, prefix, importTarget, suffix) => {
      // Skip absolute imports (non-relative packages like 'react')
      if (!importTarget.startsWith(".")) {
        return match;
      }

      // 1. Resolve relative import target path
      const resolvedTarget = resolvePath(currentDir, importTarget);
      const resolvedClean = cleanExtension(resolvedTarget);

      // Check if it already matches a planned file path exactly (with or without extension)
      const exactExists = plannedPaths.some(
        (p) => cleanExtension(p) === resolvedClean,
      );
      if (exactExists) {
        return match;
      }

      // 2. Mismatch! Try to find a planned file with the same filename
      const importFilename = resolvedClean.split("/").pop();
      if (!importFilename) {
        return match;
      }

      const foundPlannedPath = plannedPaths.find((p) => {
        const plannedClean = cleanExtension(p);
        const plannedFilename = plannedClean.split("/").pop();
        return plannedFilename === importFilename;
      });

      if (foundPlannedPath) {
        // Calculate relative path from current directory to actual planned file path
        const newRelative = getRelativePath(currentDir, foundPlannedPath);
        // Prefix relative prefix if missing
        const finalRelative = newRelative.startsWith(".")
          ? newRelative
          : "./" + newRelative;

        // Retain file extension if the original import target had it
        const hasExt = /\.(js|jsx|css|ts|tsx)$/.test(importTarget);
        const ext = hasExt ? "." + importTarget.split(".").pop() : "";

        const rewrittenTarget = cleanExtension(finalRelative) + ext;
        if (rewrittenTarget !== importTarget) {
          warnings.push(
            `${filePath}: Corrected import '${importTarget}' to '${rewrittenTarget}' (file planned at '${foundPlannedPath}')`,
          );
          return `${prefix}${rewrittenTarget}${suffix}`;
        }
      }

      return match;
    },
  );

  return { code: newCode, warnings };
}
