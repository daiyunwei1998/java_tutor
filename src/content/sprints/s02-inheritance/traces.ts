import { Tracer, type Trace } from "@/lib/trace";

/*
 * Code ↔ memory traces for Sprint 2 (used by tickets through `{ type: "trace", traceId }` and by the
 * Knowledge Space pages). Written with the Tracer builder: change the model the way the Java program
 * would, then call step(line, explanation) after each executed line.
 */

// ---------- primitive vs reference ----------
const primVsRef = (() => {
  const t = new Tracer(`
int amount = 40;
int saved = amount;
amount = 80;
int[] img = {10, 20};
int[] original = img;
img[0] = 255;
System.out.println(saved + " " + original[0]);
`);
  t.call("main");
  t.step(0, "Press **Next ▶**. Watch what is *inside* each variable's box.");
  t.set("amount", 40).step(1, "`int` is a **primitive type**: the box holds the number 40 itself.");
  t.set("saved", 40).step(2, "`=` copies what is in `amount`'s box into `saved`. There are now two separate 40s.", {
    ask: { q: "Line 3 sets `amount = 80`. What is `saved` afterwards?", options: ["40", "80"], answer: 0, explain: "saved is its own box; only amount's box changes." },
  });
  t.set("amount", 80).step(3, "Only `amount`'s box changed. `saved` is a different box and is still 40.");
  const arr = t.newArray("int[]", [10, 20]);
  t.set("img", arr).step(4, "An array is a **reference type**: the numbers live in an **object** on the heap, and `img`'s box holds only a **reference** (the arrow).");
  t.set("original", arr).step(5, "`=` again copies what is in the box. This time the box holds an arrow, so you get **a second arrow to the same object**. The array itself was not copied.", {
    ask: { q: "Line 6 sets `img[0] = 255`. What is `original[0]` now?", options: ["10", "255"], answer: 1, explain: "There is only one array; img and original are two arrows to it." },
  });
  t.setItem(arr, 0, 255).step(6, "Changing the object through `img` is visible through `original`: same object. This is exactly the Undo bug.");
  t.print("40 255").step(7, "Prints `40 255`. Same `=`, different contents: a value for primitives, an arrow for references.");
  return t.build();
})();

// ---------- shallow vs deep copy of an image ----------
const deepCopy = (() => {
  const t = new Tracer(`
int[][] img = {{10, 20}, {30, 40}};
int[][] backup = new int[img.length][];
backup[0] = img[0];
backup[1] = new int[]{img[1][0], img[1][1]};
img[0][0] = 255;
img[1][0] = 0;
System.out.println(backup[0][0] + " " + backup[1][0]);
`);
  t.call("main");
  t.step(0, "A backup for Undo, done two ways: row 0 the *shallow* way, row 1 the *deep* way.");
  const r0 = t.newArray("int[]", [10, 20]);
  const r1 = t.newArray("int[]", [30, 40]);
  const outer = t.newArray("int[][]", [r0, r1]);
  t.set("img", outer).step(1, "An image is an outer array of **references to row arrays** (Sprint 1, PF-101).");
  const b = t.newArray("int[][]", [null, null]);
  t.set("backup", b).step(2, "`new int[img.length][]` makes a **new outer array** whose slots are still `null`.");
  t.setItem(b, 0, r0).step(3, "`backup[0] = img[0]` copies the **arrow** to row 0. Both outer arrays now share that row.");
  const nr1 = t.newArray("int[]", [30, 40]);
  t.setItem(b, 1, nr1).step(4, "Row 1 is done properly: a **new** `int[]` with the numbers copied in.", {
    ask: { q: "After line 5 and 6 change img, what will line 7 print?", options: ["10 30", "255 30", "255 0"], answer: 1, explain: "Row 0 is shared, so its change shows. Row 1 was really copied, so it does not." },
  });
  t.setItem(r0, 0, 255).step(5, "Changing the shared row 0 changes what `backup[0]` sees.");
  t.setItem(r1, 0, 0).step(6, "Changing img's row 1 does **not** touch backup's own row 1.");
  t.print("255 30").step(7, "A real backup needs a new outer array **and** a new array for every row: a **deep copy**.");
  return t.build();
})();

