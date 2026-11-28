import type { Ticket } from "../../types";

/*
 * Sprint 2 = Pixel Arena (QuestForge Games): Runestone CSJava Unit 10 (Inheritance), with a review of the
 * class-design ideas it builds on (private, getters/setters, private methods, static, overloading).
 * Every ticket is why-first: students hit the problem in code or in the game, then meet the idea as the fix.
 * The right column runs the student's real Java (components/game/GameStage.tsx): public methods become buttons.
 * Reference solutions: tools/solutions/QF-2xx/. Markdown uses ~~~ fences so it can live in template literals.
 */

const qf201: Ticket = {
  id: "QF-201",
  slug: "first-heroes-objects-fields",
  title: "Your first heroes: objects and fields",
  xp: 100,
  learningGoal: {
    level: "easy",
    goal: "Write a constructor that fills an object's fields, and see that every object keeps its own copy of the fields.",
    techniques: ["Class vs object", "Fields", "Constructor with this.name = name", "Instance method using fields"],
  },
  briefing: `Welcome to **QuestForge Games**! 🎮 We're building **Pixel Arena**, a small turn-based battle game.

On the right is the game. It runs **your Java**: whatever classes and methods you write show up there, and every button calls your code. Right now the heroes don't even know their own names. Let's fix that.`,
  objectives: [
    "Explain the difference between a class and an object",
    "Write a constructor that stores its parameters in the object's fields",
    "Show that two objects of the same class keep separate field values",
    "Write a method that uses the object's own fields",
  ],
  blocks: [
    { type: "step", title: "One class, many heroes", focus: "game" },
    {
      type: "markdown",
      md: `The game needs many heroes, each with its own name and hp. Writing a separate set of variables for every hero (\`ariaName\`, \`ariaHp\`, \`bramName\`, …) would never end. Instead we write **one class**, \`Hero\`, describing what *every* hero has, and create as many **objects** as we like:

~~~java
Hero aria = new Hero("Aria", 100);
Hero bram = new Hero("Bram", 80);
~~~

- \`name\` and \`hp\` are **fields**: each Hero object gets its own copy.
- The **constructor** runs once for each \`new\` and sets up that object's fields.

Press **▶ Run my code** in the game: two heroes appear, but their names and hp are empty (\`null\`, 0), because the constructor doesn't store anything yet.`,
    },
    { type: "step", title: "Predict before you code", focus: "read" },
    {
      type: "predict",
      id: "qf201-shadow",
      question: "The constructor is written like this. What is aria.name afterwards?",
      code: `public Hero(String name, int hp) {
    name = name;
    hp = hp;
}`,
      options: ["\"Aria\"", "null", "Compile error"],
      answer: 1,
      explain: "Inside the constructor, `name` means the **parameter** (the closest variable with that name). `name = name` copies the parameter into itself; the field is never touched and keeps its default value, null. Write `this.name = name`: `this.name` is *this object's* field.",
    },
    {
      type: "predict",
      id: "qf201-own",
      question: "After TODO 1 works: what does this print?",
      code: `Hero aria = new Hero("Aria", 100);
Hero bram = new Hero("Bram", 80);
bram.hp = bram.hp - 30;
System.out.println(aria.hp);`,
      options: ["100", "70", "50"],
      answer: 0,
      explain: "aria and bram are two different objects, each with its own hp field. Changing Bram's hp does not touch Aria's.",
    },
    { type: "step", title: "Write the constructor and introduce()", focus: "build" },
    {
      type: "markdown",
      md: `In \`Hero.java\`:

1. **TODO 1**: in the constructor, store the parameters in the fields (\`this.name = name;\` and the same for hp).
2. **TODO 2**: \`introduce()\` prints exactly \`I am Aria, 100 HP!\`, using *this* hero's name and hp.

Then press **⟳ Rebuild from my code** in the game. Select a hero and press **introduce()**: the hero says the line in a speech bubble. Try both heroes: same method, different output, because each object uses its own fields.

In the game's field list you can also change \`hp\` directly, because it is \`public\`. Remember that: it becomes a problem in the next ticket.`,
    },
    { type: "step", title: "Why does it work?", focus: "read" },
    {
      type: "short-answer",
      id: "qf201-why",
      question: "Both heroes run the **same** `introduce()` code but say different things. Why?",
      placeholder: "Because…",
      modelAnswer: "introduce() uses the fields of the object it was called on. aria.introduce() reads Aria's own name and hp; bram.introduce() reads Bram's. The code is shared by the class; the data belongs to each object.",
    },
  ],
  visualizations: [],
  game: {},
  task: {
    instructions: "Fill in the constructor and `introduce()` in `Hero.java`, then rebuild the game and try `introduce()` on both heroes.",
    files: [
      { path: "Hero.java", content: "/** A hero in Pixel Arena. Every Hero object has its own name and hp. */\npublic class Hero {\n    public String name;\n    public int hp;\n\n    public Hero(String name, int hp) {\n        // TODO 1: store the parameters in THIS object's fields (hint: this.name = name;)\n    }\n\n    public void introduce() {\n        // TODO 2: print exactly:  I am Aria, 100 HP!   (using this hero's own name and hp)\n    }\n}\n" },
      { path: "Arena.java", content: "import java.util.ArrayList;\nimport java.util.List;\n\n/** Creates the characters you see in the game, and a small main for \u25b6 Run main. (Read-only.) */\npublic class Arena {\n    public static List<Object> setup() {\n        List<Object> world = new ArrayList<Object>();\n        world.add(new Hero(\"Aria\", 100));\n        world.add(new Hero(\"Bram\", 80));\n        return world;\n    }\n\n    public static void main(String[] args) {\n        Hero aria = new Hero(\"Aria\", 100);\n        Hero bram = new Hero(\"Bram\", 80);\n        aria.introduce();\n        bram.introduce();\n        bram.hp = bram.hp - 30;\n        System.out.println(\"After a hit: Bram has \" + bram.hp + \" HP, Aria still has \" + aria.hp + \" HP.\");\n    }\n}\n", readOnly: true },
      { path: "HeroTest.java", content: "import tutor.Check;\n\npublic class HeroTest {\n    static void test1_constructorStoresFields() {\n        Hero a = new Hero(\"Aria\", 100);\n        Check.equal(\"Aria\", a.name, \"name should be stored by the constructor (this.name = name)\");\n        Check.equal(100, a.hp, \"hp should be stored by the constructor\");\n    }\n\n    static void test2_eachObjectHasItsOwnFields() {\n        Hero a = new Hero(\"Aria\", 100);\n        Hero b = new Hero(\"Bram\", 80);\n        a.hp = 10;\n        Check.equal(80, b.hp, \"changing Aria's hp must not change Bram's: every object has its own fields\");\n        Check.equal(\"Bram\", b.name, \"Bram keeps his own name\");\n    }\n\n    static void test3_introduce() {\n        Hero a = new Hero(\"Aria\", 100);\n        Check.equal(\"I am Aria, 100 HP!\", out(() -> a.introduce()), \"introduce() output\");\n    }\n\n    static void test4_introduceUsesThisObject() {\n        Hero b = new Hero(\"Bram\", 80);\n        Check.equal(\"I am Bram, 80 HP!\", out(() -> b.introduce()), \"introduce() must use this hero's own name and hp\");\n    }\n\n\n    // ---- helpers: tests call new methods by name, so this file compiles before you write them ----\n    static Object call(Object target, String name, Object... args) {\n        for (java.lang.reflect.Method m : target.getClass().getMethods()) {\n            if (m.getName().equals(name) && m.getParameterCount() == args.length) {\n                try {\n                    return m.invoke(target, args);\n                } catch (java.lang.reflect.InvocationTargetException e) {\n                    throw new RuntimeException(e.getCause());\n                } catch (IllegalAccessException | IllegalArgumentException e) {\n                    continue;\n                }\n            }\n        }\n        Check.isTrue(false, \"No public method \" + name + \" with \" + args.length + \" parameter(s) in \" + target.getClass().getSimpleName());\n        return null;\n    }\n\n    static Object make(String cls, Object... args) {\n        try {\n            for (java.lang.reflect.Constructor<?> c : Class.forName(cls).getConstructors()) {\n                if (c.getParameterCount() == args.length) {\n                    try {\n                        return c.newInstance(args);\n                    } catch (IllegalArgumentException e) {\n                        continue;\n                    }\n                }\n            }\n        } catch (java.lang.reflect.InvocationTargetException e) {\n            throw new RuntimeException(e.getCause());\n        } catch (ReflectiveOperationException e) {\n            Check.isTrue(false, \"Cannot create \" + cls + \": \" + e);\n        }\n        Check.isTrue(false, \"No public constructor \" + cls + \" with \" + args.length + \" parameter(s)\");\n        return null;\n    }\n\n    static String out(Runnable r) {\n        java.io.PrintStream old = System.out;\n        java.io.ByteArrayOutputStream b = new java.io.ByteArrayOutputStream();\n        System.setOut(new java.io.PrintStream(b));\n        try {\n            r.run();\n        } finally {\n            System.setOut(old);\n        }\n        return b.toString().trim().replace(\"\\r\", \"\");\n    }\n\n    static java.lang.reflect.Field field(String cls, String name) {\n        try {\n            return Class.forName(cls).getDeclaredField(name);\n        } catch (ReflectiveOperationException e) {\n            return null;\n        }\n    }\n\n    static java.lang.reflect.Method declared(String cls, String name, Class<?>... params) {\n        try {\n            return Class.forName(cls).getDeclaredMethod(name, params);\n        } catch (ReflectiveOperationException e) {\n            return null;\n        }\n    }\n\n    static int mod(java.lang.reflect.Member m) {\n        return m.getModifiers();\n    }\n\n}\n", readOnly: true },
    ],
    mainClass: "Arena",
    testClass: "HeroTest",
    testLabels: {
      test1_constructorStoresFields: "Constructor stores the fields",
      test2_eachObjectHasItsOwnFields: "Each object has its own fields",
      test3_introduce: "introduce() prints the line",
      test4_introduceUsesThisObject: "introduce() uses this hero's fields",
    },
    solution: "QF-201/Hero",
    hints: [
      "Inside the constructor, the parameter `name` hides the field `name`. `this.name` means the field of the object being built.",
      "`System.out.println(\"I am \" + name + \", \" + hp + \" HP!\");` Check the spaces and punctuation against the test.",
    ],
  },
};

const qf202: Ticket = {
  id: "QF-202",
  slug: "private-vs-public",
  title: "Why can't I change hp? private vs public",
  xp: 130,
  learningGoal: {
    level: "easy",
    goal: "Experience what private blocks, explain why fields should be private, and add getters and a setter as the controlled way in.",
    techniques: ["public vs private", "\"is not visible\" compile error", "Getters and setters", "Why not just make it public"],
  },
  briefing: `A teammate changed \`Hero\`: \`level\` is still **public**, but \`hp\` is now **private**. Before you touch \`Hero.java\`, try both from outside the class, in \`Main.java\`, and see what happens.`,
  objectives: [
    "Change a public field and try to change a private field from another class",
    "Read the \"is not visible\" error and say what it protects",
    "Add getters and a setter as the controlled way to read and change fields",
    "Explain why not every field should simply be public",
  ],
  blocks: [
    { type: "step", title: "Try it from outside", focus: "code" },
    {
      type: "markdown",
      md: `Open \`Main.java\` (your scratch file). It changes \`aria.level\`, a **public** field, from outside the Hero class. Press **▶ Run main**: it works.

Now remove the \`//\` in front of \`aria.hp = 50;\` and press **▶ Run main** again.`,
    },
    {
      type: "predict",
      id: "qf202-predict",
      question: "What happens when Main.java runs  aria.hp = 50;  while hp is private?",
      options: ["hp becomes 50", "Compile error: The field Hero.hp is not visible", "It compiles, but crashes when it runs"],
      answer: 1,
      explain: "private means: only code inside the Hero class may use this field. Main is another class, so the compiler refuses before the program ever runs. Put the // back so Main compiles again.",
    },
    { type: "step", title: "What the game can see", focus: "game" },
    {
      type: "markdown",
      md: `Look at the game. Aria's **level** is shown, but her **HP shows 🔒 ?**: the game is also "outside code", and it cannot read a private field either. You can try **try hp =** in the field list; Java refuses in the same way.

So we're stuck: **how can anyone read or change hp now?**`,
    },
    { type: "step", title: "The controlled way in", focus: "read" },
    {
      type: "markdown",
      md: `The class itself decides what outside code may do, by offering **public methods**:

~~~java
public int getHp() {        // a getter: lets outside code READ hp
    return hp;
}

public void setLevel(int newLevel) {   // a setter: lets outside code CHANGE level
    level = newLevel;
}
~~~

The field stays private; the methods are the doors. Code inside Hero can still use \`hp\` directly.`,
    },
    { type: "step", title: "Why not just make it public?", focus: "game" },
    {
      type: "markdown",
      md: `Before answering, use the game to break something. Select Aria and set **level = -3** with the field editor. The game happily shows **Lv -3**. A level of minus three makes no sense, but because \`level\` is public, **any code anywhere** can put any value in it, at any time, and Hero cannot stop it or even notice. In a big program, when a wrong value shows up, you would have to search *every* file for who changed it.`,
    },
    {
      type: "short-answer",
      id: "qf202-why-private",
      question: "In your own words: what goes wrong when a field like `level` is public?",
      placeholder: "If level is public, then…",
      modelAnswer: "Any code anywhere can set it to any value, even nonsense like -3, and Hero can't prevent it or know it happened. When the value is wrong, the bug could be in any file. If the field is private, the only way in is through Hero's own methods, so Hero can check the value and there is one place to look.",
    },
    { type: "step", title: "Add getters and a setter", focus: "build" },
    {
      type: "markdown",
      md: `1. **TODO 3** in \`Hero.java\`: make \`level\` private too.
2. **TODO 4**: add \`public int getHp()\`, \`public int getLevel()\`, \`public void setLevel(int newLevel)\`.
3. \`Main.java\` no longer compiles (it uses \`aria.level\`). Good: the compiler now protects level as well. Change Main to use \`setLevel(5)\` and \`getLevel()\`, and print \`getHp()\`.

Rebuild the game: the **HP bar appears**, because the game can now read hp through \`getHp()\`. \`setLevel\` shows up as a button.

Right now \`setLevel(-3)\` still works, so what did we gain? There is now **one door**, and every change goes through it. In the next ticket we put a guard at that door.`,
    },
  ],
  visualizations: [],
  game: { exclude: ["Main.java"] },
  task: {
    instructions: "Try the private field from Main.java, then make level private and add getHp(), getLevel() and setLevel(int).",
    files: [
      { path: "Hero.java", content: "/** A hero in Pixel Arena. */\npublic class Hero {\n    public String name;\n    public int level;\n    private int hp;\n\n    public Hero(String name, int hp) {\n        this.name = name;\n        this.hp = hp;\n        this.level = 1;\n    }\n\n    public void introduce() {\n        System.out.println(\"I am \" + name + \", Lv \" + level + \", \" + hp + \" HP!\");\n    }\n\n    // TODO 3: make level private too.\n    // TODO 4: add  public int getHp(),  public int getLevel()  and  public void setLevel(int newLevel)\n}\n" },
      { path: "Main.java", content: "/** Your scratch file: try things here and press \u25b6 Run main. (The game ignores this file.) */\npublic class Main {\n    public static void main(String[] args) {\n        Hero aria = new Hero(\"Aria\", 100);\n\n        // Step 1: change a PUBLIC field from outside the Hero class.\n        aria.level = 5;\n        System.out.println(\"level is now \" + aria.level);\n\n        // Step 2: remove the // at the start of the next line, press Run main, and read the error.\n        // aria.hp = 50;\n\n        aria.introduce();\n    }\n}\n" },
      { path: "Arena.java", content: "import java.util.ArrayList;\nimport java.util.List;\n\n/** Creates the characters you see in the game, and a small main for \u25b6 Run main. (Read-only.) */\npublic class Arena {\n    public static List<Object> setup() {\n        List<Object> world = new ArrayList<Object>();\n        world.add(new Hero(\"Aria\", 100));\n        world.add(new Hero(\"Bram\", 80));\n        return world;\n    }\n\n    public static void main(String[] args) {\n        new Hero(\"Aria\", 100).introduce();\n    }\n}\n", readOnly: true },
      { path: "HeroTest.java", content: "import tutor.Check;\n\npublic class HeroTest {\n    static void test1_hpIsPrivate() {\n        java.lang.reflect.Field f = field(\"Hero\", \"hp\");\n        Check.isTrue(f != null && java.lang.reflect.Modifier.isPrivate(mod(f)), \"hp must stay private\");\n    }\n\n    static void test2_levelIsPrivate() {\n        java.lang.reflect.Field f = field(\"Hero\", \"level\");\n        Check.isTrue(f != null, \"Hero still needs a level field\");\n        Check.isTrue(java.lang.reflect.Modifier.isPrivate(mod(f)), \"level should be private too, so only Hero's own code can change it\");\n    }\n\n    static void test3_getHp() {\n        Hero a = new Hero(\"Aria\", 100);\n        Check.equal(100, call(a, \"getHp\"), \"getHp() returns this hero's hp\");\n    }\n\n    static void test4_getAndSetLevel() {\n        Hero a = new Hero(\"Aria\", 100);\n        Check.equal(1, call(a, \"getLevel\"), \"a new hero starts at level 1\");\n        call(a, \"setLevel\", 5);\n        Check.equal(5, call(a, \"getLevel\"), \"setLevel(5) then getLevel() should be 5\");\n    }\n\n\n    // ---- helpers: tests call new methods by name, so this file compiles before you write them ----\n    static Object call(Object target, String name, Object... args) {\n        for (java.lang.reflect.Method m : target.getClass().getMethods()) {\n            if (m.getName().equals(name) && m.getParameterCount() == args.length) {\n                try {\n                    return m.invoke(target, args);\n                } catch (java.lang.reflect.InvocationTargetException e) {\n                    throw new RuntimeException(e.getCause());\n                } catch (IllegalAccessException | IllegalArgumentException e) {\n                    continue;\n                }\n            }\n        }\n        Check.isTrue(false, \"No public method \" + name + \" with \" + args.length + \" parameter(s) in \" + target.getClass().getSimpleName());\n        return null;\n    }\n\n    static Object make(String cls, Object... args) {\n        try {\n            for (java.lang.reflect.Constructor<?> c : Class.forName(cls).getConstructors()) {\n                if (c.getParameterCount() == args.length) {\n                    try {\n                        return c.newInstance(args);\n                    } catch (IllegalArgumentException e) {\n                        continue;\n                    }\n                }\n            }\n        } catch (java.lang.reflect.InvocationTargetException e) {\n            throw new RuntimeException(e.getCause());\n        } catch (ReflectiveOperationException e) {\n            Check.isTrue(false, \"Cannot create \" + cls + \": \" + e);\n        }\n        Check.isTrue(false, \"No public constructor \" + cls + \" with \" + args.length + \" parameter(s)\");\n        return null;\n    }\n\n    static String out(Runnable r) {\n        java.io.PrintStream old = System.out;\n        java.io.ByteArrayOutputStream b = new java.io.ByteArrayOutputStream();\n        System.setOut(new java.io.PrintStream(b));\n        try {\n            r.run();\n        } finally {\n            System.setOut(old);\n        }\n        return b.toString().trim().replace(\"\\r\", \"\");\n    }\n\n    static java.lang.reflect.Field field(String cls, String name) {\n        try {\n            return Class.forName(cls).getDeclaredField(name);\n        } catch (ReflectiveOperationException e) {\n            return null;\n        }\n    }\n\n    static java.lang.reflect.Method declared(String cls, String name, Class<?>... params) {\n        try {\n            return Class.forName(cls).getDeclaredMethod(name, params);\n        } catch (ReflectiveOperationException e) {\n            return null;\n        }\n    }\n\n    static int mod(java.lang.reflect.Member m) {\n        return m.getModifiers();\n    }\n\n}\n", readOnly: true },
    ],
    mainClass: "Main",
    testClass: "HeroTest",
    testLabels: {
      test1_hpIsPrivate: "hp stays private",
      test2_levelIsPrivate: "level is private",
      test3_getHp: "getHp()",
      test4_getAndSetLevel: "getLevel() and setLevel()",
    },
    solution: "QF-202",
    hints: [
      "A getter just returns the field: `public int getHp() { return hp; }`",
      "After level is private, Main must use `aria.setLevel(5)` and `aria.getLevel()` instead of `aria.level`.",
    ],
  },
};

const qf203: Ticket = {
  id: "QF-203",
  slug: "getters-setters-no-setter",
  title: "Guards at the door: setters with rules, getters that work, fields with no setter",
  xp: 150,
  learningGoal: {
    level: "medium",
    goal: "Put validation in a setter, compute a value in a getter, and replace a setter with meaningful methods when a field should not be set freely.",
    techniques: ["Validation in a setter", "Getter that processes data", "Read-only fields (no setter)", "Methods that express intent (takeDamage, heal)"],
  },
  briefing: `Now that every change goes through methods, we can make those methods **smart**. Also, a teammate added \`setHp\` "to make testing easier". Our game designer is not happy about it. Let's see why.`,
  objectives: [
    "Reject invalid values in a setter",
    "Write a getter that computes something instead of just returning a field",
    "Explain why some fields should have no setter at all",
    "Replace setHp with takeDamage and heal",
  ],
  blocks: [
    { type: "step", title: "Smarter doors", focus: "read" },
    {
      type: "markdown",
      md: `\`setLevel\` is the only way to change level, so a rule written there **can never be skipped**:

~~~java
public void setLevel(int newLevel) {
    if (newLevel >= 1 && newLevel <= 99) {
        level = newLevel;
    }
}
~~~

With a public field, the same rule would have to be repeated (and remembered) everywhere level is changed.`,
    },
    {
      type: "markdown",
      md: `## A getter can do work

A getter doesn't have to return a field as-is. \`getHpBar()\` can turn hp into the text the game displays:

~~~
[#####-----] 50/100
~~~

There is no \`hpBar\` field at all: the getter **computes** it from hp and maxHp every time. Outside code doesn't know or care whether a value is stored or computed, which means Hero can change how it works later without breaking anyone.

You already use getters like this: \`list.get(i)\` first **checks** that i is a valid index (and throws \`IndexOutOfBoundsException\` if it isn't) before returning the element.`,
    },
    { type: "step", title: "The setHp back door", focus: "game" },
    {
      type: "markdown",
      md: `Look at the teammate's \`setHp\`. Select a hero in the game and try **setHp(9999)**.`,
    },
    {
      type: "predict",
      id: "qf203-sethp",
      question: "Why is a public setHp(int) a problem in this game?",
      options: [
        "It is slower than changing the field",
        "Any code can set hp to anything (9999, -50) and skip the game's rules; \"set hp to a number\" is not something that happens in a battle",
        "Java does not allow setters for int fields",
      ],
      answer: 1,
      explain: "In the game, hp only changes because something **happens**: a hero is hit or healed. Each of those has rules (never below 0, never above maxHp, no negative damage). A setter is a back door around all of them, so the right design is no setter, plus methods that say what happened.",
    },
    { type: "step", title: "Actions instead of a setter", focus: "read" },
    {
      type: "markdown",
      md: `So instead of \`setHp\`, Hero offers **actions with names that say what happened**:

~~~java
public void takeDamage(int amount)   // hp goes down, never below 0
public void heal(int amount)         // hp goes up, never above maxHp
~~~

And \`name\`? A hero's name is fixed once the hero is created, so it gets a getter and **no setter**: it is **read-only** from the outside.

| Field | Getter | Setter | Why |
|---|---|---|---|
| name | ✅ | ❌ | fixed after creation |
| level | ✅ | ✅ with a rule | can change, within 1..99 |
| hp | ✅ | ❌ | changes only through takeDamage / heal |
| maxHp | ✅ | ❌ | decided when the hero is created |`,
    },
    {
      type: "short-answer",
      id: "qf203-why",
      question: "Explain to a teammate why Hero has `takeDamage` and `heal` instead of `setHp`.",
      placeholder: "Because…",
      modelAnswer: "hp should only change because of game events, and each event has rules (no negative damage, never below 0, never above maxHp). takeDamage and heal enforce those rules and say what happened. setHp would let any code put any number into hp and skip every rule.",
    },
    { type: "step", title: "Build the rules", focus: "build" },
    {
      type: "markdown",
      md: `1. **TODO 1**: \`setLevel\` only accepts 1 to 99; anything else is ignored (the old level stays).
2. **TODO 2**: delete \`setHp\`. Write \`takeDamage(int amount)\` and \`heal(int amount)\`: hp never goes below 0 or above maxHp, and negative amounts are ignored.
3. **TODO 3**: write \`getHpBar()\` (10 cells; filled cells = \`hp * 10 / maxHp\`).

Rebuild and test in the game: hit a hero with **takeDamage(500)**, heal with **heal(999)**, try **setLevel(-3)**, and call **getHpBar()**. The **setHp** button is gone, and so is the back door.`,
    },
  ],
  visualizations: [],
  game: {},
  task: {
    instructions: "Add the level rule, replace setHp with takeDamage and heal, and write getHpBar().",
    files: [
      { path: "Hero.java", content: "/** A hero in Pixel Arena. */\npublic class Hero {\n    private String name;\n    private int hp;\n    private int maxHp;\n    private int level;\n\n    public Hero(String name, int maxHp) {\n        this.name = name;\n        this.maxHp = maxHp;\n        this.hp = maxHp;\n        this.level = 1;\n    }\n\n    public String getName() {\n        return name;\n    }\n\n    public int getHp() {\n        return hp;\n    }\n\n    public int getMaxHp() {\n        return maxHp;\n    }\n\n    public int getLevel() {\n        return level;\n    }\n\n    public void setLevel(int newLevel) {\n        // TODO 1: only accept levels from 1 to 99. Ignore anything else (keep the old level).\n        level = newLevel;\n    }\n\n    /** A teammate added this \"to make testing easier\". Read the lesson, then replace it (TODO 2). */\n    public void setHp(int newHp) {\n        hp = newHp;\n    }\n\n    // TODO 2: delete setHp, and write  takeDamage(int amount)  and  heal(int amount):\n    //         hp never goes below 0 or above maxHp, and negative amounts are ignored.\n\n    // TODO 3: write  public String getHpBar(),  for example \"[#####-----] 50/100\"\n    //         (10 cells; filled cells = hp * 10 / maxHp, with integer division)\n}\n" },
      { path: "Arena.java", content: "import java.util.ArrayList;\nimport java.util.List;\n\n/** Creates the characters you see in the game, and a small main for \u25b6 Run main. (Read-only.) */\npublic class Arena {\n    public static List<Object> setup() {\n        List<Object> world = new ArrayList<Object>();\n        world.add(new Hero(\"Aria\", 100));\n        world.add(new Hero(\"Bram\", 80));\n        return world;\n    }\n\n    public static void main(String[] args) {\n        Hero aria = new Hero(\"Aria\", 100);\n        System.out.println(aria.getName() + \" has \" + aria.getHp() + \"/\" + aria.getMaxHp() + \" HP\");\n    }\n}\n", readOnly: true },
      { path: "HeroTest.java", content: "import tutor.Check;\n\npublic class HeroTest {\n    static void test1_levelRule() {\n        Hero a = new Hero(\"Aria\", 100);\n        a.setLevel(5);\n        Check.equal(5, a.getLevel(), \"setLevel(5) is allowed\");\n        a.setLevel(-3);\n        Check.equal(5, a.getLevel(), \"setLevel(-3) must be ignored (level stays 5)\");\n        a.setLevel(100);\n        Check.equal(5, a.getLevel(), \"setLevel(100) must be ignored (99 is the maximum)\");\n        a.setLevel(99);\n        Check.equal(99, a.getLevel(), \"setLevel(99) is allowed\");\n    }\n\n    static void test2_noSetHp() {\n        Check.isTrue(declared(\"Hero\", \"setHp\", int.class) == null, \"Hero should not have setHp any more: hp may only change through takeDamage and heal\");\n    }\n\n    static void test3_noSetName() {\n        Check.isTrue(declared(\"Hero\", \"setName\", String.class) == null, \"name is read-only: there should be no setName\");\n    }\n\n    static void test4_takeDamage() {\n        Hero a = new Hero(\"Aria\", 100);\n        call(a, \"takeDamage\", 30);\n        Check.equal(70, a.getHp(), \"takeDamage(30) from 100\");\n        call(a, \"takeDamage\", 500);\n        Check.equal(0, a.getHp(), \"hp never goes below 0\");\n        Hero b = new Hero(\"Bram\", 80);\n        call(b, \"takeDamage\", -20);\n        Check.equal(80, b.getHp(), \"a negative amount is ignored (it must not heal)\");\n    }\n\n    static void test5_heal() {\n        Hero a = new Hero(\"Aria\", 100);\n        call(a, \"takeDamage\", 50);\n        call(a, \"heal\", 20);\n        Check.equal(70, a.getHp(), \"heal(20) from 50\");\n        call(a, \"heal\", 999);\n        Check.equal(100, a.getHp(), \"hp never goes above maxHp\");\n        call(a, \"takeDamage\", 10);\n        call(a, \"heal\", -5);\n        Check.equal(90, a.getHp(), \"a negative heal is ignored\");\n    }\n\n    static void test6_hpBar() {\n        Hero a = new Hero(\"Aria\", 100);\n        Check.equal(\"[##########] 100/100\", call(a, \"getHpBar\"), \"full hp\");\n        call(a, \"takeDamage\", 50);\n        Check.equal(\"[#####-----] 50/100\", call(a, \"getHpBar\"), \"half hp\");\n        Hero b = new Hero(\"Bram\", 80);\n        call(b, \"takeDamage\", 25);\n        Check.equal(\"[######----] 55/80\", call(b, \"getHpBar\"), \"55/80: 55 * 10 / 80 = 6 filled cells\");\n        call(b, \"takeDamage\", 100);\n        Check.equal(\"[----------] 0/80\", call(b, \"getHpBar\"), \"zero hp\");\n    }\n\n\n    // ---- helpers: tests call new methods by name, so this file compiles before you write them ----\n    static Object call(Object target, String name, Object... args) {\n        for (java.lang.reflect.Method m : target.getClass().getMethods()) {\n            if (m.getName().equals(name) && m.getParameterCount() == args.length) {\n                try {\n                    return m.invoke(target, args);\n                } catch (java.lang.reflect.InvocationTargetException e) {\n                    throw new RuntimeException(e.getCause());\n                } catch (IllegalAccessException | IllegalArgumentException e) {\n                    continue;\n                }\n            }\n        }\n        Check.isTrue(false, \"No public method \" + name + \" with \" + args.length + \" parameter(s) in \" + target.getClass().getSimpleName());\n        return null;\n    }\n\n    static Object make(String cls, Object... args) {\n        try {\n            for (java.lang.reflect.Constructor<?> c : Class.forName(cls).getConstructors()) {\n                if (c.getParameterCount() == args.length) {\n                    try {\n                        return c.newInstance(args);\n                    } catch (IllegalArgumentException e) {\n                        continue;\n                    }\n                }\n            }\n        } catch (java.lang.reflect.InvocationTargetException e) {\n            throw new RuntimeException(e.getCause());\n        } catch (ReflectiveOperationException e) {\n            Check.isTrue(false, \"Cannot create \" + cls + \": \" + e);\n        }\n        Check.isTrue(false, \"No public constructor \" + cls + \" with \" + args.length + \" parameter(s)\");\n        return null;\n    }\n\n    static String out(Runnable r) {\n        java.io.PrintStream old = System.out;\n        java.io.ByteArrayOutputStream b = new java.io.ByteArrayOutputStream();\n        System.setOut(new java.io.PrintStream(b));\n        try {\n            r.run();\n        } finally {\n            System.setOut(old);\n        }\n        return b.toString().trim().replace(\"\\r\", \"\");\n    }\n\n    static java.lang.reflect.Field field(String cls, String name) {\n        try {\n            return Class.forName(cls).getDeclaredField(name);\n        } catch (ReflectiveOperationException e) {\n            return null;\n        }\n    }\n\n    static java.lang.reflect.Method declared(String cls, String name, Class<?>... params) {\n        try {\n            return Class.forName(cls).getDeclaredMethod(name, params);\n        } catch (ReflectiveOperationException e) {\n            return null;\n        }\n    }\n\n    static int mod(java.lang.reflect.Member m) {\n        return m.getModifiers();\n    }\n\n}\n", readOnly: true },
    ],
    mainClass: "Arena",
    testClass: "HeroTest",
    testLabels: {
      test1_levelRule: "setLevel only accepts 1..99",
      test2_noSetHp: "No setHp (hp changes through game actions)",
      test3_noSetName: "name is read-only",
      test4_takeDamage: "takeDamage rules",
      test5_heal: "heal rules",
      test6_hpBar: "getHpBar() format",
    },
    solution: "QF-203/Hero",
    hints: [
      "Ignoring an invalid level: only assign when `newLevel >= 1 && newLevel <= 99`.",
      "takeDamage: `if (amount < 0) return;` then subtract, then `if (hp < 0) hp = 0;`. heal is the mirror image with maxHp.",
      "getHpBar: `int filled = hp * 10 / maxHp;` then build a String with a loop: \"#\" while i < filled, otherwise \"-\".",
    ],
  },
};

