import type { KnowledgeTopic } from "../../types";
import { Tracer } from "@/lib/trace";

/*
 * Knowledge Space for Sprint 1 (2D arrays): optional, deeper material that goes beyond the textbook.
 * Each topic is one single-column page. Traces are written with the Tracer builder: change the model the
 * way the Java program would, then call step(line, explanation) after each executed line.
 */

// ---------- 1. References and aliasing ----------
const aliasing = (() => {
  const t = new Tracer(`
int[] a = {3, 1, 4};
int[] b = a;
b[0] = 9;
System.out.println(a[0]);
int[] c = a.clone();
c[1] = 7;
System.out.println(a == b);
System.out.println(a == c);
a = new int[2];
`);
  t.call("main");
  t.step(0, "Press **Next ▶** (or the → key). Each step runs one line; the right side shows memory *after* that line.");
  const arr = t.newArray("int[]", [3, 1, 4]);
  t.set("a", arr).step(1, "`{3, 1, 4}` creates an **array object** on the heap. The variable `a` does not hold the numbers. It holds a **reference** to the object (the arrow).");
  t.set("b", arr).step(2, "`b = a` copies the **arrow**, not the array. Two variables now point at one object. This is called **aliasing**.", {
    ask: { q: "Line 3 runs `b[0] = 9`. What will `a[0]` be afterwards?", options: ["3", "9"], answer: 1, explain: "There is only one array; a and b are two ways to reach it." },
  });
  t.setItem(arr, 0, 9).step(3, "`b[0] = 9` follows `b`'s arrow and changes the one shared array.");
  t.print("9").step(4, "So `a[0]` is 9 as well.");
  const copy = t.newArray("int[]", [9, 1, 4]);
  t.set("c", copy).step(5, "`clone()` builds a **new** array object with the same values. `c` points to the copy.");
  t.setItem(copy, 1, 7).step(6, "Changing `c[1]` changes only the copy. `a` and `b` still see `{9, 1, 4}`.", {
    ask: { q: "Line 8 prints `a == c`. True or false?", options: ["true", "false"], answer: 1, explain: "`==` compares arrows. a and c point to different objects." },
  });
  t.print("true").step(7, "`==` on arrays compares **references**, not contents. `a` and `b` point to the same object, so it prints `true`.");
  t.print("false").step(8, "Different objects, so `false`, even if the values happened to be equal. To compare **contents**, use `Arrays.equals(a, c)`.");
  t.set("a", t.newArray("int[]", [0, 0])).step(9, "`a` now points to a brand-new array. The old array is not lost: `b` still points to it, so it stays alive. Only an object that **nothing** points to is garbage.");
  return t.build();
})();

