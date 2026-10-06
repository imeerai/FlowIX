import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import pMap from "p-map";
import {
  FileCodeSchema,
  FilePlanSchema,
  RevisionResultSchema,
} from "./aiSchemas.js";
import {
  buildFileCodeSystem,
  FILE_PLAN_SYSTEM,
  REVISE_SYSTEM,
} from "./prompts.js";
import { normalizeContent } from "./contentNormalizer.js";
import {
  validateAndFixCode,
  validateRevisionContent,
} from "./codeValidator.js";

// --- OpenRouter Model Client Setup ---
const MAX_CONCURRENCY = parseInt(process.env.AI_MAX_CONCURRENCY || "6", 10);

function getModel() {
  const modelName = process.env.OPENROUTER_MODEL || "openrouter/free";
  const openrouter = createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });
  return openrouter(modelName);
}

// --- Robust generateObject wrapper ---
// Some free models (like cohere/north-mini-code) don't reliably support
// structured JSON output mode. This wrapper falls back to text generation
// and manual JSON extraction when generateObject fails.

function extractJSON(text, isCodeSchema = false) {
  if (!text) return null;

  // 1. Try to find JSON in code fences
  const fenceMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {}
  }

  // 2. Try to find raw JSON object/array
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch {}
  }

  // 3. Try the entire text
  try {
    return JSON.parse(text.trim());
  } catch {}

  // 4. Fallback for code schemas (e.g. styles.css or component code):
  // If the model returned plain code or wrapped it in code fences instead of JSON { code: "..." },
  // extract the code directly into a { code: string } object.
  if (isCodeSchema && text.trim().length > 0) {
    let cleanCode = text.trim();
    const codeFenceMatch = cleanCode.match(/^```(?:css|javascript|jsx|js|html)?\s*\n([\s\S]*?)\n```$/i);
    if (codeFenceMatch) {
      cleanCode = codeFenceMatch[1].trim();
    } else {
      cleanCode = cleanCode
        .replace(/^```(?:css|javascript|jsx|js|html)?/i, "")
        .replace(/```$/, "")
        .trim();
    }
    if (cleanCode.length > 0) {
      return { code: cleanCode };
    }
  }

  return null;
}

async function safeGenerateObject({ schema, system, prompt, maxRetries = 2 }) {
  const isCodeSchema = schema === FileCodeSchema || Boolean(schema.shape?.code);
  const model = getModel();

  // Attempt 1: native generateObject
  try {
    const result = await generateObject({
      model,
      schema,
      system,
      prompt,
      maxRetries,
    });
    return result;
  } catch (firstError) {
    // If model doesn't support structured output, fall back to text
    const isParseError =
      firstError.name === "AI_JSONParseError" ||
      firstError.message?.includes("could not parse") ||
      firstError.message?.includes("No object generated");

    if (!isParseError) {
      throw firstError;
    }
  }

  // Attempt 2: generateText with JSON instruction + manual parse
  const jsonInstruction =
    "\n\nIMPORTANT: You MUST respond with ONLY a valid JSON object. " +
    "No markdown, no explanation, no code fences. Just raw JSON.\n" +
    "The JSON must conform to this schema:\n" +
    JSON.stringify(schema._def || schema.shape || schema, null, 2);

  const { text } = await generateText({
    model,
    system: (system || "") + jsonInstruction,
    prompt,
    maxRetries,
  });

  const parsed = extractJSON(text, isCodeSchema);
  if (!parsed) {
    throw new Error(
      "No object generated: model returned non-JSON response even after fallback",
    );
  }

  // Validate with zod schema
  const validated = schema.safeParse(parsed);
  if (!validated.success) {
    // Try to use partial data anyway — fill in defaults
    const withDefaults = schema.safeParse({
      ...parsed,
      files: parsed.files || [],
      projectName: parsed.projectName || parsed.name || "Generated Project",
      projectDescription:
        parsed.projectDescription ||
        parsed.description ||
        "A React project",
    });
    if (withDefaults.success) {
      return { object: withDefaults.data };
    }
    throw new Error(
      "No object generated: response did not match expected schema",
    );
  }

  return { object: validated.data };
}

