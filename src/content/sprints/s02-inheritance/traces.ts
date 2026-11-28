import { Tracer, type Trace } from "@/lib/trace";

/*
 * Code ↔ memory traces for Sprint 2 (Pixel Arena), used by the Knowledge Space pages. Written with the Tracer
 * builder: change the model the way the Java program would, then call step(line, explanation) after each line.
 */

// ---------- primitive vs reference ----------
const primVsRef = (() => {
  const t = new Tracer(`
int hp = 100;
int saved = hp;
hp = 40;
Hero aria = new Hero("Aria", 100);
Hero leader = aria;
leader.takeDamage(60);
System.out.println(saved + " " + aria.getHp());
`);
  t.call("main");
  t.step(0, "Press **Next ▶**. Watch what is *inside* each variable's box.");
  t.set("hp", 100).step(1, "`int` is a **primitive type**: the box holds the number 100 itself.");
  t.set("saved", 100).step(2, "`=` copies what is in `hp`'s box into `saved`. There are now two separate 100s.", {
    ask: { q: "Line 3 sets `hp = 40`. What is `saved` afterwards?", options: ["100", "40"], answer: 0, explain: "saved is its own box; only hp's box changes." },
  });
  t.set("hp", 40).step(3, "Only `hp`'s box changed. `saved` is a different box and is still 100.");
  const a = t.newObject("Hero", { name: '"Aria"', hp: 100 });
  t.set("aria", a).step(4, "`Hero` is a **reference type**: the hero lives in an **object** on the heap, and `aria`'s box holds only a **reference** (the arrow).");
  t.set("leader", a).step(5, "`=` again copies what is in the box. This time the box holds an arrow, so you get **a second arrow to the same hero**. No new hero was created.", {
    ask: { q: "Line 6 damages `leader`. What is `aria.getHp()` now?", options: ["100", "40"], answer: 1, explain: "There is only one Hero object; aria and leader are two arrows to it." },
  });
  t.setField(a, "hp", 40).step(6, "Changing the object through `leader` is visible through `aria`: same object.");
  t.print("100 40").step(7, "Prints `100 40`. Same `=`, different contents: a value for primitives, an arrow for references.");
  return t.build();
})();

// ---------- fields vs local variables ----------
const fieldVsLocal = (() => {
  const t = new Tracer(`
public class Hero {
    private int hp = 100;        // field: lives in the object
    public void takeDamage(int amount) {
        int newHp = hp - amount; // local variable: lives in the method's frame
        hp = newHp;
    }
}
// main:
Hero aria = new Hero();
aria.takeDamage(30);
aria.takeDamage(30);
`);
  t.call("main");
  t.step(0, "Watch two things: the **frames** on the left (one per method call) and the **object** on the right.");
  const h = t.newObject("Hero", { hp: 100 });
  t.set("aria", h).step(10, "`new` creates a Hero object. Its field `hp` lives **inside the object**.");
  t.call("aria.takeDamage(amount)", { this: h, amount: 30 }).step(11, "Calling `aria.takeDamage(30)` pushes a frame. It holds the parameter `amount` and a hidden variable `this`: an arrow to **the object doing the action**.");
  t.set("newHp", 70).step(4, "`newHp` is a local variable, so it lives in the **frame**.");
  t.setField(h, "hp", 70).step(5, "`hp = newHp` changes the field of the object `this` points to.");
  t.ret().step(6, "The method ends: its frame disappears, and **`amount` and `newHp` disappear with it**. The object, and `hp = 70`, stay.", {
    ask: { q: "The second `takeDamage(30)` starts. What is the field `hp` at that moment?", options: ["100 (it starts over)", "70 (the object remembers)"], answer: 1, explain: "Fields live as long as the object. Only the frame's variables start over." },
  });
  t.call("aria.takeDamage(amount)", { this: h, amount: 30 }).step(12, "Second call: a **brand-new** frame.");
  t.set("newHp", 40).step(4, "`newHp` is a new local variable again, computed from the remembered hp 70.");
  t.setField(h, "hp", 40).step(5, "The field continues from 70 to 40.");
  t.ret().step(6, "Done: `hp` is 40, and `newHp` no longer exists. That is the difference between a field and a local variable.");
  return t.build();
})();