// ---------- 2. Arrays and methods ----------
const methods = (() => {
  const t = new Tracer(`
static void fill(int[] arr, int v) {
    for (int i = 0; i < arr.length; i++) {
        arr[i] = v;
    }
}

static void replace(int[] arr) {
    arr = new int[]{0, 0};
    arr[0] = 5;
}

public static void main(String[] args) {
    int[] data = {1, 2};
    fill(data, 8);
    replace(data);
    System.out.println(data[0]);
}
`);
  t.call("main");
  t.step(0, "The program starts in `main`. Watch the **frames** on the left: each method call gets its own box of variables.");
  const data = t.newArray("int[]", [1, 2]);
  t.set("data", data).step(13, "`data` refers to an array `{1, 2}`.");
  t.call("fill(arr, v)", { arr: data, v: 8 }).step(14, "Calling `fill(data, 8)` pushes a new frame. The parameter `arr` receives a **copy of the arrow** in `data`, so both point to the same array. `v` receives a copy of 8.");
  t.set("i", 0).step(2, "The loop starts with `i = 0`.");
  t.setItem(data, 0, 8).step(3, "`arr[i] = v` follows the arrow and writes into the **shared** array, the same one `data` points to.");
  t.set("i", 1).step(2, "`i = 1`.");
  t.setItem(data, 1, 8).step(3, "Second slot written.");
  t.set("i", 2).step(2, "`i = 2` is not `< arr.length`, so the loop ends.");
  t.ret().step(5, "`fill` returns and its frame disappears (`arr`, `v`, `i` are gone). The array keeps its new values because they were written into the shared object.");
  t.call("replace(arr)", { arr: data }).step(15, "`replace(data)` pushes another frame. Again `arr` starts as a copy of `data`'s arrow.", {
    ask: {
      q: "Line 8 runs `arr = new int[]{0, 0}`. Does `data` change?",
      options: ["Yes, data now points to {0, 0}", "No, only arr's arrow moves"],
      answer: 1,
      explain: "Java passes a copy of the reference. Re-pointing the copy cannot move the caller's arrow.",
    },
  });
  const fresh = t.newArray("int[]", [0, 0]);
  t.set("arr", fresh).step(8, "`arr = new ...` moves **only `arr`'s arrow**. `data` in `main` still points to the old array. Java copied the arrow into the parameter; it did not tie the two variables together.");
  t.setItem(fresh, 0, 5).step(9, "`arr[0] = 5` changes the new array, which `main` cannot reach.");
  t.ret().step(10, "`replace` returns. Nothing points to `{5, 0}` any more, so it is garbage.");
  t.print("8").step(16, "Prints `8`. Rule: a method **can change the contents** of an array you pass in, but **cannot make your variable point somewhere else**. To hand back a new array, `return` it.");
  return t.build();
})();

// ---------- 3. Inside int[][] ----------
const twoD = (() => {
  const t = new Tracer(`
int[][] g = new int[3][];
g[0] = new int[]{1, 2, 3};
g[1] = new int[]{4};
g[2] = g[0];
g[2][1] = 0;
int[][] copy = g.clone();
copy[1] = new int[]{7, 7};
copy[0][0] = 5;
System.out.println(g[0][0] + " " + g[1][0]);
`);
  t.call("main");
  t.step(0, "Arrays whose slots hold references are drawn **vertically**, with an arrow from each slot.");
  const g = t.newArray("int[][]", [null, null, null]);
  t.set("g", g).step(1, "`new int[3][]` creates exactly **one** object: the outer array, with 3 slots for row references. All slots start as `null`; no rows exist yet. Reading `g[0].length` now would throw a NullPointerException.");
  const r0 = t.newArray("int[]", [1, 2, 3]);
  t.setItem(g, 0, r0).step(2, "Row 0 is its own `int[]` object; slot `g[0]` now points to it.");
  const r1 = t.newArray("int[]", [4]);
  t.setItem(g, 1, r1).step(3, "Row 1 has length 1. Rows are independent objects, which is why a 2D array can be **jagged**.", {
    ask: { q: "Line 4 runs `g[2] = g[0]`. How many new arrays does it create?", options: ["0", "1", "3"], answer: 0, explain: "Assigning a reference never creates an array; g[2] just gets a copy of g[0]'s arrow." },
  });
  t.setItem(g, 2, r0).step(4, "`g[2] = g[0]` copies a reference. Rows 0 and 2 are now **the same array object**: two arrows, one row.");
  t.setItem(r0, 1, 0).step(5, "`g[2][1] = 0` changes that shared row, so `g[0][1]` is 0 too. `Arrays.deepToString(g)` would print `[[1, 0, 3], [4], [1, 0, 3]]`.");
  const copy = t.newArray("int[][]", [r0, r1, r0]);
  t.set("copy", copy).step(6, "`clone()` on a 2D array is a **shallow copy**: a new outer array whose slots hold the **same row arrows**. Not a single row was copied.", {
    ask: { q: "Line 8 runs `copy[0][0] = 5`. Does `g[0][0]` change?", options: ["Yes", "No"], answer: 0, explain: "copy[0] and g[0] point to the same row object." },
  });
  const r2 = t.newArray("int[]", [7, 7]);
  t.setItem(copy, 1, r2).step(7, "Replacing `copy[1]` re-points a slot in the **copy's** outer array only. `g[1]` still points to `{4}`.");
  t.setItem(r0, 0, 5).step(8, "`copy[0][0] = 5` goes through `copy[0]`, which is the same row as `g[0]` and `g[2]`. All three see the 5.");
  t.print("5 4").step(9, "Prints `5 4`. For an independent (**deep**) copy, copy every row yourself: `copy[r] = g[r].clone();` (or `Arrays.copyOf(g[r], g[r].length)`).");
  return t.build();
})();

