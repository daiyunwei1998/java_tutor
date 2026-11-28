# Spec C — Sprint 2: Inheritance (Runestone CSJava Unit 10)

**Status:** v2.0 (2026-11-28) · **implemented as Pixel Arena** (QuestForge Games), QF-201 to QF-214 in `src/content/sprints/s02-inheritance/`. The Filter Plugin System case and tickets PF-300 to PF-303 described below were replaced; the textbook coverage and the why-first pattern still apply. Current mapping:

| Ticket | Theme | Textbook |
|---|---|---|
| QF-201 | objects, fields, constructor, this | review |
| QF-202 | private vs public: try both from outside, then getters/setters, "why not public?" | review |
| QF-203 | setters with rules, getters that compute, fields with no setter (takeDamage/heal instead of setHp) | review |
| QF-204 | private helper methods, balance patch in one place | review |
| QF-205 | static counter, static method, constants (why) | review |
| QF-206 | overloading: heal() / heal(int), Hero(String) with this(...) | review |
| QF-207 | is-a vs has-a MCQs, Hero has-a Weapon | 10.1 |
| QF-208 | extends (replacing a copied class) | 10.1 |
| QF-209 | constructors and super(...) | 10.2 |
| QF-210 | overriding (custom battle cry), @Override, overload trap | 10.3 |
| QF-211 | super.method(), super.toString() | 10.4 |
| QF-212 | hierarchy (Archmage), superclass references, Hero[] | 10.5 |
| QF-213 | polymorphism: Party.allAttack over ArrayList<Hero> | 10.6 |
| QF-214 | Object, toString, == vs equals(Object) with potions | 10.7 |

