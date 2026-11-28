import type { Ticket } from "../../types";

/*
 * Sprint 2 of the PixelForge project = Unit 10 (Inheritance). Spec: docs/spec-inheritance.md.
 * PF-300 / PF-301 are bridge tickets (primitive vs reference types, fields and methods), because every
 * inheritance idea rests on them. Every ticket follows the why-first order:
 * pain → name the pain → the concept as the fix → payoff → limits.
 * Markdown uses ~~~ fences so it can live inside template literals.
 */

const pf300: Ticket = {
  id: "PF-300",
  slug: "undo-primitive-vs-reference",
  title: "Undo is broken: primitive vs reference types",
  xp: 120,
  learningGoal: {
    level: "easy",
    goal: "Say what a primitive variable and a reference variable each hold, explain why Java has both, and write a deep copy.",
    techniques: ["Primitive vs reference types", "= copies the box's contents", "== on references", "Deep copy of an int[][]"],
  },
  briefing: `🐛 **QA reported a bug:** "After applying Brightness I press Undo, and the 'original' image is bright too. I can't go back."

This sprint we turn every filter into an object (the Filter Plugin System). First we fix this bug, because its cause matters for every ticket that follows: **what is actually inside a variable?**`,
  objectives: [
    "Say what a primitive-type variable and a reference-type variable each hold",
    "Predict what = and == do for both kinds",
    "Explain in your own words why Java is designed this way",
    "Write a deep copy that fixes Undo",
  ],
  blocks: [
    {
      type: "markdown",
      md: `## Reproduce the bug first

\`main\` in \`ImageUtils.java\` saves a backup the way the editor does:

~~~java
int[][] original = copy(img);   // keep a backup for Undo
img[0][0] = 255;                // the user applies a filter
~~~

Right now \`copy\` is just \`return img;\`. Press **▶ Run main**, then answer the two questions below.`,
    },
    {
      type: "predict",
      id: "pf300-int",
      question: "What does this print?",
      code: `int amount = 40;
int saved = amount;
amount = 80;
System.out.println(saved);`,
      options: ["40", "80", "Compile error"],
      answer: 0,
      explain: "`saved = amount` copies 40 into saved. Changing amount later does not touch saved: it is a separate variable.",
    },
    {
      type: "predict",
      id: "pf300-ref",
      question: "And this one?",
      code: `int[] img = {10, 20};
int[] original = img;
img[0] = 255;
System.out.println(original[0]);`,
      options: ["10", "255", "Compile error"],
      answer: 1,
      explain: "This prints 255. The same `=`, a different result. The trace below shows why.",
    },
    {
      type: "short-answer",
      id: "pf300-why1",
      question: "Same `=`, so why did `saved` stay the same while `original` changed? Guess in your own words (a wrong guess is completely fine; you will compare in a minute).",
      placeholder: "I think it's because…",
      modelAnswer:
        "An int variable holds the number itself, so `=` copies the number and saved has its own copy. An array variable holds a reference (an arrow) to an array object, so `=` copies the arrow: original and img point to the **same** array, and a change through one is visible through the other.",
    },
    { type: "viz-link", vizIndex: 0, label: "Step through it and watch what is inside each variable's box" },
    {
      type: "markdown",
      md: `## Two kinds of types

Java has only one \`=\`: **copy what is in the variable's box**. The difference is what the box holds.

| | Primitive types | Reference types |
|---|---|---|
| Which | exactly 8: \`int\`, \`double\`, \`boolean\`, \`char\`, \`byte\`, \`short\`, \`long\`, \`float\` | everything else: \`String\`, arrays, \`ArrayList\`, every class you write |
| The box holds | the value itself | a **reference** (an arrow to an object), or \`null\` |
| After \`b = a\` | two independent values | two arrows, **one object** |
| \`a == b\` asks | same value? | **same object**? |
| Can be null | no | yes |
| Has methods | no | yes (\`s.length()\`, \`list.size()\`) |

### Why does Java have two kinds?

This is not an arbitrary rule. There is a practical reason:

- An \`int\` is only 4 bytes. Copying it on every \`=\` is **cheap**, and the safest thing to do.
- A 1000 × 1000 image is **a million** \`int\`s. If every \`=\` or every method call copied the whole image, programs would crawl.
- Copying a small arrow is fast, and it lets different parts of a program **work on the same object** (the editor and a filter both working on one image).

The price: when you really need an independent copy (like Undo), **you have to say so** and create a new object yourself.`,
    },
    {
      type: "callout",
      tone: "info",
      md: "**About the name \"derived type\":** some books call non-primitive types *derived* or *composite* types. The Java Language Specification uses only two words, **primitive types** and **reference types**, and so do we. Careful later in this sprint: many books say **derived class** to mean **subclass**, which is a different idea.",
    },
    {
      type: "predict",
      id: "pf300-eq",
      question: "What does this print?",
      code: `int[] x = {1, 2};
int[] y = {1, 2};
System.out.println(x == y);`,
      options: ["true, the contents are equal", "false, they are two different array objects", "Compile error"],
      answer: 1,
      explain: "Each initializer creates its own array object. `==` compares the arrows in the boxes, and they point to different objects. To compare contents, compare element by element (or use `Arrays.equals`).",
    },
    {
      type: "markdown",
      md: `## Fix it: make a real copy

An image needs one more step (remember PF-101?): an \`int[][]\` is an outer array of **references to rows**, and every row is an object too. So a real backup needs a new outer array **and a new array for every row**. The second trace shows both ways side by side.`,
    },
    { type: "viz-link", vizIndex: 1, label: "Shallow vs deep: row 0 is shared, row 1 is really copied" },
    {
      type: "predict",
      id: "pf300-rows",
      question: "copy makes a new outer array but reuses each row. Does Undo work?",
      code: `int[][] out = new int[img.length][];
for (int r = 0; r < img.length; r++) {
    out[r] = img[r];
}
return out;`,
      options: ["Yes, the outer array is new", "No, every row is still the same int[] object, so changing img[0][0] changes out[0][0]"],
      answer: 1,
      explain: "`out[r] = img[r]` copies the arrow to that row. That is a shallow copy. Undo needs a deep copy: a new int[] for every row, with the numbers copied in.",
    },
    {
      type: "short-answer",
      id: "pf300-why2",
      question: "Now in your own words: why doesn't Java copy the whole array automatically when you write `b = a`?",
      placeholder: "Because…",
      modelAnswer:
        "Objects can be huge (an image has millions of numbers), so copying them on every = or method call would be slow; and programs often need several parts to share one object. So Java copies only the reference, and the programmer creates a new object when an independent copy is really needed.",
    },
    {
      type: "markdown",
      md: `## Your task

Implement \`copy(int[][] img)\` in \`ImageUtils.java\`:

1. Create a new outer array with the same length as \`img\`.
2. For every row, create a new \`int[]\` and copy the numbers over.
3. Return the new array.

Press ▶ Run main: \`original[0][0]\` should be 10. Then press ✓ Run tests.

This \`copy\` becomes a shared team utility: from the next ticket on, every filter's default behavior is "return a copy".`,
    },
  ],
  visualizations: [
    { type: "trace", title: "Primitive vs reference", traceId: "prim-vs-ref" },
    { type: "trace", title: "Shallow vs deep copy", traceId: "deep-copy" },
  ],
  task: {
    instructions: "Implement `ImageUtils.copy` as a deep copy so Undo works.",
    mainClass: "ImageUtils",
    testClass: "ImageUtilsTest",
    files: [
      { path: "ImageUtils.java", content: "public class ImageUtils {\n\n    /**\n     * Returns a real copy (deep copy) of img:\n     * a new outer array, and every row is a new int[] with the same numbers.\n     * Changing the copy later must not change img.\n     */\n    public static int[][] copy(int[][] img) {\n        // TODO: right now this only copies the reference, so Undo is broken\n        return img;\n    }\n\n    public static void main(String[] args) {\n        int[][] img = {\n            {10, 20, 30},\n            {40, 50, 60}\n        };\n        int[][] original = copy(img);   // keep a backup for Undo\n\n        img[0][0] = 255;                // the user applies a filter (it changes img directly)\n\n        System.out.println(\"img[0][0]      = \" + img[0][0]);\n        System.out.println(\"original[0][0] = \" + original[0][0] + \"   <- the value Undo needs, should still be 10\");\n\n        int amount = 40;\n        int saved = amount;\n        amount = 80;\n        System.out.println(\"saved = \" + saved + \"   <- why didn't this one need a copy method?\");\n    }\n}\n" },
      { path: "ImageUtilsTest.java", readOnly: true, content: "import tutor.Check;\n\npublic class ImageUtilsTest {\n\n    static void test1_sameNumbers() {\n        int[][] img = {{10, 20, 30}, {40, 50, 60}};\n        Check.equal(new int[][]{{10, 20, 30}, {40, 50, 60}}, ImageUtils.copy(img), \"the copy should have the same numbers\");\n    }\n\n    static void test2_newOuterArray() {\n        int[][] img = {{1, 2}, {3, 4}};\n        int[][] out = ImageUtils.copy(img);\n        Check.notSame(img, out, \"copy returned the same array object (it only copied the reference)\");\n    }\n\n    static void test3_newRows() {\n        int[][] img = {{1, 2}, {3, 4}};\n        int[][] out = ImageUtils.copy(img);\n        Check.notSame(img[0], out[0], \"row 0 is still the same int[] (the outer array is new, but the rows were not copied)\");\n        Check.notSame(img[1], out[1], \"row 1 is still the same int[]\");\n    }\n\n    static void test4_undoWorks() {\n        int[][] img = {{10, 20}, {30, 40}};\n        int[][] original = ImageUtils.copy(img);\n        img[0][0] = 255;\n        img[1][1] = 0;\n        Check.equal(new int[][]{{10, 20}, {30, 40}}, original, \"after changing img, the saved original changed too\");\n    }\n\n    static void test5_shapes() {\n        int[][] wide = {{1, 2, 3, 4, 5}};\n        Check.equal(new int[][]{{1, 2, 3, 4, 5}}, ImageUtils.copy(wide), \"a 1 x 5 image\");\n        int[][] empty = new int[0][];\n        Check.equal(0, ImageUtils.copy(empty).length, \"an image with 0 rows copies to 0 rows\");\n    }\n}\n" },
    ],
    testLabels: {
      test1_sameNumbers: "Same numbers",
      test2_newOuterArray: "New outer array",
      test3_newRows: "Every row is a new array",
      test4_undoWorks: "Changing img leaves the backup alone (Undo)",
      test5_shapes: "Different image shapes",
    },
    hints: [
      "Ask yourself first: for `original` to stay unchanged, it must point to a **different object**. Which keyword creates a new object?",
      "Outer: `int[][] out = new int[img.length][];` Each row: `out[r] = new int[img[r].length];`, then copy the numbers with an inner loop.",
      "If test3 fails, you probably wrote `out[r] = img[r];`: that copies the arrow, not the row.",
    ],
  },
};