// ---------- 4. Arrays of objects ----------
const objects = (() => {
  const t = new Tracer(`
Point[] ps = new Point[3];
ps[0] = new Point(1, 2);
ps[1] = ps[0];
ps[1].x = 5;
Arrays.fill(ps, new Point(0, 0));
ps[0].y = 9;
System.out.println(ps[2].y);
`);
  t.call("main");
  t.step(0, "`Point` is a small class with two fields, `x` and `y`.");
  const ps = t.newArray("Point[]", [null, null, null]);
  t.set("ps", ps).step(1, "An array of objects starts with `null` in every slot. **No Point exists yet**: `ps[2].x` here would throw a NullPointerException.");
  const p1 = t.newObject("Point", { x: 1, y: 2 });
  t.setItem(ps, 0, p1).step(2, "`new Point(1, 2)` creates one object; slot 0 points to it.");
  t.setItem(ps, 1, p1).step(3, "Slot 1 gets a copy of slot 0's arrow: one Point, reachable from two slots.", {
    ask: { q: "After line 4 (`ps[1].x = 5`), what is `ps[0].x`?", options: ["1", "5"], answer: 1, explain: "Both slots lead to the same Point object." },
  });
  t.setField(p1, "x", 5).step(4, "There is only one Point, so `ps[0].x` is 5 too.", {
    ask: { q: "Line 5 calls `Arrays.fill(ps, new Point(0, 0))`. How many Point objects does that create?", options: ["1", "3"], answer: 0, explain: "`new Point(0, 0)` runs once, before fill is called. fill copies that one arrow into every slot." },
  });
  const p2 = t.newObject("Point", { x: 0, y: 0 });
  t.setItem(ps, 0, p2).setItem(ps, 1, p2).setItem(ps, 2, p2);
  t.step(5, "`new Point(0, 0)` runs **once**, and `fill` copies the same arrow into all 3 slots. The old Point has no arrows left, so it is garbage.");
  t.setField(p2, "y", 9).step(6, "Setting `ps[0].y` changes the one Point that every slot points to.");
  t.print("9").step(7, "Prints `9`, a classic bug. To get 3 separate Points, create each one: `for (int i = 0; i < ps.length; i++) ps[i] = new Point(0, 0);`");
  return t.build();
})();

