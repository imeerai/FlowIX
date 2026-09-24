export const MAX_PROJECT_FILES = 24;
export const MAX_PROJECT_SOURCE_BYTES = 120_000;

export function getProjectSize(files = {}) {
  const entries = Object.entries(files);
  const sourceBytes = entries.reduce((total, [, entry]) => {
    const content = typeof entry === "string" ? entry : entry?.content || "";
    return total + Buffer.byteLength(content, "utf8");
  }, 0);

  return { fileCount: entries.length, sourceBytes };
}

export function getProjectLimitError(files = {}) {
  const { fileCount, sourceBytes } = getProjectSize(files);

  if (fileCount > MAX_PROJECT_FILES) {
    return `This project reached the ${MAX_PROJECT_FILES}-file preview limit. Keep the project smaller or export it to run locally.`;
  }

  if (sourceBytes > MAX_PROJECT_SOURCE_BYTES) {
    return `This project reached the ${Math.round(MAX_PROJECT_SOURCE_BYTES / 1000)} KB source limit. Keep the project smaller or export it to run locally.`;
  }

  return null;
}