// ---------- two objects, each with its own field ----------
const twoObjects = (() => {
  const t = new Tracer(`
public void takeDamage(int amount) {
    hp = hp - amount;
}
// main:
Hero aria = new Hero("Aria", 100);
Hero bram = new Hero("Bram", 80);
aria.takeDamage(35);
System.out.println(bram.getHp());
`);
  t.call("main");
  t.step(0, "One class, two objects. Watch which object `this` points to in each call.");
  const a = t.newObject("Hero", { name: '"Aria"', hp: 100 });
  t.set("aria", a).step(5, "A Hero object with its own `hp` field, set to 100 by the constructor.");
  const b = t.newObject("Hero", { name: '"Bram"', hp: 80 });
  t.set("bram", b).step(6, "A **second** object with **its own** `hp`. Every object of a class gets its own copy of the fields.");
  t.call("aria.takeDamage(amount)", { this: a, amount: 35 }).step(7, "`aria.takeDamage(35)`: in this call, `this` points to **Aria's** object.");
  t.setField(a, "hp", 65).step(2, "`hp = hp - amount` means `this.hp`: Aria's field. Bram's object is not touched.", {
    ask: { q: "What will `bram.getHp()` return?", options: ["45", "80"], answer: 1, explain: "takeDamage ran with this = aria, so only Aria's field changed." },
  });
  t.ret().step(3, "The call ends; its frame (and the parameter `amount`) disappears.");
  t.call("bram.getHp()", { this: b }).step(8, "`bram.getHp()`: now `this` points to **Bram's** object, so it reads Bram's field.");
  t.ret().print("80").step(8, "Prints 80. An instance method is an action done by **one specific object**, using that object's fields.");
  return t.build();
})();

// ---------- the name = name bug ----------
const shadowing = (() => {
  const t = new Tracer(`
// buggy constructor
public Hero(String name) {
    name = name;
}
// fixed constructor
public Hero(String name) {
    this.name = name;
}
// main:
Hero a = new Hero("Aria");   // buggy version
Hero b = new Hero("Aria");   // fixed version
`);
  t.call("main");
  t.step(0, "Two versions of the same constructor. Watch where \"Aria\" ends up.");
  const a = t.newObject("Hero", { name: null });
  t.call("Hero(name) · buggy", { this: a, name: '"Aria"' }).step(10, "`new` makes the object (field `name` = null), then runs the constructor. Now there are **two** things called `name`: the parameter (in the frame) and the field (in the object).");
  t.step(3, "With two things of the same name, `name` means the **closest one: the parameter**. This line sets the parameter to itself. The field is still null.", {
    ask: { q: "What will `a.getName()` return?", options: ["\"Aria\"", "null"], answer: 1, explain: "The field was never assigned, so it keeps its default value null." },
  });
  t.ret().set("a", a).step(4, "The constructor ends and the parameter disappears. `a`'s name is null: a classic bug, with no compiler error.");
  const b = t.newObject("Hero", { name: null });
  t.call("Hero(name) · fixed", { this: b, name: '"Aria"' }).step(11, "The fixed version: same parameter name.");
  t.setField(b, "name", '"Aria"').step(7, "`this.name` clearly means **the field of the object `this` points to**, so the name is stored.");
  t.ret().set("b", b).step(8, "`b`'s name is \"Aria\", `a`'s is still null. Another fix: give the parameter a different name, like `heroName`.");
  return t.build();
})();