export const knowledge: KnowledgeTopic[] = [
  {
    id: "references",
    title: "An array variable holds an arrow",
    summary: "Aliasing, why == is not equality of contents, what clone() really copies, and when an array becomes garbage.",
    minutes: 6,
    sections: [
      {
        type: "markdown",
        md: `The textbook shows *what* array code does. This page shows *why*, by drawing memory.

Two places hold data in a running Java program:

- **Variables** live in a method's frame (the left column). A variable of type \`int\` holds the number itself.
- **Objects** live on the heap (the right side). Every array is an object. A variable of type \`int[]\` holds only a **reference** to it, drawn as an arrow.

Step through the program and predict before you click.`,
      },
      { type: "trace", trace: aliasing, caption: "Aliasing, ==, clone()" },
      {
        type: "callout",
        tone: "info",
        md: "**Takeaways.** Assigning an array variable copies the arrow, never the array. `==` asks *same object?*, `Arrays.equals` asks *same contents?* An object becomes garbage only when no arrow points to it.",
      },
    ],
  },
  {
    id: "methods",
    title: "Arrays in methods: change the contents vs. move the arrow",
    summary: "What happens to frames and references when you pass an array to a method, and why reassigning a parameter does nothing for the caller.",
    minutes: 7,
    sections: [
      {
        type: "markdown",
        md: `Java always passes **a copy of the value** in the variable. For an array variable, that value is an arrow. So the method gets its own arrow to the **same** array.

Watch the frames: \`main\` stays at the bottom, and each call stacks a new frame on top that disappears when the method returns.`,
      },
      { type: "trace", trace: methods, caption: "fill() changes the contents, replace() only moves its own arrow" },
      {
        type: "callout",
        tone: "info",
        md: "This is why a filter like `brighten` either changes the caller's image in place or **returns** a new array. Assigning a new array to the parameter is invisible to the caller.",
      },
    ],
  },
  {
    id: "inside-2d-arrays",
    title: "Inside int[][]: shared rows and shallow copies",
    summary: "A 2D array is an array of row arrows. See null rows, jagged rows, two slots sharing one row, and why clone() does not copy the rows.",
    minutes: 8,
    sections: [
      {
        type: "markdown",
        md: `\`int[][]\` reads as "array of \`int[]\`". The outer array stores **arrows to rows**, and each row is a separate object. Everything surprising about 2D arrays follows from that one fact:

- rows can have different lengths (**jagged**),
- a slot can be \`null\` (**no row at all**),
- two slots can point to **the same row**,
- copying the outer array does **not** copy the rows.`,
      },
      { type: "trace", trace: twoD, caption: "Null rows, a shared row, and a shallow clone" },
      {
        type: "callout",
        tone: "warn",
        md: "Shared rows are a real bug source in image code: if two rows of an image are the same object, editing one pixel changes two rows. That's why PF-105's test checks that every row of your output is a **new** array.",
      },
    ],
  },
  {
    id: "object-arrays",
    title: "Arrays of objects: null slots and the Arrays.fill trap",
    summary: "An object array starts empty (all null). See how one object can sit in many slots, and why Arrays.fill with new gives you one shared object.",
    minutes: 6,
    sections: [
      {
        type: "markdown",
        md: `An array of objects, like \`Point[]\`, is an array of **arrows**, exactly like the outer array of an \`int[][]\`.

~~~java
class Point {
    int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }
}
~~~`,
      },
      { type: "trace", trace: objects, caption: "null slots, a shared Point, and Arrays.fill" },
    ],
  },
  {
    id: "memory-and-cache",
    title: "Does traversal order change speed?",
    summary: "Row-major vs. column-major from the hardware's point of view: contiguous memory, cache lines, and why the honest answer for Java is \"often, but measure\".",
    minutes: 8,
    sections: [
      {
        type: "markdown",
        md: `Both traversal orders visit every cell once, so both are O(R·C). Yet one can be noticeably faster. The reason is the **CPU cache**.

- Memory is slow compared to the CPU. When the CPU reads one value, it loads a whole block of neighbors (a **cache line**, often 64 bytes = 16 \`int\`s) into a small, fast cache.
- If your next read is a neighbor, it is already in cache (a **hit**). If it is far away, the CPU waits for memory again (a **miss**).

The lab below *imagines* the matrix stored as one contiguous block and counts misses with a tiny 4-int cache line. Try both traversal orders with both storage layouts.`,
      },
      { type: "traversal-lab", modes: ["row-major", "column-major"], rows: 4, cols: 6 },
      {
        type: "markdown",
        md: `## How this applies to Java

A Java \`int[][]\` is **not** one contiguous block: it is an outer array of arrows to separate row objects (see *Inside int[][]*). Still:

- each **row** is contiguous, so walking along a row (row-major) reads neighbors and is cache-friendly;
- walking down a column jumps to a different row object on every step.

So row-major is *usually* faster for large arrays. But the JIT compiler, the hardware and the array size all matter, and for small arrays you will not see a difference. The only honest way to know is to **measure** with a proper benchmark.`,
      },
      {
        type: "callout",
        tone: "info",
        md: "For your tickets, choose the order that matches the problem (row sums → row-major, column sums → column-major). Clear code first; optimize only after measuring.",
      },
    ],
  },
];
