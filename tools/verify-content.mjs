// Checks every ticket: starter code compiles and runs, starter fails some tests, reference solution passes all.
// Usage: node --experimental-strip-types tools/verify-content.mjs   (from repo root, needs a JDK)
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, copyFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
// Every sprint folder has a tickets.ts exporting `tickets` (see src/content/registry.ts).
const sprintDir = join(root, "src/content/sprints");
const allTickets = [];
for (const d of readdirSync(sprintDir)) {
  const f = join(sprintDir, d, "tickets.ts");
  if (existsSync(f)) allTickets.push(...(await import(f)).tickets);
}
const jars = join(root, "public/java");
const cp = `${jars}/tutor-runtime.jar:${jars}/ecj.jar`;
const bridge = (...a) => JSON.parse(execFileSync("java", ["-Dstdout.encoding=UTF-8", "-cp", cp, "tutor.Bridge", ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim().split("\n").pop());
let failed = false;
for (const t of allTickets) {
  for (const variant of ["starter", "solution"]) {
    const dir = join("/tmp", "verify", t.id, variant) + "/";
    rmSync(dir, { recursive: true, force: true }); mkdirSync(dir + "src", { recursive: true });
    for (const f of t.task.files) writeFileSync(dir + "src/" + f.path, f.content);
    if (variant === "solution") copyFileSync(join(root, "tools/solutions", t.task.mainClass + ".java"), dir + "src/" + t.task.mainClass + ".java");
    const comp = bridge("compile", dir + "src/", dir + "out/", t.task.files.map((f) => f.path).join(" "), `${jars}/tutor-runtime.jar`, `${jars}/jdk-api.jar`);
    if (!comp.ok) { console.log(t.id, variant, "COMPILE FAIL", comp.diagnostics); failed = true; continue; }
    const tests = bridge("test", dir + "out/", t.task.testClass).tests;
    const passed = tests.filter((x) => x.passed).length;
    const labelsOk = tests.every((x) => t.task.testLabels[x.name]);
    const run = variant === "starter" ? bridge("run", dir + "out/", t.task.mainClass) : { status: "-" };
    const ok = (variant === "solution" ? passed === tests.length : passed < tests.length) && labelsOk && run.status !== "runtime_error";
    if (!ok) failed = true;
    console.log(`${ok ? "OK " : "BAD"} ${t.id} ${variant}: ${passed}/${tests.length} passed, labels ${labelsOk ? "ok" : "MISSING"}, main=${run.status}`);
    if (variant === "starter") console.log("    stdout:", JSON.stringify(run.stdout));
  }
}
process.exit(failed ? 1 : 0);
