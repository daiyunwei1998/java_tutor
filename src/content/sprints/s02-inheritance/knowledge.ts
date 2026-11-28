import type { KnowledgeTopic } from "../../types";
import { sprint2Traces as T } from "./traces";
import { tickets } from "./tickets";

// The code map of the review ticket QF-215, reused here so it can be opened without a ticket.
const arenaMap = tickets.find((t) => t.id === "QF-215")?.blocks.find((b) => b.type === "code-map");
if (!arenaMap || arenaMap.type !== "code-map") throw new Error("QF-215 code map missing");

/*
 * Knowledge Space for Sprint 2 (inheritance): optional, deeper material. Each topic starts from the problem
 * the idea solves, then shows it in a code ↔ memory trace. Examples use the Pixel Arena
 * classes (Hero, Mage) from the tickets.
 */
export const knowledge: KnowledgeTopic[] = [
  {
    id: "primitive-vs-reference",
    title: "Why Java has two kinds of types",
    summary: "Primitive variables hold values; reference variables hold arrows. Why the language is built this way, and what \"derived type\" means.",
    minutes: 6,
    sections: [
      {
        type: "markdown",
        md: `Sprint 1 showed *what* happens when you copy an array variable: you get a second arrow to the same object. This page is about *why* Java works like that.

Every variable is a box, and \`=\` always does the same thing: **copy what is in the box**. What differs is what the box holds:

| | Primitive types | Reference types |
|---|---|---|
| Which | exactly 8: \`byte\`, \`short\`, \`int\`, \`long\`, \`float\`, \`double\`, \`char\`, \`boolean\` | everything else: \`String\`, arrays, \`ArrayList\`, every class you write |
| The box holds | the value | a reference to an object, or \`null\` |
| \`==\` compares | values | whether two arrows point to the same object |
| Default value of a field | \`0\`, \`0.0\`, \`false\`, \`'\\u0000'\` | \`null\` |
| Can be used with \`extends\` | no | classes can (this sprint) |`,
      },
      { type: "trace", trace: T["prim-vs-ref"], caption: "The same = on an int and on a Hero" },
      {
        type: "markdown",
        md: `## The reason

- A primitive value is tiny (an \`int\` is 4 bytes). Copying it on every assignment is cheap, and two separate copies can never surprise you.
- An object can be enormous: a 1000 × 1000 image is a million \`int\`s. Copying it on every \`=\` or method call would make programs slow, and two parts of a program could never work on the *same* object. In Pixel Arena, \`party.allAttack(dummy)\` must damage *the* dummy on the screen, not a copy of it.
- So Java copies only the small reference. When you need an independent object, you create one yourself with \`new\`.

## Wrappers

Collections hold references only, which is why \`ArrayList<int>\` does not compile. \`Integer\` is a class that wraps one \`int\`, and Java converts between them automatically (*autoboxing*): \`list.add(5)\` stores an \`Integer\`.`,
      },
      {
        type: "callout",
        tone: "info",
        md: "**\"Derived type\"?** Some books call non-primitive types *derived*, *composite* or *non-primitive* types. The Java Language Specification uses only **primitive types** and **reference types**. Do not confuse this with **derived class**, a common word (especially from C++) for a **subclass**: a different idea, and the topic of this sprint.",
      },
      {
        type: "callout",
        tone: "warn",
        md: "Gotcha: `Integer` is a reference type, so `==` on two `Integer`s compares arrows. It can appear to work for small numbers (Java reuses objects for -128..127) and then fail for larger ones. Compare wrapper values with `.equals`.",
      },
    ],
  },
  {
    id: "fields-vs-locals",
    title: "What an object remembers: fields vs local variables",
    summary: "Where a variable lives decides how long it lives. Why a hero's hp must be a field, and how this tells a method which object it is working for.",
    minutes: 8,
    sections: [
      {
        type: "markdown",
        md: `With only static methods, everything a method needs comes in through parameters and everything it produces goes out through \`return\`. That works until something must be **remembered between calls**: a hero's hp, a counter, a score. Parallel lists (\`names\`, \`hps\`, \`levels\`) can store such data elsewhere, but one forgotten \`remove\` and the lists no longer line up.

The fix is to let each object keep its own data. The trace shows where each kind of variable lives:

- **Local variables and parameters** live in the **frame** of one method call. The frame disappears when the method returns.
- **Fields** live **inside the object**, as long as the object exists.`,
      },
      { type: "trace", trace: T["field-vs-local"], caption: "newHp starts over every call; hp is remembered" },
      {
        type: "markdown",
        md: `## Which object? \`this\`

An instance method always runs *for* one object. Inside the method, the hidden variable \`this\` points to that object, and a field name like \`hp\` means \`this.hp\`. That is why \`aria.takeDamage(35)\` needs no "which hero" parameter: the object it runs for is the hero.`,
      },
      { type: "trace", trace: T["two-objects"], caption: "One class, two objects, two separate fields" },
      {
        type: "markdown",
        md: `## Where should a piece of data go?

| The data… | Put it in | Why |
|---|---|---|
| is needed only during one calculation | a local variable | it should start fresh every call and disappear afterwards |
| is supplied by the caller each time | a parameter | the caller decides it per call |
| must be remembered by the object | a field | it has to survive between calls |
| belongs to no particular object | a \`static\` field or method | there is nothing object-specific about it |

Making *everything* a field is a mistake too: a field that is really scratch space keeps leftover values, and the next call may read them.`,
      },
    ],
  },
  {
    id: "constructors-and-this",
    title: "Constructors, this, and the name = name bug",
    summary: "Why constructors exist, and why one missing \"this.\" compiles fine but leaves a field empty.",
    minutes: 5,
    sections: [
      {
        type: "markdown",
        md: `A constructor exists so that an object is **valid from the moment it is created**. If a hero needs a name, the constructor takes it and stores it; nobody can create a hero and forget to name it.

The most common constructor bug compiles, runs, and is quietly wrong: a parameter with the same name as a field.`,
      },
      { type: "trace", trace: T.shadowing, caption: "Same name, two variables: the parameter wins" },
      {
        type: "markdown",
        md: `Inside the constructor, \`name\` means the closest variable, the parameter. \`name = name;\` assigns the parameter to itself, and the field keeps its default value null. Two ways to avoid it:

- write \`this.name = name;\` (\`this.name\` always means the field), or
- name the parameter differently, for example \`heroName\`.

Routing a constructor through a setter (\`setLevel(level)\`) also keeps the class's rules in one place: the 1..99 check runs whether the value comes from the constructor or from a later change.`,
      },
    ],
  },
  {
    id: "inside-a-subclass-object",
    title: "Inside a subclass object: private fields and super(...)",
    summary: "One object, built in two layers. Why the subclass cannot touch the superclass's private fields, and why super(...) runs first.",
    minutes: 7,
    sections: [
      {
        type: "markdown",
        md: `\`class Mage extends Hero\` says *every Mage is a Hero*. What does such an object actually contain?

- **All the fields of both classes**: \`name\` and \`maxHp\` (declared in Hero) and \`mana\` (declared in Mage). There is only one object, not a Hero object plus a Mage object.
- Hero's \`private\` field \`name\` **exists inside the object**, but code in Mage **cannot use the name** \`name\`. Java's specification puts it this way: private members are *not inherited*. The storage is there; access is not. The subclass uses Hero's public methods (\`getName()\`) instead.

So who sets \`name\` and \`maxHp\`? Only Hero's code can, which is what \`super(...)\` is for.`,
      },
      { type: "trace", trace: T["super-chain"], caption: "new Mage(\"Cara\"): Hero's constructor runs first" },
      {
        type: "markdown",
        md: `## Rules, and the reason for each

| Rule | Reason |
|---|---|
| Constructors are not inherited | A subclass usually needs **different** setup (a Mage needs mana and always has 70 max hp). Inheriting \`Hero(String name, int maxHp)\` would let someone build a Mage with 500 max hp and no mana. |
| \`super(...)\` runs before the rest of the subclass constructor | The subclass's setup may use the superclass's part (inherited methods, its fields through getters), so that part must be valid first. |
| No \`super(...)\` written → Java inserts \`super();\` | Every object must run its superclass's setup. If the superclass has no no-argument constructor, you get *Implicit super constructor … is undefined*, which is the superclass insisting on required data. |`,
      },
      {
        type: "callout",
        tone: "info",
        md: "Version note: Java 25 relaxed the \"super(...) must be the very first statement\" rule a little (\"flexible constructor bodies\"), allowing some statements before it that do not use the object. The reason above still holds, and the platform's exercises use the classic rule.",
      },
    ],
  },
  {
    id: "override-vs-overload",
    title: "Which method runs? Override vs overload",
    summary: "Why a method with one extra parameter is silently ignored by the battle loop, and how @Override turns that into a compile error.",
    minutes: 6,
    sections: [
      {
        type: "markdown",
        md: `A Party that holds an \`ArrayList<Hero>\` only knows that every Hero has \`attack(Hero target)\`. It calls \`h.attack(target)\` without knowing which kind of hero \`h\` is. Two questions follow:

1. **Why does the compiler allow the call?** It checks the *declared* type: \`h\` is a \`Hero\`, and Hero has \`attack(Hero)\`. That is enough.
2. **Which method body runs?** At run time Java starts at the object's *actual* class and looks for a method with exactly that name and parameter list, moving up to the superclass if there is none.

That second step is where a small mistake hides.`,
      },
      { type: "trace", trace: T["dispatch-overload"], caption: "An overload is a different method, so Hero's attack runs" },
      {
        type: "markdown",
        md: `| | Override | Overload |
|---|---|---|
| Name | same | same |
| Parameter list | exactly the same | different |
| Effect through a \`Hero\` variable | the subclass's version runs | the superclass's version still runs |

Adding \`@Override\` above a method tells the compiler what you intend. If no superclass method matches (an extra parameter, \`Attack\` instead of \`attack\`), compilation fails right there, instead of a player reporting weeks later that the mage never casts spells.`,
      },
      {
        type: "callout",
        tone: "warn",
        md: "Only instance methods are looked up this way. Fields and static methods are chosen by the declared type, a detail beyond AP CSA that rarely matters if fields are private.",
      },
    ],
  },
  {
    id: "arena-code-map",
    title: "The whole arena on one map (quick review)",
    summary: "All of Pixel Arena as one program. Click a concept to see every place it appears, or switch to a spot check.",
    minutes: 10,
    sections: [
      {
        type: "markdown",
        md: "Everything from QF-201 to QF-214 in one program. **Explore**: click a concept on the right (overloading, static, super.method(), polymorphism…) to highlight every place it appears, or click any line to see which ideas it shows. **🎲 Spot check**: a random concept is named; click a line that shows it.",
      },
      { type: "code-map", title: arenaMap.title, code: arenaMap.code, concepts: arenaMap.concepts },
    ],
  },
];