const pf301: Ticket = {
  id: "PF-301",
  slug: "filter-stack-fields-methods",
  title: "Filter stack: let each object remember its own setting",
  xp: 150,
  learningGoal: {
    level: "medium",
    goal: "Decide whether data belongs in a field, a parameter or a local variable, and write a class whose instance method uses the object's own field.",
    techniques: ["Field vs local variable lifetime", "Instance methods and this", "Constructor + private field + setter", "The amount = amount shadowing bug"],
  },
  briefing: `📋 **New request from the PM: a filter stack.**

Users can add several adjustments, like "Brightness +20" and "Brightness -50", **and come back later to change a setting** (turn +20 into +35). The picture is recomputed from the original every time.

The tool you have so far is a static method, \`brighten(img, amount)\`. This ticket first shows you how painful this feature is with static methods, and then switches to a better way.`,
  objectives: [
    "Tell fields, parameters and local variables apart, and say when to use each",
    "Explain why an instance method does not need the setting passed in as a parameter",
    "Use a constructor and a private field with a setter to keep an object valid",
    "Recognize and avoid the amount = amount bug",
  ],
  blocks: [
    {
      type: "markdown",
      md: `## Try it with what you know first

With only static methods, each adjustment's setting has to live somewhere else, for example in two parallel lists:

~~~java
ArrayList<String>  names   = new ArrayList<String>();
ArrayList<Integer> amounts = new ArrayList<Integer>();

names.add("Brightness");  amounts.add(20);
names.add("Brightness");  amounts.add(-50);

// recompute the picture
for (int i = 0; i < names.size(); i++) {
    img = Filters.brighten(img, amounts.get(i));
}
~~~

Looks fine. Then the PM adds: we also need **Contrast**, which has two settings, \`amount\` and \`midpoint\`.`,
    },
    {
      type: "predict",
      id: "pf301-sync",
      question: "The user deletes the first adjustment. A teammate wrote `names.remove(0);` but forgot `amounts.remove(0);`. What is applied when the picture is recomputed?",
      options: ["Brightness -50 (correct)", "Brightness +20 (wrong: the deleted adjustment's setting)", "The program crashes"],
      answer: 1,
      explain: "names has 1 element, so the loop runs with i = 0, but `amounts.get(0)` is still 20. The lists are out of sync, and the compiler cannot help you notice. Every new kind of setting adds another list to keep in sync.",
    },
    {
      type: "short-answer",
      id: "pf301-pain",
      question: "What is the biggest problem with building this feature from parallel lists? What happens when three more kinds of adjustment are added?",
      placeholder: "The problem is…",
      modelAnswer:
        "One adjustment's data is split across several lists, so every add, delete or move has to update all of them, and forgetting one breaks the order. More kinds of adjustment mean more lists and more places to make mistakes. The root problem: \"this adjustment's settings\" and \"how this adjustment is applied\" are not kept together.",
    },
    {
      type: "markdown",
      md: `## A better way: each adjustment remembers its own setting

If a brightness adjustment is an **object**, it can remember its own amount and know how to apply itself:

~~~java
public class BrightnessAdjust {
    private int amount;                    // field: what this object remembers

    public int[][] apply(int[][] img) {    // method: does the work using its own amount
        ...
    }
}
~~~

The editor keeps one \`ArrayList<BrightnessAdjust>\`. Each element carries its own setting, so nothing can get out of sync.

| Idea | Why it exists |
|---|---|
| **Field** | It is the object's **memory**. A local variable disappears when its method returns; a field lives as long as the object, so the next method call can still use it. |
| **Instance method** | It is an action done by **one specific object**. \`a.apply(img)\` uses a's amount, \`b.apply(img)\` uses b's, so amount does not need to be passed in. |
| **Constructor** | A new object should start in a valid state, so its fields are set once, when it is created. |
| **private + setter** | The rule "amount stays in -255..255" is written in one place (\`setAmount\`), and no other code can get around it. |`,
    },
    { type: "viz-link", vizIndex: 0, label: "Watch temp disappear while clicks stays" },
    {
      type: "predict",
      id: "pf301-field",
      question: "Someone writes `int saved = amount;` in the constructor and wants apply to use `saved` later. Does it work?",
      code: `public BrightnessAdjust(int amount) {
    int saved = amount;
}
public int[][] apply(int[][] img) {
    ... saved ...
}`,
      options: ["Yes, saved has been stored", "No: saved is a local variable of the constructor; it is gone when the constructor ends, and apply cannot see it (compile error)"],
      answer: 1,
      explain: "A variable declared inside a method lives only for that one call. To make the object remember something, store it in a **field**. That is exactly why fields exist.",
    },
    { type: "viz-link", vizIndex: 1, label: "Two objects: watch where this points in each call" },
    {
      type: "predict",
      id: "pf301-two",
      question: "The stack holds two adjustments (+20, -50). After `stack.get(0).setAmount(35);`, what is in the stack?",
      options: ["+35, -50", "+35, +35", "+20, -50 (unchanged)"],
      answer: 0,
      explain: "`stack.get(0)` is the first object, and `setAmount` changes **that object's own** field. The other object has its own amount.",
    },
    {
      type: "markdown",
      md: `## this: "this object's"

\`setAmount(int amount)\` has a parameter with the same name as the field. Inside the method, the name \`amount\` means the **parameter** (the closest one). To mean "this object's field", write \`this.amount\`.`,
    },
    { type: "viz-link", vizIndex: 2, label: "What happens when this. is missing" },
    {
      type: "predict",
      id: "pf301-default",
      question: "If the constructor forgets to set amount, what does `new BrightnessAdjust(20).getAmount()` return?",
      options: ["20", "0", "Compile error", "null"],
      answer: 1,
      explain: "A field that is never assigned keeps its default value: 0 for int, false for boolean, null for references. It compiles and runs; the result is just wrong. That is one reason tests exist.",
    },
    {
      type: "markdown",
      md: `## Where does each piece of data belong?

| This data… | goes in a | Example |
|---|---|---|
| is needed only during one calculation | local variable | loop variables \`r\`, \`c\`; a temporary sum inside blur |
| is supplied by the caller each time | parameter | the \`img\` in \`apply(int[][] img)\` |
| must be **remembered by the object** | field | this adjustment's amount |
| has nothing to do with any one object | \`static\` | \`clamp(v)\`, the maximum value 255 |

**Limit:** don't make everything a field. Something used inside only one method does not belong in the object's memory; a later call could read a leftover value from an earlier one.`,
    },
    {
      type: "predict",
      id: "pf301-static",
      question: "Why can `clamp(v)` be static, but `apply(img)` cannot?",
      options: [
        "Because clamp is shorter",
        "Because clamp needs only its parameter v and no object data, while apply needs this object's amount",
        "Because static methods are faster",
      ],
      answer: 1,
      explain: "A static method belongs to no particular object, so it has no `this` and cannot read fields. apply has to know *which* adjustment it is, so it must be an instance method.",
    },
    {
      type: "markdown",
      md: `## Your task

Follow TODO 1–5 in \`BrightnessAdjust.java\`:

1. Declare \`private int amount\`.
2. The constructor calls \`setAmount(amount)\`, so the range rule applies at creation too.
3. \`setAmount\`: clamp the value to -255..255 and store it in the **field**.
4. \`getAmount\`: return the field.
5. \`apply(img)\`: adjust brightness with **this object's** amount and return a new image; do not modify img.

Then press ▶ Run main: \`main\` is the new filter stack. Two parallel lists became one \`ArrayList<BrightnessAdjust>\`, and "change the first adjustment" is one line.`,
    },
    {
      type: "short-answer",
      id: "pf301-why",
      question: "In your own words: when should data be a field, and when a local variable? Give one example from this ticket.",
      placeholder: "A field is for…; a local variable is for…",
      modelAnswer:
        "Data the object still needs between method calls belongs in a field, like each adjustment's amount: set once by the constructor, used by every apply. Data needed only during one calculation is a local variable, like the loop variables r and c inside apply, which are not needed after the method returns.",
    },
    {
      type: "callout",
      tone: "lead",
      md: "**Coming next:** a teammate wrote `InvertAdjust` the same way. Now the editor needs **two** lists and two loops… and the order the user wants (invert, then brightness, then invert again) cannot be stored at all. The next ticket solves that.",
    },
  ],
  visualizations: [
    { type: "trace", title: "Field vs local variable", traceId: "field-vs-local" },
    { type: "trace", title: "Two objects, two fields", traceId: "two-objects" },
    { type: "trace", title: "The amount = amount trap", traceId: "shadowing" },
  ],
  task: {
    instructions: "Finish `BrightnessAdjust`: remember amount in a field, and use it in the instance method `apply`.",
    mainClass: "BrightnessAdjust",
    testClass: "BrightnessAdjustTest",
    files: [
      { path: "BrightnessAdjust.java", content: "import java.util.ArrayList;\nimport java.util.Arrays;\n\n/**\n * One \"brightness adjustment\" in the filter stack.\n * Each BrightnessAdjust object must remember its own amount,\n * so when the user changes a setting later, only that object changes.\n */\npublic class BrightnessAdjust {\n\n    // TODO 1: what does this object need to REMEMBER so it can use it every time apply runs later?\n    //         Declare a private int field called amount.\n\n    /** A new object must start valid: the amount goes through setAmount's range rule too. */\n    public BrightnessAdjust(int amount) {\n        // TODO 2\n    }\n\n    /** The only place that changes amount: keep it in -255..255. */\n    public void setAmount(int amount) {\n        // TODO 3 (hint: when a parameter has the same name as the field, the field is this.amount)\n    }\n\n    public int getAmount() {\n        // TODO 4\n        return 0;\n    }\n\n    /**\n     * Adjusts brightness with THIS object's own amount and returns a new image.\n     * No amount parameter needed: the object remembers it. Do not modify img.\n     */\n    public int[][] apply(int[][] img) {\n        // TODO 5 (you can use clamp below)\n        return img;\n    }\n\n    /** Needs no object data, so it is static. */\n    public static int clamp(int v) {\n        return Math.max(0, Math.min(255, v));\n    }\n\n    /** Press ▶ Run main: the new filter stack. One list, and each adjustment carries its own setting. */\n    public static void main(String[] args) {\n        int[][] original = {{100, 150}, {200, 250}};\n\n        ArrayList<BrightnessAdjust> stack = new ArrayList<BrightnessAdjust>();\n        stack.add(new BrightnessAdjust(20));\n        stack.add(new BrightnessAdjust(-50));\n\n        // The user changes the first adjustment from +20 to +35: only that one object changes.\n        stack.get(0).setAmount(35);\n\n        int[][] img = original;\n        for (BrightnessAdjust adj : stack) {\n            img = adj.apply(img);\n            System.out.println(\"after \" + adj.getAmount() + \": \" + Arrays.deepToString(img));\n        }\n        System.out.println(\"original is untouched: \" + Arrays.deepToString(original));\n    }\n}\n" },
      { path: "BrightnessAdjustTest.java", readOnly: true, content: "import java.lang.reflect.Field;\nimport java.lang.reflect.Modifier;\nimport tutor.Check;\n\npublic class BrightnessAdjustTest {\n\n    static void test1_hasPrivateField() {\n        Field f;\n        try {\n            f = BrightnessAdjust.class.getDeclaredField(\"amount\");\n        } catch (NoSuchFieldException e) {\n            Check.isTrue(false, \"no field called amount: the object needs a field to remember its own brightness\");\n            return;\n        }\n        Check.isTrue(f.getType() == int.class, \"amount should be an int\");\n        Check.isTrue(Modifier.isPrivate(f.getModifiers()), \"amount should be private, so the range rule lives only in setAmount and nobody can break it\");\n        Check.isTrue(!Modifier.isStatic(f.getModifiers()), \"amount must not be static: static means ALL objects share one value, but each adjustment needs its own\");\n    }\n\n    static void test2_constructorRemembers() {\n        Check.equal(20, new BrightnessAdjust(20).getAmount(),\n            \"new BrightnessAdjust(20).getAmount() should be 20 (if it is 0, check for amount = amount;)\");\n    }\n\n    static void test3_eachObjectHasItsOwn() {\n        BrightnessAdjust a = new BrightnessAdjust(20);\n        BrightnessAdjust b = new BrightnessAdjust(-10);\n        a.setAmount(35);\n        Check.equal(35, a.getAmount(), \"a changed to 35\");\n        Check.equal(-10, b.getAmount(), \"changing a must not change b: each object has its own field\");\n    }\n\n    static void test4_rangeRule() {\n        BrightnessAdjust a = new BrightnessAdjust(0);\n        a.setAmount(300);\n        Check.equal(255, a.getAmount(), \"setAmount(300) should become 255\");\n        a.setAmount(-999);\n        Check.equal(-255, a.getAmount(), \"setAmount(-999) should become -255\");\n        Check.equal(255, new BrightnessAdjust(1000).getAmount(), \"the constructor must follow the range rule too\");\n    }\n\n    static void test5_applyUsesOwnAmount() {\n        int[][] img = {{100, 250}, {0, 30}};\n        int[][] brighter = new BrightnessAdjust(20).apply(img);\n        int[][] darker = new BrightnessAdjust(-40).apply(img);\n        Check.equal(new int[][]{{120, 255}, {20, 50}}, brighter, \"the +20 object\");\n        Check.equal(new int[][]{{60, 210}, {0, 0}}, darker, \"the -40 object\");\n        Check.equal(new int[][]{{100, 250}, {0, 30}}, img, \"apply must not modify the original image\");\n        Check.notSame(img, brighter, \"apply should return a new array\");\n    }\n\n    static void test6_remembersBetweenCalls() {\n        BrightnessAdjust a = new BrightnessAdjust(10);\n        int[][] img = {{100}};\n        Check.equal(new int[][]{{110}}, a.apply(img), \"the first apply uses 10\");\n        a.setAmount(50);\n        Check.equal(new int[][]{{150}}, a.apply(img), \"after setAmount(50), the next apply should use 50\");\n    }\n}\n" },
    ],
    testLabels: {
      test1_hasPrivateField: "Has a private amount field",
      test2_constructorRemembers: "Constructor stores amount in the field",
      test3_eachObjectHasItsOwn: "Each object has its own amount",
      test4_rangeRule: "Range rule (-255..255)",
      test5_applyUsesOwnAmount: "apply uses the object's own amount",
      test6_remembersBetweenCalls: "After a new setting, the next apply uses it",
    },
    hints: [
      "Ask yourself: which value must still be known *after the constructor has finished*? That value belongs in a field, not just in a parameter or a local variable.",
      "setAmount's parameter has the same name as the field. To store into the field, write `this.amount = ...;`",
      "apply needs no amount parameter: use the field. Build the new array like `copy` in PF-300, but store `clamp(img[r][c] + amount)`.",
    ],
  },
};