const qf204: Ticket = {
  id: "QF-204",
  slug: "private-methods",
  title: "Helpers nobody else should call: private methods",
  xp: 150,
  learningGoal: {
    level: "medium",
    goal: "Extract repeated logic into private helper methods and explain why helpers stay private.",
    techniques: ["Removing duplicated code", "private helper methods", "Changing a formula in one place", "Public interface vs internal details"],
  },
  briefing: `Two things in \`Hero.java\` are copied in two places: the "keep hp between 0 and maxHp" code, and the damage formula. Now the game designer wants a **balance patch**: damage becomes \`6 + level * 3\`. With copies, it's easy to change one and forget the other.`,
  objectives: [
    "Move repeated code into a helper method",
    "Explain why a helper method should be private",
    "Change a formula in exactly one place",
    "Tell a class's public methods apart from its internal details",
  ],
  blocks: [
    { type: "step", title: "Find the copies", focus: "code" },
    {
      type: "markdown",
      md: `Read \`takeDamage\` and \`heal\`: both end with the same clamping lines. Read \`attack\` and \`previewDamage\`: both contain \`8 + level * 2\`.`,
    },
    {
      type: "predict",
      id: "qf204-copies",
      question: "A teammate applies the balance patch by changing only attack. What does the player see?",
      options: ["Nothing wrong", "The attack preview shows one number and the real attack deals another", "A compile error"],
      answer: 1,
      explain: "Two copies of a formula drift apart. The preview still uses the old formula. Bugs like this are why repeated code is moved into one method.",
    },
    { type: "step", title: "One helper, one place", focus: "read" },
    {
      type: "markdown",
      md: `Move each repeated piece into its own method and call it from both places:

~~~java
private int clampHp(int value) {
    if (value < 0) return 0;
    if (value > maxHp) return maxHp;
    return value;
}
~~~

Why **private**?

- \`clampHp\` is a small step *inside* Hero's own work. Outside code has no reason to call it, and calling it alone would do nothing useful (it doesn't even change hp).
- The damage formula is Hero's own business. If it were public, other classes might start depending on \`calculateDamage()\`, and the designer could no longer change how damage works without breaking them.
- A private method is a promise: "I can change or delete this any time, and nothing outside Hero will break."

You already rely on this every day: when an \`ArrayList\` runs out of room, \`add\` quietly grows its internal array using a **private** method (called \`grow\` in Java's source code). You've never called it, and you can't. That's the point.`,
    },
    { type: "step", title: "Extract the helpers", focus: "build" },
    {
      type: "markdown",
      md: `1. **TODO 1**: write \`private int clampHp(int value)\` and use it in \`takeDamage\` and \`heal\`.
2. **TODO 2**: write \`private int calculateDamage()\` and use it in \`attack\` and \`previewDamage\`.
3. **TODO 3**: balance patch: damage is \`6 + level * 3\`. Change it in **one** place.

Rebuild the game and look at **📐 Your classes**: the private methods have a 🔒, and they do **not** appear as buttons: outside code (the game) cannot call them. Try **attack** and **previewDamage**: they agree.`,
    },
    { type: "step", title: "Why private?", focus: "read" },
    {
      type: "short-answer",
      id: "qf204-why",
      question: "Why should calculateDamage() be private rather than public?",
      placeholder: "Because…",
      modelAnswer: "It's an internal step of Hero's attack. If it were public, other code could start depending on it, and then changing the formula (like this balance patch) could break that code. Private means Hero can change or remove it at any time.",
    },
  ],
  visualizations: [],
  game: {},
  task: {
    instructions: "Extract clampHp and calculateDamage as private methods, then apply the balance patch in one place.",
    files: [
      { path: "Hero.java", content: "/** A hero in Pixel Arena. */\npublic class Hero {\n    private String name;\n    private int hp;\n    private int maxHp;\n    private int level;\n\n    public Hero(String name, int maxHp) {\n        this.name = name;\n        this.maxHp = maxHp;\n        this.hp = maxHp;\n        this.level = 1;\n    }\n\n    public String getName() {\n        return name;\n    }\n\n    public int getHp() {\n        return hp;\n    }\n\n    public int getMaxHp() {\n        return maxHp;\n    }\n\n    public int getLevel() {\n        return level;\n    }\n\n    public void setLevel(int newLevel) {\n        if (newLevel >= 1 && newLevel <= 99) {\n            level = newLevel;\n        }\n    }\n\n    public void takeDamage(int amount) {\n        if (amount < 0) {\n            return;\n        }\n        hp = hp - amount;\n        if (hp < 0) {\n            hp = 0;\n        }\n        if (hp > maxHp) {\n            hp = maxHp;\n        }\n    }\n\n    public void heal(int amount) {\n        if (amount < 0) {\n            return;\n        }\n        hp = hp + amount;\n        if (hp < 0) {\n            hp = 0;\n        }\n        if (hp > maxHp) {\n            hp = maxHp;\n        }\n    }\n\n    public void attack(Hero target) {\n        int damage = 8 + level * 2;\n        System.out.println(name + \" attacks \" + target.getName() + \" for \" + damage + \"!\");\n        target.takeDamage(damage);\n    }\n\n    /** Shown in the game's attack preview. */\n    public int previewDamage() {\n        return 8 + level * 2;\n    }\n\n    // TODO 1: the \"keep hp between 0 and maxHp\" code is copied in two places.\n    //         Move it into   private int clampHp(int value)   and use it in takeDamage and heal.\n    // TODO 2: the damage formula is copied in two places.\n    //         Move it into   private int calculateDamage()   and use it in attack and previewDamage.\n    // TODO 3: balance patch from the game designer: damage is now 6 + level * 3 (change it in ONE place).\n\n    public String getHpBar() {\n        int filled = hp * 10 / maxHp;\n        String bar = \"\";\n        for (int i = 0; i < 10; i++) {\n            if (i < filled) {\n                bar += \"#\";\n            } else {\n                bar += \"-\";\n            }\n        }\n        return \"[\" + bar + \"] \" + hp + \"/\" + maxHp;\n    }\n}\n" },
      { path: "Arena.java", content: "import java.util.ArrayList;\nimport java.util.List;\n\n/** Creates the characters you see in the game, and a small main for \u25b6 Run main. (Read-only.) */\npublic class Arena {\n    public static List<Object> setup() {\n        List<Object> world = new ArrayList<Object>();\n        world.add(new Hero(\"Aria\", 100));\n        world.add(new Hero(\"Bram\", 80));\n        return world;\n    }\n\n    public static void main(String[] args) {\n        Hero aria = new Hero(\"Aria\", 100);\n        Hero bram = new Hero(\"Bram\", 80);\n        aria.attack(bram);\n        System.out.println(bram.getHpBar());\n    }\n}\n", readOnly: true },
      { path: "HeroTest.java", content: "import tutor.Check;\n\npublic class HeroTest {\n    static void test1_clampHpIsPrivate() {\n        java.lang.reflect.Method m = declared(\"Hero\", \"clampHp\", int.class);\n        Check.isTrue(m != null, \"write  private int clampHp(int value)\");\n        Check.isTrue(java.lang.reflect.Modifier.isPrivate(mod(m)), \"clampHp should be private: it is a helper for Hero's own methods\");\n        Check.isTrue(m.getReturnType() == int.class, \"clampHp returns the clamped value (int)\");\n    }\n\n    static void test2_calculateDamageIsPrivate() {\n        java.lang.reflect.Method m = declared(\"Hero\", \"calculateDamage\");\n        Check.isTrue(m != null, \"write  private int calculateDamage()\");\n        Check.isTrue(java.lang.reflect.Modifier.isPrivate(mod(m)), \"calculateDamage should be private: the formula is Hero's own business\");\n    }\n\n    static void test3_rulesStillHold() {\n        Hero a = new Hero(\"Aria\", 100);\n        a.takeDamage(130);\n        Check.equal(0, a.getHp(), \"hp never below 0\");\n        a.heal(500);\n        Check.equal(100, a.getHp(), \"hp never above maxHp\");\n        a.takeDamage(-5);\n        Check.equal(100, a.getHp(), \"negative damage ignored\");\n    }\n\n    static void test4_balancePatch() {\n        Hero a = new Hero(\"Aria\", 100);\n        Check.equal(9, a.previewDamage(), \"level 1: 6 + 1 * 3 = 9\");\n        a.setLevel(10);\n        Check.equal(36, a.previewDamage(), \"level 10: 6 + 10 * 3 = 36\");\n    }\n\n    static void test5_attackUsesSameFormula() {\n        Hero a = new Hero(\"Aria\", 100);\n        Hero b = new Hero(\"Bram\", 80);\n        String said = out(() -> a.attack(b));\n        Check.equal(\"Aria attacks Bram for 9!\", said, \"attack output\");\n        Check.equal(71, b.getHp(), \"Bram took 9 damage\");\n    }\n\n\n    // ---- helpers: tests call new methods by name, so this file compiles before you write them ----\n    static Object call(Object target, String name, Object... args) {\n        for (java.lang.reflect.Method m : target.getClass().getMethods()) {\n            if (m.getName().equals(name) && m.getParameterCount() == args.length) {\n                try {\n                    return m.invoke(target, args);\n                } catch (java.lang.reflect.InvocationTargetException e) {\n                    throw new RuntimeException(e.getCause());\n                } catch (IllegalAccessException | IllegalArgumentException e) {\n                    continue;\n                }\n            }\n        }\n        Check.isTrue(false, \"No public method \" + name + \" with \" + args.length + \" parameter(s) in \" + target.getClass().getSimpleName());\n        return null;\n    }\n\n    static Object make(String cls, Object... args) {\n        try {\n            for (java.lang.reflect.Constructor<?> c : Class.forName(cls).getConstructors()) {\n                if (c.getParameterCount() == args.length) {\n                    try {\n                        return c.newInstance(args);\n                    } catch (IllegalArgumentException e) {\n                        continue;\n                    }\n                }\n            }\n        } catch (java.lang.reflect.InvocationTargetException e) {\n            throw new RuntimeException(e.getCause());\n        } catch (ReflectiveOperationException e) {\n            Check.isTrue(false, \"Cannot create \" + cls + \": \" + e);\n        }\n        Check.isTrue(false, \"No public constructor \" + cls + \" with \" + args.length + \" parameter(s)\");\n        return null;\n    }\n\n    static String out(Runnable r) {\n        java.io.PrintStream old = System.out;\n        java.io.ByteArrayOutputStream b = new java.io.ByteArrayOutputStream();\n        System.setOut(new java.io.PrintStream(b));\n        try {\n            r.run();\n        } finally {\n            System.setOut(old);\n        }\n        return b.toString().trim().replace(\"\\r\", \"\");\n    }\n\n    static java.lang.reflect.Field field(String cls, String name) {\n        try {\n            return Class.forName(cls).getDeclaredField(name);\n        } catch (ReflectiveOperationException e) {\n            return null;\n        }\n    }\n\n    static java.lang.reflect.Method declared(String cls, String name, Class<?>... params) {\n        try {\n            return Class.forName(cls).getDeclaredMethod(name, params);\n        } catch (ReflectiveOperationException e) {\n            return null;\n        }\n    }\n\n    static int mod(java.lang.reflect.Member m) {\n        return m.getModifiers();\n    }\n\n}\n", readOnly: true },
    ],
    mainClass: "Arena",
    testClass: "HeroTest",
    testLabels: {
      test1_clampHpIsPrivate: "private clampHp(int)",
      test2_calculateDamageIsPrivate: "private calculateDamage()",
      test3_rulesStillHold: "hp rules still hold",
      test4_balancePatch: "Balance patch: 6 + level * 3",
      test5_attackUsesSameFormula: "attack uses the same formula",
    },
    solution: "QF-204/Hero",
    hints: [
      "`hp = clampHp(hp - amount);` replaces the subtraction and both if-statements in takeDamage.",
      "`previewDamage()` becomes `return calculateDamage();`",
    ],
  },
};

const qf205: Ticket = {
  id: "QF-205",
  slug: "static-shared-by-class",
  title: "How many heroes are there? static",
  xp: 120,
  learningGoal: {
    level: "medium",
    goal: "Explain when a value belongs to the class rather than each object, and use static fields, static methods and constants.",
    techniques: ["Instance vs static fields", "static methods", "public static final constants", "Why static"],
  },
  briefing: `The game's title screen wants to show **how many heroes exist**. A teammate added a counter to Hero, but every hero in the game says "1". Rebuild the game and call **getHeroCount()** on each hero to see it.`,
  objectives: [
    "Explain why the counter shows 1 for every hero",
    "Use a static field for data shared by the whole class",
    "Call a static method without any object",
    "Replace a magic number with a constant",
  ],
  blocks: [
    { type: "step", title: "Counting heroes", focus: "game" },
    {
      type: "predict",
      id: "qf205-count",
      question: "Three heroes are created. Why does each one say heroCount is 1?",
      options: [
        "The constructor doesn't run",
        "heroCount is a normal field: every hero has its own copy, starts at 0, and is incremented once, by its own constructor",
        "int can only count to 1",
      ],
      answer: 1,
      explain: "A normal (instance) field belongs to each object. The question \"how many heroes are there?\" is not about any one hero; it's about the whole class.",
    },
    { type: "step", title: "Data that belongs to the class", focus: "read" },
    {
      type: "markdown",
      md: `\`static\` means **one copy for the whole class**, shared by every object:

~~~java
private static int heroCount = 0;   // one counter for the whole game

public Hero(String name, int maxHp) {
    ...
    heroCount++;                    // every new hero adds to the same counter
}

public static int getHeroCount() {  // no hero needed to ask
    return heroCount;
}
~~~

Called as \`Hero.getHeroCount()\`, on the **class**. A static method has no "this hero", so it cannot use instance fields like \`name\` or \`hp\`. That's exactly right: the count isn't about any one hero.

## Constants

\`99\` sitting inside \`setLevel\` is a "magic number": a reader has to guess what it means, and if it appears in several places they may disagree. A **constant** gives it a name:

~~~java
public static final int MAX_LEVEL = 99;
~~~

- \`static\`: the same for every hero, so one copy is enough.
- \`final\`: it can never change after it's set.
- Because it can't change, it is safe to make it **public**: nobody can break it. You know this style from \`Math.PI\` and \`Integer.MAX_VALUE\`.

**Limit:** don't use static just to avoid creating objects. If a value is different for each hero (hp, name), it must **not** be static.`,
    },
    { type: "step", title: "Make it static", focus: "build" },
    {
      type: "markdown",
      md: `1. **TODO 1**: make \`heroCount\` static (keep it private).
2. **TODO 2**: make \`getHeroCount()\` static.
3. **TODO 3**: add \`public static final int MAX_LEVEL = 99;\` and use it in \`setLevel\`.

Rebuild: the game's top bar now shows **Hero.getHeroCount() = 3** and **Hero.MAX_LEVEL = 99**. In 📐 Your classes, static members are marked: they belong to the class, not to each hero card.`,
    },
    { type: "step", title: "Why static?", focus: "read" },
    {
      type: "short-answer",
      id: "qf205-why",
      question: "Why is heroCount static but hp is not?",
      placeholder: "heroCount…; hp…",
      modelAnswer: "heroCount describes the whole class (how many heroes exist), so there should be one shared copy. hp is different for each hero, so each object needs its own copy.",
    },
  ],
  visualizations: [],
  game: {},
  task: {
    instructions: "Make the hero counter static, make getHeroCount() static, and add the MAX_LEVEL constant.",
    files: [
      { path: "Hero.java", content: "/** A hero in Pixel Arena. */\npublic class Hero {\n    private int heroCount = 0;   // TODO 1: how many heroes exist in the whole game? (see the lesson)\n\n    private String name;\n    private int hp;\n    private int maxHp;\n    private int level;\n\n    public Hero(String name, int maxHp) {\n        this.name = name;\n        this.maxHp = maxHp;\n        this.hp = maxHp;\n        this.level = 1;\n        heroCount++;\n    }\n\n    // TODO 2: this should not need a hero object. Make it static.\n    public int getHeroCount() {\n        return heroCount;\n    }\n\n    public String getName() {\n        return name;\n    }\n\n    public int getHp() {\n        return hp;\n    }\n\n    public int getMaxHp() {\n        return maxHp;\n    }\n\n    public int getLevel() {\n        return level;\n    }\n\n    public void setLevel(int newLevel) {\n        // TODO 3: replace 99 with a constant:  public static final int MAX_LEVEL = 99;\n        if (newLevel >= 1 && newLevel <= 99) {\n            level = newLevel;\n        }\n    }\n\n    public void takeDamage(int amount) {\n        if (amount < 0) {\n            return;\n        }\n        hp = clampHp(hp - amount);\n    }\n\n    public void heal(int amount) {\n        if (amount < 0) {\n            return;\n        }\n        hp = clampHp(hp + amount);\n    }\n\n    public void attack(Hero target) {\n        int damage = calculateDamage();\n        System.out.println(name + \" attacks \" + target.getName() + \" for \" + damage + \"!\");\n        target.takeDamage(damage);\n    }\n\n    /** Shown in the game's attack preview. */\n    public int previewDamage() {\n        return calculateDamage();\n    }\n\n    public String getHpBar() {\n        int filled = hp * 10 / maxHp;\n        String bar = \"\";\n        for (int i = 0; i < 10; i++) {\n            if (i < filled) {\n                bar += \"#\";\n            } else {\n                bar += \"-\";\n            }\n        }\n        return \"[\" + bar + \"] \" + hp + \"/\" + maxHp;\n    }\n\n    private int clampHp(int value) {\n        if (value < 0) {\n            return 0;\n        }\n        if (value > maxHp) {\n            return maxHp;\n        }\n        return value;\n    }\n\n    private int calculateDamage() {\n        return 6 + level * 3;\n    }\n}\n" },
      { path: "Arena.java", content: "import java.util.ArrayList;\nimport java.util.List;\n\n/** Creates the characters you see in the game, and a small main for \u25b6 Run main. (Read-only.) */\npublic class Arena {\n    public static List<Object> setup() {\n        List<Object> world = new ArrayList<Object>();\n        world.add(new Hero(\"Aria\", 100));\n        world.add(new Hero(\"Bram\", 80));\n        world.add(new Hero(\"Cara\", 70));\n        return world;\n    }\n\n    public static void main(String[] args) {\n        Hero aria = new Hero(\"Aria\", 100);\n        Hero bram = new Hero(\"Bram\", 80);\n        System.out.println(\"Two heroes created.\");\n    }\n}\n", readOnly: true },
      { path: "HeroTest.java", content: "import tutor.Check;\n\npublic class HeroTest {\n    static int count() {\n        try {\n            java.lang.reflect.Method m = Hero.class.getMethod(\"getHeroCount\");\n            Check.isTrue(java.lang.reflect.Modifier.isStatic(mod(m)), \"getHeroCount should be static: you should be able to ask Hero.getHeroCount() without any hero\");\n            return (Integer) m.invoke(null);\n        } catch (ReflectiveOperationException e) {\n            Check.isTrue(false, \"getHeroCount() not found: \" + e);\n            return -1;\n        }\n    }\n\n    static void test1_countIsStatic() {\n        java.lang.reflect.Field f = field(\"Hero\", \"heroCount\");\n        Check.isTrue(f != null, \"Hero still needs the heroCount field\");\n        Check.isTrue(java.lang.reflect.Modifier.isStatic(mod(f)), \"heroCount should be static: ONE counter shared by all heroes, not one per hero\");\n        Check.isTrue(java.lang.reflect.Modifier.isPrivate(mod(f)), \"keep heroCount private, so only Hero's constructor can change it\");\n    }\n\n    static void test2_getterIsStatic() {\n        count();\n    }\n\n    static void test3_countsEveryHero() {\n        int before = count();\n        new Hero(\"X\", 10);\n        new Hero(\"Y\", 10);\n        Check.equal(before + 2, count(), \"creating 2 heroes adds 2 to the shared count\");\n    }\n\n    static void test4_maxLevelConstant() {\n        java.lang.reflect.Field f = field(\"Hero\", \"MAX_LEVEL\");\n        Check.isTrue(f != null, \"add  public static final int MAX_LEVEL = 99;\");\n        int m = mod(f);\n        Check.isTrue(java.lang.reflect.Modifier.isStatic(m) && java.lang.reflect.Modifier.isFinal(m) && java.lang.reflect.Modifier.isPublic(m), \"MAX_LEVEL should be public static final\");\n        try {\n            Check.equal(99, f.getInt(null), \"MAX_LEVEL is 99\");\n        } catch (IllegalAccessException e) {\n            Check.isTrue(false, e.toString());\n        }\n        Hero a = new Hero(\"A\", 10);\n        a.setLevel(99);\n        Check.equal(99, a.getLevel(), \"level 99 still allowed\");\n        a.setLevel(100);\n        Check.equal(99, a.getLevel(), \"level 100 still rejected\");\n    }\n\n\n    // ---- helpers: tests call new methods by name, so this file compiles before you write them ----\n    static Object call(Object target, String name, Object... args) {\n        for (java.lang.reflect.Method m : target.getClass().getMethods()) {\n            if (m.getName().equals(name) && m.getParameterCount() == args.length) {\n                try {\n                    return m.invoke(target, args);\n                } catch (java.lang.reflect.InvocationTargetException e) {\n                    throw new RuntimeException(e.getCause());\n                } catch (IllegalAccessException | IllegalArgumentException e) {\n                    continue;\n                }\n            }\n        }\n        Check.isTrue(false, \"No public method \" + name + \" with \" + args.length + \" parameter(s) in \" + target.getClass().getSimpleName());\n        return null;\n    }\n\n    static Object make(String cls, Object... args) {\n        try {\n            for (java.lang.reflect.Constructor<?> c : Class.forName(cls).getConstructors()) {\n                if (c.getParameterCount() == args.length) {\n                    try {\n                        return c.newInstance(args);\n                    } catch (IllegalArgumentException e) {\n                        continue;\n                    }\n                }\n            }\n        } catch (java.lang.reflect.InvocationTargetException e) {\n            throw new RuntimeException(e.getCause());\n        } catch (ReflectiveOperationException e) {\n            Check.isTrue(false, \"Cannot create \" + cls + \": \" + e);\n        }\n        Check.isTrue(false, \"No public constructor \" + cls + \" with \" + args.length + \" parameter(s)\");\n        return null;\n    }\n\n    static String out(Runnable r) {\n        java.io.PrintStream old = System.out;\n        java.io.ByteArrayOutputStream b = new java.io.ByteArrayOutputStream();\n        System.setOut(new java.io.PrintStream(b));\n        try {\n            r.run();\n        } finally {\n            System.setOut(old);\n        }\n        return b.toString().trim().replace(\"\\r\", \"\");\n    }\n\n    static java.lang.reflect.Field field(String cls, String name) {\n        try {\n            return Class.forName(cls).getDeclaredField(name);\n        } catch (ReflectiveOperationException e) {\n            return null;\n        }\n    }\n\n    static java.lang.reflect.Method declared(String cls, String name, Class<?>... params) {\n        try {\n            return Class.forName(cls).getDeclaredMethod(name, params);\n        } catch (ReflectiveOperationException e) {\n            return null;\n        }\n    }\n\n    static int mod(java.lang.reflect.Member m) {\n        return m.getModifiers();\n    }\n\n}\n", readOnly: true },
    ],
    mainClass: "Arena",
    testClass: "HeroTest",
    testLabels: {
      test1_countIsStatic: "heroCount is static (shared)",
      test2_getterIsStatic: "getHeroCount() is static",
      test3_countsEveryHero: "Counts every new hero",
      test4_maxLevelConstant: "MAX_LEVEL constant",
    },
    solution: "QF-205/Hero",
    hints: [
      "Add the word static: `private static int heroCount = 0;` and `public static int getHeroCount()`.",
      "In setLevel: `newLevel <= MAX_LEVEL`.",
    ],
  },
};

