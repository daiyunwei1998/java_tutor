import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Reference solution of a ticket, read from tools/solutions/<mainClass>.java at build time. */
export function readSolution(mainClass: string): string | null {
  try {
    return readFileSync(join(process.cwd(), "tools", "solutions", `${mainClass}.java`), "utf8");
  } catch {
    return null;
  }
}