const pf302: Ticket = {
  id: "PF-302",
  slug: "brightness-filter-extends",
  title: "One list for every filter: BrightnessFilter extends Filter",
  xp: 180,
  learningGoal: {
    level: "medium",
    goal: "Use extends and super(...) so different filter classes share one type and one list, and explain why super runs first.",
    techniques: ["is-a vs has-a", "extends", "private fields of the superclass", "super(...) and the implicit super()"],
  },
  briefing: `A teammate wrote \`InvertAdjust\` the same way as PF-301. This is the editor now, and the PM says **6 more filters** are coming next month 😰

This ticket first counts how much has to change with this approach, and then gives every filter a **shared home**.`,
  objectives: [
    "Name what the \"one list per filter class\" approach cannot do, and how inheritance fixes it",
    "Decide between is-a (inheritance) and has-a (a field)",
    "Use extends to make BrightnessFilter a kind of Filter",
    "Explain why super(...) is needed and why it runs first",
  ],
  blocks: [
    {
      type: "markdown",
      md: `## The editor today

~~~java
ArrayList<BrightnessAdjust> brightList = new ArrayList<BrightnessAdjust>();
ArrayList<InvertAdjust>     invertList = new ArrayList<InvertAdjust>();

for (BrightnessAdjust b : brightList) img = b.apply(img);
for (InvertAdjust v : invertList)     img = v.apply(img);
~~~

Both classes have \`apply(int[][] img)\`, but to Java they are **completely unrelated** types, so they need two different lists.`,
    },
    {
      type: "predict",
      id: "pf302-count",
      question: "To add a Blur filter, how many places in the editor must change?",
      options: ["None, just write BlurAdjust", "At least 3: a new list, the code that adds to it, and the loop that applies it (delete and reorder too)"],
      answer: 1,
      explain: "Every new filter kind adds one more of everything that handles the lists. Six filters means six lists and six loops.",
    },
    {
      type: "short-answer",
      id: "pf302-pain",
      question: "Besides touching many places, this approach **cannot do** one thing at all. Think about a user who wants \"invert, then brightness, then invert again\".",
      placeholder: "It cannot…",
      modelAnswer:
        "It cannot keep the order the user chose. Different kinds of filters sit in different lists, so the program applies all brightness adjustments, then all inverts, and the user's order is lost. To keep the order, every filter has to be in the **same** list.",
    },
    {
      type: "markdown",
      md: `## They are all "a kind of filter"

Brightness, invert, blur… each one **is a** filter: each has a name and can \`apply\`. That shared part is the class \`Filter\` (the read-only file):

~~~java
public class Filter {
    private String name;
    public Filter(String name) { this.name = name; }
    public String getName() { return name; }
    public int[][] apply(int[][] img) { return ImageUtils.copy(img); }   // default: change nothing
}
~~~

Each filter then **extends** it:

~~~java
public class BrightnessFilter extends Filter { ... }
~~~

This tells Java: "every BrightnessFilter **is a** Filter". What you get:

- BrightnessFilter **automatically has** Filter's public methods (\`getName()\`, \`apply\`) without rewriting them.
- Because it is a Filter, it **fits in an \`ArrayList<Filter>\`**. All filters in one list, so the order is kept.
- Adding a filter = writing one new subclass. The editor **does not change at all**.`,
    },
    {
      type: "predict",
      id: "pf302-hasa",
      question: "A `FilterPipeline` keeps its filters in an `ArrayList<Filter>`. Should it be written as `FilterPipeline extends ArrayList<Filter>`?",
      options: [
        "Yes, it saves writing methods",
        "No: a pipeline *has* a list of filters (has-a); it is not itself a list (is-a). Use a field.",
      ],
      answer: 1,
      explain: "If it extended ArrayList, anyone could call every ArrayList method on the pipeline (clear it, add null…), and the pipeline could not protect its own rules. Use inheritance only for a real \"is a kind of\"; for \"has\", use a field.",
    },
    {
      type: "markdown",
      md: `## How does the name get set?

A BrightnessFilter's name should be "Brightness". The natural first try is \`name = "Brightness";\` in its constructor…`,
    },
    {
      type: "predict",
      id: "pf302-private",
      question: "What happens if BrightnessFilter's constructor contains `name = \"Brightness\";`?",
      options: ["Works, name is inherited", "Compile error: name is Filter's private field, and only Filter's own code may use that name"],
      answer: 1,
      explain: "Every BrightnessFilter object **does contain** the name field (it is a Filter), but private means only code inside the Filter class can touch it directly. Same reason as PF-301: Filter protects its own rules.",
    },
    {
      type: "markdown",
      md: `## super(...): ask Filter to set up its part

Since only Filter may set name, let Filter's constructor do it:

~~~java
public BrightnessFilter(int amount) {
    super("Brightness");   // first, Filter sets up its part
    setAmount(amount);     // then BrightnessFilter sets up its own part
}
~~~

**Why must super(...) be the first line?** The subclass's own setup may use things from the superclass (like \`getName()\`), so the superclass's part has to be ready first.

**If you leave super(...) out,** Java inserts \`super();\` for you (a call to Filter's constructor with no parameters). Filter has no such constructor (every filter must have a name), so you get this compile error:

~~~
Implicit super constructor Filter() is undefined. Must explicitly invoke another constructor
~~~

It means: "the super() Java added for you matches no constructor; call another one yourself."`,
    },
    { type: "viz-link", vizIndex: 0, label: "Watch one object get built in two layers" },
    {
      type: "predict",
      id: "pf302-super",
      question: "You added `extends Filter` but not yet `super(\"Brightness\")`. What happens?",
      options: ["It compiles and the name is null", "Compile error: the super() Java inserts finds no Filter() constructor"],
      answer: 1,
      explain: "A subclass constructor always runs a superclass constructor first. If you don't write one, Java adds `super();`, but Filter only has `Filter(String name)`. This is actually good design: Filter makes a filter without a name impossible.",
    },
    {
      type: "predict",
      id: "pf302-list",
      question: "Can an `ArrayList<Filter> stack` do `stack.add(new BrightnessFilter(40));`?",
      options: ["Yes, every BrightnessFilter is a Filter", "No, the types are different"],
      answer: 0,
      explain: "The list wants Filters, and a BrightnessFilter is one, so it always fits. The reverse fails: an `ArrayList<BrightnessFilter>` cannot hold a plain `new Filter(...)`, because not every Filter is a BrightnessFilter.",
    },
    {
      type: "markdown",
      md: `## Your task

In \`BrightnessFilter.java\`:

- TODO 1: \`extends Filter\`
- TODO 2: \`super("Brightness");\` as the first line of the constructor
- TODO 3: write \`public int[][] apply(int[][] img)\` that adjusts brightness by amount (as in PF-301). With this method in place, the editor's \`f.apply(img)\` runs your version instead of Filter's "change nothing". (The next ticket looks at this closely.)
- TODO 4: in \`main\`, remove the \`//\` before the line that adds a BrightnessFilter, then press ▶ Run main.

Tip: after TODO 1 and before TODO 2, press ▶ Run main once to see the super error above for yourself.`,
    },
    {
      type: "callout",
      tone: "warn",
      md: "**When not to inherit:** two classes that happen to share a few similar methods are not a reason to inherit. Ask first: \"is X **a kind of** Y?\" Only then use extends. If you only want to reuse code, a field or a shared static helper is usually the better tool.",
    },
    {
      type: "short-answer",
      id: "pf302-why",
      question: "In your own words: why does BrightnessFilter set its name with super(...) instead of declaring its own name field?",
      placeholder: "Because…",
      modelAnswer:
        "Every BrightnessFilter object already contains Filter's name field; declaring another one would give it two names, and getName() would read Filter's. name is Filter's private field, so Filter's own constructor should set it. super(...) asks Filter to do that, and it runs first so the subclass can safely rely on that part afterwards.",
    },
  ],
  visualizations: [{ type: "trace", title: "Inside a subclass object", traceId: "super-chain" }],
  task: {
    instructions: "Make `BrightnessFilter` extend `Filter`, set its name with `super(...)`, and write its own `apply`.",
    mainClass: "BrightnessFilter",
    testClass: "BrightnessFilterTest",
    files: [
      { path: "BrightnessFilter.java", content: "import java.util.ArrayList;\nimport java.util.Arrays;\n\n// TODO 1: make BrightnessFilter \"a kind of Filter\", so it can go into an ArrayList<Filter>.\npublic class BrightnessFilter {\n\n    private int amount;   // what BrightnessFilter itself must remember (Filter already remembers the name)\n\n    public BrightnessFilter(int amount) {\n        // TODO 2: Filter's name field is private, so only Filter's constructor can set it.\n        //         Ask Filter to set the name to \"Brightness\" (this must be the first line of the constructor).\n        setAmount(amount);\n    }\n\n    public void setAmount(int amount) {\n        this.amount = Math.max(-255, Math.min(255, amount));\n    }\n\n    public int getAmount() {\n        return amount;\n    }\n\n    // TODO 3: write public int[][] apply(int[][] img)\n    //         Adjust brightness by amount and return a new image (same as PF-301; ImageUtils.clamp helps).\n    //         Once it exists, the editor's f.apply(img) runs YOUR version instead of Filter's \"change nothing\".\n\n    /** Press ▶ Run main: the new editor. One list holds every filter, one loop applies them in order. */\n    public static void main(String[] args) {\n        ArrayList<Filter> stack = new ArrayList<Filter>();\n        stack.add(new Filter(\"Original (does nothing)\"));\n\n        // TODO 4: once BrightnessFilter extends Filter, remove the // on the next line.\n        //         Think: why can an ArrayList<Filter> hold a BrightnessFilter?\n        // stack.add(new BrightnessFilter(40));\n\n        int[][] img = {{100, 150}, {200, 250}};\n        for (Filter f : stack) {\n            img = f.apply(img);\n            System.out.println(f.getName() + \" -> \" + Arrays.deepToString(img));\n        }\n    }\n}\n" },
      { path: "Filter.java", readOnly: true, content: "/**\n * The shared \"home\" of every filter: each filter has a name and can apply itself.\n * (Read-only: this is the team's shared code.)\n */\npublic class Filter {\n    private String name;\n\n    public Filter(String name) {\n        this.name = name;\n    }\n\n    public String getName() {\n        return name;\n    }\n\n    /** Default behavior: change nothing, return a copy. Subclasses replace this with their own version. */\n    public int[][] apply(int[][] img) {\n        return ImageUtils.copy(img);\n    }\n\n    public String toString() {\n        return name;\n    }\n}\n" },
      { path: "ImageUtils.java", readOnly: true, content: "/** Team utilities (read-only). copy is the deep copy you wrote in PF-300. */\npublic class ImageUtils {\n    public static int[][] copy(int[][] img) {\n        int[][] out = new int[img.length][];\n        for (int r = 0; r < img.length; r++) {\n            out[r] = new int[img[r].length];\n            for (int c = 0; c < img[r].length; c++) {\n                out[r][c] = img[r][c];\n            }\n        }\n        return out;\n    }\n\n    public static int clamp(int v) {\n        return Math.max(0, Math.min(255, v));\n    }\n}\n" },
      { path: "BrightnessFilterTest.java", readOnly: true, content: "import java.util.ArrayList;\nimport tutor.Check;\n\n/**\n * These tests create your class through reflection, so even before BrightnessFilter\n * extends Filter, the other tests still run and tell you what is missing.\n */\npublic class BrightnessFilterTest {\n\n    /** Creates new BrightnessFilter(amount) and uses it as a Filter. */\n    static Filter make(int amount) {\n        Class<?> c;\n        try {\n            c = Class.forName(\"BrightnessFilter\");\n        } catch (ClassNotFoundException e) {\n            Check.isTrue(false, \"class BrightnessFilter not found\");\n            return null;\n        }\n        if (!Filter.class.isAssignableFrom(c)) {\n            Check.isTrue(false, \"BrightnessFilter is not a kind of Filter yet: the class header needs extends Filter\");\n            return null;\n        }\n        try {\n            return (Filter) c.getConstructor(int.class).newInstance(amount);\n        } catch (ReflectiveOperationException e) {\n            Check.isTrue(false, \"could not call new BrightnessFilter(int): \" + e);\n            return null;\n        }\n    }\n\n    static void test1_isAFilter() {\n        Class<?> c;\n        try {\n            c = Class.forName(\"BrightnessFilter\");\n        } catch (ClassNotFoundException e) {\n            Check.isTrue(false, \"class BrightnessFilter not found\");\n            return;\n        }\n        Check.isTrue(c.getSuperclass() == Filter.class, \"the superclass of BrightnessFilter should be Filter\");\n    }\n\n    static void test2_nameSetBySuper() {\n        Filter f = make(10);\n        Check.equal(\"Brightness\", f.getName(), \"getName() should be \\\"Brightness\\\": let Filter set it with super(\\\"Brightness\\\")\");\n    }\n\n    static void test3_noDuplicateNameField() {\n        boolean own;\n        try {\n            Class.forName(\"BrightnessFilter\").getDeclaredField(\"name\");\n            own = true;\n        } catch (ReflectiveOperationException e) {\n            own = false;\n        }\n        Check.isTrue(!own, \"BrightnessFilter does not need its own name field: every Filter object already has Filter's name\");\n    }\n\n    static void test4_applyOverridesDefault() {\n        Filter f = make(40);\n        int[][] out = f.apply(new int[][]{{100, 230}, {0, 255}});\n        Check.equal(new int[][]{{140, 255}, {40, 255}}, out,\n            \"f.apply(img) through a Filter variable should run your brightness version (if nothing changed, Filter's default apply ran)\");\n    }\n\n    static void test5_doesNotModifyInput() {\n        int[][] img = {{10, 20}, {30, 40}};\n        int[][] out = make(-20).apply(img);\n        Check.equal(new int[][]{{10, 20}, {30, 40}}, img, \"apply must not modify the original image\");\n        Check.equal(new int[][]{{0, 0}, {10, 20}}, out, \"result for -20 (remember to clamp)\");\n    }\n\n    static void test6_oneListForAll() {\n        ArrayList<Filter> stack = new ArrayList<Filter>();\n        stack.add(new Filter(\"Original\"));\n        stack.add(make(30));\n        stack.add(make(-10));\n        int[][] img = {{100}};\n        for (Filter f : stack) {\n            img = f.apply(img);\n        }\n        Check.equal(new int[][]{{120}}, img, \"one ArrayList<Filter> applied in order: 100 -> 100 -> 130 -> 120\");\n    }\n}\n" },
    ],
    testLabels: {
      test1_isAFilter: "BrightnessFilter extends Filter",
      test2_nameSetBySuper: "Name set with super",
      test3_noDuplicateNameField: "No duplicate name field",
      test4_applyOverridesDefault: "f.apply(img) runs your version",
      test5_doesNotModifyInput: "Original image unchanged",
      test6_oneListForAll: "One ArrayList<Filter> applied in order",
    },
    hints: [
      "Class header: `public class BrightnessFilter extends Filter {`",
      "Seeing `Implicit super constructor Filter() is undefined`? Call `super(\"Brightness\");` yourself as the constructor's first line.",
      "apply's header must match Filter's exactly: `public int[][] apply(int[][] img)`. The body can follow what you wrote in PF-301.",
    ],
  },
};