const qf206: Ticket = {
  id: "QF-206",
  slug: "overloading",
  title: "Same name, different parameters: overloading",
  xp: 120,
  learningGoal: {
    level: "medium",
    goal: "Write overloaded methods and constructors, and reuse one constructor from another with this(...).",
    techniques: ["Method overloading", "Constructor overloading", "this(...) constructor call", "When not to overload"],
  },
  briefing: `Two requests from the game designer: an inn that **heals a hero completely**, and quick creation of standard heroes with **100 hp**. Both are things Hero can already almost do, just with different inputs.`,
  objectives: [
    "Add a second method with the same name but different parameters",
    "Add a second constructor and reuse the first with this(...)",
    "Explain how Java picks which version to call",
    "Recognize when two methods should have different names instead",
  ],
  blocks: [
    { type: "step", title: "Same action, different inputs", focus: "read" },
    {
      type: "markdown",
      md: `"Heal" is one idea, used two ways: heal *some* hp, or heal *completely*. Java lets one class have **several methods with the same name** as long as their **parameter lists differ**. This is called **overloading**:

~~~java
public void heal(int amount) { ... }   // heal some
public void heal() { ... }             // heal to full
~~~

Java picks the version by the **arguments**: \`heal(20)\` calls the first, \`heal()\` the second.

You use overloading all the time: \`System.out.println(5)\`, \`println("hi")\` and \`println(true)\` are different methods named println; \`Math.max(3, 7)\` and \`Math.max(2.5, 1.0)\` are too.`,
    },
    {
      type: "markdown",
      md: `## Overloaded constructors and this(...)

Constructors can be overloaded too. A "standard hero" just needs a name:

~~~java
public Hero(String name) {
    this(name, 100);       // run the other constructor
}
~~~

\`this(...)\` must be the first line. Why not copy the four lines of the other constructor instead? Because the counter would then have to be copied too, and every future rule as well. With \`this(...)\` there is **one** place where a hero is set up.`,
    },
    { type: "step", title: "Which one runs?", focus: "read" },
    {
      type: "predict",
      id: "qf206-pick",
      question: "Hero has heal(int amount) and heal(). Which one does  aria.heal(0)  call?",
      options: ["heal(): it heals to full", "heal(int amount) with amount 0: nothing changes", "Compile error: ambiguous"],
      answer: 1,
      explain: "Java looks at the arguments: one int argument matches heal(int). The number of arguments (and their types) decides, not what the value means.",
    },
    {
      type: "callout",
      tone: "warn",
      md: "**When not to overload:** only when the methods do *the same thing* with different inputs. If they mean different things, give them different names. A known trap: `ArrayList<Integer>` has both `remove(int index)` and `remove(Object o)`, so `list.remove(1)` removes the element at **index 1**, not the number 1.",
    },
    { type: "step", title: "Add the overloads", focus: "build" },
    {
      type: "markdown",
      md: `1. **TODO 1**: add \`heal()\` (no parameters) that heals to full.
2. **TODO 2**: add \`Hero(String name)\`, using \`this(name, 100);\`.

Rebuild: the game now shows **two heal buttons**, \`heal()\` and \`heal(int)\`. 📐 Your classes lists both constructors.`,
    },
  ],
  visualizations: [],
  game: {},
  task: {
    instructions: "Add heal() and the Hero(String name) constructor.",
    files: [
      { path: "Hero.java", content: "/** A hero in Pixel Arena. */\npublic class Hero {\n    public static final int MAX_LEVEL = 99;\n    private static int heroCount = 0;\n\n    private String name;\n    private int hp;\n    private int maxHp;\n    private int level;\n\n    public Hero(String name, int maxHp) {\n        this.name = name;\n        this.maxHp = maxHp;\n        this.hp = maxHp;\n        this.level = 1;\n        heroCount++;\n    }\n\n    public static int getHeroCount() {\n        return heroCount;\n    }\n\n    public String getName() {\n        return name;\n    }\n\n    public int getHp() {\n        return hp;\n    }\n\n    public int getMaxHp() {\n        return maxHp;\n    }\n\n    public int getLevel() {\n        return level;\n    }\n\n    public void setLevel(int newLevel) {\n        if (newLevel >= 1 && newLevel <= MAX_LEVEL) {\n            level = newLevel;\n        }\n    }\n\n    public void takeDamage(int amount) {\n        if (amount < 0) {\n            return;\n        }\n        hp = clampHp(hp - amount);\n    }\n\n    public void heal(int amount) {\n        if (amount < 0) {\n            return;\n        }\n        hp = clampHp(hp + amount);\n    }\n\n    public void attack(Hero target) {\n        int damage = calculateDamage();\n        System.out.println(name + \" attacks \" + target.getName() + \" for \" + damage + \"!\");\n        target.takeDamage(damage);\n    }\n\n    /** Shown in the game's attack preview. */\n    public int previewDamage() {\n        return calculateDamage();\n    }\n\n    public String getHpBar() {\n        int filled = hp * 10 / maxHp;\n        String bar = \"\";\n        for (int i = 0; i < 10; i++) {\n            if (i < filled) {\n                bar += \"#\";\n            } else {\n                bar += \"-\";\n            }\n        }\n        return \"[\" + bar + \"] \" + hp + \"/\" + maxHp;\n    }\n\n    // TODO 1: add a second heal with NO parameters that heals to full hp.\n    // TODO 2: add a second constructor  Hero(String name)  for a hero with 100 max hp.\n    //         Make it call the other constructor with  this(name, 100);\n\n    private int clampHp(int value) {\n        if (value < 0) {\n            return 0;\n        }\n        if (value > maxHp) {\n            return maxHp;\n        }\n        return value;\n    }\n\n    private int calculateDamage() {\n        return 6 + level * 3;\n    }\n}\n" },
      { path: "Arena.java", content: "import java.util.ArrayList;\nimport java.util.List;\n\n/** Creates the characters you see in the game, and a small main for \u25b6 Run main. (Read-only.) */\npublic class Arena {\n    public static List<Object> setup() {\n        List<Object> world = new ArrayList<Object>();\n        world.add(new Hero(\"Aria\", 100));\n        world.add(new Hero(\"Bram\", 80));\n        return world;\n    }\n\n    public static void main(String[] args) {\n        Hero aria = new Hero(\"Aria\", 100);\n        aria.takeDamage(60);\n        aria.heal(20);\n        System.out.println(aria.getHpBar());\n    }\n}\n", readOnly: true },
      { path: "HeroTest.java", content: "import tutor.Check;\n\npublic class HeroTest {\n    static void test1_twoHeals() {\n        Check.isTrue(declared(\"Hero\", \"heal\", int.class) != null, \"keep heal(int amount)\");\n        Check.isTrue(declared(\"Hero\", \"heal\") != null, \"add heal() with no parameters\");\n    }\n\n    static void test2_healToFull() {\n        Hero a = new Hero(\"Aria\", 100);\n        a.takeDamage(70);\n        call(a, \"heal\");\n        Check.equal(100, a.getHp(), \"heal() heals to full\");\n    }\n\n    static void test3_healAmountStillWorks() {\n        Hero a = new Hero(\"Aria\", 100);\n        a.takeDamage(70);\n        a.heal(20);\n        Check.equal(50, a.getHp(), \"heal(20) still heals 20\");\n    }\n\n    static void test4_shortConstructor() {\n        int before = Hero.getHeroCount();\n        Object c = make(\"Hero\", \"Cid\");\n        Hero h = (Hero) c;\n        Check.equal(\"Cid\", h.getName(), \"new Hero(\\\"Cid\\\") has the name Cid\");\n        Check.equal(100, h.getMaxHp(), \"a hero made with Hero(String) has 100 max hp\");\n        Check.equal(100, h.getHp(), \"...and starts with full hp\");\n        Check.equal(before + 1, Hero.getHeroCount(), \"one new hero counted once: use this(name, 100) instead of copying the constructor\");\n    }\n\n\n    // ---- helpers: tests call new methods by name, so this file compiles before you write them ----\n    static Object call(Object target, String name, Object... args) {\n        for (java.lang.reflect.Method m : target.getClass().getMethods()) {\n            if (m.getName().equals(name) && m.getParameterCount() == args.length) {\n                try {\n                    return m.invoke(target, args);\n                } catch (java.lang.reflect.InvocationTargetException e) {\n                    throw new RuntimeException(e.getCause());\n                } catch (IllegalAccessException | IllegalArgumentException e) {\n                    continue;\n                }\n            }\n        }\n        Check.isTrue(false, \"No public method \" + name + \" with \" + args.length + \" parameter(s) in \" + target.getClass().getSimpleName());\n        return null;\n    }\n\n    static Object make(String cls, Object... args) {\n        try {\n            for (java.lang.reflect.Constructor<?> c : Class.forName(cls).getConstructors()) {\n                if (c.getParameterCount() == args.length) {\n                    try {\n                        return c.newInstance(args);\n                    } catch (IllegalArgumentException e) {\n                        continue;\n                    }\n                }\n            }\n        } catch (java.lang.reflect.InvocationTargetException e) {\n            throw new RuntimeException(e.getCause());\n        } catch (ReflectiveOperationException e) {\n            Check.isTrue(false, \"Cannot create \" + cls + \": \" + e);\n        }\n        Check.isTrue(false, \"No public constructor \" + cls + \" with \" + args.length + \" parameter(s)\");\n        return null;\n    }\n\n    static String out(Runnable r) {\n        java.io.PrintStream old = System.out;\n        java.io.ByteArrayOutputStream b = new java.io.ByteArrayOutputStream();\n        System.setOut(new java.io.PrintStream(b));\n        try {\n            r.run();\n        } finally {\n            System.setOut(old);\n        }\n        return b.toString().trim().replace(\"\\r\", \"\");\n    }\n\n    static java.lang.reflect.Field field(String cls, String name) {\n        try {\n            return Class.forName(cls).getDeclaredField(name);\n        } catch (ReflectiveOperationException e) {\n            return null;\n        }\n    }\n\n    static java.lang.reflect.Method declared(String cls, String name, Class<?>... params) {\n        try {\n            return Class.forName(cls).getDeclaredMethod(name, params);\n        } catch (ReflectiveOperationException e) {\n            return null;\n        }\n    }\n\n    static int mod(java.lang.reflect.Member m) {\n        return m.getModifiers();\n    }\n\n}\n", readOnly: true },
    ],
    mainClass: "Arena",
    testClass: "HeroTest",
    testLabels: {
      test1_twoHeals: "Two heal methods (overloaded)",
      test2_healToFull: "heal() heals to full",
      test3_healAmountStillWorks: "heal(int) still works",
      test4_shortConstructor: "Hero(String) uses this(name, 100)",
    },
    solution: "QF-206/Hero",
    hints: [
      "heal(): `hp = maxHp;`",
      "`public Hero(String name) { this(name, 100); }` (this(...) must be the first statement).",
    ],
  },
};

const qf207: Ticket = {
  id: "QF-207",
  slug: "has-a-weapon",
  title: "A hero has a weapon: has-a vs is-a",
  xp: 140,
  learningGoal: {
    level: "medium",
    goal: "Model a has-a relationship with a field, write a small class with private fields, and tell is-a from has-a.",
    techniques: ["has-a = a field of another class", "is-a = a kind of (inheritance, next ticket)", "Designing a small class", "null for \"nothing yet\""],
  },
  briefing: `Heroes need **weapons**. Before writing code, the team has to decide how a weapon relates to a hero, because that decision shapes everything after it.`,
  objectives: [
    "Write a Weapon class with private fields, a constructor and getters",
    "Give Hero a Weapon field and an equip method",
    "Describe relationships as is-a or has-a",
    "Choose between a field and inheritance",
  ],
  blocks: [
    { type: "step", title: "Two kinds of relationship", focus: "read" },
    {
      type: "markdown",
      md: `- **has-a**: a hero *has a* weapon. The weapon is a separate thing that the hero holds; it can be swapped, dropped or shared. In Java: a **field**: \`private Weapon weapon;\`.
- **is-a**: a warrior *is a* hero, a special kind of hero. In Java: **inheritance** (\`extends\`), which starts in the next ticket.

A quick test: say the sentence out loud. "A hero **is a** weapon" sounds wrong; "a hero **has a** weapon" sounds right.`,
    },
    { type: "step", title: "Checkpoint: is-a or has-a?", focus: "read" },
    {
      type: "predict",
      id: "qf207-q1",
      question: "Car and Engine:",
      options: ["Car is-a Engine", "Car has-a Engine", "Engine is-a Car"],
      answer: 1,
      explain: "An engine is a part the car holds: a field `private Engine engine;`.",
    },
    {
      type: "predict",
      id: "qf207-q2",
      question: "Mage and Hero (in our game):",
      options: ["Mage is-a Hero", "Mage has-a Hero", "Neither"],
      answer: 0,
      explain: "A mage is a special kind of hero: it can do everything a hero can, plus more. That is inheritance.",
    },
    {
      type: "predict",
      id: "qf207-q3",
      question: "Party and Hero (a party is a group of heroes):",
      options: ["Party is-a Hero", "Party has-a list of Heroes", "Hero is-a Party"],
      answer: 1,
      explain: "A party is not itself a hero; it holds heroes, e.g. `private ArrayList<Hero> members;`.",
    },
    {
      type: "predict",
      id: "qf207-q4",
      question: "Student and Person, at a school:",
      options: ["Student is-a Person", "Student has-a Person", "Person is-a Student"],
      answer: 0,
      explain: "Every student is a person (but not every person is a student), so Student could extend Person.",
    },
    {
      type: "predict",
      id: "qf207-q5",
      question: "Someone writes  class Hero extends Weapon  \"so Hero gets getPower()\". Good idea?",
      options: [
        "Yes, it saves code",
        "No: a hero is not a kind of weapon. Inheritance only for real is-a; reuse through a field (has-a) instead",
      ],
      answer: 1,
      explain: "Inheriting just to reuse methods creates nonsense (can you equip a hero onto another hero?) and ties the classes together. A has-a field gives the hero a weapon's power without pretending it is one.",
    },
    { type: "step", title: "Give heroes weapons", focus: "build" },
    {
      type: "markdown",
      md: `1. **Weapon.java** (TODO 1–3): private fields \`name\` and \`power\`, a constructor, and the getters \`getName()\` and \`getPower()\`. Same habits as Hero: private fields, public getters.
2. **Hero.java** (TODO 4–6): \`private Weapon weapon;\` (\`null\` means no weapon yet), \`equip(Weapon w)\`, \`getWeapon()\`, and \`calculateDamage()\` adds the weapon's power when the hero has one.

Rebuild: two weapons lie on the field. Select Aria, choose a weapon in **equip(**…**)**, and compare **previewDamage()** before and after.`,
    },
    { type: "step", title: "Why a field?", focus: "read" },
    {
      type: "short-answer",
      id: "qf207-why",
      question: "Why is Weapon a field of Hero instead of Hero extending Weapon?",
      placeholder: "Because…",
      modelAnswer: "A hero is not a kind of weapon; it holds one (has-a). As a field, the weapon can be changed, removed (null) or shared, and Hero and Weapon stay separate. Inheritance would claim that every hero is a weapon, which is false.",
    },
  ],
  visualizations: [],
  game: {},
  task: {
    instructions: "Write the Weapon class, then give Hero a weapon field, equip() and getWeapon(), and add the weapon's power to the damage.",
    files: [
      { path: "Hero.java", content: "/** A hero in Pixel Arena. */\npublic class Hero {\n    public static final int MAX_LEVEL = 99;\n    private static int heroCount = 0;\n\n    private String name;\n    private int hp;\n    private int maxHp;\n    private int level;\n    // TODO 4: a hero HAS A weapon: add  private Weapon weapon;  (null = no weapon)\n\n    public Hero(String name, int maxHp) {\n        this.name = name;\n        this.maxHp = maxHp;\n        this.hp = maxHp;\n        this.level = 1;\n        heroCount++;\n    }\n\n    public Hero(String name) {\n        this(name, 100);\n    }\n\n    public static int getHeroCount() {\n        return heroCount;\n    }\n\n    public String getName() {\n        return name;\n    }\n\n    public int getHp() {\n        return hp;\n    }\n\n    public int getMaxHp() {\n        return maxHp;\n    }\n\n    public int getLevel() {\n        return level;\n    }\n\n    public void setLevel(int newLevel) {\n        if (newLevel >= 1 && newLevel <= MAX_LEVEL) {\n            level = newLevel;\n        }\n    }\n\n    public void takeDamage(int amount) {\n        if (amount < 0) {\n            return;\n        }\n        hp = clampHp(hp - amount);\n    }\n\n    public void heal(int amount) {\n        if (amount < 0) {\n            return;\n        }\n        hp = clampHp(hp + amount);\n    }\n\n    public void attack(Hero target) {\n        int damage = calculateDamage();\n        System.out.println(name + \" attacks \" + target.getName() + \" for \" + damage + \"!\");\n        target.takeDamage(damage);\n    }\n\n    /** Shown in the game's attack preview. */\n    public int previewDamage() {\n        return calculateDamage();\n    }\n\n    public void heal() {\n        hp = maxHp;\n    }\n\n    public String getHpBar() {\n        int filled = hp * 10 / maxHp;\n        String bar = \"\";\n        for (int i = 0; i < 10; i++) {\n            if (i < filled) {\n                bar += \"#\";\n            } else {\n                bar += \"-\";\n            }\n        }\n        return \"[\" + bar + \"] \" + hp + \"/\" + maxHp;\n    }\n\n    private int clampHp(int value) {\n        if (value < 0) {\n            return 0;\n        }\n        if (value > maxHp) {\n            return maxHp;\n        }\n        return value;\n    }\n\n    // TODO 5: public void equip(Weapon w)  and  public Weapon getWeapon()\n\n    private int calculateDamage() {\n        // TODO 6: if the hero has a weapon, add the weapon's power\n        return 6 + level * 3;\n    }\n}\n" },
      { path: "Weapon.java", content: "/** A weapon a hero can equip. */\npublic class Weapon {\n    // TODO 1: private fields  name (String)  and  power (int)\n\n    public Weapon(String name, int power) {\n        // TODO 2: store the parameters\n    }\n\n    // TODO 3: public String getName()  and  public int getPower()\n}\n" },
      { path: "Arena.java", content: "import java.util.ArrayList;\nimport java.util.List;\n\n/** Creates the characters you see in the game, and a small main for \u25b6 Run main. (Read-only.) */\npublic class Arena {\n    public static List<Object> setup() {\n        List<Object> world = new ArrayList<Object>();\n        world.add(new Hero(\"Aria\", 100));\n        world.add(new Hero(\"Bram\", 80));\n        world.add(new Weapon(\"Wooden sword\", 3));\n        world.add(new Weapon(\"Fire staff\", 7));\n        return world;\n    }\n\n    public static void main(String[] args) {\n        Hero aria = new Hero(\"Aria\", 100);\n        Weapon sword = new Weapon(\"Wooden sword\", 3);\n        System.out.println(\"Aria's attack would deal \" + aria.previewDamage());\n    }\n}\n", readOnly: true },
      { path: "WeaponTest.java", content: "import tutor.Check;\n\npublic class WeaponTest {\n    static void test1_weaponFields() {\n        java.lang.reflect.Field n = field(\"Weapon\", \"name\"), p = field(\"Weapon\", \"power\");\n        Check.isTrue(n != null && p != null, \"Weapon needs the fields name and power\");\n        Check.isTrue(java.lang.reflect.Modifier.isPrivate(mod(n)) && java.lang.reflect.Modifier.isPrivate(mod(p)), \"keep Weapon's fields private too\");\n    }\n\n    static void test2_weaponGetters() {\n        Weapon w = new Weapon(\"Fire staff\", 7);\n        Check.equal(\"Fire staff\", call(w, \"getName\"), \"getName()\");\n        Check.equal(7, call(w, \"getPower\"), \"getPower()\");\n    }\n\n    static void test3_heroHasAWeapon() {\n        java.lang.reflect.Field f = field(\"Hero\", \"weapon\");\n        Check.isTrue(f != null && f.getType() == Weapon.class, \"Hero needs a field  private Weapon weapon\");\n        Check.isTrue(java.lang.reflect.Modifier.isPrivate(mod(f)), \"the weapon field should be private\");\n        Hero a = new Hero(\"Aria\", 100);\n        Check.isTrue(call(a, \"getWeapon\") == null, \"a new hero has no weapon (null)\");\n    }\n\n    static void test4_equipAddsPower() {\n        Hero a = new Hero(\"Aria\", 100);\n        Check.equal(9, a.previewDamage(), \"no weapon: 9\");\n        Weapon w = new Weapon(\"Fire staff\", 7);\n        call(a, \"equip\", w);\n        Check.isTrue(call(a, \"getWeapon\") == w, \"getWeapon() returns the equipped weapon\");\n        Check.equal(16, a.previewDamage(), \"with a power-7 weapon: 9 + 7 = 16\");\n    }\n\n\n    // ---- helpers: tests call new methods by name, so this file compiles before you write them ----\n    static Object call(Object target, String name, Object... args) {\n        for (java.lang.reflect.Method m : target.getClass().getMethods()) {\n            if (m.getName().equals(name) && m.getParameterCount() == args.length) {\n                try {\n                    return m.invoke(target, args);\n                } catch (java.lang.reflect.InvocationTargetException e) {\n                    throw new RuntimeException(e.getCause());\n                } catch (IllegalAccessException | IllegalArgumentException e) {\n                    continue;\n                }\n            }\n        }\n        Check.isTrue(false, \"No public method \" + name + \" with \" + args.length + \" parameter(s) in \" + target.getClass().getSimpleName());\n        return null;\n    }\n\n    static Object make(String cls, Object... args) {\n        try {\n            for (java.lang.reflect.Constructor<?> c : Class.forName(cls).getConstructors()) {\n                if (c.getParameterCount() == args.length) {\n                    try {\n                        return c.newInstance(args);\n                    } catch (IllegalArgumentException e) {\n                        continue;\n                    }\n                }\n            }\n        } catch (java.lang.reflect.InvocationTargetException e) {\n            throw new RuntimeException(e.getCause());\n        } catch (ReflectiveOperationException e) {\n            Check.isTrue(false, \"Cannot create \" + cls + \": \" + e);\n        }\n        Check.isTrue(false, \"No public constructor \" + cls + \" with \" + args.length + \" parameter(s)\");\n        return null;\n    }\n\n    static String out(Runnable r) {\n        java.io.PrintStream old = System.out;\n        java.io.ByteArrayOutputStream b = new java.io.ByteArrayOutputStream();\n        System.setOut(new java.io.PrintStream(b));\n        try {\n            r.run();\n        } finally {\n            System.setOut(old);\n        }\n        return b.toString().trim().replace(\"\\r\", \"\");\n    }\n\n    static java.lang.reflect.Field field(String cls, String name) {\n        try {\n            return Class.forName(cls).getDeclaredField(name);\n        } catch (ReflectiveOperationException e) {\n            return null;\n        }\n    }\n\n    static java.lang.reflect.Method declared(String cls, String name, Class<?>... params) {\n        try {\n            return Class.forName(cls).getDeclaredMethod(name, params);\n        } catch (ReflectiveOperationException e) {\n            return null;\n        }\n    }\n\n    static int mod(java.lang.reflect.Member m) {\n        return m.getModifiers();\n    }\n\n}\n", readOnly: true },
    ],
    mainClass: "Arena",
    testClass: "WeaponTest",
    testLabels: {
      test1_weaponFields: "Weapon has private fields",
      test2_weaponGetters: "Weapon getters",
      test3_heroHasAWeapon: "Hero has a Weapon field",
      test4_equipAddsPower: "equip() adds the weapon's power",
    },
    solution: "QF-207",
    hints: [
      "Weapon looks like a tiny Hero: two private fields, a constructor that stores them, two getters.",
      "In calculateDamage: `if (weapon != null) { damage += weapon.getPower(); }` (calling a method on null would crash).",
    ],
  },
};