// ---------- fields vs local variables ----------
const fieldVsLocal = (() => {
  const t = new Tracer(`
public class Counter {
    private int clicks;          // field: lives in the object
    public void click() {
        int temp = 0;            // local variable: lives in the method's frame
        temp++;
        clicks++;
    }
}
// main:
Counter c = new Counter();
c.click();
c.click();
`);
  t.call("main");
  t.step(0, "Watch two things: the **frames** on the left (one per method call) and the **object** on the right.");
  const c = t.newObject("Counter", { clicks: 0 });
  t.set("c", c).step(10, "`new` creates a Counter object. Its field `clicks` lives **inside the object** and starts at the default value 0.");
  t.call("c.click()", { this: c }).step(11, "Calling `c.click()` pushes a frame. It holds a hidden variable `this`: an arrow to **the object doing the action**.");
  t.set("temp", 0).step(4, "`temp` is a local variable, so it lives in the **frame**.");
  t.set("temp", 1).step(5, "`temp` becomes 1.");
  t.setField(c, "clicks", 1).step(6, "`clicks++` changes the field of the object `this` points to.");
  t.ret().step(7, "The method ends: its frame disappears, and **`temp` disappears with it**. The object, and `clicks = 1`, stay.", {
    ask: { q: "The second `c.click()` starts. What value does `temp` start with?", options: ["1 (from last time)", "0 (it starts over)"], answer: 1, explain: "Each call gets a brand-new frame; local variables do not remember earlier calls." },
  });
  t.call("c.click()", { this: c }).step(12, "Second call: a **brand-new** frame.");
  t.set("temp", 0).step(4, "`temp` starts at 0 again. It does not remember the last call.");
  t.set("temp", 1).step(5, "`temp` is 1 again.");
  t.setField(c, "clicks", 2).step(6, "`clicks` continues from 1 to 2: the object **remembers**.");
  t.ret().step(7, "Done: `clicks` is 2, and `temp` no longer exists. That is the difference between a field and a local variable.");
  return t.build();
})();

// ---------- two objects, each with its own field ----------
const twoObjects = (() => {
  const t = new Tracer(`
public void setAmount(int amount) {
    this.amount = Math.max(-255, Math.min(255, amount));
}
// main:
BrightnessAdjust a = new BrightnessAdjust(20);
BrightnessAdjust b = new BrightnessAdjust(-10);
a.setAmount(35);
System.out.println(b.getAmount());
`);
  t.call("main");
  t.step(0, "One class, two objects. Watch which object `this` points to in each call.");
  const a = t.newObject("BrightnessAdjust", { amount: 20 });
  t.set("a", a).step(5, "A BrightnessAdjust object with its own `amount` field, set to 20 by the constructor.");
  const b = t.newObject("BrightnessAdjust", { amount: -10 });
  t.set("b", b).step(6, "A **second** object with **its own** `amount`. Every object of a class gets its own copy of the fields.");
  t.call("a.setAmount(amount)", { this: a, amount: 35 }).step(7, "`a.setAmount(35)`: in this call, `this` points to **a's** object.");
  t.setField(a, "amount", 35).step(2, "`this.amount = …` changes the field of **a's** object. b's object is not touched.", {
    ask: { q: "What will `b.getAmount()` return?", options: ["35", "-10"], answer: 1, explain: "setAmount ran with this = a, so only a's field changed." },
  });
  t.ret().step(3, "The call ends; its frame (and the parameter `amount`) disappears.");
  t.call("b.getAmount()", { this: b }).step(8, "`b.getAmount()`: now `this` points to **b's** object, so it reads b's field.");
  t.ret().print("-10").step(8, "Prints -10. An instance method is an action done by **one specific object**, using that object's fields. That is why `apply(img)` needs no amount parameter.");
  return t.build();
})();

// ---------- the amount = amount bug ----------
const shadowing = (() => {
  const t = new Tracer(`
// buggy constructor
public BrightnessAdjust(int amount) {
    amount = amount;
}
// fixed constructor
public BrightnessAdjust(int amount) {
    this.amount = amount;
}
// main:
BrightnessAdjust a = new BrightnessAdjust(20);   // buggy version
BrightnessAdjust b = new BrightnessAdjust(20);   // fixed version
`);
  t.call("main");
  t.step(0, "Two versions of the same constructor. Watch where the 20 ends up.");
  const a = t.newObject("BrightnessAdjust", { amount: 0 });
  t.call("BrightnessAdjust(amount) · buggy", { this: a, amount: 20 }).step(10, "`new` makes the object (field `amount` = 0), then runs the constructor. Now there are **two** things called `amount`: the parameter (in the frame) and the field (in the object).");
  t.step(3, "With two things of the same name, `amount` means the **closest one: the parameter**. This line sets the parameter to itself. The field is still 0.", {
    ask: { q: "What will `a.getAmount()` return?", options: ["20", "0"], answer: 1, explain: "The field was never assigned, so it keeps its default value 0." },
  });
  t.ret().set("a", a).step(4, "The constructor ends and the parameter disappears. `a`'s field is 0: a classic bug, with no compiler error.");
  const b = t.newObject("BrightnessAdjust", { amount: 0 });
  t.call("BrightnessAdjust(amount) · fixed", { this: b, amount: 20 }).step(11, "The fixed version: same parameter name.");
  t.setField(b, "amount", 20).step(7, "`this.amount` clearly means **the field of the object `this` points to**, so the 20 is stored.");
  t.ret().set("b", b).step(8, "`b`'s field is 20, `a`'s is still 0. Another fix: give the parameter a different name, like `newAmount`.");
  return t.build();
})();