const pf303: Ticket = {
  id: "PF-303",
  slug: "invert-override-vs-overload",
  title: "Bug: the Invert filter does nothing (override vs overload)",
  xp: 150,
  learningGoal: {
    level: "medium",
    goal: "Tell an override from an overload, explain which method runs through a superclass variable, and use @Override to catch the mistake.",
    techniques: ["Override vs overload", "Run-time method lookup", "@Override", "Keeping the superclass method's promise"],
  },
  briefing: `🐛 **Bug report:** "After adding Invert to the filter stack, the picture doesn't change at all."

The teammate says: "But I wrote apply, and it compiles." Press ▶ Run main to reproduce it.`,
  objectives: [
    "Explain why the compiler did not catch this bug",
    "Tell an override from an overload",
    "Say what @Override does for you",
    "Fix InvertFilter",
  ],
  blocks: [
    {
      type: "markdown",
      md: `## Reproduce the bug

\`main\` in \`InvertFilter.java\` is the editor's pipeline. It knows exactly one thing: **every Filter has \`apply(int[][] img)\`**.

~~~java
for (Filter f : stack) {
    img = f.apply(img);
}
~~~

Now look at the teammate's \`InvertFilter\`: it defines \`apply(int[][] img, int strength)\`.`,
    },
    {
      type: "predict",
      id: "pf303-dispatch",
      question: "f points to an InvertFilter object. Which method does `f.apply(img)` run?",
      options: ["InvertFilter's apply(img, strength)", "Filter's apply(img), which returns an unchanged copy", "Compile error"],
      answer: 1,
      explain: "At run time Java starts at the object's real class, InvertFilter, and looks for `apply(int[][])`. InvertFilter only has `apply(int[][], int)`: **a different parameter list, so a different method**. The search moves up to Filter's apply, which returns an unchanged copy.",
    },
    { type: "viz-link", vizIndex: 0, label: "Follow the method lookup step by step" },
    {
      type: "short-answer",
      id: "pf303-why1",
      question: "Why didn't the compiler report an error?",
      placeholder: "Because…",
      modelAnswer:
        "Adding a method with the same name but different parameters to a subclass is perfectly legal (an overload). The compiler cannot know the teammate meant to replace Filter's apply. To the compiler, InvertFilter simply gained one new method, and the inherited apply(img) is still there.",
    },
    {
      type: "markdown",
      md: `## Override vs overload

| | Override | Overload |
|---|---|---|
| Method name | same | same |
| Parameter list | **exactly the same** | **different** |
| Meaning | "for this kind of filter, use my version of apply" | "here is one more method that happens to be called apply" |
| The pipeline's \`f.apply(img)\` runs | the subclass's version | still Filter's version |

PF-302's BrightnessFilter is an override: its \`apply(int[][] img)\` matches Filter's exactly, so the pipeline uses it.

## @Override: let the compiler check

Writing \`@Override\` above a method tells the compiler "**I mean to override a superclass method**". If the superclass has no such method (wrong parameters, misspelled name), the compiler reports an error immediately.

What makes this bug nasty is that it is **silent**: it compiles, runs, and is just wrong. \`@Override\` turns it into a **loud** error that you see before pressing Run.`,
    },
    {
      type: "predict",
      id: "pf303-overload",
      question: "In InvertFilter, `public int[][] apply(int[][] img, int times)` is…",
      options: ["an override", "an overload", "a compile error"],
      answer: 1,
      explain: "It has an extra int parameter, so it is a new method (an overload). The pipeline still calls Filter's apply(img).",
    },
    {
      type: "predict",
      id: "pf303-override",
      question: "What happens with this?",
      code: `@Override
public int[][] Apply(int[][] img) { ... }`,
      options: ["Works, override successful", "Compile error: Filter has no method called Apply (capital A), and @Override catches it", "Compiles, but the pipeline never uses it"],
      answer: 1,
      explain: "Java names are case-sensitive: Apply and apply are different methods. Without @Override this would be the third option (a silent bug). With @Override the compiler tells you right away.",
    },
    {
      type: "markdown",
      md: `## Your task

Fix \`InvertFilter.java\`:

1. Make apply's parameter list exactly match Filter's: \`apply(int[][] img)\`. strength is not used; remove it.
2. Add \`@Override\` above the method.
3. Press ▶ Run main: the picture should be inverted. Then press ✓ Run tests.

**Limit:** an override must keep the promise of the method it replaces. Filter's apply promises **not to modify the image passed in**, so your version must return a new array too.`,
    },
    {
      type: "short-answer",
      id: "pf303-why2",
      question: "If the teammate had written @Override from the start, when would this bug have been found? Why is that better for the team?",
      placeholder: "It would have been found…",
      modelAnswer:
        "At compile time, before running or shipping anything. The compiler would say there is no apply(int[][], int) in Filter to override, so the teammate would see the wrong parameter list at once instead of waiting for users to report that the picture does not change.",
    },
  ],
  visualizations: [{ type: "trace", title: "Which apply runs?", traceId: "dispatch-overload" }],
  task: {
    instructions: "Fix `InvertFilter`: really override `apply(int[][] img)` and add `@Override`.",
    mainClass: "InvertFilter",
    testClass: "InvertFilterTest",
    files: [
      { path: "InvertFilter.java", content: "import java.util.ArrayList;\nimport java.util.Arrays;\n\n/**\n * Invert (negative) filter: every pixel becomes 255 - its value (black turns white, white turns black).\n *\n * 🐛 Bug report: users add \"Invert\" to the filter stack and the picture does not change at all.\n *    Press ▶ Run main to see what the pipeline prints, then find out why.\n */\npublic class InvertFilter extends Filter {\n\n    public InvertFilter() {\n        super(\"Invert\");\n    }\n\n    public int[][] apply(int[][] img, int strength) {\n        int[][] out = new int[img.length][];\n        for (int r = 0; r < img.length; r++) {\n            out[r] = new int[img[r].length];\n            for (int c = 0; c < img[r].length; c++) {\n                out[r][c] = 255 - img[r][c];\n            }\n        }\n        return out;\n    }\n\n    /** The editor's pipeline. It only knows one thing: every Filter has apply(int[][] img). */\n    public static void main(String[] args) {\n        ArrayList<Filter> stack = new ArrayList<Filter>();\n        stack.add(new InvertFilter());\n\n        int[][] img = {{0, 100}, {200, 255}};\n        System.out.println(\"original:     \" + Arrays.deepToString(img));\n        for (Filter f : stack) {\n            img = f.apply(img);\n            System.out.println(\"after \" + f.getName() + \": \" + Arrays.deepToString(img));\n        }\n    }\n}\n" },
      { path: "Filter.java", readOnly: true, content: "/**\n * The shared \"home\" of every filter: each filter has a name and can apply itself.\n * (Read-only: this is the team's shared code.)\n */\npublic class Filter {\n    private String name;\n\n    public Filter(String name) {\n        this.name = name;\n    }\n\n    public String getName() {\n        return name;\n    }\n\n    /** Default behavior: change nothing, return a copy. Subclasses replace this with their own version. */\n    public int[][] apply(int[][] img) {\n        return ImageUtils.copy(img);\n    }\n\n    public String toString() {\n        return name;\n    }\n}\n" },
      { path: "ImageUtils.java", readOnly: true, content: "/** Team utilities (read-only). copy is the deep copy you wrote in PF-300. */\npublic class ImageUtils {\n    public static int[][] copy(int[][] img) {\n        int[][] out = new int[img.length][];\n        for (int r = 0; r < img.length; r++) {\n            out[r] = new int[img[r].length];\n            for (int c = 0; c < img[r].length; c++) {\n                out[r][c] = img[r][c];\n            }\n        }\n        return out;\n    }\n\n    public static int clamp(int v) {\n        return Math.max(0, Math.min(255, v));\n    }\n}\n" },
      { path: "InvertFilterTest.java", readOnly: true, content: "import tutor.Check;\n\npublic class InvertFilterTest {\n\n    static void test1_overridesApply() {\n        boolean found;\n        try {\n            InvertFilter.class.getDeclaredMethod(\"apply\", int[][].class);\n            found = true;\n        } catch (NoSuchMethodException e) {\n            found = false;\n        }\n        Check.isTrue(found,\n            \"InvertFilter has no apply(int[][] img): the parameter list must match Filter's apply exactly to override it; one extra parameter makes a different method (overload)\");\n    }\n\n    static void test2_pipelineSeesIt() {\n        Filter f = new InvertFilter();\n        int[][] out = f.apply(new int[][]{{0, 100}, {200, 255}});\n        Check.equal(new int[][]{{255, 155}, {55, 0}}, out,\n            \"when the editor calls f.apply(img) through a Filter variable, InvertFilter's version should run\");\n    }\n\n    static void test3_doesNotModifyInput() {\n        int[][] img = {{10, 20}};\n        new InvertFilter().apply(img);\n        Check.equal(new int[][]{{10, 20}}, img, \"apply must not modify the original image\");\n    }\n\n    static void test4_nameStillWorks() {\n        Check.equal(\"Invert\", new InvertFilter().getName(), \"the name is still Invert (getName is inherited from Filter)\");\n    }\n\n    static void test5_nonSquare() {\n        Filter f = new InvertFilter();\n        Check.equal(new int[][]{{255}, {0}, {127}}, f.apply(new int[][]{{0}, {255}, {128}}), \"a 3 x 1 image\");\n    }\n}\n" },
    ],
    testLabels: {
      test1_overridesApply: "Overrides apply(int[][] img)",
      test2_pipelineSeesIt: "The pipeline runs your version",
      test3_doesNotModifyInput: "Original image unchanged",
      test4_nameStillWorks: "Name is still Invert",
      test5_nonSquare: "Non-square image",
    },
    hints: [
      "Put InvertFilter's method header next to the apply in Filter.java. What is different?",
      "First add only `@Override` without changing the parameters, and press ▶ Run main. What does the compiler say?",
      "The fixed header: `public int[][] apply(int[][] img)`. The method body can stay.",
    ],
  },
};

export const tickets: Ticket[] = [pf300, pf301, pf302, pf303];