const qf208: Ticket = {
  id: "QF-208",
  slug: "extends-warrior",
  title: "A warrior is a hero: extends",
  xp: 150,
  learningGoal: {
    level: "medium",
    goal: "Replace a copied class with a subclass that extends Hero, and explain what a subclass inherits.",
    techniques: ["extends", "Superclass and subclass", "Inherited public methods", "Why copying a class is a trap"],
  },
  briefing: `We need **warriors**: heroes with more hp who can **roar**. A teammate made \`Warrior.java\` by copying \`Hero.java\` and renaming it. It compiles. Rebuild the game and play with Bram the warrior for a minute: something is off.`,
  objectives: [
    "Find the bugs that copying a class created",
    "Write a subclass with extends",
    "List what a subclass inherits from its superclass",
    "Explain why inheritance fits an is-a relationship",
  ],
  blocks: [
    { type: "step", title: "Play with the copied warrior", focus: "game" },
    {
      type: "markdown",
      md: `Try **heal(999)** on Bram: his hp goes far past his max. Hero fixed that bug in QF-203, but the copy was made from an old version. Bram also has no \`setLevel\`, no \`attack\`, no weapon, and he is **not counted** in \`Hero.getHeroCount()\`.

A copy is a snapshot. Every fix and every new feature in Hero has to be made twice, and nobody remembers to. And the game can't treat Bram as a hero at all: to Java, \`Warrior\` and \`Hero\` are unrelated classes.`,
    },
    { type: "step", title: "extends: a warrior is a hero", focus: "read" },
    {
      type: "markdown",
      md: `~~~java
public class Warrior extends Hero {
    public Warrior(String name) {
        super(name, 130);       // let Hero set up its own fields (next ticket explains this line)
    }

    public void roar() {        // the only thing that is new
        System.out.println(getName() + " roars!");
        heal(5);
    }
}
~~~

- \`Hero\` is the **superclass**, \`Warrior\` the **subclass**.
- Warrior **inherits** every public method of Hero: \`getHp\`, \`takeDamage\`, \`heal\`, \`attack\`, \`equip\`… without a single copied line. Fix Hero, and Warrior is fixed too.
- Warrior only writes **what is different**.
- Every Warrior **is a** Hero: it can go anywhere a Hero is expected.`,
    },
    {
      type: "predict",
      id: "qf208-private",
      question: "Inside Warrior's roar(), a teammate writes  System.out.println(name + \" roars!\");  Hero's name field is private. What happens?",
      options: [
        "It works: Warrior inherits name",
        "Compile error: name is private in Hero, so even a subclass can't use it directly. Use getName()",
        "It prints null",
      ],
      answer: 1,
      explain: "A Warrior object does contain Hero's name field, but private means only code written inside Hero can touch it. The subclass uses Hero's public methods, like everyone else. That keeps Hero's rules safe even from subclasses.",
    },
    { type: "step", title: "Rewrite Warrior with extends", focus: "build" },
    {
      type: "markdown",
      md: `Rewrite \`Warrior.java\`:

1. \`public class Warrior extends Hero\`
2. Delete **all** copied fields and methods.
3. Constructor: \`super(name, 130);\`
4. Keep \`roar()\`: print \`Bram roars!\` (use \`getName()\`) and heal 5.

Rebuild: Bram now has **every Hero button** plus **roar()**, heal is capped, and the hero count includes him. In 📐 Your classes, Warrior shows \`extends Hero\` and lists only its own method.`,
    },
    { type: "step", title: "Why extends?", focus: "read" },
    {
      type: "short-answer",
      id: "qf208-why",
      question: "Why is `extends Hero` better than copying Hero.java into Warrior.java?",
      placeholder: "With a copy…; with extends…",
      modelAnswer: "With a copy, every fix and feature in Hero must be repeated in Warrior, and the copy is already out of date (heal has no cap). Java also doesn't know a Warrior is a Hero. With extends, Warrior reuses Hero's code, gets every fix automatically, writes only what's new (roar), and can be used anywhere a Hero is expected.",
    },
  ],
  visualizations: [],
  game: {},
  task: {
    instructions: "Replace the copied Warrior with `class Warrior extends Hero` that only adds roar().",
    files: [
      { path: "Warrior.java", content: "/**\n * A warrior: a hero with more hp who can roar.\n * A teammate made it by COPYING Hero.java and renaming it. Read the lesson, then fix it with extends.\n */\npublic class Warrior {\n    private String name;\n    private int hp;\n    private int maxHp;\n    private int level;\n\n    public Warrior(String name) {\n        this.name = name;\n        this.maxHp = 130;\n        this.hp = maxHp;\n        this.level = 1;\n    }\n\n    public String getName() {\n        return name;\n    }\n\n    public int getHp() {\n        return hp;\n    }\n\n    public int getMaxHp() {\n        return maxHp;\n    }\n\n    public int getLevel() {\n        return level;\n    }\n\n    public void takeDamage(int amount) {\n        if (amount < 0) {\n            return;\n        }\n        hp = hp - amount;\n        if (hp < 0) {\n            hp = 0;\n        }\n    }\n\n    public void heal(int amount) {\n        hp = hp + amount;\n    }\n\n    public void roar() {\n        System.out.println(name + \" roars!\");\n        heal(5);\n    }\n}\n" },
      { path: "Hero.java", content: "/** A hero in Pixel Arena. */\npublic class Hero {\n    public static final int MAX_LEVEL = 99;\n    private static int heroCount = 0;\n\n    private String name;\n    private int hp;\n    private int maxHp;\n    private int level;\n    private Weapon weapon;\n\n    public Hero(String name, int maxHp) {\n        this.name = name;\n        this.maxHp = maxHp;\n        this.hp = maxHp;\n        this.level = 1;\n        heroCount++;\n    }\n\n    public Hero(String name) {\n        this(name, 100);\n    }\n\n    public static int getHeroCount() {\n        return heroCount;\n    }\n\n    public String getName() {\n        return name;\n    }\n\n    public int getHp() {\n        return hp;\n    }\n\n    public int getMaxHp() {\n        return maxHp;\n    }\n\n    public int getLevel() {\n        return level;\n    }\n\n    public void setLevel(int newLevel) {\n        if (newLevel >= 1 && newLevel <= MAX_LEVEL) {\n            level = newLevel;\n        }\n    }\n\n    public void takeDamage(int amount) {\n        if (amount < 0) {\n            return;\n        }\n        hp = clampHp(hp - amount);\n    }\n\n    public void heal(int amount) {\n        if (amount < 0) {\n            return;\n        }\n        hp = clampHp(hp + amount);\n    }\n\n    public void attack(Hero target) {\n        int damage = calculateDamage();\n        System.out.println(name + \" attacks \" + target.getName() + \" for \" + damage + \"!\");\n        target.takeDamage(damage);\n    }\n\n    /** Shown in the game's attack preview. */\n    public int previewDamage() {\n        return calculateDamage();\n    }\n\n    public void heal() {\n        hp = maxHp;\n    }\n\n    public String getHpBar() {\n        int filled = hp * 10 / maxHp;\n        String bar = \"\";\n        for (int i = 0; i < 10; i++) {\n            if (i < filled) {\n                bar += \"#\";\n            } else {\n                bar += \"-\";\n            }\n        }\n        return \"[\" + bar + \"] \" + hp + \"/\" + maxHp;\n    }\n\n    private int clampHp(int value) {\n        if (value < 0) {\n            return 0;\n        }\n        if (value > maxHp) {\n            return maxHp;\n        }\n        return value;\n    }\n\n    public void equip(Weapon w) {\n        weapon = w;\n    }\n\n    public Weapon getWeapon() {\n        return weapon;\n    }\n\n    private int calculateDamage() {\n        int damage = 6 + level * 3;\n        if (weapon != null) {\n            damage += weapon.getPower();\n        }\n        return damage;\n    }\n}\n", readOnly: true },
      { path: "Weapon.java", content: "/** A weapon a hero can equip. */\npublic class Weapon {\n    private String name;\n    private int power;\n\n    public Weapon(String name, int power) {\n        this.name = name;\n        this.power = power;\n    }\n\n    public String getName() {\n        return name;\n    }\n\n    public int getPower() {\n        return power;\n    }\n}\n", readOnly: true },
      { path: "Arena.java", content: "import java.util.ArrayList;\nimport java.util.List;\n\n/** Creates the characters you see in the game, and a small main for \u25b6 Run main. (Read-only.) */\npublic class Arena {\n    public static List<Object> setup() {\n        List<Object> world = new ArrayList<Object>();\n        world.add(new Hero(\"Aria\", 100));\n        world.add(new Warrior(\"Bram\"));\n        return world;\n    }\n\n    public static void main(String[] args) {\n        Warrior bram = new Warrior(\"Bram\");\n        bram.takeDamage(10);\n        bram.roar();\n        System.out.println(\"Bram has \" + bram.getHp() + \" HP\");\n    }\n}\n", readOnly: true },
      { path: "WarriorTest.java", content: "import tutor.Check;\n\npublic class WarriorTest {\n    static void test1_warriorIsAHero() {\n        Check.isTrue((Object) Warrior.class.getSuperclass() == Hero.class, \"Warrior should extend Hero (class header: public class Warrior extends Hero)\");\n    }\n\n    static void test2_noCopiedFields() {\n        for (String f : new String[] {\"name\", \"hp\", \"maxHp\", \"level\"}) {\n            Check.isTrue(field(\"Warrior\", f) == null, \"Warrior should not declare its own \" + f + \": every Warrior already has Hero's \" + f);\n        }\n    }\n\n    static void test3_inheritsTheRules() {\n        Object w = new Warrior(\"Bram\");\n        Check.isTrue(w instanceof Hero, \"a Warrior is a Hero\");\n        Hero h = (Hero) w;\n        Check.equal(130, h.getMaxHp(), \"a warrior has 130 max hp\");\n        h.takeDamage(10);\n        h.heal(500);\n        Check.equal(130, h.getHp(), \"heal must not go above max hp (Hero's rule is inherited; the copied heal had a bug)\");\n    }\n\n    static void test4_roar() {\n        Warrior w = new Warrior(\"Bram\");\n        ((Hero) (Object) w).takeDamage(20);\n        String said = out(() -> w.roar());\n        Check.equal(\"Bram roars!\", said, \"roar() output\");\n        Check.equal(115, ((Hero) (Object) w).getHp(), \"roar() heals 5: 130 - 20 + 5 = 115\");\n    }\n\n    static void test5_countedAsHero() {\n        int before = Hero.getHeroCount();\n        new Warrior(\"X\");\n        Check.equal(before + 1, Hero.getHeroCount(), \"creating a Warrior also runs Hero's constructor, so it is counted\");\n    }\n\n\n    // ---- helpers: tests call new methods by name, so this file compiles before you write them ----\n    static Object call(Object target, String name, Object... args) {\n        for (java.lang.reflect.Method m : target.getClass().getMethods()) {\n            if (m.getName().equals(name) && m.getParameterCount() == args.length) {\n                try {\n                    return m.invoke(target, args);\n                } catch (java.lang.reflect.InvocationTargetException e) {\n                    throw new RuntimeException(e.getCause());\n                } catch (IllegalAccessException | IllegalArgumentException e) {\n                    continue;\n                }\n            }\n        }\n        Check.isTrue(false, \"No public method \" + name + \" with \" + args.length + \" parameter(s) in \" + target.getClass().getSimpleName());\n        return null;\n    }\n\n    static Object make(String cls, Object... args) {\n        try {\n            for (java.lang.reflect.Constructor<?> c : Class.forName(cls).getConstructors()) {\n                if (c.getParameterCount() == args.length) {\n                    try {\n                        return c.newInstance(args);\n                    } catch (IllegalArgumentException e) {\n                        continue;\n                    }\n                }\n            }\n        } catch (java.lang.reflect.InvocationTargetException e) {\n            throw new RuntimeException(e.getCause());\n        } catch (ReflectiveOperationException e) {\n            Check.isTrue(false, \"Cannot create \" + cls + \": \" + e);\n        }\n        Check.isTrue(false, \"No public constructor \" + cls + \" with \" + args.length + \" parameter(s)\");\n        return null;\n    }\n\n    static String out(Runnable r) {\n        java.io.PrintStream old = System.out;\n        java.io.ByteArrayOutputStream b = new java.io.ByteArrayOutputStream();\n        System.setOut(new java.io.PrintStream(b));\n        try {\n            r.run();\n        } finally {\n            System.setOut(old);\n        }\n        return b.toString().trim().replace(\"\\r\", \"\");\n    }\n\n    static java.lang.reflect.Field field(String cls, String name) {\n        try {\n            return Class.forName(cls).getDeclaredField(name);\n        } catch (ReflectiveOperationException e) {\n            return null;\n        }\n    }\n\n    static java.lang.reflect.Method declared(String cls, String name, Class<?>... params) {\n        try {\n            return Class.forName(cls).getDeclaredMethod(name, params);\n        } catch (ReflectiveOperationException e) {\n            return null;\n        }\n    }\n\n    static int mod(java.lang.reflect.Member m) {\n        return m.getModifiers();\n    }\n\n}\n", readOnly: true },
    ],
    mainClass: "Arena",
    testClass: "WarriorTest",
    testLabels: {
      test1_warriorIsAHero: "Warrior extends Hero",
      test2_noCopiedFields: "No copied fields",
      test3_inheritsTheRules: "Inherits Hero's rules",
      test4_roar: "roar()",
      test5_countedAsHero: "Counted as a hero",
    },
    solution: "QF-208/Warrior",
    hints: [
      "The whole class is about ten lines: the class header with extends, a constructor calling super(name, 130), and roar().",
      "In roar(), use `getName()`, because Hero's name field is private.",
    ],
  },
};

const qf209: Ticket = {
  id: "QF-209",
  slug: "constructors-super",
  title: "Building a mage: constructors and super(...)",
  xp: 140,
  learningGoal: {
    level: "medium",
    goal: "Write a subclass constructor that passes values to the superclass constructor with super(...) and then sets its own fields.",
    techniques: ["super(...) call", "Constructor chaining", "super must be first", "Subclass fields"],
  },
  briefing: `Next class: **Mage**, a hero with only **70 max hp** but **50 mana**. The starter compiles, but Cara the mage has 100 hp and 0 mana. Constructors work a bit differently in subclasses. Let's see how.`,
  objectives: [
    "Explain why a subclass constructor must call a superclass constructor",
    "Choose which superclass constructor to call with super(...)",
    "Set the subclass's own fields after super(...)",
    "Explain why the subclass can't simply set maxHp itself",
  ],
  blocks: [
    { type: "step", title: "Who builds which part?", focus: "read" },
    {
      type: "markdown",
      md: `A Mage object has two parts: the **Hero part** (name, hp, maxHp, level, weapon) and the **Mage part** (mana). The Hero part's fields are private to Hero, so **only Hero's constructor can set them up**.

That's why the first thing every subclass constructor does is call a superclass constructor with \`super(...)\`:

~~~java
public Mage(String name) {
    super(name, 70);     // 1. Hero builds the Hero part (and counts the hero)
    mana = 50;           // 2. then Mage sets up its own part
}
~~~

The arguments choose **which** Hero constructor runs, just like overloading: \`super(name)\` runs \`Hero(String)\` (100 hp); \`super(name, 70)\` runs \`Hero(String, int)\`.`,
    },
    { type: "step", title: "Predict", focus: "read" },
    {
      type: "predict",
      id: "qf209-maxhp",
      question: "Why not keep super(name) and then write  maxHp = 70;  in Mage's constructor?",
      options: [
        "That would work fine",
        "maxHp is private in Hero, so Mage can't assign it; Hero must receive 70 through its constructor",
        "Because maxHp is static",
      ],
      answer: 1,
      explain: "Private fields belong to Hero's code only. The subclass hands the value to Hero's constructor, which applies Hero's own setup (hp = maxHp, the hero counter…).",
    },
    {
      type: "predict",
      id: "qf209-order",
      question: "What happens with this constructor?",
      code: `public Mage(String name) {
    mana = 50;
    super(name, 70);
}`,
      options: ["It works the same", "Compile error: super(...) must be the first statement in the constructor", "Mana ends up 0"],
      answer: 1,
      explain: "The Hero part must be built before anything else in the object runs. If you don't write super(...) at all, Java inserts super() (with no arguments) for you, and that only compiles if Hero has a no-argument constructor. Ours doesn't.",
    },
    { type: "step", title: "Fix the mage's constructor", focus: "build" },
    {
      type: "markdown",
      md: `In \`Mage.java\`: call the right Hero constructor so a mage has **70 max hp**, then set **mana to 50**.

Rebuild: Cara has a shorter hp bar and a **mana** field. Check the top bar: the hero count went up by one, not two, because only one Hero constructor ran for Cara.`,
    },
  ],
  visualizations: [],
  game: {},
  task: {
    instructions: "Fix Mage's constructor: super(name, 70), then mana = 50.",
    files: [
      { path: "Mage.java", content: "/** A mage: a hero with less hp who has mana. */\npublic class Mage extends Hero {\n    private int mana;\n\n    public Mage(String name) {\n        super(name);\n        // TODO: a mage has 70 max hp (not 100) and starts with 50 mana.\n    }\n\n    public int getMana() {\n        return mana;\n    }\n}\n" },
      { path: "Hero.java", content: "/** A hero in Pixel Arena. */\npublic class Hero {\n    public static final int MAX_LEVEL = 99;\n    private static int heroCount = 0;\n\n    private String name;\n    private int hp;\n    private int maxHp;\n    private int level;\n    private Weapon weapon;\n\n    public Hero(String name, int maxHp) {\n        this.name = name;\n        this.maxHp = maxHp;\n        this.hp = maxHp;\n        this.level = 1;\n        heroCount++;\n    }\n\n    public Hero(String name) {\n        this(name, 100);\n    }\n\n    public static int getHeroCount() {\n        return heroCount;\n    }\n\n    public String getName() {\n        return name;\n    }\n\n    public int getHp() {\n        return hp;\n    }\n\n    public int getMaxHp() {\n        return maxHp;\n    }\n\n    public int getLevel() {\n        return level;\n    }\n\n    public void setLevel(int newLevel) {\n        if (newLevel >= 1 && newLevel <= MAX_LEVEL) {\n            level = newLevel;\n        }\n    }\n\n    public void takeDamage(int amount) {\n        if (amount < 0) {\n            return;\n        }\n        hp = clampHp(hp - amount);\n    }\n\n    public void heal(int amount) {\n        if (amount < 0) {\n            return;\n        }\n        hp = clampHp(hp + amount);\n    }\n\n    public void attack(Hero target) {\n        int damage = calculateDamage();\n        System.out.println(name + \" attacks \" + target.getName() + \" for \" + damage + \"!\");\n        target.takeDamage(damage);\n    }\n\n    /** Shown in the game's attack preview. */\n    public int previewDamage() {\n        return calculateDamage();\n    }\n\n    public void heal() {\n        hp = maxHp;\n    }\n\n    public String getHpBar() {\n        int filled = hp * 10 / maxHp;\n        String bar = \"\";\n        for (int i = 0; i < 10; i++) {\n            if (i < filled) {\n                bar += \"#\";\n            } else {\n                bar += \"-\";\n            }\n        }\n        return \"[\" + bar + \"] \" + hp + \"/\" + maxHp;\n    }\n\n    private int clampHp(int value) {\n        if (value < 0) {\n            return 0;\n        }\n        if (value > maxHp) {\n            return maxHp;\n        }\n        return value;\n    }\n\n    public void equip(Weapon w) {\n        weapon = w;\n    }\n\n    public Weapon getWeapon() {\n        return weapon;\n    }\n\n    private int calculateDamage() {\n        int damage = 6 + level * 3;\n        if (weapon != null) {\n            damage += weapon.getPower();\n        }\n        return damage;\n    }\n}\n", readOnly: true },
      { path: "Weapon.java", content: "/** A weapon a hero can equip. */\npublic class Weapon {\n    private String name;\n    private int power;\n\n    public Weapon(String name, int power) {\n        this.name = name;\n        this.power = power;\n    }\n\n    public String getName() {\n        return name;\n    }\n\n    public int getPower() {\n        return power;\n    }\n}\n", readOnly: true },
      { path: "Warrior.java", content: "/** A warrior: a hero with more hp who can roar. */\npublic class Warrior extends Hero {\n\n    public Warrior(String name) {\n        super(name, 130);\n    }\n\n    public void roar() {\n        System.out.println(getName() + \" roars!\");\n        heal(5);\n    }\n}\n", readOnly: true },
      { path: "Arena.java", content: "import java.util.ArrayList;\nimport java.util.List;\n\n/** Creates the characters you see in the game, and a small main for \u25b6 Run main. (Read-only.) */\npublic class Arena {\n    public static List<Object> setup() {\n        List<Object> world = new ArrayList<Object>();\n        world.add(new Hero(\"Aria\", 100));\n        world.add(new Warrior(\"Bram\"));\n        world.add(new Mage(\"Cara\"));\n        return world;\n    }\n\n    public static void main(String[] args) {\n        Mage cara = new Mage(\"Cara\");\n        System.out.println(cara.getName() + \": \" + cara.getHp() + \"/\" + cara.getMaxHp() + \" HP, \" + cara.getMana() + \" mana\");\n    }\n}\n", readOnly: true },
      { path: "MageTest.java", content: "import tutor.Check;\n\npublic class MageTest {\n    static void test1_mageIsAHero() {\n        Check.isTrue((Object) Mage.class.getSuperclass() == Hero.class, \"Mage extends Hero\");\n    }\n\n    static void test2_maxHp() {\n        Mage m = new Mage(\"Cara\");\n        Check.equal(70, m.getMaxHp(), \"a mage has 70 max hp: pass it to Hero's constructor with super(name, 70)\");\n        Check.equal(70, m.getHp(), \"...and starts with full hp\");\n        Check.equal(\"Cara\", m.getName(), \"the name is set by Hero's constructor\");\n    }\n\n    static void test3_mana() {\n        Check.equal(50, new Mage(\"Cara\").getMana(), \"a mage starts with 50 mana\");\n    }\n\n    static void test4_countedOnce() {\n        int before = Hero.getHeroCount();\n        new Mage(\"X\");\n        Check.equal(before + 1, Hero.getHeroCount(), \"one Mage = one Hero constructor run = counted once\");\n    }\n\n\n    // ---- helpers: tests call new methods by name, so this file compiles before you write them ----\n    static Object call(Object target, String name, Object... args) {\n        for (java.lang.reflect.Method m : target.getClass().getMethods()) {\n            if (m.getName().equals(name) && m.getParameterCount() == args.length) {\n                try {\n                    return m.invoke(target, args);\n                } catch (java.lang.reflect.InvocationTargetException e) {\n                    throw new RuntimeException(e.getCause());\n                } catch (IllegalAccessException | IllegalArgumentException e) {\n                    continue;\n                }\n            }\n        }\n        Check.isTrue(false, \"No public method \" + name + \" with \" + args.length + \" parameter(s) in \" + target.getClass().getSimpleName());\n        return null;\n    }\n\n    static Object make(String cls, Object... args) {\n        try {\n            for (java.lang.reflect.Constructor<?> c : Class.forName(cls).getConstructors()) {\n                if (c.getParameterCount() == args.length) {\n                    try {\n                        return c.newInstance(args);\n                    } catch (IllegalArgumentException e) {\n                        continue;\n                    }\n                }\n            }\n        } catch (java.lang.reflect.InvocationTargetException e) {\n            throw new RuntimeException(e.getCause());\n        } catch (ReflectiveOperationException e) {\n            Check.isTrue(false, \"Cannot create \" + cls + \": \" + e);\n        }\n        Check.isTrue(false, \"No public constructor \" + cls + \" with \" + args.length + \" parameter(s)\");\n        return null;\n    }\n\n    static String out(Runnable r) {\n        java.io.PrintStream old = System.out;\n        java.io.ByteArrayOutputStream b = new java.io.ByteArrayOutputStream();\n        System.setOut(new java.io.PrintStream(b));\n        try {\n            r.run();\n        } finally {\n            System.setOut(old);\n        }\n        return b.toString().trim().replace(\"\\r\", \"\");\n    }\n\n    static java.lang.reflect.Field field(String cls, String name) {\n        try {\n            return Class.forName(cls).getDeclaredField(name);\n        } catch (ReflectiveOperationException e) {\n            return null;\n        }\n    }\n\n    static java.lang.reflect.Method declared(String cls, String name, Class<?>... params) {\n        try {\n            return Class.forName(cls).getDeclaredMethod(name, params);\n        } catch (ReflectiveOperationException e) {\n            return null;\n        }\n    }\n\n    static int mod(java.lang.reflect.Member m) {\n        return m.getModifiers();\n    }\n\n}\n", readOnly: true },
    ],
    mainClass: "Arena",
    testClass: "MageTest",
    testLabels: {
      test1_mageIsAHero: "Mage extends Hero",
      test2_maxHp: "super(name, 70)",
      test3_mana: "Starts with 50 mana",
      test4_countedOnce: "Counted once",
    },
    solution: "QF-209/Mage",
    hints: [
      "Replace `super(name);` with `super(name, 70);`",
      "After the super line: `mana = 50;`",
    ],
  },
};

