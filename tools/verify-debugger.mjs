// Checks the step-through debugger on every ticket: instrumented starter and solution code compiles (at the
// browser's Java 8 level), main can be traced, and the instrumented tests give the same results as the originals.
// Usage: node --experimental-strip-types tools/verify-debugger.mjs   (from repo root, needs a JDK)
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, copyFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const sprintDir = join(root, "src/content/sprints");
const allTickets = [];
for (const d of readdirSync(sprintDir)) {
  if (!existsSync(join(sprintDir, d, "tickets.ts"))) continue;
  for (const f of readdirSync(join(sprintDir, d)).filter((n) => /^tickets(-[\w-]+)?\.ts$/.test(n)).sort()) {
    allTickets.push(...(await import(join(sprintDir, d, f))).tickets);
  }
}
const jars = join(root, "public/java");
const cp = `${jars}/tutor-runtime.jar:${jars}/ecj.jar`;
const bridge = (...a) => JSON.parse(execFileSync("java", ["-Dstdout.encoding=UTF-8", "-cp", cp, "tutor.Bridge", ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 1 << 28 }).trim().split("\n").pop());
let failed = false;
for (const t of allTickets) {
  for (const variant of ["starter", "solution"]) {
    const dir = join("/tmp", "verify-debug", t.id, variant) + "/";
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir + "src", { recursive: true });
    for (const f of t.task.files) writeFileSync(dir + "src/" + f.path, f.content);
    if (variant === "solution") copyFileSync(join(root, "tools/solutions", t.task.mainClass + ".java"), dir + "src/" + t.task.mainClass + ".java");
    const names = t.task.files.map((f) => f.path).join(" ");
    const plain = bridge("compile", dir + "src/", dir + "out/", names, `${jars}/tutor-runtime.jar`, `${jars}/jdk-api.jar`);
    if (!plain.ok) { console.log("BAD", t.id, variant, "original does not compile"); failed = true; continue; }
    bridge("instrument", dir + "src/", dir + "isrc/", names);
    const comp = bridge("compile", dir + "isrc/", dir + "iout/", names, `${jars}/tutor-runtime.jar`, `${jars}/jdk-api.jar`);
    if (!comp.ok) { console.log("BAD", t.id, variant, "INSTRUMENTED COMPILE FAIL\n", comp.diagnostics); failed = true; continue; }
    const before = bridge("test", dir + "out/", t.task.testClass).tests.map((x) => x.passed).join();
    const after = bridge("test", dir + "iout/", t.task.testClass).tests.map((x) => x.passed).join();
    const tr = bridge("trace", dir + "iout/", t.task.mainClass, "true");
    const ok = before === after && tr.reached && tr.status !== "runtime_error" || (before === after && tr.status === "runtime_error" && variant === "starter");
    if (!ok) failed = true;
    console.log(`${ok ? "OK " : "BAD"} ${t.id} ${variant}: tests same=${before === after}, trace ${tr.status}, ${tr.steps.length} steps${tr.stepLimit ? " (limit)" : ""}, ${Math.round(JSON.stringify(tr.steps).length / 1024)} KB`);
  }
}
process.exit(failed ? 1 : 0);