// ---------- what is inside a subclass object; super(...) ----------
const superChain = (() => {
  const t = new Tracer(`
public class Hero {
    private String name;
    private int maxHp;
    public Hero(String name, int maxHp) {
        this.name = name;
        this.maxHp = maxHp;
    }
}
public class Mage extends Hero {
    private int mana;
    public Mage(String name) {
        super(name, 70);
        mana = 50;
    }
}
// main:
Hero h = new Mage("Cara");
`);
  t.call("main");
  t.step(0, "What does `new Mage(\"Cara\")` build, and in what order do the constructors run?");
  const o = t.newObject("Mage", { name: null, maxHp: 0, mana: 0 });
  t.call("Mage(name)", { this: o, name: '"Cara"' }).step(17, "`new` creates **one** object that has the fields of **both** classes: `name` and `maxHp` (declared in Hero) and `mana` (declared in Mage). All start at default values.");
  t.call("Hero(name, maxHp)", { this: o, name: '"Cara"', maxHp: 70 }).step(12, "`super(name, 70)` runs **Hero's constructor first**. Only Hero's code may touch its `private` fields, so Hero sets up its own part.");
  t.setField(o, "name", '"Cara"').step(5, "Hero's constructor stores the name. (A String is an object too; it is drawn inline here to keep the picture small.)");
  t.setField(o, "maxHp", 70).step(6, "…and the 70 that Mage passed in.");
  t.ret().step(7, "Hero's part of the object is ready, so Mage's code can now safely use inherited methods like `getName()`.", {
    ask: { q: "Why must `super(...)` run before the rest of Mage's constructor?", options: ["Because the compiler likes it first", "So the Hero part is valid before subclass code uses it"], answer: 1, explain: "The subclass's setup may rely on the superclass's part (fields, inherited methods), so that part is built first." },
  });
  t.setField(o, "mana", 50).step(13, "Now Mage sets up its **own** part.");
  t.ret().set("h", o).step(17, "`h` is declared as `Hero`, but the object it points to is a `Mage`. One object, built in two layers: superclass part first.");
  return t.build();
})();

// ---------- which attack runs? overload vs override ----------
const dispatchOverload = (() => {
  const t = new Tracer(`
public class Hero {
    public void attack(Hero target) { /* normal hit */ }
}
public class Mage extends Hero {
    public void attack(Hero target, int power) { /* spell */ }
}
// main (the party's battle loop):
Hero dummy = new Hero("Dummy", 300);
Hero h = new Mage("Cara");
h.attack(dummy);
`);
  t.call("main");
  t.step(0, "The battle loop only knows that every Hero has `attack(Hero target)`. Which `attack` runs for a Mage?");
  const d = t.newObject("Hero", { name: '"Dummy"', hp: 300 });
  t.set("dummy", d).step(9, "A training dummy to hit.");
  const m = t.newObject("Mage", { name: '"Cara"', mana: 50 });
  t.set("h", m).step(10, "`h` is declared `Hero` and points to a Mage object.", {
    ask: {
      q: "`h.attack(dummy)` runs. Which method?",
      options: ["Mage's attack(target, power)", "Hero's attack(target)"],
      answer: 1,
      explain: "Java looks for attack with exactly one Hero parameter, starting at the object's class Mage. Mage's attack has a different parameter list, so it does not count; Hero's version is found.",
    },
  });
  t.call("Hero.attack(target)", { this: m, target: d }).step(11, "At **run time** Java starts at the object's real class, Mage, and looks for `attack(Hero)`. Mage only has `attack(Hero, int)`: a **different method** (an overload). So the search moves up to **Hero's** `attack`.");
  t.setField(d, "hp", 291).step(2, "Hero's normal hit runs, no spell, no mana spent.");
  t.ret().step(11, "The \"mage attacks like a normal hero\" bug. The fix is to **override**, with exactly the same parameter list, `attack(Hero target)`, and to add `@Override` so the compiler checks it.");
  return t.build();
})();

export const sprint2Traces = {
  "prim-vs-ref": primVsRef,
  "field-vs-local": fieldVsLocal,
  "two-objects": twoObjects,
  shadowing,
  "super-chain": superChain,
  "dispatch-overload": dispatchOverload,
} satisfies Record<string, Trace>;