const qf210: Ticket = {
  id: "QF-210",
  slug: "overriding-battle-cry",
  title: "Your own battle cry: overriding",
  xp: 170,
  learningGoal: {
    level: "medium",
    goal: "Override a superclass method to change one behavior, use @Override, and tell overriding from overloading.",
    techniques: ["Overriding", "@Override", "Overloading vs overriding", "Same signature rule"],
  },
  briefing: `Hero got an update from the team: every attack now starts with a **battle cry**, \`getBattleCry()\`, which returns \`"Hyah!"\`. Warriors want their **own** cry: you get to write it. And the mage's spell attack has a bug: in the game the mage still attacks like a normal hero.`,
  objectives: [
    "Override getBattleCry() in Warrior with your own battle cry",
    "Explain why the inherited attack() now shouts your cry",
    "Find the overload-instead-of-override bug in Mage",
    "Use @Override so the compiler catches that bug",
  ],
  blocks: [
    { type: "step", title: "Replacing one behavior", focus: "read" },
    {
      type: "markdown",
      md: `Look at Hero's (read-only) \`attack\`:

~~~java
public void attack(Hero target) {
    System.out.println(getName() + ": " + getBattleCry());
    ...
}
~~~

If Warrior writes a method with **exactly the same name and parameters**, its version **replaces** Hero's for warriors. This is **overriding**:

~~~java
@Override
public String getBattleCry() {
    return "For the guild!";     // write your own!
}
~~~

You don't touch \`attack\` at all. Hero's attack calls \`getBattleCry()\`, and for a warrior that call runs **Warrior's** version. Java always looks at the actual object first.

You've used this already: \`ArrayList\` overrides \`toString()\`, which is why \`System.out.println(list)\` prints \`[1, 2, 3]\` instead of something like \`java.util.ArrayList@1b6d3586\`.`,
    },
    { type: "step", title: "The mage bug", focus: "game" },
    {
      type: "markdown",
      md: `Mage has \`attack(Hero target, int power)\`. Rebuild the game: Cara now has **two** attack buttons, \`attack(Hero)\` and \`attack(Hero, int)\`. The game, and the rest of our code, calls \`attack(Hero)\`, which is still Hero's.`,
    },
    {
      type: "predict",
      id: "qf210-overload",
      question: "Why doesn't Mage's attack(Hero target, int power) replace Hero's attack(Hero target)?",
      options: [
        "Mage forgot to call super",
        "The parameter lists differ, so it is a new overloaded method next to Hero's, not an override",
        "Mage methods can't be called from the game",
      ],
      answer: 1,
      explain: "Override = same name **and** same parameters, so it replaces. Overload = same name, different parameters, so it is an extra method. The extra `int power` parameter isn't even used.",
    },
    { type: "step", title: "@Override", focus: "read" },
    {
      type: "markdown",
      md: `Put \`@Override\` on the buggy method and the compiler immediately says *"The method attack(Hero, int) of type Mage must override or implement a supertype method"*. \`@Override\` changes nothing when it's correct; it **catches** this exact mistake. Use it every time you mean to override.

| | Overloading | Overriding |
|---|---|---|
| Where | same class (or subclass) | subclass |
| Name | same | same |
| Parameters | **different** | **same** |
| Result | an extra method | replaces the inherited one |
| Example | \`heal()\` / \`heal(int)\` | Warrior's \`getBattleCry()\` |`,
    },
    { type: "step", title: "Your battle cry and the spell fix", focus: "build" },
    {
      type: "markdown",
      md: `1. **Warrior.java TODO 1**: override \`getBattleCry()\` with your own cry (anything but \`"Hyah!"\`).
2. **Mage.java TODO 2**: add \`@Override\`, read the compiler error, then fix the parameter list so it overrides \`attack(Hero target)\`.

Rebuild and press **attack** with Bram: his speech bubble shows **your** cry. Cara's spell costs 10 mana and hits twice as hard; when she runs out of mana she says so. In 📐 Your classes, overriding methods are tagged **overrides**.`,
    },
    { type: "step", title: "Why does attack shout it?", focus: "read" },
    {
      type: "short-answer",
      id: "qf210-why",
      question: "Warrior only overrides getBattleCry(), yet Bram's attack shouts the new cry. Why?",
      placeholder: "Because…",
      modelAnswer: "Hero's attack calls getBattleCry(). When the object is a Warrior, Java runs the Warrior's version of getBattleCry(), the one closest to the actual object. So the inherited attack uses the overridden cry.",
    },
  ],
  visualizations: [],
  game: {},
  task: {
    instructions: "Give the Warrior your own battle cry by overriding getBattleCry(), and fix Mage's attack so it really overrides Hero's.",
    files: [
      { path: "Warrior.java", content: "/** A warrior: a hero with more hp who can roar. */\npublic class Warrior extends Hero {\n\n    public Warrior(String name) {\n        super(name, 130);\n    }\n\n    // TODO 1: override getBattleCry() so the warrior shouts YOUR battle cry (anything but \"Hyah!\")\n\n    public void roar() {\n        System.out.println(getName() + \" roars!\");\n        heal(5);\n    }\n}\n" },
      { path: "Mage.java", content: "/** A mage: a hero with less hp who has mana. */\npublic class Mage extends Hero {\n    private int mana;\n\n    public Mage(String name) {\n        super(name, 70);\n        mana = 50;\n    }\n\n    public int getMana() {\n        return mana;\n    }\n\n    /**\n     * \ud83d\udc1b A teammate wrote the mage's spell attack, but in the game the mage still attacks like a normal hero.\n     * TODO 2: find out why (lesson), fix it so it really replaces Hero's attack, and add @Override.\n     */\n    public void attack(Hero target, int power) {\n        if (mana < 10) {\n            System.out.println(getName() + \" is out of mana!\");\n            return;\n        }\n        mana = mana - 10;\n        System.out.println(getName() + \": \" + getBattleCry());\n        int damage = previewDamage() * 2;\n        System.out.println(getName() + \" casts a spell on \" + target.getName() + \" for \" + damage + \"!\");\n        target.takeDamage(damage);\n    }\n}\n" },
      { path: "Hero.java", content: "/** A hero in Pixel Arena. */\npublic class Hero {\n    public static final int MAX_LEVEL = 99;\n    private static int heroCount = 0;\n\n    private String name;\n    private int hp;\n    private int maxHp;\n    private int level;\n    private Weapon weapon;\n\n    public Hero(String name, int maxHp) {\n        this.name = name;\n        this.maxHp = maxHp;\n        this.hp = maxHp;\n        this.level = 1;\n        heroCount++;\n    }\n\n    public Hero(String name) {\n        this(name, 100);\n    }\n\n    public static int getHeroCount() {\n        return heroCount;\n    }\n\n    public String getName() {\n        return name;\n    }\n\n    public int getHp() {\n        return hp;\n    }\n\n    public int getMaxHp() {\n        return maxHp;\n    }\n\n    public int getLevel() {\n        return level;\n    }\n\n    public void setLevel(int newLevel) {\n        if (newLevel >= 1 && newLevel <= MAX_LEVEL) {\n            level = newLevel;\n        }\n    }\n\n    public void takeDamage(int amount) {\n        if (amount < 0) {\n            return;\n        }\n        hp = clampHp(hp - amount);\n    }\n\n    public void heal(int amount) {\n        if (amount < 0) {\n            return;\n        }\n        hp = clampHp(hp + amount);\n    }\n\n    /** What this hero shouts when attacking. Subclasses can override it. */\n    public String getBattleCry() {\n        return \"Hyah!\";\n    }\n\n    public void attack(Hero target) {\n        System.out.println(name + \": \" + getBattleCry());\n        int damage = calculateDamage();\n        System.out.println(name + \" hits \" + target.getName() + \" for \" + damage + \"!\");\n        target.takeDamage(damage);\n    }\n\n    /** Shown in the game's attack preview. */\n    public int previewDamage() {\n        return calculateDamage();\n    }\n\n    public void heal() {\n        hp = maxHp;\n    }\n\n    public String getHpBar() {\n        int filled = hp * 10 / maxHp;\n        String bar = \"\";\n        for (int i = 0; i < 10; i++) {\n            if (i < filled) {\n                bar += \"#\";\n            } else {\n                bar += \"-\";\n            }\n        }\n        return \"[\" + bar + \"] \" + hp + \"/\" + maxHp;\n    }\n\n    @Override\n    public String toString() {\n        return name + \" (Lv \" + level + \", \" + hp + \"/\" + maxHp + \" HP)\";\n    }\n\n    private int clampHp(int value) {\n        if (value < 0) {\n            return 0;\n        }\n        if (value > maxHp) {\n            return maxHp;\n        }\n        return value;\n    }\n\n    public void equip(Weapon w) {\n        weapon = w;\n    }\n\n    public Weapon getWeapon() {\n        return weapon;\n    }\n\n    private int calculateDamage() {\n        int damage = 6 + level * 3;\n        if (weapon != null) {\n            damage += weapon.getPower();\n        }\n        return damage;\n    }\n}\n", readOnly: true },
      { path: "Weapon.java", content: "/** A weapon a hero can equip. */\npublic class Weapon {\n    private String name;\n    private int power;\n\n    public Weapon(String name, int power) {\n        this.name = name;\n        this.power = power;\n    }\n\n    public String getName() {\n        return name;\n    }\n\n    public int getPower() {\n        return power;\n    }\n}\n", readOnly: true },
      { path: "Arena.java", content: "import java.util.ArrayList;\nimport java.util.List;\n\n/** Creates the characters you see in the game, and a small main for \u25b6 Run main. (Read-only.) */\npublic class Arena {\n    public static List<Object> setup() {\n        List<Object> world = new ArrayList<Object>();\n        world.add(new Hero(\"Aria\", 100));\n        world.add(new Warrior(\"Bram\"));\n        world.add(new Mage(\"Cara\"));\n        world.add(new Hero(\"Training Dummy\", 300));\n        return world;\n    }\n\n    public static void main(String[] args) {\n        Hero dummy = new Hero(\"Training Dummy\", 300);\n        new Hero(\"Aria\", 100).attack(dummy);\n        new Warrior(\"Bram\").attack(dummy);\n        new Mage(\"Cara\").attack(dummy);\n        System.out.println(dummy.getHpBar());\n    }\n}\n", readOnly: true },
      { path: "OverrideTest.java", content: "import tutor.Check;\n\npublic class OverrideTest {\n    static void test1_warriorCry() {\n        Check.isTrue(declared(\"Warrior\", \"getBattleCry\") != null, \"Warrior should override getBattleCry() (same name, no parameters)\");\n        String cry = new Warrior(\"Bram\").getBattleCry();\n        Check.isTrue(cry != null && !cry.trim().isEmpty() && !cry.equals(\"Hyah!\"), \"the warrior's battle cry should be your own text, not Hero's \\\"Hyah!\\\"\");\n    }\n\n    static void test2_warriorAttackShouts() {\n        Warrior w = new Warrior(\"Bram\");\n        Hero d = new Hero(\"Dummy\", 300);\n        String said = out(() -> w.attack(d));\n        Check.isTrue(said.startsWith(\"Bram: \" + w.getBattleCry()), \"Hero's attack() calls getBattleCry(): for a Warrior it must print the warrior's cry. Got: \" + said);\n        Check.equal(291, d.getHp(), \"a warrior's attack still deals the normal 9 damage\");\n    }\n\n    static void test3_mageOverridesAttack() {\n        Check.isTrue(declared(\"Mage\", \"attack\", Hero.class) != null,\n            \"Mage needs attack(Hero target) with exactly the same parameters as Hero's attack. attack(Hero, int) is a different method (an overload), so the game never calls it\");\n    }\n\n    static void test4_spell() {\n        Mage m = new Mage(\"Cara\");\n        Hero d = new Hero(\"Dummy\", 300);\n        Hero asHero = m;\n        String said = out(() -> asHero.attack(d));\n        Check.equal(282, d.getHp(), \"a spell deals double damage: 2 * 9 = 18\");\n        Check.equal(40, m.getMana(), \"a spell costs 10 mana\");\n        Check.isTrue(said.contains(\"casts a spell\"), \"the spell message should be printed. Got: \" + said);\n    }\n\n    static void test5_outOfMana() {\n        Mage m = new Mage(\"Cara\");\n        Hero d = new Hero(\"Dummy\", 300);\n        for (int i = 0; i < 5; i++) {\n            out(() -> m.attack(d));\n        }\n        String said = out(() -> m.attack(d));\n        Check.equal(\"Cara is out of mana!\", said, \"after 5 spells (50 mana) the mage is out of mana\");\n        Check.equal(300 - 5 * 18, d.getHp(), \"no damage without mana\");\n    }\n\n\n    // ---- helpers: tests call new methods by name, so this file compiles before you write them ----\n    static Object call(Object target, String name, Object... args) {\n        for (java.lang.reflect.Method m : target.getClass().getMethods()) {\n            if (m.getName().equals(name) && m.getParameterCount() == args.length) {\n                try {\n                    return m.invoke(target, args);\n                } catch (java.lang.reflect.InvocationTargetException e) {\n                    throw new RuntimeException(e.getCause());\n                } catch (IllegalAccessException | IllegalArgumentException e) {\n                    continue;\n                }\n            }\n        }\n        Check.isTrue(false, \"No public method \" + name + \" with \" + args.length + \" parameter(s) in \" + target.getClass().getSimpleName());\n        return null;\n    }\n\n    static Object make(String cls, Object... args) {\n        try {\n            for (java.lang.reflect.Constructor<?> c : Class.forName(cls).getConstructors()) {\n                if (c.getParameterCount() == args.length) {\n                    try {\n                        return c.newInstance(args);\n                    } catch (IllegalArgumentException e) {\n                        continue;\n                    }\n                }\n            }\n        } catch (java.lang.reflect.InvocationTargetException e) {\n            throw new RuntimeException(e.getCause());\n        } catch (ReflectiveOperationException e) {\n            Check.isTrue(false, \"Cannot create \" + cls + \": \" + e);\n        }\n        Check.isTrue(false, \"No public constructor \" + cls + \" with \" + args.length + \" parameter(s)\");\n        return null;\n    }\n\n    static String out(Runnable r) {\n        java.io.PrintStream old = System.out;\n        java.io.ByteArrayOutputStream b = new java.io.ByteArrayOutputStream();\n        System.setOut(new java.io.PrintStream(b));\n        try {\n            r.run();\n        } finally {\n            System.setOut(old);\n        }\n        return b.toString().trim().replace(\"\\r\", \"\");\n    }\n\n    static java.lang.reflect.Field field(String cls, String name) {\n        try {\n            return Class.forName(cls).getDeclaredField(name);\n        } catch (ReflectiveOperationException e) {\n            return null;\n        }\n    }\n\n    static java.lang.reflect.Method declared(String cls, String name, Class<?>... params) {\n        try {\n            return Class.forName(cls).getDeclaredMethod(name, params);\n        } catch (ReflectiveOperationException e) {\n            return null;\n        }\n    }\n\n    static int mod(java.lang.reflect.Member m) {\n        return m.getModifiers();\n    }\n\n}\n", readOnly: true },
    ],
    mainClass: "Arena",
    testClass: "OverrideTest",
    testLabels: {
      test1_warriorCry: "Warrior overrides getBattleCry()",
      test2_warriorAttackShouts: "attack() shouts the warrior's cry",
      test3_mageOverridesAttack: "Mage overrides attack(Hero)",
      test4_spell: "Spell: double damage, 10 mana",
      test5_outOfMana: "Out of mana",
    },
    solution: "QF-210",
    hints: [
      "Same signature as Hero: `public String getBattleCry()`.",
      "Mage's attack must be exactly `public void attack(Hero target)` (remove `int power`).",
    ],
  },
};

const qf211: Ticket = {
  id: "QF-211",
  slug: "super-method",
  title: "Extend, don't replace: super.method()",
  xp: 160,
  learningGoal: {
    level: "medium",
    goal: "Override a method and still run the superclass version with super.method(), including super.toString().",
    techniques: ["super.method()", "Extending inherited behavior", "super.toString()", "Infinite recursion trap"],
  },
  briefing: `Two requests. Warriors build up **rage**: +10 every time they attack, but the attack itself should stay exactly the same. And the battle log prints heroes with \`toString()\`; warriors and mages should also show rage and mana.`,
  objectives: [
    "Override a method and call the superclass version with super.method()",
    "Explain why copying the superclass code is worse",
    "Use super.toString() to extend a description",
    "Avoid calling the overridden method on yourself by mistake",
  ],
  blocks: [
    { type: "step", title: "The same, plus", focus: "read" },
    {
      type: "markdown",
      md: `If Warrior overrides \`attack(Hero target)\`, Hero's attack no longer runs for warriors. We could copy Hero's attack code into Warrior, but that's the copy trap from QF-208 again (and Hero's attack uses private things Warrior can't even see).

\`super.attack(target)\` means: **run the superclass's version of this method, on this object**:

~~~java
@Override
public void attack(Hero target) {
    super.attack(target);   // everything a hero does: cry, damage, message
    rage += 10;             // plus the warrior part
}
~~~

Compare: \`super(...)\` calls the superclass **constructor** (first line only); \`super.method()\` calls a superclass **method**, anywhere in a method.`,
    },
    {
      type: "predict",
      id: "qf211-recursion",
      question: "A teammate writes  attack(target);  instead of  super.attack(target);  inside Warrior's attack. What happens when Bram attacks?",
      options: [
        "Same as super.attack",
        "Warrior's attack calls itself again and again until the program crashes with StackOverflowError",
        "Compile error",
      ],
      answer: 1,
      explain: "For a warrior, attack(...) means Warrior's attack, the method you're in. Without super, it never reaches Hero's version.",
    },
    { type: "step", title: "super.toString()", focus: "read" },
    {
      type: "markdown",
      md: `Hero's \`toString()\` returns \`Bram (Lv 1, 130/130 HP)\`. Warrior's version reuses it and adds to it:

~~~java
@Override
public String toString() {
    return super.toString() + " rage " + rage;
}
~~~

Now if Hero's format changes (say, to show the weapon), warriors and mages get the change automatically.`,
    },
    { type: "step", title: "Add rage and better descriptions", focus: "build" },
    {
      type: "markdown",
      md: `1. **Warrior TODO 1**: \`private int rage\`, \`getRage()\`, and override \`attack(Hero target)\` using \`super.attack(target)\`, then +10 rage.
2. **Warrior TODO 2**: \`toString()\` = Hero's text + \`" rage " + rage\`.
3. **Mage TODO 3**: \`toString()\` = Hero's text + \`" mana " + mana\`.

Rebuild: attack with Bram a few times and watch **rage** climb while the attack still shouts and deals damage. Each character card shows its \`toString()\` line.`,
    },
  ],
  visualizations: [],
  game: {},
  task: {
    instructions: "Add rage to Warrior with super.attack(target), and extend toString() in Warrior and Mage with super.toString().",
    files: [
      { path: "Warrior.java", content: "/** A warrior: a hero with more hp who can roar. */\npublic class Warrior extends Hero {\n\n    public Warrior(String name) {\n        super(name, 130);\n    }\n\n    @Override\n    public String getBattleCry() {\n        return \"For the guild!\";\n    }\n\n    // TODO 1: a warrior gains 10 rage every time it attacks.\n    //         Add  private int rage  and  public int getRage(),  then override attack(Hero target):\n    //         do everything Hero's attack does (use super.attack(target)), then add 10 rage.\n\n    // TODO 2: override toString(): Hero's text + \" rage \" + rage,  e.g. \"Bram (Lv 1, 130/130 HP) rage 10\"\n\n    public void roar() {\n        System.out.println(getName() + \" roars!\");\n        heal(5);\n    }\n}\n" },
      { path: "Mage.java", content: "/** A mage: a hero with less hp who has mana. */\npublic class Mage extends Hero {\n    private int mana;\n\n    public Mage(String name) {\n        super(name, 70);\n        mana = 50;\n    }\n\n    public int getMana() {\n        return mana;\n    }\n\n    // TODO 3: override toString(): Hero's text + \" mana \" + mana,  e.g. \"Cara (Lv 1, 70/70 HP) mana 50\"\n\n    /** A spell: costs 10 mana and deals double damage. */\n    @Override\n    public void attack(Hero target) {\n        if (mana < 10) {\n            System.out.println(getName() + \" is out of mana!\");\n            return;\n        }\n        mana = mana - 10;\n        System.out.println(getName() + \": \" + getBattleCry());\n        int damage = previewDamage() * 2;\n        System.out.println(getName() + \" casts a spell on \" + target.getName() + \" for \" + damage + \"!\");\n        target.takeDamage(damage);\n    }\n}\n" },
      { path: "Hero.java", content: "/** A hero in Pixel Arena. */\npublic class Hero {\n    public static final int MAX_LEVEL = 99;\n    private static int heroCount = 0;\n\n    private String name;\n    private int hp;\n    private int maxHp;\n    private int level;\n    private Weapon weapon;\n\n    public Hero(String name, int maxHp) {\n        this.name = name;\n        this.maxHp = maxHp;\n        this.hp = maxHp;\n        this.level = 1;\n        heroCount++;\n    }\n\n    public Hero(String name) {\n        this(name, 100);\n    }\n\n    public static int getHeroCount() {\n        return heroCount;\n    }\n\n    public String getName() {\n        return name;\n    }\n\n    public int getHp() {\n        return hp;\n    }\n\n    public int getMaxHp() {\n        return maxHp;\n    }\n\n    public int getLevel() {\n        return level;\n    }\n\n    public void setLevel(int newLevel) {\n        if (newLevel >= 1 && newLevel <= MAX_LEVEL) {\n            level = newLevel;\n        }\n    }\n\n    public void takeDamage(int amount) {\n        if (amount < 0) {\n            return;\n        }\n        hp = clampHp(hp - amount);\n    }\n\n    public void heal(int amount) {\n        if (amount < 0) {\n            return;\n        }\n        hp = clampHp(hp + amount);\n    }\n\n    /** What this hero shouts when attacking. Subclasses can override it. */\n    public String getBattleCry() {\n        return \"Hyah!\";\n    }\n\n    public void attack(Hero target) {\n        System.out.println(name + \": \" + getBattleCry());\n        int damage = calculateDamage();\n        System.out.println(name + \" hits \" + target.getName() + \" for \" + damage + \"!\");\n        target.takeDamage(damage);\n    }\n\n    /** Shown in the game's attack preview. */\n    public int previewDamage() {\n        return calculateDamage();\n    }\n\n    public void heal() {\n        hp = maxHp;\n    }\n\n    public String getHpBar() {\n        int filled = hp * 10 / maxHp;\n        String bar = \"\";\n        for (int i = 0; i < 10; i++) {\n            if (i < filled) {\n                bar += \"#\";\n            } else {\n                bar += \"-\";\n            }\n        }\n        return \"[\" + bar + \"] \" + hp + \"/\" + maxHp;\n    }\n\n    @Override\n    public String toString() {\n        return name + \" (Lv \" + level + \", \" + hp + \"/\" + maxHp + \" HP)\";\n    }\n\n    private int clampHp(int value) {\n        if (value < 0) {\n            return 0;\n        }\n        if (value > maxHp) {\n            return maxHp;\n        }\n        return value;\n    }\n\n    public void equip(Weapon w) {\n        weapon = w;\n    }\n\n    public Weapon getWeapon() {\n        return weapon;\n    }\n\n    private int calculateDamage() {\n        int damage = 6 + level * 3;\n        if (weapon != null) {\n            damage += weapon.getPower();\n        }\n        return damage;\n    }\n}\n", readOnly: true },
      { path: "Weapon.java", content: "/** A weapon a hero can equip. */\npublic class Weapon {\n    private String name;\n    private int power;\n\n    public Weapon(String name, int power) {\n        this.name = name;\n        this.power = power;\n    }\n\n    public String getName() {\n        return name;\n    }\n\n    public int getPower() {\n        return power;\n    }\n}\n", readOnly: true },
      { path: "Arena.java", content: "import java.util.ArrayList;\nimport java.util.List;\n\n/** Creates the characters you see in the game, and a small main for \u25b6 Run main. (Read-only.) */\npublic class Arena {\n    public static List<Object> setup() {\n        List<Object> world = new ArrayList<Object>();\n        world.add(new Hero(\"Aria\", 100));\n        world.add(new Warrior(\"Bram\"));\n        world.add(new Mage(\"Cara\"));\n        world.add(new Hero(\"Training Dummy\", 300));\n        return world;\n    }\n\n    public static void main(String[] args) {\n        Warrior bram = new Warrior(\"Bram\");\n        bram.attack(new Hero(\"Training Dummy\", 300));\n        System.out.println(bram);\n        System.out.println(new Mage(\"Cara\"));\n    }\n}\n", readOnly: true },
      { path: "SuperTest.java", content: "import tutor.Check;\n\npublic class SuperTest {\n    static void test1_warriorAttackKeepsHeroBehavior() {\n        Warrior w = new Warrior(\"Bram\");\n        Hero d = new Hero(\"Dummy\", 300);\n        String said = out(() -> w.attack(d));\n        Check.isTrue(declared(\"Warrior\", \"attack\", Hero.class) != null, \"Warrior should override attack(Hero target)\");\n        Check.isTrue(said.contains(\"Bram: \") && said.contains(\"hits Dummy for 9!\"), \"the warrior's attack should still do everything Hero's attack does (call super.attack(target)). Got: \" + said);\n        Check.equal(291, d.getHp(), \"the target still takes 9 damage\");\n    }\n\n    static void test2_rage() {\n        Warrior w = new Warrior(\"Bram\");\n        Hero d = new Hero(\"Dummy\", 300);\n        Check.equal(0, call(w, \"getRage\"), \"a warrior starts with 0 rage\");\n        out(() -> w.attack(d));\n        out(() -> w.attack(d));\n        Check.equal(20, call(w, \"getRage\"), \"+10 rage per attack\");\n    }\n\n    static void test3_warriorToString() {\n        Warrior w = new Warrior(\"Bram\");\n        Check.equal(\"Bram (Lv 1, 130/130 HP) rage 0\", w.toString(), \"Warrior's toString = super.toString() + \\\" rage \\\" + rage\");\n    }\n\n    static void test4_mageToString() {\n        Check.equal(\"Cara (Lv 1, 70/70 HP) mana 50\", new Mage(\"Cara\").toString(), \"Mage's toString = super.toString() + \\\" mana \\\" + mana\");\n    }\n\n\n    // ---- helpers: tests call new methods by name, so this file compiles before you write them ----\n    static Object call(Object target, String name, Object... args) {\n        for (java.lang.reflect.Method m : target.getClass().getMethods()) {\n            if (m.getName().equals(name) && m.getParameterCount() == args.length) {\n                try {\n                    return m.invoke(target, args);\n                } catch (java.lang.reflect.InvocationTargetException e) {\n                    throw new RuntimeException(e.getCause());\n                } catch (IllegalAccessException | IllegalArgumentException e) {\n                    continue;\n                }\n            }\n        }\n        Check.isTrue(false, \"No public method \" + name + \" with \" + args.length + \" parameter(s) in \" + target.getClass().getSimpleName());\n        return null;\n    }\n\n    static Object make(String cls, Object... args) {\n        try {\n            for (java.lang.reflect.Constructor<?> c : Class.forName(cls).getConstructors()) {\n                if (c.getParameterCount() == args.length) {\n                    try {\n                        return c.newInstance(args);\n                    } catch (IllegalArgumentException e) {\n                        continue;\n                    }\n                }\n            }\n        } catch (java.lang.reflect.InvocationTargetException e) {\n            throw new RuntimeException(e.getCause());\n        } catch (ReflectiveOperationException e) {\n            Check.isTrue(false, \"Cannot create \" + cls + \": \" + e);\n        }\n        Check.isTrue(false, \"No public constructor \" + cls + \" with \" + args.length + \" parameter(s)\");\n        return null;\n    }\n\n    static String out(Runnable r) {\n        java.io.PrintStream old = System.out;\n        java.io.ByteArrayOutputStream b = new java.io.ByteArrayOutputStream();\n        System.setOut(new java.io.PrintStream(b));\n        try {\n            r.run();\n        } finally {\n            System.setOut(old);\n        }\n        return b.toString().trim().replace(\"\\r\", \"\");\n    }\n\n    static java.lang.reflect.Field field(String cls, String name) {\n        try {\n            return Class.forName(cls).getDeclaredField(name);\n        } catch (ReflectiveOperationException e) {\n            return null;\n        }\n    }\n\n    static java.lang.reflect.Method declared(String cls, String name, Class<?>... params) {\n        try {\n            return Class.forName(cls).getDeclaredMethod(name, params);\n        } catch (ReflectiveOperationException e) {\n            return null;\n        }\n    }\n\n    static int mod(java.lang.reflect.Member m) {\n        return m.getModifiers();\n    }\n\n}\n", readOnly: true },
    ],
    mainClass: "Arena",
    testClass: "SuperTest",
    testLabels: {
      test1_warriorAttackKeepsHeroBehavior: "Warrior's attack calls super.attack",
      test2_rage: "+10 rage per attack",
      test3_warriorToString: "Warrior toString with super",
      test4_mageToString: "Mage toString with super",
    },
    solution: "QF-211",
    hints: [
      "`super.attack(target);` first, then `rage = rage + 10;`",
      "`return super.toString() + \" rage \" + rage;` (note the spaces).",
    ],
  },
};