// ---------- what is inside a subclass object; super(...) ----------
const superChain = (() => {
  const t = new Tracer(`
public class Filter {
    private String name;
    public Filter(String name) {
        this.name = name;
    }
}
public class BrightnessFilter extends Filter {
    private int amount;
    public BrightnessFilter(int amount) {
        super("Brightness");
        setAmount(amount);
    }
}
// main:
Filter f = new BrightnessFilter(40);
`);
  t.call("main");
  t.step(0, "What does `new BrightnessFilter(40)` build, and in what order do the constructors run?");
  const o = t.newObject("BrightnessFilter", { name: null, amount: 0 });
  t.call("BrightnessFilter(amount)", { this: o, amount: 40 }).step(15, "`new` creates **one** object that has the fields of **both** classes: `name` (declared in Filter) and `amount` (declared in BrightnessFilter). All start at default values.");
  t.call("Filter(name)", { this: o, name: '"Brightness"' }).step(11, "`super(\"Brightness\")` runs **Filter's constructor first**. Only Filter's code may touch its `private` field `name`, so Filter sets up its own part.");
  t.setField(o, "name", '"Brightness"').step(4, "Filter's constructor stores the name. (A String is an object too; it is drawn inline here to keep the picture small.)");
  t.ret().step(5, "Filter's part of the object is ready, so BrightnessFilter's code can now safely use inherited methods like `getName()`.", {
    ask: { q: "Why must `super(...)` run before the rest of BrightnessFilter's constructor?", options: ["Because the compiler likes it first", "So the Filter part is valid before subclass code uses it"], answer: 1, explain: "The subclass's setup may rely on the superclass's part (fields, inherited methods), so that part is built first." },
  });
  t.setField(o, "amount", 40).step(12, "Now BrightnessFilter sets up its **own** part.");
  t.ret().set("f", o).step(15, "`f` is declared as `Filter`, but the object it points to is a `BrightnessFilter`. One object, built in two layers: superclass part first.");
  return t.build();
})();

// ---------- which apply runs? overload vs override ----------
const dispatchOverload = (() => {
  const t = new Tracer(`
public class Filter {
    public int[][] apply(int[][] img) { return ImageUtils.copy(img); }
}
public class InvertFilter extends Filter {
    public int[][] apply(int[][] img, int strength) { /* invert */ }
}
// main (the editor's pipeline):
int[][] img = {{0, 100}};
Filter f = new InvertFilter();
int[][] out = f.apply(img);
`);
  t.call("main");
  t.step(0, "The editor only knows that every Filter has `apply(int[][] img)`. Which `apply` runs for an InvertFilter?");
  const img = t.newArray("int[]", [0, 100]);
  t.set("img", img).step(9, "A one-row image (drawn as an `int[]` to keep it small).");
  const f = t.newObject("InvertFilter", { name: '"Invert"' });
  t.set("f", f).step(10, "`f` is declared `Filter` and points to an InvertFilter object.", {
    ask: {
      q: "`f.apply(img)` runs. Which method?",
      options: ["InvertFilter's apply(img, strength)", "Filter's apply(img)"],
      answer: 1,
      explain: "Java looks for apply with exactly one int[][] parameter, starting at the object's class InvertFilter. Its apply has a different parameter list, so it does not count; Filter's version is found.",
    },
  });
  t.call("Filter.apply(img)", { this: f, img }).step(11, "At **run time** Java starts at the object's real class, InvertFilter, and looks for `apply(int[][])`. InvertFilter only has `apply(int[][], int)`: a **different method** (an overload). So the search moves up to **Filter's** `apply`.");
  const copy = t.newArray("int[]", [0, 100]);
  t.set("copy", copy).step(2, "Filter's default `apply` just makes an unchanged copy.");
  t.ret().set("out", copy).step(11, "`out` is an unchanged copy: the \"Invert does nothing\" bug. The fix is to **override**, with exactly the same parameter list, `apply(int[][] img)`, and to add `@Override` so the compiler checks it.");
  return t.build();
})();

export const sprint2Traces = {
  "prim-vs-ref": primVsRef,
  "deep-copy": deepCopy,
  "field-vs-local": fieldVsLocal,
  "two-objects": twoObjects,
  shadowing,
  "super-chain": superChain,
  "dispatch-overload": dispatchOverload,
} satisfies Record<string, Trace>;
