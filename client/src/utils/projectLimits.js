export const MAX_PROJECT_FILES = 24;
export const MAX_PROJECT_SOURCE_BYTES = 120000;

export function getProjectSize(files = {}) {
  const entries = Object.entries(files || {});
  const sourceBytes = entries.reduce((total, [, content]) => {
    const code = typeof content === "string" ? content : content?.content || "";
    return total + new Blob([code]).size;
  }, 0);

  return { fileCount: entries.length, sourceBytes };
}

export function getProjectLimitMessage(files = {}) {
  const { fileCount, sourceBytes } = getProjectSize(files);
  if (fileCount > MAX_PROJECT_FILES) {
    return `Preview limit reached: ${MAX_PROJECT_FILES} files maximum.`;
  }
  if (sourceBytes > MAX_PROJECT_SOURCE_BYTES) {
    return `Preview limit reached: ${Math.round(MAX_PROJECT_SOURCE_BYTES / 1000)} KB of source maximum.`;
  }
  return "";
}