const qf212: Ticket = {
  id: "QF-212",
  slug: "hierarchies",
  title: "The class tree: Archmage and Hero references",
  xp: 160,
  learningGoal: {
    level: "medium",
    goal: "Build a multi-level hierarchy and use superclass references and arrays to treat different subclasses alike.",
    techniques: ["Multi-level inheritance", "Superclass reference to subclass object", "Hero[] holding mixed types", "What a reference type allows"],
  },
  briefing: `Mages who reach the top become **Archmages**: everything a mage is, with **100 mana** and their own cry. And the team needs one method that adds up the hp of a whole party, no matter what kinds of heroes are in it.`,
  objectives: [
    "Extend a class that itself extends another",
    "Use a Hero reference for any kind of hero",
    "Write one method that works for an array of mixed hero types",
    "Explain what the reference type allows you to call",
  ],
  blocks: [
    { type: "step", title: "A tree of classes", focus: "read" },
    {
      type: "markdown",
      md: `~~~
          Hero
        /      \\
   Warrior     Mage
                 |
              Archmage
~~~

An Archmage **is a** Mage, and a Mage **is a** Hero, so an Archmage is a Hero too. It inherits from both levels. Its constructor calls \`super(name)\`, which runs Mage's constructor, which calls Hero's.

Mage has a public helper, \`addMana(int)\`, that subclasses can use: the archmage is built like a mage, then gets 50 more mana.`,
    },
    { type: "step", title: "One type for every hero", focus: "read" },
    {
      type: "markdown",
      md: `Because each of these **is a** Hero, a variable or array of type \`Hero\` can hold any of them:

~~~java
Hero h = new Warrior("Bram");          // OK: a warrior is a hero
Hero[] party = { new Warrior("Bram"), new Mage("Cara"), new Archmage("Zed") };
~~~

You know this pattern already: \`List<String> names = new ArrayList<String>();\`: the variable's type is the general one, the object is a specific kind.

So \`Roster.totalHp(Hero[] party)\` is written **once** and works for any mix of heroes, including kinds that don't exist yet.`,
    },
    {
      type: "predict",
      id: "qf212-ref",
      question: "Hero h = new Warrior(\"Bram\");   Which line does NOT compile?",
      options: ["h.getHp();", "h.attack(target);", "h.roar();"],
      answer: 2,
      explain: "The compiler only knows that h is *some* Hero, and Hero has no roar(). The variable's type decides what you may call. (Which version runs is decided by the object: that's the next ticket.)",
    },
    {
      type: "predict",
      id: "qf212-other-way",
      question: "Which assignment is a compile error?",
      options: ["Hero h = new Archmage(\"Zed\");", "Mage m = new Archmage(\"Zed\");", "Warrior w = new Hero(\"Aria\");"],
      answer: 2,
      explain: "Every Archmage is a Mage and a Hero, but not every Hero is a Warrior. The arrow of is-a only goes up the tree.",
    },
    { type: "step", title: "Archmage and Roster", focus: "build" },
    {
      type: "markdown",
      md: `1. **Archmage TODO 1–3**: \`extends Mage\`; the constructor calls \`super(name)\` then \`addMana(50)\`; override \`getBattleCry()\` with the archmage's own cry.
2. **Roster TODO 4**: \`totalHp(Hero[] party)\` adds \`getHp()\` of every hero in the array (0 for an empty array).

Rebuild: Zed the Archmage joins, with 100 mana and a spell attack (inherited from Mage) shouting **his** cry. 📐 Your classes shows the chain \`Archmage → Mage → Hero\`.`,
    },
  ],
  visualizations: [],
  game: {},
  task: {
    instructions: "Write Archmage as a subclass of Mage, and Roster.totalHp for an array of any heroes.",
    files: [
      { path: "Archmage.java", content: "// TODO 1: an Archmage is a kind of Mage (and so also a kind of Hero).\npublic class Archmage {\n\n    public Archmage(String name) {\n        // TODO 2: an archmage is built like a mage, then gets 50 extra mana (100 in total). Use addMana.\n    }\n\n    // TODO 3: override getBattleCry() with the archmage's own cry\n}\n" },
      { path: "Roster.java", content: "/** Team utilities. */\npublic class Roster {\n\n    /** Total hp of every hero in the array, whatever kind of hero each one is. */\n    public static int totalHp(Hero[] party) {\n        // TODO 4\n        return 0;\n    }\n}\n" },
      { path: "Hero.java", content: "/** A hero in Pixel Arena. */\npublic class Hero {\n    public static final int MAX_LEVEL = 99;\n    private static int heroCount = 0;\n\n    private String name;\n    private int hp;\n    private int maxHp;\n    private int level;\n    private Weapon weapon;\n\n    public Hero(String name, int maxHp) {\n        this.name = name;\n        this.maxHp = maxHp;\n        this.hp = maxHp;\n        this.level = 1;\n        heroCount++;\n    }\n\n    public Hero(String name) {\n        this(name, 100);\n    }\n\n    public static int getHeroCount() {\n        return heroCount;\n    }\n\n    public String getName() {\n        return name;\n    }\n\n    public int getHp() {\n        return hp;\n    }\n\n    public int getMaxHp() {\n        return maxHp;\n    }\n\n    public int getLevel() {\n        return level;\n    }\n\n    public void setLevel(int newLevel) {\n        if (newLevel >= 1 && newLevel <= MAX_LEVEL) {\n            level = newLevel;\n        }\n    }\n\n    public void takeDamage(int amount) {\n        if (amount < 0) {\n            return;\n        }\n        hp = clampHp(hp - amount);\n    }\n\n    public void heal(int amount) {\n        if (amount < 0) {\n            return;\n        }\n        hp = clampHp(hp + amount);\n    }\n\n    /** What this hero shouts when attacking. Subclasses can override it. */\n    public String getBattleCry() {\n        return \"Hyah!\";\n    }\n\n    public void attack(Hero target) {\n        System.out.println(name + \": \" + getBattleCry());\n        int damage = calculateDamage();\n        System.out.println(name + \" hits \" + target.getName() + \" for \" + damage + \"!\");\n        target.takeDamage(damage);\n    }\n\n    /** Shown in the game's attack preview. */\n    public int previewDamage() {\n        return calculateDamage();\n    }\n\n    public void heal() {\n        hp = maxHp;\n    }\n\n    public String getHpBar() {\n        int filled = hp * 10 / maxHp;\n        String bar = \"\";\n        for (int i = 0; i < 10; i++) {\n            if (i < filled) {\n                bar += \"#\";\n            } else {\n                bar += \"-\";\n            }\n        }\n        return \"[\" + bar + \"] \" + hp + \"/\" + maxHp;\n    }\n\n    @Override\n    public String toString() {\n        return name + \" (Lv \" + level + \", \" + hp + \"/\" + maxHp + \" HP)\";\n    }\n\n    private int clampHp(int value) {\n        if (value < 0) {\n            return 0;\n        }\n        if (value > maxHp) {\n            return maxHp;\n        }\n        return value;\n    }\n\n    public void equip(Weapon w) {\n        weapon = w;\n    }\n\n    public Weapon getWeapon() {\n        return weapon;\n    }\n\n    private int calculateDamage() {\n        int damage = 6 + level * 3;\n        if (weapon != null) {\n            damage += weapon.getPower();\n        }\n        return damage;\n    }\n}\n", readOnly: true },
      { path: "Weapon.java", content: "/** A weapon a hero can equip. */\npublic class Weapon {\n    private String name;\n    private int power;\n\n    public Weapon(String name, int power) {\n        this.name = name;\n        this.power = power;\n    }\n\n    public String getName() {\n        return name;\n    }\n\n    public int getPower() {\n        return power;\n    }\n}\n", readOnly: true },
      { path: "Warrior.java", content: "/** A warrior: a hero with more hp who can roar, and gains rage when attacking. */\npublic class Warrior extends Hero {\n    private int rage;\n\n    public Warrior(String name) {\n        super(name, 130);\n    }\n\n    public int getRage() {\n        return rage;\n    }\n\n    @Override\n    public String getBattleCry() {\n        return \"For the guild!\";\n    }\n\n    @Override\n    public void attack(Hero target) {\n        super.attack(target);\n        rage = rage + 10;\n    }\n\n    @Override\n    public String toString() {\n        return super.toString() + \" rage \" + rage;\n    }\n\n    public void roar() {\n        System.out.println(getName() + \" roars!\");\n        heal(5);\n    }\n}\n", readOnly: true },
      { path: "Mage.java", content: "/** A mage: a hero with less hp who has mana. */\npublic class Mage extends Hero {\n    private int mana;\n\n    public Mage(String name) {\n        super(name, 70);\n        mana = 50;\n    }\n\n    public int getMana() {\n        return mana;\n    }\n\n    /** Adds mana (used by stronger kinds of mages). */\n    public void addMana(int amount) {\n        if (amount > 0) {\n            mana = mana + amount;\n        }\n    }\n\n    @Override\n    public String toString() {\n        return super.toString() + \" mana \" + mana;\n    }\n\n    /** A spell: costs 10 mana and deals double damage. */\n    @Override\n    public void attack(Hero target) {\n        if (mana < 10) {\n            System.out.println(getName() + \" is out of mana!\");\n            return;\n        }\n        mana = mana - 10;\n        System.out.println(getName() + \": \" + getBattleCry());\n        int damage = previewDamage() * 2;\n        System.out.println(getName() + \" casts a spell on \" + target.getName() + \" for \" + damage + \"!\");\n        target.takeDamage(damage);\n    }\n}\n", readOnly: true },
      { path: "Arena.java", content: "import java.util.ArrayList;\nimport java.util.List;\n\n/** Creates the characters you see in the game, and a small main for \u25b6 Run main. (Read-only.) */\npublic class Arena {\n    public static List<Object> setup() {\n        List<Object> world = new ArrayList<Object>();\n        world.add(new Hero(\"Aria\", 100));\n        world.add(new Warrior(\"Bram\"));\n        world.add(new Mage(\"Cara\"));\n        world.add(new Archmage(\"Zed\"));\n        return world;\n    }\n\n    public static void main(String[] args) {\n        Hero[] party = { new Hero(\"Aria\", 100), new Warrior(\"Bram\"), new Mage(\"Cara\") };\n        System.out.println(\"Total hp: \" + Roster.totalHp(party));\n    }\n}\n", readOnly: true },
      { path: "HierarchyTest.java", content: "import tutor.Check;\n\npublic class HierarchyTest {\n    static void test1_archmageIsAMage() {\n        Check.isTrue((Object) Archmage.class.getSuperclass() == Mage.class, \"Archmage should extend Mage\");\n        Object a = new Archmage(\"Zed\");\n        Check.isTrue(a instanceof Hero, \"...so an Archmage is also a Hero (three levels: Hero, Mage, Archmage)\");\n    }\n\n    static void test2_builtLikeAMage() {\n        Object a = new Archmage(\"Zed\");\n        Check.isTrue(a instanceof Mage, \"Archmage extends Mage\");\n        Mage m = (Mage) a;\n        Check.equal(70, m.getMaxHp(), \"built like a mage: 70 max hp (call super(name))\");\n        Check.equal(100, m.getMana(), \"50 mana from Mage + 50 extra = 100\");\n    }\n\n    static void test3_ownCry() {\n        Object a = new Archmage(\"Zed\");\n        Check.isTrue(declared(\"Archmage\", \"getBattleCry\") != null, \"override getBattleCry() in Archmage\");\n        String cry = ((Hero) a).getBattleCry();\n        Check.isTrue(cry != null && !cry.trim().isEmpty() && !cry.equals(\"Hyah!\"), \"the archmage needs its own cry\");\n    }\n\n    static void test4_totalHp() {\n        Hero[] party = { new Hero(\"Aria\", 100), new Warrior(\"Bram\"), new Mage(\"Cara\") };\n        party[0].takeDamage(30);\n        Check.equal(70 + 130 + 70, Roster.totalHp(party), \"totalHp works for any kind of hero in a Hero[]\");\n    }\n\n    static void test5_emptyParty() {\n        Check.equal(0, Roster.totalHp(new Hero[0]), \"an empty party has 0 total hp\");\n    }\n\n\n    // ---- helpers: tests call new methods by name, so this file compiles before you write them ----\n    static Object call(Object target, String name, Object... args) {\n        for (java.lang.reflect.Method m : target.getClass().getMethods()) {\n            if (m.getName().equals(name) && m.getParameterCount() == args.length) {\n                try {\n                    return m.invoke(target, args);\n                } catch (java.lang.reflect.InvocationTargetException e) {\n                    throw new RuntimeException(e.getCause());\n                } catch (IllegalAccessException | IllegalArgumentException e) {\n                    continue;\n                }\n            }\n        }\n        Check.isTrue(false, \"No public method \" + name + \" with \" + args.length + \" parameter(s) in \" + target.getClass().getSimpleName());\n        return null;\n    }\n\n    static Object make(String cls, Object... args) {\n        try {\n            for (java.lang.reflect.Constructor<?> c : Class.forName(cls).getConstructors()) {\n                if (c.getParameterCount() == args.length) {\n                    try {\n                        return c.newInstance(args);\n                    } catch (IllegalArgumentException e) {\n                        continue;\n                    }\n                }\n            }\n        } catch (java.lang.reflect.InvocationTargetException e) {\n            throw new RuntimeException(e.getCause());\n        } catch (ReflectiveOperationException e) {\n            Check.isTrue(false, \"Cannot create \" + cls + \": \" + e);\n        }\n        Check.isTrue(false, \"No public constructor \" + cls + \" with \" + args.length + \" parameter(s)\");\n        return null;\n    }\n\n    static String out(Runnable r) {\n        java.io.PrintStream old = System.out;\n        java.io.ByteArrayOutputStream b = new java.io.ByteArrayOutputStream();\n        System.setOut(new java.io.PrintStream(b));\n        try {\n            r.run();\n        } finally {\n            System.setOut(old);\n        }\n        return b.toString().trim().replace(\"\\r\", \"\");\n    }\n\n    static java.lang.reflect.Field field(String cls, String name) {\n        try {\n            return Class.forName(cls).getDeclaredField(name);\n        } catch (ReflectiveOperationException e) {\n            return null;\n        }\n    }\n\n    static java.lang.reflect.Method declared(String cls, String name, Class<?>... params) {\n        try {\n            return Class.forName(cls).getDeclaredMethod(name, params);\n        } catch (ReflectiveOperationException e) {\n            return null;\n        }\n    }\n\n    static int mod(java.lang.reflect.Member m) {\n        return m.getModifiers();\n    }\n\n}\n", readOnly: true },
    ],
    mainClass: "Arena",
    testClass: "HierarchyTest",
    testLabels: {
      test1_archmageIsAMage: "Archmage extends Mage",
      test2_builtLikeAMage: "Built with super(name) + addMana",
      test3_ownCry: "Archmage's own battle cry",
      test4_totalHp: "totalHp(Hero[]) with mixed heroes",
      test5_emptyParty: "Empty party",
    },
    solution: "QF-212",
    hints: [
      "`public class Archmage extends Mage`; constructor: `super(name); addMana(50);`",
      "totalHp: an enhanced for loop, `for (Hero h : party) { total += h.getHp(); }`.",
    ],
  },
};

const qf213: Ticket = {
  id: "QF-213",
  slug: "polymorphism-party",
  title: "Everyone attack! Polymorphism",
  xp: 170,
  learningGoal: {
    level: "hard",
    goal: "Call one method on a list of mixed subclasses and predict which version runs for each object.",
    techniques: ["Polymorphism", "Dynamic dispatch", "ArrayList<Hero>", "Compile time vs run time"],
  },
  briefing: `The party is ready: warrior, mage, archmage and a plain hero. Our first boss is a **training dummy with 300 hp**. One button, **allAttack**, makes the whole party attack. Writing it is one line inside one loop. Predicting the result is the real job.`,
  objectives: [
    "Write a loop that calls attack on every member of an ArrayList<Hero>",
    "Predict which attack runs for each member",
    "Explain the difference between what compiles and what runs",
    "Explain why no if/instanceof is needed",
  ],
  blocks: [
    { type: "step", title: "One call, many behaviors", focus: "read" },
    {
      type: "markdown",
      md: `~~~java
for (Hero h : members) {
    h.attack(target);
}
~~~

The loop doesn't know or care what kind each member is. For each one, Java runs **the attack of the actual object**:

- a plain Hero: Hero's attack, "Hyah!"
- a Warrior: Warrior's attack (Hero's attack via super, your cry, plus rage)
- a Mage: Mage's spell (10 mana, double damage)
- an Archmage: Mage's spell, inherited, with the archmage's cry

This is **polymorphism** ("many forms"): one method call, the right behavior per object.

Two rules from the last two tickets, together:
1. **Compile time:** the variable's type (\`Hero\`) decides *whether you may call* \`attack\`.
2. **Run time:** the object's class decides *which* \`attack\` runs.`,
    },
    { type: "step", title: "Predict the battle", focus: "read" },
    {
      type: "predict",
      id: "qf213-dispatch",
      question: "members holds a Warrior, Mage and Archmage. In  h.attack(target),  whose method runs for the Archmage?",
      options: [
        "Hero's attack, because h is declared as Hero",
        "Mage's attack, the closest version up the Archmage's own chain (Archmage doesn't override attack)",
        "None: compile error",
      ],
      answer: 1,
      explain: "Java starts at the object's class (Archmage), finds no attack there, moves up to Mage, and uses that. Inside it, getBattleCry() starts again at Archmage, so the archmage's own cry is shouted.",
    },
    {
      type: "callout",
      tone: "info",
      md: "Without polymorphism, allAttack would need `if (h instanceof Warrior) ... else if (h instanceof Mage) ...`, and every new hero class would mean editing Party. With it, Party never changes: write a new subclass, override attack, and it just works.",
    },
    { type: "step", title: "Everyone attack!", focus: "build" },
    {
      type: "markdown",
      md: `In \`Party.java\`:
1. **TODO 1**: \`allAttack(Hero target)\`: every member attacks the target, in order.
2. **TODO 2**: \`totalHp()\`: the sum of the members' hp.

**Before pressing the button**, predict each line of the battle log. Then rebuild and press **allAttack** on the dummy. The dummy should go from **300 to 246**. Press it again: did the mage's mana change the result?`,
    },
    { type: "step", title: "Explain it", focus: "read" },
    {
      type: "short-answer",
      id: "qf213-why",
      question: "allAttack has one line inside the loop, but four different attacks happen. Explain how.",
      placeholder: "Each member…",
      modelAnswer: "Every member is a Hero, so h.attack(target) compiles. When it runs, Java uses the attack of each object's actual class (or the closest one up its chain): Hero, Warrior, Mage, and Mage's for the Archmage. That's polymorphism.",
    },
  ],
  visualizations: [],
  game: {},
  task: {
    instructions: "Write Party.allAttack and Party.totalHp, predict the battle log, then test it on the dummy.",
    files: [
      { path: "Party.java", content: "import java.util.ArrayList;\n\n/** A party of heroes of any kind. */\npublic class Party {\n    private ArrayList<Hero> members = new ArrayList<Hero>();\n\n    public void add(Hero h) {\n        members.add(h);\n    }\n\n    public int size() {\n        return members.size();\n    }\n\n    // TODO 1: public void allAttack(Hero target): every member attacks the target, in order.\n    //         One loop, one line inside it.\n\n    // TODO 2: public int totalHp(): the sum of every member's hp.\n}\n" },
      { path: "Hero.java", content: "/** A hero in Pixel Arena. */\npublic class Hero {\n    public static final int MAX_LEVEL = 99;\n    private static int heroCount = 0;\n\n    private String name;\n    private int hp;\n    private int maxHp;\n    private int level;\n    private Weapon weapon;\n\n    public Hero(String name, int maxHp) {\n        this.name = name;\n        this.maxHp = maxHp;\n        this.hp = maxHp;\n        this.level = 1;\n        heroCount++;\n    }\n\n    public Hero(String name) {\n        this(name, 100);\n    }\n\n    public static int getHeroCount() {\n        return heroCount;\n    }\n\n    public String getName() {\n        return name;\n    }\n\n    public int getHp() {\n        return hp;\n    }\n\n    public int getMaxHp() {\n        return maxHp;\n    }\n\n    public int getLevel() {\n        return level;\n    }\n\n    public void setLevel(int newLevel) {\n        if (newLevel >= 1 && newLevel <= MAX_LEVEL) {\n            level = newLevel;\n        }\n    }\n\n    public void takeDamage(int amount) {\n        if (amount < 0) {\n            return;\n        }\n        hp = clampHp(hp - amount);\n    }\n\n    public void heal(int amount) {\n        if (amount < 0) {\n            return;\n        }\n        hp = clampHp(hp + amount);\n    }\n\n    /** What this hero shouts when attacking. Subclasses can override it. */\n    public String getBattleCry() {\n        return \"Hyah!\";\n    }\n\n    public void attack(Hero target) {\n        System.out.println(name + \": \" + getBattleCry());\n        int damage = calculateDamage();\n        System.out.println(name + \" hits \" + target.getName() + \" for \" + damage + \"!\");\n        target.takeDamage(damage);\n    }\n\n    /** Shown in the game's attack preview. */\n    public int previewDamage() {\n        return calculateDamage();\n    }\n\n    public void heal() {\n        hp = maxHp;\n    }\n\n    public String getHpBar() {\n        int filled = hp * 10 / maxHp;\n        String bar = \"\";\n        for (int i = 0; i < 10; i++) {\n            if (i < filled) {\n                bar += \"#\";\n            } else {\n                bar += \"-\";\n            }\n        }\n        return \"[\" + bar + \"] \" + hp + \"/\" + maxHp;\n    }\n\n    @Override\n    public String toString() {\n        return name + \" (Lv \" + level + \", \" + hp + \"/\" + maxHp + \" HP)\";\n    }\n\n    private int clampHp(int value) {\n        if (value < 0) {\n            return 0;\n        }\n        if (value > maxHp) {\n            return maxHp;\n        }\n        return value;\n    }\n\n    public void equip(Weapon w) {\n        weapon = w;\n    }\n\n    public Weapon getWeapon() {\n        return weapon;\n    }\n\n    private int calculateDamage() {\n        int damage = 6 + level * 3;\n        if (weapon != null) {\n            damage += weapon.getPower();\n        }\n        return damage;\n    }\n}\n", readOnly: true },
      { path: "Weapon.java", content: "/** A weapon a hero can equip. */\npublic class Weapon {\n    private String name;\n    private int power;\n\n    public Weapon(String name, int power) {\n        this.name = name;\n        this.power = power;\n    }\n\n    public String getName() {\n        return name;\n    }\n\n    public int getPower() {\n        return power;\n    }\n}\n", readOnly: true },
      { path: "Warrior.java", content: "/** A warrior: a hero with more hp who can roar, and gains rage when attacking. */\npublic class Warrior extends Hero {\n    private int rage;\n\n    public Warrior(String name) {\n        super(name, 130);\n    }\n\n    public int getRage() {\n        return rage;\n    }\n\n    @Override\n    public String getBattleCry() {\n        return \"For the guild!\";\n    }\n\n    @Override\n    public void attack(Hero target) {\n        super.attack(target);\n        rage = rage + 10;\n    }\n\n    @Override\n    public String toString() {\n        return super.toString() + \" rage \" + rage;\n    }\n\n    public void roar() {\n        System.out.println(getName() + \" roars!\");\n        heal(5);\n    }\n}\n", readOnly: true },
      { path: "Mage.java", content: "/** A mage: a hero with less hp who has mana. */\npublic class Mage extends Hero {\n    private int mana;\n\n    public Mage(String name) {\n        super(name, 70);\n        mana = 50;\n    }\n\n    public int getMana() {\n        return mana;\n    }\n\n    /** Adds mana (used by stronger kinds of mages). */\n    public void addMana(int amount) {\n        if (amount > 0) {\n            mana = mana + amount;\n        }\n    }\n\n    @Override\n    public String toString() {\n        return super.toString() + \" mana \" + mana;\n    }\n\n    /** A spell: costs 10 mana and deals double damage. */\n    @Override\n    public void attack(Hero target) {\n        if (mana < 10) {\n            System.out.println(getName() + \" is out of mana!\");\n            return;\n        }\n        mana = mana - 10;\n        System.out.println(getName() + \": \" + getBattleCry());\n        int damage = previewDamage() * 2;\n        System.out.println(getName() + \" casts a spell on \" + target.getName() + \" for \" + damage + \"!\");\n        target.takeDamage(damage);\n    }\n}\n", readOnly: true },
      { path: "Archmage.java", content: "/** An archmage: a mage with extra mana. */\npublic class Archmage extends Mage {\n\n    public Archmage(String name) {\n        super(name);\n        addMana(50);\n    }\n\n    @Override\n    public String getBattleCry() {\n        return \"Witness true power!\";\n    }\n}\n", readOnly: true },
      { path: "Arena.java", content: "import java.util.ArrayList;\nimport java.util.List;\n\n/** Creates the characters you see in the game, and a small main for \u25b6 Run main. (Read-only.) */\npublic class Arena {\n    public static List<Object> setup() {\n        Hero aria = new Hero(\"Aria\", 100);\n        Warrior bram = new Warrior(\"Bram\");\n        Mage cara = new Mage(\"Cara\");\n        Archmage zed = new Archmage(\"Zed\");\n        Party party = new Party();\n        party.add(aria);\n        party.add(bram);\n        party.add(cara);\n        party.add(zed);\n        List<Object> world = new ArrayList<Object>();\n        world.add(aria);\n        world.add(bram);\n        world.add(cara);\n        world.add(zed);\n        world.add(new Hero(\"Training Dummy\", 300));\n        world.add(party);\n        return world;\n    }\n\n    public static void main(String[] args) {\n        Party party = new Party();\n        party.add(new Hero(\"Aria\", 100));\n        party.add(new Mage(\"Cara\"));\n        System.out.println(\"Party size: \" + party.size());\n    }\n}\n", readOnly: true },
      { path: "PartyTest.java", content: "import tutor.Check;\n\npublic class PartyTest {\n    static Party party() {\n        Party p = new Party();\n        p.add(new Hero(\"Aria\", 100));\n        p.add(new Warrior(\"Bram\"));\n        p.add(new Mage(\"Cara\"));\n        p.add(new Archmage(\"Zed\"));\n        return p;\n    }\n\n    static void test1_allAttackDamage() {\n        Party p = party();\n        Hero d = new Hero(\"Dummy\", 300);\n        out(() -> call(p, \"allAttack\", d));\n        Check.equal(300 - (9 + 9 + 18 + 18), d.getHp(), \"each member attacks in its own way: Hero 9, Warrior 9, Mage 18, Archmage 18\");\n    }\n\n    static void test2_eachUsesItsOwnAttack() {\n        Party p = party();\n        Hero d = new Hero(\"Dummy\", 300);\n        String said = out(() -> call(p, \"allAttack\", d));\n        Check.isTrue(said.contains(\"Aria: Hyah!\"), \"Aria (a Hero) shouts Hyah!\");\n        Check.isTrue(said.contains(\"Cara casts a spell\"), \"Cara (a Mage) casts a spell: Mage's attack runs, even though the list is ArrayList<Hero>\");\n        Check.isTrue(said.contains(\"Zed casts a spell\"), \"Zed (an Archmage) inherits Mage's spell attack\");\n        Check.isTrue(said.indexOf(\"Aria\") < said.indexOf(\"Bram\") && said.indexOf(\"Bram\") < said.indexOf(\"Cara\"), \"members attack in the order they were added\");\n    }\n\n    static void test3_totalHp() {\n        Party p = party();\n        Check.equal(100 + 130 + 70 + 70, call(p, \"totalHp\"), \"totalHp() adds every member's hp\");\n    }\n\n\n    // ---- helpers: tests call new methods by name, so this file compiles before you write them ----\n    static Object call(Object target, String name, Object... args) {\n        for (java.lang.reflect.Method m : target.getClass().getMethods()) {\n            if (m.getName().equals(name) && m.getParameterCount() == args.length) {\n                try {\n                    return m.invoke(target, args);\n                } catch (java.lang.reflect.InvocationTargetException e) {\n                    throw new RuntimeException(e.getCause());\n                } catch (IllegalAccessException | IllegalArgumentException e) {\n                    continue;\n                }\n            }\n        }\n        Check.isTrue(false, \"No public method \" + name + \" with \" + args.length + \" parameter(s) in \" + target.getClass().getSimpleName());\n        return null;\n    }\n\n    static Object make(String cls, Object... args) {\n        try {\n            for (java.lang.reflect.Constructor<?> c : Class.forName(cls).getConstructors()) {\n                if (c.getParameterCount() == args.length) {\n                    try {\n                        return c.newInstance(args);\n                    } catch (IllegalArgumentException e) {\n                        continue;\n                    }\n                }\n            }\n        } catch (java.lang.reflect.InvocationTargetException e) {\n            throw new RuntimeException(e.getCause());\n        } catch (ReflectiveOperationException e) {\n            Check.isTrue(false, \"Cannot create \" + cls + \": \" + e);\n        }\n        Check.isTrue(false, \"No public constructor \" + cls + \" with \" + args.length + \" parameter(s)\");\n        return null;\n    }\n\n    static String out(Runnable r) {\n        java.io.PrintStream old = System.out;\n        java.io.ByteArrayOutputStream b = new java.io.ByteArrayOutputStream();\n        System.setOut(new java.io.PrintStream(b));\n        try {\n            r.run();\n        } finally {\n            System.setOut(old);\n        }\n        return b.toString().trim().replace(\"\\r\", \"\");\n    }\n\n    static java.lang.reflect.Field field(String cls, String name) {\n        try {\n            return Class.forName(cls).getDeclaredField(name);\n        } catch (ReflectiveOperationException e) {\n            return null;\n        }\n    }\n\n    static java.lang.reflect.Method declared(String cls, String name, Class<?>... params) {\n        try {\n            return Class.forName(cls).getDeclaredMethod(name, params);\n        } catch (ReflectiveOperationException e) {\n            return null;\n        }\n    }\n\n    static int mod(java.lang.reflect.Member m) {\n        return m.getModifiers();\n    }\n\n}\n", readOnly: true },
    ],
    mainClass: "Arena",
    testClass: "PartyTest",
    testLabels: {
      test1_allAttackDamage: "allAttack: total damage",
      test2_eachUsesItsOwnAttack: "Each member uses its own attack",
      test3_totalHp: "totalHp()",
    },
    solution: "QF-213/Party",
    hints: [
      "`for (Hero h : members) { h.attack(target); }`",
      "totalHp is the same loop with `total += h.getHp();`.",
    ],
  },
};

