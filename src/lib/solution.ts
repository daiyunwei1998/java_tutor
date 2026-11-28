import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export type SolutionFile = { name: string; content: string };

/**
 * Reference solution of a ticket, read at build time (path = task.solution ?? mainClass):
 * tools/solutions/<path>.java for one file, or every .java file in the folder tools/solutions/<path>/.
 */
export function readSolutionFiles(path: string): SolutionFile[] {
  const base = join(process.cwd(), "tools", "solutions");
  try {
    const dir = join(base, path);
    if (statSync(dir, { throwIfNoEntry: false })?.isDirectory()) {
      return readdirSync(dir)
        .filter((n) => n.endsWith(".java"))
        .sort()
        .map((n) => ({ name: n, content: readFileSync(join(dir, n), "utf8") }));
    }
    return [{ name: `${path.split("/").pop()}.java`, content: readFileSync(join(base, `${path}.java`), "utf8") }];
  } catch {
    return [];
  }
}

/** The solution as one text (several files are joined with a header line each). Null when there is none. */
export function readSolution(path: string): string | null {
  const files = readSolutionFiles(path);
  if (files.length === 0) return null;
  if (files.length === 1) return files[0].content;
  return files.map((f) => `// ===== ${f.name} =====\n${f.content}`).join("\n");
}