// Generate a single file's code
async function generateSingleFile(
  file,
  allFiles,
  prompt,
  alreadyGeneratedFiles,
) {
  const system = buildFileCodeSystem(allFiles, alreadyGeneratedFiles);

  const userMsg = `Project: ${prompt}\n\nWrite the complete code for: ${file.path}\nPurpose: ${file.description}`;

  const { object } = await safeGenerateObject({
    schema: FileCodeSchema,
    system,
    prompt: userMsg,
    maxRetries: 2,
  });

  let code = normalizeContent(object.code);

  if (code.trim().length === 0) {
    throw new Error("Generated code is empty after normalization");
  }

  // Apply post-generation validation and auto-fixing
  const validation = validateAndFixCode(code, file.path, {
    allPlannedFiles: allFiles,
  });

  code = validation.code;

  return { path: file.path, code };
}

// Generate project files: plan first, then build files in order with fallback retries
export async function generateProject(prompt, callbacks) {
  // Phase 1: Plan
  const { object: plan } = await safeGenerateObject({
    schema: FilePlanSchema,
    system: FILE_PLAN_SYSTEM,
    prompt: `Plan a comprehensive React website for: ${prompt}`,
    maxRetries: 2,
  });

  if (!plan.files.find((f) => f.path === "/App.js")) {
    plan.files.unshift({
      path: "/App.js",
      description: "Main application entry point",
      exports: "default App",
      imports: ["./styles.css"],
    });
  }

  if (!plan.files.find((f) => f.path === "/styles.css")) {
    plan.files.push({
      path: "/styles.css",
      description:
        "Minimal base CSS: Google Fonts @import and body font styling (under 25 lines). All UI styling must use inline Tailwind CSS classes in JSX.",
      exports: "none",
      imports: [],
    });
  }

  // Ensure minimum component architecture for rich polish (if plan returned fewer than 4 files)
  const defaultComponents = [
    { path: "/components/Header.js", description: "Header navigation with logo, links, and CTA", exports: "default Header", imports: [] },
    { path: "/components/Hero.js", description: "Hero section with headline, subtitle, visuals, and primary CTA", exports: "default Hero", imports: [] },
    { path: "/components/Features.js", description: "Features grid showcase section", exports: "default Features", imports: [] },
    { path: "/components/Footer.js", description: "Footer section with navigation links and copyright", exports: "default Footer", imports: [] },
  ];

  for (const comp of defaultComponents) {
    if (!plan.files.find((f) => f.path === comp.path)) {
      plan.files.push(comp);
    }
  }

  if (callbacks?.onPlan) {
    await callbacks.onPlan(plan);
  }

  const files = {};
  let pendingFiles = plan.files.map((f) => ({ ...f }));

  const maxRetryRounds = 1;

  for (let round = 0; round <= maxRetryRounds; round++) {
    if (pendingFiles.length === 0) break;

    if (round > 0) {
    }

    const results = await pMap(
      pendingFiles,
      async (file) => {
        try {
          if (callbacks?.onFileStart) {
            await callbacks.onFileStart(file.path);
          }

          const singleResult = await generateSingleFile(
            file,
            plan.files,
            prompt,
            files,
          );

          if (callbacks?.onFileComplete) {
            await callbacks.onFileComplete(file.path, singleResult.code);
          }
          return { success: true, file, result: singleResult };
        } catch (err) {
          return { success: false, file, error: err };
        }
      },
      { concurrency: MAX_CONCURRENCY },
    );

    const failedFiles = [];
    for (const entry of results) {
      if (entry.success) {
        const { path, code } = entry.result;
        files[path.startsWith("/") ? path : "/" + path] = code;
      } else {
        failedFiles.push(entry.file);
      }
    }
    pendingFiles = failedFiles;
  }

  if (pendingFiles.length > 0) {
    const failedPaths = pendingFiles.map((f) => f.path).join(", ");

    if (pendingFiles.some((file) => file.path === "/App.js")) {
      throw new Error("AI did not generate /App.js entry point");
    }
    for (const file of pendingFiles) {
      const ext = file.path.split(".").pop()?.toLowerCase();

      if (ext === "css") {
        files[file.path] =
          `/* ${file.description} - Generation failed, please retry */\n`;
      } else {
        files[file.path] =
          "import React from 'react';\n\n" +
          `// This file could not be generated. Please retry.\n` +
          `// Purpose: ${file.description}\n\n` +
          "export default function Placeholder() {\n" +
          "  return (\n" +
          "    <div className='p-8 text-center text-zinc-400'>\n" +
          "      <p>Component failed to generate. Please try again.</p>\n" +
          "    </div>\n" +
          "  );\n" +
          "}\n";
      }
      if (callbacks?.onFileComplete) {
        await callbacks.onFileComplete(file.path, files[file.path]);
      }
    }
  }

  if (!files["/App.js"]) {
    throw new Error("AI did not generate /App.js entry point");
  }

  return { files, description: plan.projectDescription };
}