const qf214: Ticket = {
  id: "QF-214",
  slug: "object-tostring-equals",
  title: "Two red potions: Object, toString and equals",
  xp: 160,
  learningGoal: {
    level: "medium",
    goal: "Explain that every class extends Object, and override toString and equals(Object) to give a class meaningful behavior.",
    techniques: ["Object as the root class", "Overriding toString()", "== vs equals", "equals(Object) with instanceof and a cast"],
  },
  briefing: `Last ticket: the **backpack**. Potions show up in the game as \`Potion@6d06d69c\`, and two red +30 potions are "not equal". Both come from the same place: a class called \`Object\`.`,
  objectives: [
    "Explain where Potion's toString() and equals() come from",
    "Override toString()",
    "Explain the difference between == and equals",
    "Override equals(Object) correctly",
  ],
  blocks: [
    { type: "step", title: "Every class extends Object", focus: "game" },
    {
      type: "markdown",
      md: `\`Potion\` doesn't say \`extends\`, so Java makes it extend **Object**, the root of every class tree (Hero too). Object gives every class a few methods, including:

- \`toString()\`: by default, class name + \`@\` + a hash code: \`Potion@6d06d69c\`.
- \`equals(Object other)\`: by default, the same as \`==\`.

Rebuild the game and look at the two red potions: that's Object's toString.`,
    },
    { type: "step", title: "== vs equals", focus: "read" },
    {
      type: "markdown",
      md: `~~~java
Potion a = new Potion("Red", 30);
Potion b = new Potion("Red", 30);
a == b          // false: two different objects in memory
a.equals(b)     // false for now (Object's equals is ==); true after you override it
~~~

You've seen this with String: \`s1 == s2\` can be false for two strings with the same letters, which is why you compare strings with \`s1.equals(s2)\`. **String overrides equals** to compare the characters. Now you'll do the same for Potion.`,
    },
    {
      type: "predict",
      id: "qf214-param",
      question: "A teammate writes  public boolean equals(Potion other).  What's wrong?",
      options: [
        "Nothing",
        "It overloads instead of overriding: Object's method is equals(Object). Code that calls equals with an Object type (like ArrayList, or any code written for Object) still uses the old ==",
        "equals must be static",
      ],
      answer: 1,
      explain: "Same trap as the mage's attack in QF-210. The parameter type must be Object. Put @Override on it and the compiler checks for you.",
    },
    { type: "step", title: "Writing equals(Object)", focus: "read" },
    {
      type: "markdown",
      md: `~~~java
@Override
public boolean equals(Object other) {
    if (!(other instanceof Potion)) {
        return false;                // a String, a Hero, or null is never equal to a potion
    }
    Potion p = (Potion) other;       // now we know it is a Potion
    return color.equals(p.color) && healAmount == p.healAmount;
}
~~~

- \`instanceof\` checks the object's real class (and is false for null).
- The cast \`(Potion) other\` lets us use Potion's fields; it's safe because we checked first.
- \`color\` is a String, so it's compared with \`equals\`; \`healAmount\` is an int, so \`==\`.
- \`p.color\` works even though color is private: private means "only code in the Potion class", and this *is* code in the Potion class.`,
    },
    { type: "step", title: "Override toString and equals", focus: "build" },
    {
      type: "markdown",
      md: `1. **TODO 1**: \`toString()\` returns e.g. \`Red potion (+30)\`.
2. **TODO 2**: \`equals(Object other)\`: equal when color and healAmount are the same.

Rebuild: the potions show their names. Select a red potion and call **equals(…)** with the other red one: **true**. Then **isSameObject(…)** with the same one: still **false**, they are two objects with the same meaning.`,
    },
    { type: "step", title: "Explain it", focus: "read" },
    {
      type: "short-answer",
      id: "qf214-why",
      question: "The two red +30 potions: equals is true, == is false. Explain both answers.",
      placeholder: "== … ; equals …",
      modelAnswer: "== checks whether two references point to the very same object; they are two separate objects, so it's false. Our equals override compares what matters about a potion (color and heal amount), which are the same, so it's true.",
    },
    {
      type: "callout",
      tone: "lead",
      md: "🎉 **Pixel Arena is playable!** Look at 📐 Your classes one last time: a Hero class that protects its own rules (private fields, getters, no setHp, private helpers, a static counter), a Weapon it has, a tree of heroes that are Heroes, a Party that treats them all alike, and potions that know what \"equal\" means.",
    },
  ],
  visualizations: [],
  game: {},
  task: {
    instructions: "Override toString() and equals(Object) in Potion.",
    files: [
      { path: "Potion.java", content: "/** A potion in the backpack. */\npublic class Potion {\n    private String color;\n    private int healAmount;\n\n    public Potion(String color, int healAmount) {\n        this.color = color;\n        this.healAmount = healAmount;\n    }\n\n    public String getColor() {\n        return color;\n    }\n\n    public int getHealAmount() {\n        return healAmount;\n    }\n\n    /** True only if other is this very same object. */\n    public boolean isSameObject(Potion other) {\n        return this == other;\n    }\n\n    // TODO 1: override toString(), e.g. \"Red potion (+30)\"\n\n    // TODO 2: override equals(Object other): two potions are equal when they have the same color and healAmount\n}\n" },
      { path: "Hero.java", content: "/** A hero in Pixel Arena. */\npublic class Hero {\n    public static final int MAX_LEVEL = 99;\n    private static int heroCount = 0;\n\n    private String name;\n    private int hp;\n    private int maxHp;\n    private int level;\n    private Weapon weapon;\n\n    public Hero(String name, int maxHp) {\n        this.name = name;\n        this.maxHp = maxHp;\n        this.hp = maxHp;\n        this.level = 1;\n        heroCount++;\n    }\n\n    public Hero(String name) {\n        this(name, 100);\n    }\n\n    public static int getHeroCount() {\n        return heroCount;\n    }\n\n    public String getName() {\n        return name;\n    }\n\n    public int getHp() {\n        return hp;\n    }\n\n    public int getMaxHp() {\n        return maxHp;\n    }\n\n    public int getLevel() {\n        return level;\n    }\n\n    public void setLevel(int newLevel) {\n        if (newLevel >= 1 && newLevel <= MAX_LEVEL) {\n            level = newLevel;\n        }\n    }\n\n    public void takeDamage(int amount) {\n        if (amount < 0) {\n            return;\n        }\n        hp = clampHp(hp - amount);\n    }\n\n    public void heal(int amount) {\n        if (amount < 0) {\n            return;\n        }\n        hp = clampHp(hp + amount);\n    }\n\n    /** What this hero shouts when attacking. Subclasses can override it. */\n    public String getBattleCry() {\n        return \"Hyah!\";\n    }\n\n    public void attack(Hero target) {\n        System.out.println(name + \": \" + getBattleCry());\n        int damage = calculateDamage();\n        System.out.println(name + \" hits \" + target.getName() + \" for \" + damage + \"!\");\n        target.takeDamage(damage);\n    }\n\n    /** Shown in the game's attack preview. */\n    public int previewDamage() {\n        return calculateDamage();\n    }\n\n    public void heal() {\n        hp = maxHp;\n    }\n\n    public String getHpBar() {\n        int filled = hp * 10 / maxHp;\n        String bar = \"\";\n        for (int i = 0; i < 10; i++) {\n            if (i < filled) {\n                bar += \"#\";\n            } else {\n                bar += \"-\";\n            }\n        }\n        return \"[\" + bar + \"] \" + hp + \"/\" + maxHp;\n    }\n\n    @Override\n    public String toString() {\n        return name + \" (Lv \" + level + \", \" + hp + \"/\" + maxHp + \" HP)\";\n    }\n\n    private int clampHp(int value) {\n        if (value < 0) {\n            return 0;\n        }\n        if (value > maxHp) {\n            return maxHp;\n        }\n        return value;\n    }\n\n    public void equip(Weapon w) {\n        weapon = w;\n    }\n\n    public Weapon getWeapon() {\n        return weapon;\n    }\n\n    private int calculateDamage() {\n        int damage = 6 + level * 3;\n        if (weapon != null) {\n            damage += weapon.getPower();\n        }\n        return damage;\n    }\n}\n", readOnly: true },
      { path: "Weapon.java", content: "/** A weapon a hero can equip. */\npublic class Weapon {\n    private String name;\n    private int power;\n\n    public Weapon(String name, int power) {\n        this.name = name;\n        this.power = power;\n    }\n\n    public String getName() {\n        return name;\n    }\n\n    public int getPower() {\n        return power;\n    }\n}\n", readOnly: true },
      { path: "Arena.java", content: "import java.util.ArrayList;\nimport java.util.List;\n\n/** Creates the characters you see in the game, and a small main for \u25b6 Run main. (Read-only.) */\npublic class Arena {\n    public static List<Object> setup() {\n        List<Object> world = new ArrayList<Object>();\n        world.add(new Hero(\"Aria\", 100));\n        world.add(new Potion(\"Red\", 30));\n        world.add(new Potion(\"Red\", 30));\n        world.add(new Potion(\"Blue\", 50));\n        return world;\n    }\n\n    public static void main(String[] args) {\n        Potion a = new Potion(\"Red\", 30);\n        Potion b = new Potion(\"Red\", 30);\n        System.out.println(a);\n        System.out.println(\"a == b: \" + (a == b));\n        System.out.println(\"a.equals(b): \" + a.equals(b));\n    }\n}\n", readOnly: true },
      { path: "PotionTest.java", content: "import tutor.Check;\n\npublic class PotionTest {\n    static void test1_toString() {\n        Check.equal(\"Red potion (+30)\", new Potion(\"Red\", 30).toString(), \"toString() format\");\n        Check.equal(\"Blue potion (+50)\", new Potion(\"Blue\", 50).toString(), \"toString() uses this potion's fields\");\n    }\n\n    static void test2_equalContents() {\n        Potion a = new Potion(\"Red\", 30), b = new Potion(\"Red\", 30);\n        Check.isTrue(a != b, \"a and b are two different objects (== is false)\");\n        Check.isTrue(a.equals(b), \"but they have the same contents, so a.equals(b) should be true\");\n        Check.isTrue(b.equals(a), \"and b.equals(a) too\");\n    }\n\n    static void test3_differentContents() {\n        Potion red = new Potion(\"Red\", 30);\n        Check.isTrue(!red.equals(new Potion(\"Blue\", 30)), \"different color: not equal\");\n        Check.isTrue(!red.equals(new Potion(\"Red\", 50)), \"different heal amount: not equal\");\n    }\n\n    static void test4_notAPotion() {\n        Potion red = new Potion(\"Red\", 30);\n        Check.isTrue(!red.equals(null), \"equals(null) must be false (and must not crash)\");\n        Check.isTrue(!red.equals(\"Red potion (+30)\"), \"a String is not a Potion, even with the same text\");\n    }\n\n    static void test5_equalsTakesObject() {\n        Check.isTrue(declared(\"Potion\", \"equals\", Object.class) != null,\n            \"the parameter must be Object, exactly like Object's equals; equals(Potion) would be an overload, and Java's own code would never call it\");\n    }\n\n\n    // ---- helpers: tests call new methods by name, so this file compiles before you write them ----\n    static Object call(Object target, String name, Object... args) {\n        for (java.lang.reflect.Method m : target.getClass().getMethods()) {\n            if (m.getName().equals(name) && m.getParameterCount() == args.length) {\n                try {\n                    return m.invoke(target, args);\n                } catch (java.lang.reflect.InvocationTargetException e) {\n                    throw new RuntimeException(e.getCause());\n                } catch (IllegalAccessException | IllegalArgumentException e) {\n                    continue;\n                }\n            }\n        }\n        Check.isTrue(false, \"No public method \" + name + \" with \" + args.length + \" parameter(s) in \" + target.getClass().getSimpleName());\n        return null;\n    }\n\n    static Object make(String cls, Object... args) {\n        try {\n            for (java.lang.reflect.Constructor<?> c : Class.forName(cls).getConstructors()) {\n                if (c.getParameterCount() == args.length) {\n                    try {\n                        return c.newInstance(args);\n                    } catch (IllegalArgumentException e) {\n                        continue;\n                    }\n                }\n            }\n        } catch (java.lang.reflect.InvocationTargetException e) {\n            throw new RuntimeException(e.getCause());\n        } catch (ReflectiveOperationException e) {\n            Check.isTrue(false, \"Cannot create \" + cls + \": \" + e);\n        }\n        Check.isTrue(false, \"No public constructor \" + cls + \" with \" + args.length + \" parameter(s)\");\n        return null;\n    }\n\n    static String out(Runnable r) {\n        java.io.PrintStream old = System.out;\n        java.io.ByteArrayOutputStream b = new java.io.ByteArrayOutputStream();\n        System.setOut(new java.io.PrintStream(b));\n        try {\n            r.run();\n        } finally {\n            System.setOut(old);\n        }\n        return b.toString().trim().replace(\"\\r\", \"\");\n    }\n\n    static java.lang.reflect.Field field(String cls, String name) {\n        try {\n            return Class.forName(cls).getDeclaredField(name);\n        } catch (ReflectiveOperationException e) {\n            return null;\n        }\n    }\n\n    static java.lang.reflect.Method declared(String cls, String name, Class<?>... params) {\n        try {\n            return Class.forName(cls).getDeclaredMethod(name, params);\n        } catch (ReflectiveOperationException e) {\n            return null;\n        }\n    }\n\n    static int mod(java.lang.reflect.Member m) {\n        return m.getModifiers();\n    }\n\n}\n", readOnly: true },
    ],
    mainClass: "Arena",
    testClass: "PotionTest",
    testLabels: {
      test1_toString: "toString()",
      test2_equalContents: "Same contents: equal",
      test3_differentContents: "Different contents: not equal",
      test4_notAPotion: "null and other types",
      test5_equalsTakesObject: "equals(Object), not equals(Potion)",
    },
    solution: "QF-214/Potion",
    hints: [
      "`return color + \" potion (+\" + healAmount + \")\";`",
      "The parameter must be `Object other`. Check `other instanceof Potion`, cast, then compare both fields.",
    ],
  },
};