Every game ticket uses the two-column workspace: lesson and code on the left, the game (running the student's own code through `src/lib/game/GameBridge.java`) and a class preview on the right.

**Original v1.2 status:** implemented in part: Sprint 2 contained PF-300 to PF-303 and five Knowledge Space topics
**Parent product:** Interactive CS Learning Platform (Spec B)
**Previous sprint:** Sprint 1 — 2D Arrays (Mini Photoshop)
**Target learners:** High-school Java / AP Computer Science A students
**Prerequisites:** references and aliasing (Sprint 1), writing classes, `ArrayList`. The bridge tickets PF-300 / PF-301 review the first two in depth, because students' early understanding of fields and methods is weak.

**Changes**

- v1.1: **why-first lesson pattern** (§1.1); **bridge lessons** 0A (primitive vs reference types) and 0B (fields and methods); tickets renumbered so PF-300 / PF-301 are the bridge tickets and inheritance starts at PF-302.
- v1.2: adapted to the platform as it is now (sprints, English UI, existing Knowledge Space and TraceViewer). Visualizations reuse the existing code ↔ memory trace instead of new components (§5).

**Curriculum reference:** Runestone CS Java (csjava / BHSawesome numbering), Unit 10 — Inheritance, sections 10.1–10.14

## 0. Curriculum Review and Scope Decision

### 0.1 Textbook coverage

| Textbook section | Topic | Covered in |
|---|---|---|
| (review of Units 1–2, 6) | primitive vs reference types, assignment, fields vs local variables, instance methods | Lessons 0A–0B · PF-300, PF-301 |
| 10.1 Inheritance, Superclass, Subclass (incl. is-a vs has-a) | `extends`, what is and is not inherited, `private` access | Lesson 1 · PF-302 |
| 10.2 Inheritance and Constructors | constructors not inherited, `super(...)`, implicit `super()` | Lesson 2 · PF-302 |
| 10.3 Overriding Methods | overriding vs overloading, `@Override` | Lesson 3 · PF-303 |
| 10.4 `super` Keyword | `super.method()` | Lesson 3 · PF-304 |
| 10.5 Inheritance Hierarchies | multi-level hierarchies, superclass references, superclass parameters / arrays / `ArrayList`s | Lesson 4 · PF-305 |
| 10.6 Polymorphism | declared vs actual type, compile-time vs run-time rule, casting, `instanceof` | Lesson 5 · PF-306 |
| 10.7 `Object` Superclass | `toString()`, `equals(Object)`, `==` vs `equals` | Lesson 6 · PF-307 |
| 10.8 Summary, 10.10–10.13 practice | vocabulary, mixed-up code, MCQ | Review blocks at the end of each ticket + unit quiz |
| 10.9 Free Response (Trio) | FRQ-style class design | Optional practice ticket (PF-3X1) |
| 10.14 College Board Celebrity Lab | game built on a `Celebrity` hierarchy | Replaced by the PixelForge capstone; Celebrity Lab may be linked as optional practice |

The textbook teaches each concept through small, unrelated examples (shapes, pets, people, shopping cart). This module keeps the concepts and the order, but moves all graded work into one continuous project: refactoring the Mini Photoshop filters into a filter class hierarchy.

### 0.2 AP exam scope (decision required)

Under the 2025–26 AP CSA Course and Exam Description, the standalone inheritance unit was removed from the course, and the CSAwesome2 edition of the textbook states that inheritance is no longer assessed on the AP exam or FRQs.

Consequences for this module:

- Unit 10 is **not on the AP-exam path**. Mark it in the course navigation as *Enrichment / College Prep*, consistent with Spec A §5 ("Keep optional advanced exercises separate from the AP CSA learning path").
- It remains valuable: it is standard in introductory college Java courses, and the platform's own future units (data structures, GUIs) depend on it.
- **Tutor decision:** teach it as a full unit before moving on, or offer it as optional. The content below works either way; nothing in later AP-path units may depend on it.

Items that were already outside the old AP Java subset (`protected`, `abstract`, interfaces, `hashCode`, field hiding, static-method hiding) are marked **[Advanced]** and must stay out of the core path.

## 1. Product Goal

Create an interactive module that teaches inheritance as a way to model "is-a" relationships and to let one piece of code work with many related types.

Students should understand not only the syntax (`extends`, `super`, `@Override`), but also:

- What a subclass object contains, and which parts the subclass may access by name.
- The order in which constructors run.
- How Java decides **at compile time** whether a method call is allowed, and **at run time** which method body executes.
- Why a superclass-typed `ArrayList` can hold different subclasses and still call the right method on each.
- Why `equals` must take an `Object` parameter.

The module culminates in a **Filter Plugin System** for Mini Photoshop: every filter becomes a subclass of `Filter`, and the editor's filter pipeline runs any list of filters through polymorphism.

**Core teaching principle (unchanged from Spec A):** Every abstract concept is supported by an observable interactive experiment, executable Java code, or a meaningful application.

### 1.1 Why-first lesson pattern (required for every lesson in this unit)

Inheritance is easy to teach as rules ("a subclass inherits…") and hard to teach as a tool students would choose on their own. Students who learn only the rules can answer tracing questions but still copy and paste code in their own projects, because nobody showed them the problem inheritance solves. Every lesson therefore follows this order:

| Step | What happens | Example (Lesson 1) |
|---|---|---|
| 1. Pain | A ticket in which the student's *current* tools work but hurt. The student does the work first. | Two filter classes; the pipeline needs two lists and two loops, or `Object` plus casts. Adding a third filter means editing the pipeline again. |
| 2. Name the pain | A prediction or short-answer question makes the student say what went wrong in their own words. | "To add a fourth filter, how many places change, and why?" |
| 3. The concept as a fix | The new concept is introduced only as the answer to that pain. | A shared superclass `Filter`: one list, one loop. |
| 4. Payoff | Re-run the same scenario and show what changed (fewer edits, a bug that can no longer happen). | Adding a filter now touches one new file and zero existing files. |
| 5. Limits | When *not* to use it, with a counterexample. | `FilterPipeline extends ArrayList<Filter>` looks convenient but is wrong: a pipeline *has* filters. |

Rules:

- **No definition before the problem.** A lesson may not open with a definition, a vocabulary list or a UML diagram.
- **No unrelated analogy as the first exposure.** Animal/Dog, Shape/Circle and similar examples may be used *after* the PixelForge version, as a second example to show that the idea generalizes. They may not replace it.
- **Every "rule" is traceable to a reason.** For each rule the lesson states why Java works that way, in one or two sentences a high-school student can repeat. Example: "`super(...)` runs first because the subclass's setup may depend on the superclass's fields already being valid." Where the honest answer is "this is a language design decision", say so instead of inventing a reason.
- **Students must be able to explain, not only trace.** Each lesson ends with at least one "why" question (short answer or multiple choice about reasons). Tracing questions alone do not count as evidence for the knowledge items.

### 1.2 Ticket map

| Lesson | Ticket | Status |
|---|---|---|
| 0A primitive vs reference | PF-300 | implemented |
| 0B fields and methods | PF-301 | implemented |
| 1–2 extends, super | PF-302 | implemented |
| 3 override vs overload | PF-303 | implemented |
| 3–4 super.method(), kernel family | PF-304 | planned |
| 4 superclass references | PF-305 | planned |
| 5 polymorphism | PF-306 | planned |
| 6 toString / equals | PF-307 | planned |

## 2. Learning Journey

### Lesson 0A — Primitive Types vs Reference Types (bridge)

**Why this lesson exists**

Students often say "a variable stores an object". That belief works until the first time two variables refer to the same object, and then every later topic (aliasing in 2D arrays, `==` vs `equals`, superclass references, polymorphism) looks like magic. Unit 10 depends on getting this right, so it is reviewed here with an image-editor bug rather than an abstract rule.

**Pain: the Undo bug (ticket PF-300)**

Bug report from QA: *"After applying Brightness, I press Undo, and the 'original' image is also bright."* The code:

```java
int[][] original = img;      // "save a copy for Undo"
Brightness.applyInPlace(img, 40);
// Undo: img = original;  → still bright
```

Then a contrasting snippet the student predicts first:

```java
int amount = 40;
int saved = amount;
amount = 80;
System.out.println(saved);   // 40 — why does this one work?
```

Students run both. The question "why does saving work for `amount` but not for `img`?" is the pain step.

**The concept as the fix**

Java has two kinds of types:

| | Primitive types | Reference types |
|---|---|---|
| Which | exactly 8: `int`, `double`, `boolean`, `char`, `byte`, `short`, `long`, `float` | everything else: `String`, arrays (`int[]`, `int[][]`), `ArrayList`, every class you write (`Filter`) |
| The variable holds | the value itself | a **reference** to an object (or `null`) |
| `b = a` copies | the value → two independent values | the reference → two variables, **one object** |
| `a == b` asks | "same value?" | "same object?" |
| Can be `null` | no | yes |
| Has methods / fields | no | yes (`s.length()`, `img.length`) |
| Can be extended with `extends` | no | classes can (Unit 10) |
| Default value as a field | `0`, `0.0`, `false`, `'\u0000'` | `null` |

**Why Java has two kinds (the reason students should be able to repeat):** a primitive value is small (an `int` is 4 bytes), so copying it on every assignment is cheap and safe. An object can be huge: a 1000 × 1000 image is a million `int`s. If every `b = a` or every method call copied the whole object, programs would be slow, and two parts of the program could never work on the same object. So Java copies only a small reference, and you ask for a real copy explicitly when you need one.

Payoff: the student writes `ImageUtils.copy(int[][] img)`, a deep copy (a new outer array **and** new rows, connecting to K23 from Unit 9), and the Undo bug is fixed. This same `copy` method is reused later as the default behavior of `Filter.apply`, so the work carries forward.

**Method calls**

Use the same reference diagram to show that Java always passes a copy of the variable's content:

- A method that changes `img[0][0]` changes the caller's image (same object).
- A method that does `img = new int[2][2];` changes only its own parameter. The caller's variable still refers to the old image.

The lesson must say "Java is pass-by-value; for a reference type, the value that is copied is the reference". It must not say "objects are passed by reference". That phrase predicts the second case wrongly.

**Terminology: "derived type"**

Some textbooks and other languages call non-primitive types "derived", "composite" or "non-primitive" types. The Java Language Specification uses **primitive types** and **reference types** only, so the platform uses those two terms. This matters in this unit because C++ and many textbooks use **"derived class"** to mean *subclass*, which is a different idea. The lesson states this once, in a callout.

**Wrappers (K22, short)**

`ArrayList<int>` does not compile because collections hold references only. `Integer` is a class that wraps one `int`, and Java converts between them automatically (autoboxing). Probe `ks-k22`. Comparing two `Integer`s with `==` is an **[Advanced]** gotcha, mentioned only in a collapsed note.

**Visualization:** the existing code ↔ memory trace (`prim-vs-ref`, `deep-copy`). Variables are boxes on the left (inside the frame of the method they belong to); objects are on the right; references are arrows. Primitive boxes contain the number itself; reference boxes contain only an arrow. Assignment animates copying the box's content, so the difference between the two kinds of types is visible as the same action applied to different contents.

**Why-question (end of lesson):** "Why doesn't Java copy the whole array when you write `b = a`?" (Expected idea: cost, and the ability to share one object.)

### Lesson 0B — Fields and Methods: What an Object Remembers (bridge)

**Why this lesson exists**

So far most PixelForge code has been `static` methods: `brighten(int[][] img, int amount)`. Everything the method needs comes in through parameters, and everything it produces goes out through the return value. Students can write classes with fields, but many treat a field as "a variable declared at the top", and they cannot say when to use a field instead of a parameter or a local variable. Inheritance is about sharing fields and methods, so this has to be solid first.

**Pain: the filter stack needs to remember settings (ticket PF-301)**

New feature request: the editor shows a **filter stack**. The user adds "Brightness +20", later changes it to +35, and the image is re-rendered from the original each time.

Step 1. The student first builds this with the tools they have: a static `brighten(img, amount)`, plus two parallel lists in the editor:

```java
ArrayList<String>  names   = new ArrayList<>();
ArrayList<Integer> amounts = new ArrayList<>();
```

Step 2. They hit the pain directly. They are then asked to add a second setting (Contrast needs `amount` *and* `midpoint`). Now there are three lists, every add and remove must keep them in sync, and a provided bug (removing from one list but not the other) shifts every later setting by one. The prediction question asks what the stack shows after that bug.

**The concept as the fix**

A class bundles **what a thing must remember** with **what it can do with what it remembers**:

```java
public class BrightnessAdjust {
    private int amount;                         // what each adjustment remembers

    public BrightnessAdjust(int amount) {       // how it starts in a valid state
        setAmount(amount);
    }

    public void setAmount(int amount) {         // the only way to change it, so the rule lives here
        this.amount = Math.max(-255, Math.min(255, amount));
    }

    public int getAmount() { return amount; }

    public int[][] apply(int[][] img) {         // an action done by *this* adjustment, using its own amount
        ...
    }
}
```

and the editor keeps one `ArrayList<BrightnessAdjust>`.

Each idea is introduced with its reason:

| Idea | The reason students should be able to say | Probe |
|---|---|---|
| **Field** | It is the object's memory. A local variable disappears when the method returns; a field stays as long as the object exists, so the next method call can still use it. | `ks-k11`, `ks-k11-local` |
| **Instance method** | It is an action done *by one specific object*. `a.apply(img)` uses `a`'s amount; `b.apply(img)` uses `b`'s. That is why the method does not need `amount` as a parameter. | `ks-k12` |
| **Constructor** | A new object must start in a valid state, so its fields are set up once, at creation. | `ks-k14` |
| **`this`** | When a parameter has the same name as a field, the name means the parameter. `this.amount` means "this object's field". | `ks-k13` |
| **`private` + setter** | The rule "amount is between −255 and 255" is written in one place, and no other code can break it. With a `public` field, every place that changes it would have to remember the rule. | `ks-k16` |
| **`static` vs instance** | `static` means "belongs to the class, not to any one object". `ImageUtils.copy` needs no memory, so it can be static; `apply` needs this object's amount, so it cannot. | `ks-k15` |

**Decision guide (the "limits" step).** Students practise deciding where a piece of data belongs:

- Needed only during one method call → **local variable**.
- Supplied fresh by the caller each time → **parameter**.
- Must be remembered by this object between calls → **field**.
- Shared by all objects, or the method needs no object at all → **`static`** (use sparingly).

A short exercise gives 6 pieces of data from the editor (loop counter `r`, the image passed to `apply`, the brightness amount, the filter's display name, a temporary sum inside blur, the maximum allowed amount) and asks for the right choice and the reason.

**Common misconceptions to target** :

- "A field is just a variable at the top of the class." The probe `ks-k11-local` shows the difference: the same `clicks++` gives 2 with a field and 0 with a local variable.
- "All objects of a class share the same field." Probe `ks-k12`: two objects, two amounts.
- "`amount = amount;` sets the field." Probe `ks-k13`: the field stays 0.
- "Calling a method creates a new object." The trace shows the same object across calls.
- Writing `BrightnessAdjust.apply(img)` (calling an instance method through the class name). The real compiler error is shown, then explained with the reason: "which adjustment's amount should it use?"

**Visualization:** traces `field-vs-local`, `two-objects`, `shadowing`. Each call to `apply` pushes a frame with its local variables and `this` (an arrow to the object). When the call returns, the frame disappears, while the object and its fields stay. Students step through two calls on two objects and watch which `amount` each call reads.

**Payoff:** the three parallel lists become one `ArrayList<BrightnessAdjust>`. The sync bug can no longer happen, because each adjustment carries its own settings.

**Bridge to Lesson 1:** at the end of PF-301 a teammate has written `InvertAdjust` the same way. The editor now needs a separate list and loop for each adjustment class. This is the pain that Lesson 1 starts from.

### Lesson 1 — Superclass, Subclass and What Gets Inherited

**Why (pain):** PF-301 ended with two adjustment classes and two lists. PF-302's briefing asks for a third filter type, and the student first counts how many places in the editor must change (list, add method, render loop, remove method). The prediction question "how many places change to add a fourth filter?" names the pain. A shared superclass is introduced as the way to say "all of these are filters", so the editor needs only one list, and adding a filter touches only the new class.

**Limits:** the has-a counterexample (`FilterPipeline extends ArrayList<Filter>`) and "copying two methods is not by itself a reason to inherit; there must be a true is-a relationship".

**Learning objectives**

Students should be able to:

1. Write `class B extends A` and state the is-a relationship it expresses.
2. Distinguish is-a (inheritance) from has-a (an instance variable), and choose correctly in a design question.
3. Explain that a subclass inherits the superclass's public methods and can add its own fields and methods.
4. Explain why a subclass cannot access a superclass `private` field by name, and use a public getter instead.
5. State that every class without an `extends` clause extends `Object`.

**Interactive visualization: Class Diagram ↔ Object Anatomy**

Two synchronized panels.

Left panel: class diagram (UML-style).

- Boxes for classes with fields and methods; arrows for `extends`.
- Clicking a class shows its own members and, greyed out, the members it inherits.
- A has-a relationship is drawn differently from is-a, for example a `FilterPipeline` box with an `ArrayList<Filter>` field.

Right panel: object anatomy.

- Shows one object created with `new`, drawn as stacked partitions, one per class in the chain (`Object` → `Filter` → `BrightnessFilter`).
- Each partition lists the fields declared by that class.
- `private` fields carry a lock icon. Hovering a locked field from subclass code shows: "This field exists inside the object, but code in `BrightnessFilter` cannot name it. Use `getName()`."
- Clicking a method call in the code panel highlights which partition's method is used.

**Important accuracy requirement**

The Java Language Specification says that `private` members are **not inherited** by subclasses, yet every subclass object still contains storage for the superclass's private fields. The lesson must state both facts and avoid the loose phrase "private fields are inherited but hidden" without explanation.

The partitioned drawing is an educational model, not a JVM object layout. Like the simulated addresses in Spec A, the UI must not claim that it shows real memory.

**Prediction questions (examples)**

- "Will `this.name = n;` compile inside `BrightnessFilter` if `name` is a `private` field of `Filter`?" → No.
- "`PixelForgeApp` has an `ArrayList<Filter>`. Should `PixelForgeApp extends ArrayList<Filter>`?" → No: an app *has* a list of filters; it is not a list.

### Lesson 2 — Constructors and `super(...)`

**Why (pain):** In PF-302 the student's `BrightnessFilter` must also have a display name, which `Filter` already stores in a `private` field. The student first tries `name = "Brightness";` in the subclass constructor and gets a compile error. Reason given: the superclass owns its private fields, so only the superclass's constructor can set them up. `super("Brightness")` is the way to ask it to do that. Why it runs first: the subclass's own setup is allowed to use inherited methods (for example `getName()`), so the superclass part must already be valid.

**Limits:** constructors are not inherited because a subclass usually needs *more* setup than its superclass; inheriting `Filter(String name)` would let someone create a `BrightnessFilter` without an amount.

**Learning objectives**

1. State that constructors are not inherited.
2. Call a superclass constructor with `super(args)` as the first statement of a subclass constructor.
3. Predict that the compiler inserts `super()` when no explicit call is written.
4. Explain the compile error that occurs when the superclass has no no-argument constructor and the subclass does not call `super(args)`.
5. Predict constructor execution order in a 3-level hierarchy.

**Interactive visualization: Constructor Chain**

- Step through `new BoxBlurFilter()` for the hierarchy `Filter` → `KernelFilter` → `BoxBlurFilter`.
- Show a call stack growing upward (`BoxBlurFilter()` → `KernelFilter(...)` → `Filter(...)` → `Object()`), then unwinding.
- Show the object-anatomy partitions being initialized in the order the constructor bodies finish: superclass fields first.
- Insert a visible, greyed "implicit `super();`" line when the student's example omits the call.
- A toggle removes the no-arg constructor from `Filter` and shows the resulting compile error message (from the real compiler, see §5.3).

**Accuracy requirement**

Teach "`super(...)` must be the first statement" as the rule for the compiler level used by the platform. Recent Java versions (JDK 25, "flexible constructor bodies") relax this rule by allowing some statements before `super(...)`. If the platform's compiler level ever changes, update this lesson. Do not claim that the rule is permanent in all Java versions.

### Lesson 3 — Overriding, Overloading and `super.method()`

**Why (pain):** after PF-302 every filter inherits `Filter.apply`, which returns an unchanged copy. The editor shows "Invert" in the stack, but the image does not change (PF-303). Overriding is introduced as "replace the inherited behavior for this kind of filter". `@Override` is introduced *after* the student has spent time on a silent overload bug, so its reason is obvious: it turns that silent bug into a compile error. `super.apply(...)` (PF-304) is introduced when a strong blur wants "the normal blur, done twice" without copying the blur code.

**Limits:** overriding a method only to call `super` and do nothing else adds no value; and an override must keep the promise of the original method (for example `apply` must not modify its input).

**Learning objectives**

1. Override a method by declaring the same name and parameter list in a subclass.
2. Distinguish overriding (same signature, replaces behavior) from overloading (same name, different parameters, adds a method).
3. Use `@Override` and explain how it turns a silent bug into a compile error.
4. Call the superclass version with `super.method(...)` to extend rather than replace behavior.

**Interactive experiment: Override or Overload?**

Present short subclass snippets. Students classify each as *override*, *overload*, or *compile error*, and then run them. Required cases:

- `public int[][] apply(int[][] img)` → override.
- `public int[][] apply(int[][] img, int times)` → overload; the pipeline still calls `Filter.apply(img)`.
- `public int[][] Apply(int[][] img)` → a new, unrelated method; with `@Override` it becomes a compile error.
- `private int[][] apply(int[][] img)` → compile error: an override cannot reduce visibility.

**Concept challenge (realistic bug)**

A teammate's `InvertFilter` "does nothing" in the editor (PF-303). The code defines `apply(int[][] img, int strength)`. Students must explain why the pipeline produced an unchanged image and fix it.

**`super.method()` visualization**

Use the method-lookup visualizer (Lesson 5) in a restricted mode: show that `super.toString()` starts the search in the **superclass of the class where the code is written**, not in the superclass of the object's run-time class.

### Lesson 4 — Inheritance Hierarchies and Superclass References

**Why (pain):** the editor's "Add filter" menu needs one list of every available filter, of different classes (PF-305). Without superclass references this needs one list per class. `ArrayList<Filter>` holding a `BrightnessFilter` and a `BoxBlurFilter` is the fix. Reason for the one-way rule: every `BoxBlurFilter` is a `Filter`, so storing it as a `Filter` is always safe; not every `Filter` is a `BoxBlurFilter`, so the reverse could promise methods the object does not have.

**Limits:** a deep hierarchy for its own sake (for example `BlurFilter → BoxBlurFilter → BigBoxBlurFilter → …`) makes code harder to follow; prefer a constructor parameter when classes differ only in a value.

**Learning objectives**

1. Build a 3-level hierarchy and identify every is-a relationship it implies (a `BoxBlurFilter` is a `KernelFilter` and is a `Filter`).
2. Assign a subclass object to a superclass variable (`Filter f = new BoxBlurFilter();`) and explain why the reverse does not compile.
3. Write methods with superclass parameters and fill `Filter[]` / `ArrayList<Filter>` with subclass objects.
4. Recognize when inheritance is **not** appropriate (code reuse without a true is-a relationship).

**Interactive visualization: Hierarchy Builder**

- Students drag classes into a tree. The tool validates each `extends` arrow and generates the matching class headers.
- An assignment checker: students pick a declared type and an actual type from the tree (`KernelFilter k = new BrightnessFilter(10);`) and predict *compiles / does not compile* before seeing the answer.

### Lesson 5 — Polymorphism

**Why (pain):** the student is shown the *old* editor code from Spec A's pipeline idea: a `switch (filterName)` that calls a different static method in each case. Adding a filter means editing this switch, and forgetting one case is a real bug in the provided code ("Sharpen" silently does nothing). With `ArrayList<Filter>` and `f.apply(img)`, the pipeline never needs to change: each object brings its own `apply`. The two-step rule is presented as the answer to two natural questions: "How can the compiler allow `f.apply(img)` when it does not know which filter `f` is?" (it only checks that every `Filter` has `apply`) and "How does the right filter run?" (the object decides at run time).

**Limits:** if code needs `instanceof` checks on every element to decide what to do, polymorphism is not being used; move the behavior into the subclasses instead.

**Learning objectives**

1. Distinguish the declared (static) type of a variable from the actual (run-time) type of the object.
2. Apply the two-step rule:
   - **Compile time:** the method must exist in the declared type or one of its superclasses; otherwise, compile error.
   - **Run time:** Java runs the most specific version, starting the search at the actual type and moving up.
3. Use a cast to call a subclass-only method, and explain that the cast changes what the compiler checks, not the object.
4. Predict a `ClassCastException` from an invalid downcast.
5. Use `instanceof` to test an object's type before casting. **[Beyond the old AP subset; keep as an enrichment item.]**

**Interactive visualization: Method Dispatch Lookup**

The central visualization of this unit.

- Left: the code line being evaluated, with its declared type highlighted.
- Center: the class hierarchy.
- Right: the object anatomy of the actual object.
- Phase 1 (compile time): a "compiler" marker starts at the declared type and searches upward. If it reaches `Object` without a match, it shows a compile error and the run-time phase is skipped.
- Phase 2 (run time): a "JVM" marker starts at the actual class and searches upward to the first matching method body. That body is highlighted and executed.
- Calls made *inside* an inherited method (`this.describe()` inside `Filter.label()`) restart Phase 2 from the actual class. This is the step most students get wrong, so it must be animated explicitly.

Required walkthrough:

```java
public class Filter {
    public String label()    { return "Filter:" + describe(); }
    public String describe() { return "identity"; }
}

public class KernelFilter extends Filter {
    @Override
    public String describe() { return "kernel"; }
}

public class BoxBlurFilter extends KernelFilter {
    @Override
    public String label() { return "Blur/" + super.label(); }
}

Filter f = new BoxBlurFilter();
System.out.println(f.label());   // Blur/Filter:kernel
```

The visualizer must show:

1. `label()` exists in `Filter` → compiles.
2. Run time: `BoxBlurFilter.label()` runs.
3. `super.label()` → search starts in `KernelFilter` (superclass of `BoxBlurFilter`), finds `Filter.label()`.
4. `describe()` inside `Filter.label()` → search restarts at the actual class `BoxBlurFilter`, finds `KernelFilter.describe()`.

**Casting experiment**

```java
Filter f = new BrightnessFilter(20);
f.getAmount();                          // compile error: Filter has no getAmount()
((BrightnessFilter) f).getAmount();     // OK: 20
KernelFilter k = (KernelFilter) f;      // compiles, throws ClassCastException at run time
```

**Accuracy requirements**

- Only instance methods are dynamically dispatched. Fields and static methods are resolved by the declared type. Field hiding and static-method hiding are **[Advanced]**. They appear only in an optional "gotchas" card, never in core questions.
- This visualizer is a **simulation of the lesson's fixed example**, not a trace of the student's code. Label it as a simulation of the fixed example, not the student's code (Spec B §7 consistency rule, spec-review 2.5).

### Lesson 6 — The `Object` Superclass: `toString` and `equals`

**Why (pain):** the history panel prints `BrightnessFilter@1b6d3586` and shows the same adjustment twice (PF-307). The student first asks why: `println` calls `toString()`, which every class inherits from `Object`, and `contains` calls `equals`, whose inherited version only means "same object". Overriding them makes the history readable and lets the editor recognize two equal settings.

**Limits:** do not override `equals` for classes whose objects should only be equal to themselves (for example an open editor window).

**Learning objectives**

1. Explain what `System.out.println(obj)` prints when `toString()` is not overridden, and override it.
2. Build a subclass `toString()` from `super.toString()`.
3. Distinguish `==` (same object) from `equals` (same meaning, as defined by the class).
4. Override `equals(Object other)` correctly: check the type, cast, compare fields, and reuse `super.equals(other)` where appropriate.
5. Explain why `equals(BrightnessFilter other)` is an overload that `ArrayList.contains` will never call.

**Interactive visualization: Identity vs Equality**

Reuse the reference-diagram style from Spec A Lesson 1 (`array-memory`):

- Variables on the left, objects on the right, arrows for references.
- `a == b` lights up when both arrows reach the same object.
- `a.equals(b)` animates the field-by-field comparison defined by the class.
- A toggle switches between `equals(Object)` (override) and `equals(BrightnessFilter)` (overload) and shows `history.contains(f)` returning different results.

**Accuracy requirements**

- Do not present `getClass()`-based and `instanceof`-based `equals` as one being universally correct. The core path uses `instanceof` (simpler, matches the textbook's level). The trade-off is an **[Advanced]** note.
- Mention that Java expects `hashCode()` to be overridden together with `equals` (important for `HashMap` / `HashSet`) as an **[Advanced]** note only. Core tests must not require `hashCode`.
- The default `toString()` output (`ClassName@hex`) shows a hash code, not a memory address. Do not call it an address.

## 3. Capstone — Filter Plugin System (Sprint 2)

### Product concept

Story framing (tech lead Mei): *"Our filters are a pile of copy-pasted static methods. Every new filter means editing the editor's `switch` statement. This sprint we pay down that tech debt: every filter becomes a class, and the editor runs whatever list of filters the user builds."*

The editor panel shows a **filter stack** (like layers) that the user can add to, reorder and remove from. The stack is a `FilterPipeline` written by the student, and each output image is computed by the student's Java and labelled as such (spec-review 2.5).

### Class design (given contract)

```java
public class Filter {                       // given, read-only
    private String name;
    public Filter(String name) { this.name = name; }
    public String getName() { return name; }
    /** Default behavior: identity. Returns a new array; never modifies img. */
    public int[][] apply(int[][] img) { return ImageUtils.copy(img); }
    @Override public String toString() { return name; }
}

public class KernelFilter extends Filter {   // given, read-only
    private double[][] kernel;               // 3 × 3
    public KernelFilter(String name, double[][] kernel) { super(name); this.kernel = kernel; }
    /** Cross-correlation, clamp-to-edge, round, clamp 0–255 (same convention as Spec A Lesson 6). */
    @Override public int[][] apply(int[][] img) { ... }
}
```

`KernelFilter` is given so that Sprint 3 does not depend on the student having finished Sprint 2 (PF-203 Blur). If PF-203 is merged, the briefing for PF-304 may point out that the student's blur loop is now generalized here.

The core path uses only concrete classes. `Filter` as an `abstract class` or an interface is an **[Advanced]** refactor in the bonus ticket.

### Ticket progression

**PF-300 — Undo is broken: primitive vs reference types (Lesson 0A, bridge) · implemented**

Implement `ImageUtils.copy(int[][] img)` as a deep copy so that Undo works. Tests: changing the copy does not change the original, rows are new arrays, a non-square image keeps its shape, `copy` of a 0-row image returns a 0-row image.

**PF-301 — Filter stack: each object remembers its own setting (Lesson 0B, bridge) · implemented**

Write `BrightnessAdjust` with a `private int amount`, a constructor, `getAmount`, a clamping `setAmount`, and an instance `apply(int[][] img)` that does not modify its input. Tests include the shadowing bug (`amount = amount`), two objects with different amounts, and clamping through both the constructor and the setter. Ends with the given `InvertAdjust` and the question that leads into PF-302.

**PF-302 — First plugin: `BrightnessFilter` (Lessons 1–2) · implemented**

Write `BrightnessFilter extends Filter` with a `private int amount`, a constructor that calls `super("Brightness")`, `getAmount()`, and an overriding `apply` that reuses the PF-105 logic. Tests check that the class extends `Filter`, that the name is correct, the clamping behavior, and that the input array is not modified.

**PF-303 — Bug fix: `InvertFilter` does nothing (Lesson 3) · implemented**

Given a buggy `InvertFilter` that overloads instead of overrides. The student explains the bug in the ticket's short-answer block, adds `@Override`, and fixes the signature. Tests run it through `Filter f = new InvertFilter(); f.apply(img)`.

**PF-304 — Kernel family: `BoxBlurFilter`, `SharpenFilter` (Lessons 2–4)**

Two 3-level subclasses whose constructors only pass a kernel to `super(name, kernel)`. A fourth level, `StrongBlurFilter extends BoxBlurFilter`, overrides `apply` as `return super.apply(super.apply(img));` (blur twice) and overrides `toString()` using `super.toString()`. Prediction blocks: constructor order for `new StrongBlurFilter()`, and why `this.apply(this.apply(img))` inside `StrongBlurFilter.apply` calls itself forever and ends in a `StackOverflowError`.

**PF-305 — Superclass references: filter menu (Lesson 4)**

Implement `FilterMenu.defaultFilters()` returning `ArrayList<Filter>` containing one of each filter, and `FilterMenu.names(ArrayList<Filter>)`. The editor's "Add filter" dropdown is populated from the student's list.

**PF-306 — `FilterPipeline` (Lesson 5)**

```java
public class FilterPipeline {
    private ArrayList<Filter> filters;
    public void add(Filter f)
    public void move(int from, int to)
    public int[][] applyAll(int[][] img)        // apply in order; empty pipeline returns a copy
    public int countKernelFilters()             // instanceof, enrichment part
}
```

This replaces Spec A Bonus Task 7 (Filter Pipeline): the same feature, now built on polymorphism. A comparison block shows the old `switch (filterName)` version next to the new polymorphic loop and asks which one needs editing when a new filter is added.

**PF-307 — Presets and history: `toString` / `equals` (Lesson 6)**

Override `toString()` in `BrightnessFilter` to return, for example, `Brightness(+20)` built from `super.toString()`, and override `equals(Object)` so that two `BrightnessFilter`s with the same amount are equal. (`KernelFilter` is read-only and its kernel is `private`, so kernel filters keep the inherited `equals`; a prediction block asks what `new BoxBlurFilter().equals(new BoxBlurFilter())` returns and why.) The editor's history panel uses `history.contains(f)` to avoid duplicate consecutive entries; with an overloaded `equals`, students can watch the duplicates appear.

**Bonus PF-308 — Your own plugin**

The student designs a new filter (for example threshold, posterize, vignette) as a `Filter` subclass, registers it in `FilterMenu`, and it appears in the editor. Optional advanced refactor: make `Filter` abstract and explain what changes.

**Optional PF-3X1 — FRQ practice**

An AP-FRQ-style class design question (in the style of textbook 10.9) graded by tests, kept off the main board.

For each ticket, provide (same as Spec A):

- Learning objectives.
- Starter Java files (multi-file: student files + read-only `Filter.java`, `KernelFilter.java`, `ImageUtils.java`, test file).
- TODO markers.
- At least three test cases, including boundary cases (empty pipeline, 1×1 image, non-square image, the same filter added twice).
- Hints (at least one conceptual and one code-level).
- Prediction questions.
- Completion checks.

## 4. UI Requirements

Same three-panel layout as Spec A. Additions:

- **Multi-file editor tabs.** Inheritance tasks need several classes. Read-only files show a lock and cannot be edited. The file tree is ordered by hierarchy (superclass first).
- **Class diagram mini-map.** A small, always-visible UML view of the current ticket's classes, generated from ticket data (not parsed from student code in v1), with the class being edited highlighted.
- **Filter stack panel** in Mini Photoshop for PF-301 and PF-305 to PF-308.

## 5. Platform Changes Required

### 5.1 New visualization types (`VizConfig` additions)

```ts
| { type: "trace"; title?: string; traceId: TraceId; caption?: string }   // implemented: hand-written traces in src/content/traces.ts
| { type: "class-diagram"; title?: string; presetId: ClassDiagramPresetId; showObjectAnatomy: boolean }   // planned
// constructor chaining and method lookup are covered by the traces "super-chain" and "dispatch-overload";
// a dedicated step-by-step lookup visualizer (Lesson 5) and an equality view (Lesson 6) are still planned.
| { type: "image-lab"; title?: string; filter: ImageFilterId | "pipeline" }
```

Presets are fixed TypeScript models (Spec B Mode A). Following the existing content rule, lesson content references them by id and contains no executable JavaScript.

### 5.2 New lesson block types

- `classify`: the student assigns each snippet a label (override / overload / compile error; compiles / does not compile). Needed for Lessons 3 and 4.
- `short-answer` (implemented): free-text "why" questions. Not graded; the student sees a model answer after saving, and the teacher sees every answer in the admin ticket summary. Answers are stored in the ticket's progress (`answers`).

### 5.3 Testing multi-class tasks

Problem: if a test file references `new BrightnessFilter(10)` and the student has not created that class (or forgot `extends Filter`), the **whole test file fails to compile**, and the student sees one compiler error instead of a list of tests.

Requirements:

- Structural checks (class exists, extends the right superclass, field is `private`, method overrides) use reflection (implemented directly in the PF-301 to PF-303 test files; a shared helper in `tutor-runtime.jar` would be a later cleanup), for example `Check.extendsClass("BrightnessFilter", "Filter")`, so that they fail as ordinary tests with readable messages ("BrightnessFilter is not a kind of Filter yet").
- Behavioral tests run only after structural tests pass. Reflection support in CheerpJ must be verified during implementation.
- When the test file itself fails to compile, the UI should translate the most common cases into a hint ("class BrightnessFilter not found: do the file name and class name match?") instead of only showing the raw error.
- `tools/verify-content.mjs` must support multi-file reference solutions in `tools/solutions/`.

### 5.4 Real compiler messages

Lessons 2, 3 and 5 rely on compile errors (`super` missing, reduced visibility, missing method on declared type). These must be produced by the real compiler (ecj) running the example, not hardcoded text, so that the message students see in the lesson matches the message they will see in their own code.

## 6. Pedagogical Requirements

All of Spec A §5 applies. In addition:

- Every "what does this print?" question involving dispatch must be followed by the dispatch visualizer for that exact example.
- Introduce terms in this order and do not use them before they are introduced: superclass/subclass → is-a/has-a → override → overload → declared type/actual type → polymorphism.
- Write in the platform's language (English); introduce each term with a plain-words explanation at first use.
- Examples stay inside the PixelForge domain wherever possible; if a textbook-style example (shapes, pets) is used for a first explanation, it must connect back to filters within the same ticket.
- Advanced items are collapsed by default and visually marked.

## 7. Acceptance Criteria

The module is complete when:

- Students can open a class diagram and see, for any class, its own and inherited members, with private access shown correctly.
- `new` on a 3-level hierarchy can be stepped through with the constructor chain shown in the correct order, including implicit `super()`.
- The dispatch visualizer correctly animates compile-time checking, run-time lookup, `super.method()` and calls from inherited methods back into overridden methods, for every preset.
- The override/overload classifier shows real compiler output for the compile-error cases.
- `==` vs `equals` can be compared on reference diagrams, including the overloaded-`equals` trap with `ArrayList.contains`.
- PF-300 to PF-307 can be completed with Java code; structural mistakes produce test failures with readable messages, not whole-file compile errors.
- The Mini Photoshop filter stack runs the student's `FilterPipeline` and labels results as computed by the student's Java.
- The unit is shown as Enrichment / not AP-exam-assessed (unless the tutor changes this), and no AP-path unit depends on it.
- Student progress is saved and restored like Sprint 1; "why" answers are visible to the teacher in the admin ticket summary.

## 8. Out of Scope for Initial Release

- Interfaces, abstract classes and `protected` in the core path (bonus/advanced only).
- Generics beyond `ArrayList<Filter>`.
- Automatic parsing of student code into class diagrams.
- Real execution tracing of student code in the dispatch visualizer.
- Multiple inheritance discussions beyond one sentence ("Java classes have exactly one direct superclass").
- Design patterns (Strategy, Template Method), even though the capstone is an instance of them; at most one [Advanced] note naming them.