export async function reviseProject(
  prompt,
  manifest,
  relevantFiles,
  recentMessages,
  callbacks,
) {
  const contextParts = [];

  contextParts.push("## Current Project Files (manifest)");
  contextParts.push("```");
  for (const f of manifest) {
    contextParts.push(`${f.path} (${f.hash}, ${f.size}B)`);
  }
  contextParts.push("```");

  if (Object.keys(relevantFiles).length > 0) {
    contextParts.push("\n## File Contents (for reference)");
    for (const [path, content] of Object.entries(relevantFiles)) {
      contextParts.push(`\n### ${path}\n\`\`\`\n${content}\n\`\`\``);
    }
  }

  if (recentMessages.length > 0) {
    contextParts.push("\n## Recent Conversation");
    for (const msg of recentMessages.slice(-3)) {
      contextParts.push(`${msg.role}: ${msg.content}`);
    }
  }

  contextParts.push(`\n## Revision Request\n${prompt}`);

  const { object: rawParsed } = await safeGenerateObject({
    schema: RevisionResultSchema,
    system: REVISE_SYSTEM,
    prompt: contextParts.join("\n"),
    maxRetries: 2,
  });

  if (rawParsed && Array.isArray(rawParsed.operations)) {
    rawParsed.operations = rawParsed.operations.map((op) => {
      if (!op || typeof op !== "object") return op;

      let opStr = String(op.op || "")
        .trim()
        .toLowerCase();

      if (["create", "add", "new"].includes(opStr)) op.op = "create";
      else if (["update", "edit", "modify", "patch"].includes(opStr))
        op.op = "update";
      else if (["delete", "remove", "del", "rm"].includes(opStr))
        op.op = "delete";

      if (op.path && typeof op.path === "string" && !op.path.startsWith("/")) {
        op.path = "/" + op.path;
      }

      if (op.content) op.content = normalizeContent(op.content);
      if (op.search) op.search = normalizeContent(op.search);
      if (op.replace) op.replace = normalizeContent(op.replace);

      if (op.op === "create" && op.content) {
        const validation = validateRevisionContent(
          op.content,
          op.path,
          "create",
        );
        op.content = validation.content;
      } else if (op.op === "update" && op.replace) {
        const validation = validateRevisionContent(
          op.replace,
          op.path,
          "update",
        );
        op.replace = validation.content;
      }
      return op;
    });

    if (callbacks?.onPlan) {
      await callbacks.onPlan({
        files: rawParsed.operations.map((operation) => ({
          path: operation.path,
          description: `${operation.op} operation`,
        })),
      });
    }
  }
  return rawParsed;
}