const qf215: Ticket = {
  id: "QF-215",
  slug: "review-code-map",
  title: "Review: the whole arena on one map",
  xp: 120,
  learningGoal: {
    level: "easy",
    goal: "Find every class-design and inheritance idea of the sprint in one complete program, and say why each one is there.",
    techniques: ["Reading a whole program", "Naming concepts in real code", "Spot check (random concept, find it)"],
  },
  briefing: `Pixel Arena is done! 🎉 Before we ship, a quick **code review**: here is the whole game as one long program, everything you built in QF-201 to QF-214. Can you still point to each idea and say why it's there?`,
  objectives: [
    "Find each concept of the sprint in a complete program",
    "Explain why each one is used where it is",
    "Pass a spot check: a random concept, and you click where it is",
  ],
  blocks: [
    { type: "step", title: "Explore the map", focus: "read" },
    { type: "markdown", md: "Click a concept on the right to highlight every place it appears. Or click any line to see which ideas it shows. The file names are the grey lines." },
    { type: "code-map", title: "Pixel Arena, all of it", mode: "explore", code: "// ======================= Hero.java =======================\n/** A hero in Pixel Arena. */\npublic class Hero {\n    public static final int MAX_LEVEL = 99;\n    private static int heroCount = 0;\n\n    private String name;\n    private int hp;\n    private int maxHp;\n    private int level;\n    private Weapon weapon;\n\n    public Hero(String name, int maxHp) {\n        this.name = name;\n        this.maxHp = maxHp;\n        this.hp = maxHp;\n        this.level = 1;\n        heroCount++;\n    }\n\n    public Hero(String name) {\n        this(name, 100);\n    }\n\n    public static int getHeroCount() {\n        return heroCount;\n    }\n\n    public String getName() {\n        return name;\n    }\n\n    public int getHp() {\n        return hp;\n    }\n\n    public int getMaxHp() {\n        return maxHp;\n    }\n\n    public int getLevel() {\n        return level;\n    }\n\n    public void setLevel(int newLevel) {\n        if (newLevel >= 1 && newLevel <= MAX_LEVEL) {\n            level = newLevel;\n        }\n    }\n\n    public void takeDamage(int amount) {\n        if (amount < 0) {\n            return;\n        }\n        hp = clampHp(hp - amount);\n    }\n\n    public void heal(int amount) {\n        if (amount < 0) {\n            return;\n        }\n        hp = clampHp(hp + amount);\n    }\n\n    /** What this hero shouts when attacking. Subclasses can override it. */\n    public String getBattleCry() {\n        return \"Hyah!\";\n    }\n\n    public void attack(Hero target) {\n        System.out.println(name + \": \" + getBattleCry());\n        int damage = calculateDamage();\n        System.out.println(name + \" hits \" + target.getName() + \" for \" + damage + \"!\");\n        target.takeDamage(damage);\n    }\n\n    /** Shown in the game's attack preview. */\n    public int previewDamage() {\n        return calculateDamage();\n    }\n\n    public void heal() {\n        hp = maxHp;\n    }\n\n    public String getHpBar() {\n        int filled = hp * 10 / maxHp;\n        String bar = \"\";\n        for (int i = 0; i < 10; i++) {\n            if (i < filled) {\n                bar += \"#\";\n            } else {\n                bar += \"-\";\n            }\n        }\n        return \"[\" + bar + \"] \" + hp + \"/\" + maxHp;\n    }\n\n    @Override\n    public String toString() {\n        return name + \" (Lv \" + level + \", \" + hp + \"/\" + maxHp + \" HP)\";\n    }\n\n    private int clampHp(int value) {\n        if (value < 0) {\n            return 0;\n        }\n        if (value > maxHp) {\n            return maxHp;\n        }\n        return value;\n    }\n\n    public void equip(Weapon w) {\n        weapon = w;\n    }\n\n    public Weapon getWeapon() {\n        return weapon;\n    }\n\n    private int calculateDamage() {\n        int damage = 6 + level * 3;\n        if (weapon != null) {\n            damage += weapon.getPower();\n        }\n        return damage;\n    }\n}\n\n// ======================= Weapon.java =======================\n/** A weapon a hero can equip. */\npublic class Weapon {\n    private String name;\n    private int power;\n\n    public Weapon(String name, int power) {\n        this.name = name;\n        this.power = power;\n    }\n\n    public String getName() {\n        return name;\n    }\n\n    public int getPower() {\n        return power;\n    }\n}\n\n// ======================= Warrior.java =======================\n/** A warrior: a hero with more hp who can roar, and gains rage when attacking. */\npublic class Warrior extends Hero {\n    private int rage;\n\n    public Warrior(String name) {\n        super(name, 130);\n    }\n\n    public int getRage() {\n        return rage;\n    }\n\n    @Override\n    public String getBattleCry() {\n        return \"For the guild!\";\n    }\n\n    @Override\n    public void attack(Hero target) {\n        super.attack(target);\n        rage = rage + 10;\n    }\n\n    @Override\n    public String toString() {\n        return super.toString() + \" rage \" + rage;\n    }\n\n    public void roar() {\n        System.out.println(getName() + \" roars!\");\n        heal(5);\n    }\n}\n\n// ======================= Mage.java =======================\n/** A mage: a hero with less hp who has mana. */\npublic class Mage extends Hero {\n    private int mana;\n\n    public Mage(String name) {\n        super(name, 70);\n        mana = 50;\n    }\n\n    public int getMana() {\n        return mana;\n    }\n\n    /** Adds mana (used by stronger kinds of mages). */\n    public void addMana(int amount) {\n        if (amount > 0) {\n            mana = mana + amount;\n        }\n    }\n\n    @Override\n    public String toString() {\n        return super.toString() + \" mana \" + mana;\n    }\n\n    /** A spell: costs 10 mana and deals double damage. */\n    @Override\n    public void attack(Hero target) {\n        if (mana < 10) {\n            System.out.println(getName() + \" is out of mana!\");\n            return;\n        }\n        mana = mana - 10;\n        System.out.println(getName() + \": \" + getBattleCry());\n        int damage = previewDamage() * 2;\n        System.out.println(getName() + \" casts a spell on \" + target.getName() + \" for \" + damage + \"!\");\n        target.takeDamage(damage);\n    }\n}\n\n// ======================= Archmage.java =======================\n/** An archmage: a mage with extra mana. */\npublic class Archmage extends Mage {\n\n    public Archmage(String name) {\n        super(name);\n        addMana(50);\n    }\n\n    @Override\n    public String getBattleCry() {\n        return \"Witness true power!\";\n    }\n}\n\n// ======================= Roster.java =======================\n/** Team utilities. */\npublic class Roster {\n\n    /** Total hp of every hero in the array, whatever kind of hero each one is. */\n    public static int totalHp(Hero[] party) {\n        int total = 0;\n        for (Hero h : party) {\n            total = total + h.getHp();\n        }\n        return total;\n    }\n}\n\n// ======================= Party.java =======================\nimport java.util.ArrayList;\n\n/** A party of heroes of any kind. */\npublic class Party {\n    private ArrayList<Hero> members = new ArrayList<Hero>();\n\n    public void add(Hero h) {\n        members.add(h);\n    }\n\n    public int size() {\n        return members.size();\n    }\n\n    public void allAttack(Hero target) {\n        for (Hero h : members) {\n            h.attack(target);\n        }\n    }\n\n    public int totalHp() {\n        int total = 0;\n        for (Hero h : members) {\n            total = total + h.getHp();\n        }\n        return total;\n    }\n}\n\n// ======================= Potion.java =======================\n/** A potion in the backpack. */\npublic class Potion {\n    private String color;\n    private int healAmount;\n\n    public Potion(String color, int healAmount) {\n        this.color = color;\n        this.healAmount = healAmount;\n    }\n\n    public String getColor() {\n        return color;\n    }\n\n    public int getHealAmount() {\n        return healAmount;\n    }\n\n    /** True only if other is this very same object. */\n    public boolean isSameObject(Potion other) {\n        return this == other;\n    }\n\n    @Override\n    public String toString() {\n        return color + \" potion (+\" + healAmount + \")\";\n    }\n\n    @Override\n    public boolean equals(Object other) {\n        if (!(other instanceof Potion)) {\n            return false;\n        }\n        Potion p = (Potion) other;\n        return color.equals(p.color) && healAmount == p.healAmount;\n    }\n}\n\n// ======================= Arena.java =======================\nimport java.util.ArrayList;\nimport java.util.List;\n\n/** The whole Pixel Arena: everything you built in QF-201 to QF-214. */\npublic class Arena {\n    public static List<Object> setup() {\n        Hero aria = new Hero(\"Aria\", 100);\n        Warrior bram = new Warrior(\"Bram\");\n        Mage cara = new Mage(\"Cara\");\n        Archmage zed = new Archmage(\"Zed\");\n        Party party = new Party();\n        party.add(aria);\n        party.add(bram);\n        party.add(cara);\n        party.add(zed);\n        List<Object> world = new ArrayList<Object>();\n        world.add(aria);\n        world.add(bram);\n        world.add(cara);\n        world.add(zed);\n        world.add(new Hero(\"Training Dummy\", 300));\n        world.add(party);\n        world.add(new Weapon(\"Iron Sword\", 5));\n        world.add(new Potion(\"Red\", 30));\n        world.add(new Potion(\"Red\", 30));\n        return world;\n    }\n\n    public static void main(String[] args) {\n        Party party = new Party();\n        party.add(new Warrior(\"Bram\"));\n        party.add(new Mage(\"Cara\"));\n        Hero dummy = new Hero(\"Training Dummy\", 300);\n        party.allAttack(dummy);\n        System.out.println(dummy);\n        System.out.println(\"Heroes created: \" + Hero.getHeroCount());\n    }\n}", concepts: [{"id": "fields", "label": "Fields & constructor", "group": "Class design", "explain": "Every Hero object gets its own copy of these fields; the constructor fills them for each `new`. `this.name` is the field, `name` the parameter.", "ranges": [[7, 11], [13, 19]]}, {"id": "private", "label": "private fields", "group": "Class design", "explain": "Only code inside the class can touch a private field, so the class's rules can't be skipped from outside. Look for `private` on every field of every class.", "ranges": [[7, 11], [134, 134], [135, 135], [154, 154], [189, 189], [261, 261], [289, 289], [290, 290]]}, {"id": "getters", "label": "Getters", "group": "Class design", "explain": "Public methods that let outside code read a private field.", "ranges": [[29, 31], [33, 35], [37, 39], [41, 43], [142, 144], [146, 148]]}, {"id": "setter", "label": "Setter with a rule", "group": "Class design", "explain": "The only way to change level, so the 1..MAX_LEVEL rule can never be skipped.", "ranges": [[45, 49]]}, {"id": "nosetter", "label": "No setter: actions instead", "group": "Class design", "explain": "hp has no setHp. It only changes through takeDamage and heal, which say what happened and keep hp between 0 and maxHp. name has no setter either: it is read-only.", "ranges": [[51, 56], [58, 63]]}, {"id": "computed", "label": "Getter that computes", "group": "Class design", "explain": "There is no hpBar field: getHpBar() builds the text from hp and maxHp every time.", "ranges": [[86, 97]]}, {"id": "privmethods", "label": "private helper methods", "group": "Class design", "explain": "Internal steps of Hero's work. Nothing outside Hero may call them, so Hero can change them (like the damage formula) without breaking other code.", "ranges": [[104, 112], [122, 128]]}, {"id": "static", "label": "static & constants", "group": "Class design", "explain": "One copy for the whole class: the hero counter, the method that reads it (called as Hero.getHeroCount()), and the constant MAX_LEVEL.", "ranges": [[4, 4], [5, 5], [18, 18], [25, 27], [361, 361], [247, 253]]}, {"id": "overloading", "label": "Overloading", "group": "Class design", "explain": "Same name, different parameters: two Hero constructors, and heal(int) next to heal(). Java picks one by the arguments.", "ranges": [[13, 19], [21, 23], [58, 63], [82, 84]]}, {"id": "thiscall", "label": "this(...)", "group": "Class design", "explain": "One constructor runs another, so a hero is set up in one place.", "ranges": [[22, 22]]}, {"id": "hasa", "label": "has-a (composition)", "group": "Class design", "explain": "A hero has a weapon: a field of another class, not inheritance. null means no weapon yet. A Party has a list of heroes.", "ranges": [[11, 11], [114, 116], [118, 120], [124, 124], [261, 261]]}, {"id": "extends", "label": "extends (is-a)", "group": "Inheritance", "explain": "A Warrior is a Hero, a Mage is a Hero, an Archmage is a Mage. Each subclass only writes what is different.", "ranges": [[153, 153], [188, 188], [229, 229]]}, {"id": "super", "label": "super(...)", "group": "Inheritance", "explain": "The first line of a subclass constructor: the superclass builds its own (private) part first.", "ranges": [[157, 157], [192, 192], [232, 232]]}, {"id": "overriding", "label": "Overriding & @Override", "group": "Inheritance", "explain": "Same name and same parameters as the superclass method: the subclass's version replaces it for those objects. @Override asks the compiler to check.", "ranges": [[164, 167], [213, 224], [236, 239], [169, 173]]}, {"id": "supermethod", "label": "super.method()", "group": "Inheritance", "explain": "Run the superclass's version, then add to it: the warrior's attack is a hero's attack plus rage; toString adds rage or mana to Hero's text.", "ranges": [[171, 171], [177, 177], [209, 209]]}, {"id": "hierarchy", "label": "Hierarchy & Hero references", "group": "Inheritance", "explain": "A variable or array of type Hero can hold any kind of hero. totalHp is written once for all of them.", "ranges": [[247, 253], [263, 263], [332, 335]]}, {"id": "polymorphism", "label": "Polymorphism", "group": "Inheritance", "explain": "One call, h.attack(target), and each object runs its own class's attack: Hero, Warrior, Mage, or Mage's for the Archmage. Inside Hero.attack, getBattleCry() is polymorphic too.", "ranges": [[271, 275], [71, 71]]}, {"id": "object", "label": "Object: toString", "group": "Object", "explain": "Every class extends Object. Overriding toString() replaces the default Potion@6d06d69c with readable text.", "ranges": [[99, 102], [310, 313]]}, {"id": "equals", "label": "== vs equals(Object)", "group": "Object", "explain": "== asks: the very same object? equals asks: the same meaning? The parameter must be Object; instanceof and a cast come first.", "ranges": [[306, 308], [315, 322]]}] },
    { type: "step", title: "Spot check", focus: "read" },
    { type: "markdown", md: "Now without help: a random concept is named, you click **one line** that shows it. Then all its places light up. Go through as many as you like; your score is on the right." },
    { type: "code-map", title: "Pixel Arena, all of it", mode: "quiz", code: "// ======================= Hero.java =======================\n/** A hero in Pixel Arena. */\npublic class Hero {\n    public static final int MAX_LEVEL = 99;\n    private static int heroCount = 0;\n\n    private String name;\n    private int hp;\n    private int maxHp;\n    private int level;\n    private Weapon weapon;\n\n    public Hero(String name, int maxHp) {\n        this.name = name;\n        this.maxHp = maxHp;\n        this.hp = maxHp;\n        this.level = 1;\n        heroCount++;\n    }\n\n    public Hero(String name) {\n        this(name, 100);\n    }\n\n    public static int getHeroCount() {\n        return heroCount;\n    }\n\n    public String getName() {\n        return name;\n    }\n\n    public int getHp() {\n        return hp;\n    }\n\n    public int getMaxHp() {\n        return maxHp;\n    }\n\n    public int getLevel() {\n        return level;\n    }\n\n    public void setLevel(int newLevel) {\n        if (newLevel >= 1 && newLevel <= MAX_LEVEL) {\n            level = newLevel;\n        }\n    }\n\n    public void takeDamage(int amount) {\n        if (amount < 0) {\n            return;\n        }\n        hp = clampHp(hp - amount);\n    }\n\n    public void heal(int amount) {\n        if (amount < 0) {\n            return;\n        }\n        hp = clampHp(hp + amount);\n    }\n\n    /** What this hero shouts when attacking. Subclasses can override it. */\n    public String getBattleCry() {\n        return \"Hyah!\";\n    }\n\n    public void attack(Hero target) {\n        System.out.println(name + \": \" + getBattleCry());\n        int damage = calculateDamage();\n        System.out.println(name + \" hits \" + target.getName() + \" for \" + damage + \"!\");\n        target.takeDamage(damage);\n    }\n\n    /** Shown in the game's attack preview. */\n    public int previewDamage() {\n        return calculateDamage();\n    }\n\n    public void heal() {\n        hp = maxHp;\n    }\n\n    public String getHpBar() {\n        int filled = hp * 10 / maxHp;\n        String bar = \"\";\n        for (int i = 0; i < 10; i++) {\n            if (i < filled) {\n                bar += \"#\";\n            } else {\n                bar += \"-\";\n            }\n        }\n        return \"[\" + bar + \"] \" + hp + \"/\" + maxHp;\n    }\n\n    @Override\n    public String toString() {\n        return name + \" (Lv \" + level + \", \" + hp + \"/\" + maxHp + \" HP)\";\n    }\n\n    private int clampHp(int value) {\n        if (value < 0) {\n            return 0;\n        }\n        if (value > maxHp) {\n            return maxHp;\n        }\n        return value;\n    }\n\n    public void equip(Weapon w) {\n        weapon = w;\n    }\n\n    public Weapon getWeapon() {\n        return weapon;\n    }\n\n    private int calculateDamage() {\n        int damage = 6 + level * 3;\n        if (weapon != null) {\n            damage += weapon.getPower();\n        }\n        return damage;\n    }\n}\n\n// ======================= Weapon.java =======================\n/** A weapon a hero can equip. */\npublic class Weapon {\n    private String name;\n    private int power;\n\n    public Weapon(String name, int power) {\n        this.name = name;\n        this.power = power;\n    }\n\n    public String getName() {\n        return name;\n    }\n\n    public int getPower() {\n        return power;\n    }\n}\n\n// ======================= Warrior.java =======================\n/** A warrior: a hero with more hp who can roar, and gains rage when attacking. */\npublic class Warrior extends Hero {\n    private int rage;\n\n    public Warrior(String name) {\n        super(name, 130);\n    }\n\n    public int getRage() {\n        return rage;\n    }\n\n    @Override\n    public String getBattleCry() {\n        return \"For the guild!\";\n    }\n\n    @Override\n    public void attack(Hero target) {\n        super.attack(target);\n        rage = rage + 10;\n    }\n\n    @Override\n    public String toString() {\n        return super.toString() + \" rage \" + rage;\n    }\n\n    public void roar() {\n        System.out.println(getName() + \" roars!\");\n        heal(5);\n    }\n}\n\n// ======================= Mage.java =======================\n/** A mage: a hero with less hp who has mana. */\npublic class Mage extends Hero {\n    private int mana;\n\n    public Mage(String name) {\n        super(name, 70);\n        mana = 50;\n    }\n\n    public int getMana() {\n        return mana;\n    }\n\n    /** Adds mana (used by stronger kinds of mages). */\n    public void addMana(int amount) {\n        if (amount > 0) {\n            mana = mana + amount;\n        }\n    }\n\n    @Override\n    public String toString() {\n        return super.toString() + \" mana \" + mana;\n    }\n\n    /** A spell: costs 10 mana and deals double damage. */\n    @Override\n    public void attack(Hero target) {\n        if (mana < 10) {\n            System.out.println(getName() + \" is out of mana!\");\n            return;\n        }\n        mana = mana - 10;\n        System.out.println(getName() + \": \" + getBattleCry());\n        int damage = previewDamage() * 2;\n        System.out.println(getName() + \" casts a spell on \" + target.getName() + \" for \" + damage + \"!\");\n        target.takeDamage(damage);\n    }\n}\n\n// ======================= Archmage.java =======================\n/** An archmage: a mage with extra mana. */\npublic class Archmage extends Mage {\n\n    public Archmage(String name) {\n        super(name);\n        addMana(50);\n    }\n\n    @Override\n    public String getBattleCry() {\n        return \"Witness true power!\";\n    }\n}\n\n// ======================= Roster.java =======================\n/** Team utilities. */\npublic class Roster {\n\n    /** Total hp of every hero in the array, whatever kind of hero each one is. */\n    public static int totalHp(Hero[] party) {\n        int total = 0;\n        for (Hero h : party) {\n            total = total + h.getHp();\n        }\n        return total;\n    }\n}\n\n// ======================= Party.java =======================\nimport java.util.ArrayList;\n\n/** A party of heroes of any kind. */\npublic class Party {\n    private ArrayList<Hero> members = new ArrayList<Hero>();\n\n    public void add(Hero h) {\n        members.add(h);\n    }\n\n    public int size() {\n        return members.size();\n    }\n\n    public void allAttack(Hero target) {\n        for (Hero h : members) {\n            h.attack(target);\n        }\n    }\n\n    public int totalHp() {\n        int total = 0;\n        for (Hero h : members) {\n            total = total + h.getHp();\n        }\n        return total;\n    }\n}\n\n// ======================= Potion.java =======================\n/** A potion in the backpack. */\npublic class Potion {\n    private String color;\n    private int healAmount;\n\n    public Potion(String color, int healAmount) {\n        this.color = color;\n        this.healAmount = healAmount;\n    }\n\n    public String getColor() {\n        return color;\n    }\n\n    public int getHealAmount() {\n        return healAmount;\n    }\n\n    /** True only if other is this very same object. */\n    public boolean isSameObject(Potion other) {\n        return this == other;\n    }\n\n    @Override\n    public String toString() {\n        return color + \" potion (+\" + healAmount + \")\";\n    }\n\n    @Override\n    public boolean equals(Object other) {\n        if (!(other instanceof Potion)) {\n            return false;\n        }\n        Potion p = (Potion) other;\n        return color.equals(p.color) && healAmount == p.healAmount;\n    }\n}\n\n// ======================= Arena.java =======================\nimport java.util.ArrayList;\nimport java.util.List;\n\n/** The whole Pixel Arena: everything you built in QF-201 to QF-214. */\npublic class Arena {\n    public static List<Object> setup() {\n        Hero aria = new Hero(\"Aria\", 100);\n        Warrior bram = new Warrior(\"Bram\");\n        Mage cara = new Mage(\"Cara\");\n        Archmage zed = new Archmage(\"Zed\");\n        Party party = new Party();\n        party.add(aria);\n        party.add(bram);\n        party.add(cara);\n        party.add(zed);\n        List<Object> world = new ArrayList<Object>();\n        world.add(aria);\n        world.add(bram);\n        world.add(cara);\n        world.add(zed);\n        world.add(new Hero(\"Training Dummy\", 300));\n        world.add(party);\n        world.add(new Weapon(\"Iron Sword\", 5));\n        world.add(new Potion(\"Red\", 30));\n        world.add(new Potion(\"Red\", 30));\n        return world;\n    }\n\n    public static void main(String[] args) {\n        Party party = new Party();\n        party.add(new Warrior(\"Bram\"));\n        party.add(new Mage(\"Cara\"));\n        Hero dummy = new Hero(\"Training Dummy\", 300);\n        party.allAttack(dummy);\n        System.out.println(dummy);\n        System.out.println(\"Heroes created: \" + Hero.getHeroCount());\n    }\n}", concepts: [{"id": "fields", "label": "Fields & constructor", "group": "Class design", "explain": "Every Hero object gets its own copy of these fields; the constructor fills them for each `new`. `this.name` is the field, `name` the parameter.", "ranges": [[7, 11], [13, 19]]}, {"id": "private", "label": "private fields", "group": "Class design", "explain": "Only code inside the class can touch a private field, so the class's rules can't be skipped from outside. Look for `private` on every field of every class.", "ranges": [[7, 11], [134, 134], [135, 135], [154, 154], [189, 189], [261, 261], [289, 289], [290, 290]]}, {"id": "getters", "label": "Getters", "group": "Class design", "explain": "Public methods that let outside code read a private field.", "ranges": [[29, 31], [33, 35], [37, 39], [41, 43], [142, 144], [146, 148]]}, {"id": "setter", "label": "Setter with a rule", "group": "Class design", "explain": "The only way to change level, so the 1..MAX_LEVEL rule can never be skipped.", "ranges": [[45, 49]]}, {"id": "nosetter", "label": "No setter: actions instead", "group": "Class design", "explain": "hp has no setHp. It only changes through takeDamage and heal, which say what happened and keep hp between 0 and maxHp. name has no setter either: it is read-only.", "ranges": [[51, 56], [58, 63]]}, {"id": "computed", "label": "Getter that computes", "group": "Class design", "explain": "There is no hpBar field: getHpBar() builds the text from hp and maxHp every time.", "ranges": [[86, 97]]}, {"id": "privmethods", "label": "private helper methods", "group": "Class design", "explain": "Internal steps of Hero's work. Nothing outside Hero may call them, so Hero can change them (like the damage formula) without breaking other code.", "ranges": [[104, 112], [122, 128]]}, {"id": "static", "label": "static & constants", "group": "Class design", "explain": "One copy for the whole class: the hero counter, the method that reads it (called as Hero.getHeroCount()), and the constant MAX_LEVEL.", "ranges": [[4, 4], [5, 5], [18, 18], [25, 27], [361, 361], [247, 253]]}, {"id": "overloading", "label": "Overloading", "group": "Class design", "explain": "Same name, different parameters: two Hero constructors, and heal(int) next to heal(). Java picks one by the arguments.", "ranges": [[13, 19], [21, 23], [58, 63], [82, 84]]}, {"id": "thiscall", "label": "this(...)", "group": "Class design", "explain": "One constructor runs another, so a hero is set up in one place.", "ranges": [[22, 22]]}, {"id": "hasa", "label": "has-a (composition)", "group": "Class design", "explain": "A hero has a weapon: a field of another class, not inheritance. null means no weapon yet. A Party has a list of heroes.", "ranges": [[11, 11], [114, 116], [118, 120], [124, 124], [261, 261]]}, {"id": "extends", "label": "extends (is-a)", "group": "Inheritance", "explain": "A Warrior is a Hero, a Mage is a Hero, an Archmage is a Mage. Each subclass only writes what is different.", "ranges": [[153, 153], [188, 188], [229, 229]]}, {"id": "super", "label": "super(...)", "group": "Inheritance", "explain": "The first line of a subclass constructor: the superclass builds its own (private) part first.", "ranges": [[157, 157], [192, 192], [232, 232]]}, {"id": "overriding", "label": "Overriding & @Override", "group": "Inheritance", "explain": "Same name and same parameters as the superclass method: the subclass's version replaces it for those objects. @Override asks the compiler to check.", "ranges": [[164, 167], [213, 224], [236, 239], [169, 173]]}, {"id": "supermethod", "label": "super.method()", "group": "Inheritance", "explain": "Run the superclass's version, then add to it: the warrior's attack is a hero's attack plus rage; toString adds rage or mana to Hero's text.", "ranges": [[171, 171], [177, 177], [209, 209]]}, {"id": "hierarchy", "label": "Hierarchy & Hero references", "group": "Inheritance", "explain": "A variable or array of type Hero can hold any kind of hero. totalHp is written once for all of them.", "ranges": [[247, 253], [263, 263], [332, 335]]}, {"id": "polymorphism", "label": "Polymorphism", "group": "Inheritance", "explain": "One call, h.attack(target), and each object runs its own class's attack: Hero, Warrior, Mage, or Mage's for the Archmage. Inside Hero.attack, getBattleCry() is polymorphic too.", "ranges": [[271, 275], [71, 71]]}, {"id": "object", "label": "Object: toString", "group": "Object", "explain": "Every class extends Object. Overriding toString() replaces the default Potion@6d06d69c with readable text.", "ranges": [[99, 102], [310, 313]]}, {"id": "equals", "label": "== vs equals(Object)", "group": "Object", "explain": "== asks: the very same object? equals asks: the same meaning? The parameter must be Object; instanceof and a cast come first.", "ranges": [[306, 308], [315, 322]]}] },
    { type: "step", title: "Run the whole game", focus: "build" },
    { type: "markdown", md: "The same code, compiled and running. Press **✓ Run tests** to confirm the whole arena still works, then play: equip the sword, let the party attack the dummy, compare the potions.\n\nYou may change anything except `Arena.java` and try ideas out. If you break something, **↺ Reset** brings the code back." },
    {
      type: "short-answer",
      id: "qf215-favorite",
      question: "Pick one concept from the map and explain to a new teammate why the code uses it right there.",
      placeholder: "In Hero, … is used because…",
      modelAnswer: "For example: hp has no setter because it should only change through game events. takeDamage and heal enforce the rules (never below 0, never above maxHp) and say what happened, so no code can put a nonsense value into hp.",
    },
  ],
  visualizations: [],
  game: {},
  task: {
    instructions: "Explore the map, try the spot check, then run the tests on the complete game.",
    files: [{"path": "Hero.java", "content": "/** A hero in Pixel Arena. */\npublic class Hero {\n    public static final int MAX_LEVEL = 99;\n    private static int heroCount = 0;\n\n    private String name;\n    private int hp;\n    private int maxHp;\n    private int level;\n    private Weapon weapon;\n\n    public Hero(String name, int maxHp) {\n        this.name = name;\n        this.maxHp = maxHp;\n        this.hp = maxHp;\n        this.level = 1;\n        heroCount++;\n    }\n\n    public Hero(String name) {\n        this(name, 100);\n    }\n\n    public static int getHeroCount() {\n        return heroCount;\n    }\n\n    public String getName() {\n        return name;\n    }\n\n    public int getHp() {\n        return hp;\n    }\n\n    public int getMaxHp() {\n        return maxHp;\n    }\n\n    public int getLevel() {\n        return level;\n    }\n\n    public void setLevel(int newLevel) {\n        if (newLevel >= 1 && newLevel <= MAX_LEVEL) {\n            level = newLevel;\n        }\n    }\n\n    public void takeDamage(int amount) {\n        if (amount < 0) {\n            return;\n        }\n        hp = clampHp(hp - amount);\n    }\n\n    public void heal(int amount) {\n        if (amount < 0) {\n            return;\n        }\n        hp = clampHp(hp + amount);\n    }\n\n    /** What this hero shouts when attacking. Subclasses can override it. */\n    public String getBattleCry() {\n        return \"Hyah!\";\n    }\n\n    public void attack(Hero target) {\n        System.out.println(name + \": \" + getBattleCry());\n        int damage = calculateDamage();\n        System.out.println(name + \" hits \" + target.getName() + \" for \" + damage + \"!\");\n        target.takeDamage(damage);\n    }\n\n    /** Shown in the game's attack preview. */\n    public int previewDamage() {\n        return calculateDamage();\n    }\n\n    public void heal() {\n        hp = maxHp;\n    }\n\n    public String getHpBar() {\n        int filled = hp * 10 / maxHp;\n        String bar = \"\";\n        for (int i = 0; i < 10; i++) {\n            if (i < filled) {\n                bar += \"#\";\n            } else {\n                bar += \"-\";\n            }\n        }\n        return \"[\" + bar + \"] \" + hp + \"/\" + maxHp;\n    }\n\n    @Override\n    public String toString() {\n        return name + \" (Lv \" + level + \", \" + hp + \"/\" + maxHp + \" HP)\";\n    }\n\n    private int clampHp(int value) {\n        if (value < 0) {\n            return 0;\n        }\n        if (value > maxHp) {\n            return maxHp;\n        }\n        return value;\n    }\n\n    public void equip(Weapon w) {\n        weapon = w;\n    }\n\n    public Weapon getWeapon() {\n        return weapon;\n    }\n\n    private int calculateDamage() {\n        int damage = 6 + level * 3;\n        if (weapon != null) {\n            damage += weapon.getPower();\n        }\n        return damage;\n    }\n}\n"}, {"path": "Weapon.java", "content": "/** A weapon a hero can equip. */\npublic class Weapon {\n    private String name;\n    private int power;\n\n    public Weapon(String name, int power) {\n        this.name = name;\n        this.power = power;\n    }\n\n    public String getName() {\n        return name;\n    }\n\n    public int getPower() {\n        return power;\n    }\n}\n"}, {"path": "Warrior.java", "content": "/** A warrior: a hero with more hp who can roar, and gains rage when attacking. */\npublic class Warrior extends Hero {\n    private int rage;\n\n    public Warrior(String name) {\n        super(name, 130);\n    }\n\n    public int getRage() {\n        return rage;\n    }\n\n    @Override\n    public String getBattleCry() {\n        return \"For the guild!\";\n    }\n\n    @Override\n    public void attack(Hero target) {\n        super.attack(target);\n        rage = rage + 10;\n    }\n\n    @Override\n    public String toString() {\n        return super.toString() + \" rage \" + rage;\n    }\n\n    public void roar() {\n        System.out.println(getName() + \" roars!\");\n        heal(5);\n    }\n}\n"}, {"path": "Mage.java", "content": "/** A mage: a hero with less hp who has mana. */\npublic class Mage extends Hero {\n    private int mana;\n\n    public Mage(String name) {\n        super(name, 70);\n        mana = 50;\n    }\n\n    public int getMana() {\n        return mana;\n    }\n\n    /** Adds mana (used by stronger kinds of mages). */\n    public void addMana(int amount) {\n        if (amount > 0) {\n            mana = mana + amount;\n        }\n    }\n\n    @Override\n    public String toString() {\n        return super.toString() + \" mana \" + mana;\n    }\n\n    /** A spell: costs 10 mana and deals double damage. */\n    @Override\n    public void attack(Hero target) {\n        if (mana < 10) {\n            System.out.println(getName() + \" is out of mana!\");\n            return;\n        }\n        mana = mana - 10;\n        System.out.println(getName() + \": \" + getBattleCry());\n        int damage = previewDamage() * 2;\n        System.out.println(getName() + \" casts a spell on \" + target.getName() + \" for \" + damage + \"!\");\n        target.takeDamage(damage);\n    }\n}\n"}, {"path": "Archmage.java", "content": "/** An archmage: a mage with extra mana. */\npublic class Archmage extends Mage {\n\n    public Archmage(String name) {\n        super(name);\n        addMana(50);\n    }\n\n    @Override\n    public String getBattleCry() {\n        return \"Witness true power!\";\n    }\n}\n"}, {"path": "Roster.java", "content": "/** Team utilities. */\npublic class Roster {\n\n    /** Total hp of every hero in the array, whatever kind of hero each one is. */\n    public static int totalHp(Hero[] party) {\n        int total = 0;\n        for (Hero h : party) {\n            total = total + h.getHp();\n        }\n        return total;\n    }\n}\n"}, {"path": "Party.java", "content": "import java.util.ArrayList;\n\n/** A party of heroes of any kind. */\npublic class Party {\n    private ArrayList<Hero> members = new ArrayList<Hero>();\n\n    public void add(Hero h) {\n        members.add(h);\n    }\n\n    public int size() {\n        return members.size();\n    }\n\n    public void allAttack(Hero target) {\n        for (Hero h : members) {\n            h.attack(target);\n        }\n    }\n\n    public int totalHp() {\n        int total = 0;\n        for (Hero h : members) {\n            total = total + h.getHp();\n        }\n        return total;\n    }\n}\n"}, {"path": "Potion.java", "content": "/** A potion in the backpack. */\npublic class Potion {\n    private String color;\n    private int healAmount;\n\n    public Potion(String color, int healAmount) {\n        this.color = color;\n        this.healAmount = healAmount;\n    }\n\n    public String getColor() {\n        return color;\n    }\n\n    public int getHealAmount() {\n        return healAmount;\n    }\n\n    /** True only if other is this very same object. */\n    public boolean isSameObject(Potion other) {\n        return this == other;\n    }\n\n    @Override\n    public String toString() {\n        return color + \" potion (+\" + healAmount + \")\";\n    }\n\n    @Override\n    public boolean equals(Object other) {\n        if (!(other instanceof Potion)) {\n            return false;\n        }\n        Potion p = (Potion) other;\n        return color.equals(p.color) && healAmount == p.healAmount;\n    }\n}\n"}, {"path": "Arena.java", "content": "import java.util.ArrayList;\nimport java.util.List;\n\n/** The whole Pixel Arena: everything you built in QF-201 to QF-214. */\npublic class Arena {\n    public static List<Object> setup() {\n        Hero aria = new Hero(\"Aria\", 100);\n        Warrior bram = new Warrior(\"Bram\");\n        Mage cara = new Mage(\"Cara\");\n        Archmage zed = new Archmage(\"Zed\");\n        Party party = new Party();\n        party.add(aria);\n        party.add(bram);\n        party.add(cara);\n        party.add(zed);\n        List<Object> world = new ArrayList<Object>();\n        world.add(aria);\n        world.add(bram);\n        world.add(cara);\n        world.add(zed);\n        world.add(new Hero(\"Training Dummy\", 300));\n        world.add(party);\n        world.add(new Weapon(\"Iron Sword\", 5));\n        world.add(new Potion(\"Red\", 30));\n        world.add(new Potion(\"Red\", 30));\n        return world;\n    }\n\n    public static void main(String[] args) {\n        Party party = new Party();\n        party.add(new Warrior(\"Bram\"));\n        party.add(new Mage(\"Cara\"));\n        Hero dummy = new Hero(\"Training Dummy\", 300);\n        party.allAttack(dummy);\n        System.out.println(dummy);\n        System.out.println(\"Heroes created: \" + Hero.getHeroCount());\n    }\n}\n", "readOnly": true}, {"path": "ReviewTest.java", "content": "import tutor.Check;\n\npublic class ReviewTest {\n    static void test1_wholeArenaBuilds() {\n        Check.equal(9, Arena.setup().size(), \"Arena.setup() builds 4 heroes, a dummy, a party, a sword and 2 potions\");\n    }\n\n    static void test2_partyAttack() {\n        Party party = new Party();\n        party.add(new Hero(\"Aria\", 100));\n        party.add(new Warrior(\"Bram\"));\n        party.add(new Mage(\"Cara\"));\n        party.add(new Archmage(\"Zed\"));\n        Hero dummy = new Hero(\"Training Dummy\", 300);\n        party.allAttack(dummy);\n        Check.equal(246, dummy.getHp(), \"every member attacks with its own attack: 9 + 9 + 18 + 18 = 54 damage\");\n    }\n\n    static void test3_potionsAreEqual() {\n        Potion a = new Potion(\"Red\", 30), b = new Potion(\"Red\", 30);\n        Check.isTrue(a.equals(b) && !a.isSameObject(b), \"two red +30 potions: equal, but not the same object\");\n    }\n}\n", "readOnly": true}],
    mainClass: "Arena",
    testClass: "ReviewTest",
    testLabels: {
      test1_wholeArenaBuilds: "The whole arena builds",
      test2_partyAttack: "Polymorphic party attack: 300 → 246",
      test3_potionsAreEqual: "equals vs the same object",
    },
    hints: ["Nothing to fix here: if a test fails, press ↺ Reset to get the original code back."],
    solution: "QF-215",
    review: true,
  },
};

export const tickets: Ticket[] = [qf201, qf202, qf203, qf204, qf205, qf206, qf207, qf208, qf209, qf210, qf211, qf212, qf213, qf214, qf215];
