import type { Ticket } from "../../types";

/*
 * Sprint 1 of the PixelForge "Mini Photoshop" project = AP CSA Unit 9 (2D arrays), lessons 1–4,
 * plus the first real filter. Content is data only; it is rendered by the generic ticket workspace.
 * Markdown uses ~~~ fences so it can live inside template literals.
 */

const pf101: Ticket = {
  id: "PF-101",
  slug: "image-buffer-memory",
  title: "Image buffer health check: 2D arrays and memory",
  xp: 100,
  learningGoal: {
    level: "easy",
    goal: "See an int[][] as an outer array of references to separate row arrays, so jagged and null rows make sense.",
    techniques: ["arr.length vs arr[r].length", "Outer array of row references", "Jagged arrays", "Guarding against null rows"],
  },
  briefing: `Welcome to **PixelForge Studio**! 🎉 We're building a Mini Photoshop that runs in the browser.

In our code, every image is an \`int[][]\` (we call it an *image buffer*). Last week someone passed a buffer with a \`null\` row into a filter and the whole app crashed 😅

Your first ticket: write two utility methods so the team can check that a buffer is healthy before processing it.`,
  objectives: [
    "Tell an array variable apart from an array object",
    "Explain that an int[][] is really an array of references to int[] arrays",
    "Point out the outer array and the inner arrays",
    "Explain why jagged arrays (rows of different lengths) are legal in Java",
  ],
  blocks: [
    {
      type: "markdown",
      md: `## What is an int[][] really?

In Java, \`int[][] a\` means: **a is an array, and each slot holds a reference to an int[]**.

- The **variable** \`a\` stores a reference to the **outer array object**.
- Each slot of the outer array, \`a[0]\`, \`a[1]\`, … points to an **inner array object** (where the numbers actually live).
- Every inner array is its own object, so they can have different lengths. That is a **jagged array**.

~~~java
int[][] a = new int[3][];   // creates only the outer array; all 3 slots are null
a[0] = new int[]{1, 2, 3};
a[1] = new int[]{4};
a[2] = new int[]{5, 6};
~~~`,
    },
    { type: "viz-link", vizIndex: 0, label: "Build this array step by step and watch the references" },
    {
      type: "callout",
      tone: "warn",
      md: "The memory addresses shown in the visualization (like `@0x1A40`) are **made up for teaching**, not real JVM addresses. Java does not promise where array objects live in memory, or that they sit next to each other.",
    },
    {
      type: "predict",
      id: "pf101-null",
      question: "What does this code print?",
      code: `int[][] a = new int[3][];
System.out.println(a[1]);`,
      options: ["0", "null", "[]", "Compile error"],
      answer: 1,
      explain: "`new int[3][]` creates only the outer array. Each slot holds a reference to an int[], and the default is `null`: no inner arrays exist yet.",
    },
    {
      type: "predict",
      id: "pf101-alias",
      question: "What does this code print at the end?",
      code: `int[][] a = {{1, 2}, {3, 4}};
int[][] b = a;
b[0][0] = 9;
System.out.println(a[0][0]);`,
      options: ["1", "9", "Compile error", "Runtime error"],
      answer: 1,
      explain: "`b = a` does not copy the array, only the reference. a and b point to the **same** outer array object (aliasing), so a change made through b is visible through a. Pick \"Aliasing\" in the visualization to see two arrows pointing at one object.",
    },
    {
      type: "markdown",
      md: `## Your task

In \`ImageBuffer.java\`, implement:

1. \`countPixels(int[][] img)\`: return the total number of elements across all rows. **A null row counts as 0.**
2. \`isRectangular(int[][] img)\`: return \`true\` when no row is \`null\` and every row has the same length as row 0. An outer array of length 0 also counts as \`true\`.

When you're done, press **✓ Run tests**. Once everything passes you can **Merge**.`,
    },
  ],
  visualizations: [
    { type: "array-memory", title: "Array vs Memory", presets: ["jagged", "rectangular", "alias", "shared-row", "null-row"] },
  ],
  task: {
    instructions: "Implement `countPixels` and `isRectangular`. Watch out for jagged arrays and `null` rows!",
    mainClass: "ImageBuffer",
    testClass: "ImageBufferTest",
    files: [
      {
        path: "ImageBuffer.java",
        content: `public class ImageBuffer {

    /**
     * Returns the total number of elements in all rows.
     * A null row counts as 0 elements.
     */
    public static int countPixels(int[][] img) {
        // TODO: visit every row and add up the lengths
        return 0;
    }

    /**
     * Returns true when no row is null and every row has the same length as img[0].
     * Returns true when img.length == 0.
     */
    public static boolean isRectangular(int[][] img) {
        // TODO
        return false;
    }

    public static void main(String[] args) {
        int[][] a = new int[3][];
        a[0] = new int[]{1, 2, 3};
        a[1] = new int[]{4};
        a[2] = new int[]{5, 6};

        System.out.println("pixels = " + countPixels(a));
        System.out.println("rectangular? " + isRectangular(a));
    }
}
`,
      },
      {
        path: "ImageBufferTest.java",
        readOnly: true,
        content: `import tutor.Check;

public class ImageBufferTest {

    static void test1_rectangular() {
        int[][] img = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};
        Check.equal(9, ImageBuffer.countPixels(img), "pixels in a 3x3");
    }

    static void test2_jagged() {
        int[][] img = {{1, 2, 3}, {4}, {5, 6}};
        Check.equal(6, ImageBuffer.countPixels(img), "pixels in a jagged array");
    }

    static void test3_nullRow() {
        int[][] img = new int[3][];
        img[0] = new int[]{1, 2};
        img[2] = new int[]{3};
        Check.equal(3, ImageBuffer.countPixels(img), "pixels with a null row");
    }

    static void test4_isRectangularTrue() {
        Check.isTrue(ImageBuffer.isRectangular(new int[][]{{1, 2}, {3, 4}, {5, 6}}), "3x2 should be rectangular");
    }

    static void test5_isRectangularJagged() {
        Check.isTrue(!ImageBuffer.isRectangular(new int[][]{{1, 2, 3}, {4}, {5, 6}}), "a jagged array is not rectangular");
    }

    static void test6_isRectangularNullRow() {
        int[][] img = new int[2][];
        img[0] = new int[]{1};
        Check.isTrue(!ImageBuffer.isRectangular(img), "a null row means not rectangular");
    }

    static void test7_empty() {
        Check.equal(0, ImageBuffer.countPixels(new int[0][]), "pixels in an empty array");
        Check.isTrue(ImageBuffer.isRectangular(new int[0][]), "an empty array counts as rectangular");
    }
}
`,
      },
    ],
    testLabels: {
      test1_rectangular: "Pixels in a 3×3 matrix",
      test2_jagged: "Pixels in a jagged array",
      test3_nullRow: "A null row counts as 0",
      test4_isRectangularTrue: "3×2 is rectangular",
      test5_isRectangularJagged: "Jagged is not rectangular",
      test6_isRectangularNullRow: "A null row is not rectangular",
      test7_empty: "Empty array (edge case)",
    },
    hints: [
      "The outer loop visits `img.length` rows; each row is `img[r]`, and its length is `img[r].length`.",
      "Before reading `img[r].length`, check `img[r] == null`, or you will get a NullPointerException.",
      "`isRectangular`: handle `img.length == 0` first, then remember the length of `img[0]` and compare the other rows to it. Don't forget `img[0]` itself could be null.",
    ],
  },
};

const pf102: Ticket = {
  id: "PF-102",
  slug: "row-column-major",
  title: "Brightness stats: row-major and column-major traversal",
  xp: 120,
  learningGoal: {
    level: "easy",
    goal: "Choose the loop order on purpose: row-major for per-row results, column-major for per-column results.",
    techniques: ["Nested for loops over r and c", "Row-major traversal", "Column-major traversal", "Non-square and empty arrays"],
  },
  briefing: `The designers want a "brightness profile" panel in Mini Photoshop: the total brightness of **every row** and **every column**.

In this ticket you'll learn the two orders for visiting a 2D array, and when each one is the natural choice.`,
  objectives: [
    "Separate the logical position (r, c) from the order you visit cells in",
    "Write row-major and column-major nested loops",
    "Choose the traversal order that matches what you are computing",
  ],
  blocks: [
    {
      type: "markdown",
      md: `## Two traversal orders

**Row-major**: go row by row; the outer loop is the row.

~~~java
for (int r = 0; r < m.length; r++)
    for (int c = 0; c < m[r].length; c++)
        visit(m[r][c]);
~~~

**Column-major**: go column by column; the outer loop is the column (usually assuming the matrix is rectangular).

~~~java
for (int c = 0; c < m[0].length; c++)
    for (int r = 0; r < m.length; r++)
        visit(m[r][c]);
~~~`,
    },
    { type: "viz-link", vizIndex: 0, label: "Use Step ▶ to compare the two orders and watch how r and c change" },
    {
      type: "predict",
      id: "pf102-order",
      question: "m = {{1, 2, 3}, {4, 5, 6}}. Visiting it column-major and printing each value gives?",
      options: ["1 2 3 4 5 6", "1 4 2 5 3 6", "6 5 4 3 2 1", "1 3 5 2 4 6"],
      answer: 1,
      explain: "The outer loop is the column: first column 0 (1, 4), then column 1 (2, 5), then column 2 (3, 6).",
    },
    {
      type: "callout",
      tone: "info",
      md: "Curious whether the order changes **speed**? That's a deeper topic (memory layout and CPU caches). It's in this sprint's **Knowledge Space**, not needed for this ticket.",
    },
    {
      type: "markdown",
      md: `## Your task

In \`BrightnessStats.java\`, implement:

1. \`rowSums(int[][] m)\`: return an array of length \`m.length\` where slot r is the sum of row r.
2. \`columnSums(int[][] m)\`: return an array with one slot per column, where slot c is the sum of column c (assume m is rectangular).
3. If \`m.length == 0\`, both methods return \`new int[0]\`.`,
    },
  ],
  visualizations: [{ type: "traversal", title: "Traversal Lab", modes: ["row-major", "column-major"], rows: 3, cols: 4 }],
  task: {
    instructions: "Implement `rowSums` and `columnSums`. Which one should have the column as its outer loop?",
    mainClass: "BrightnessStats",
    testClass: "BrightnessStatsTest",
    files: [
      {
        path: "BrightnessStats.java",
        content: `import java.util.Arrays;

public class BrightnessStats {

    /** slot r = sum of row r */
    public static int[] rowSums(int[][] m) {
        int[] sums = new int[m.length];
        // TODO
        return sums;
    }

    /** slot c = sum of column c. Assumes m is rectangular. */
    public static int[] columnSums(int[][] m) {
        // TODO: when m.length == 0, how do you know the number of columns?
        return new int[0];
    }

    public static void main(String[] args) {
        int[][] m = {
            {1, 2, 3, 4},
            {5, 6, 7, 8},
            {9, 10, 11, 12}
        };
        System.out.println("row sums    = " + Arrays.toString(rowSums(m)));
        System.out.println("column sums = " + Arrays.toString(columnSums(m)));
    }
}
`,
      },
      {
        path: "BrightnessStatsTest.java",
        readOnly: true,
        content: `import tutor.Check;

public class BrightnessStatsTest {

    static void test1_rowSums() {
        int[][] m = {{1, 2, 3}, {4, 5, 6}};
        Check.equal(new int[]{6, 15}, BrightnessStats.rowSums(m), "rowSums 2x3");
    }

    static void test2_columnSums() {
        int[][] m = {{1, 2, 3}, {4, 5, 6}};
        Check.equal(new int[]{5, 7, 9}, BrightnessStats.columnSums(m), "columnSums 2x3");
    }

    static void test3_tallMatrix() {
        int[][] m = {{1, 2}, {3, 4}, {5, 6}};
        Check.equal(new int[]{9, 12}, BrightnessStats.columnSums(m), "columnSums 3x2");
        Check.equal(new int[]{3, 7, 11}, BrightnessStats.rowSums(m), "rowSums 3x2");
    }

    static void test4_singleCell() {
        int[][] m = {{42}};
        Check.equal(new int[]{42}, BrightnessStats.rowSums(m), "rowSums 1x1");
        Check.equal(new int[]{42}, BrightnessStats.columnSums(m), "columnSums 1x1");
    }

    static void test5_empty() {
        Check.equal(new int[0], BrightnessStats.rowSums(new int[0][0]), "rowSums of an empty array");
        Check.equal(new int[0], BrightnessStats.columnSums(new int[0][0]), "columnSums of an empty array");
    }
}
`,
      },
    ],
    testLabels: {
      test1_rowSums: "rowSums (2×3)",
      test2_columnSums: "columnSums (2×3)",
      test3_tallMatrix: "Non-square 3×2",
      test4_singleCell: "1×1 matrix",
      test5_empty: "Empty array (edge case)",
    },
    hints: [
      "`rowSums`: the outer loop goes over r, the inner over c; add `m[r][c]` to `sums[r]`.",
      "The result of `columnSums` has `m[0].length` slots, but you can only read `m[0]` when `m.length > 0`.",
      "`columnSums` is column-major: outer `for (int c ...)`, inner `for (int r ...)`, adding into `sums[c]`.",
    ],
  },
};

const pf103: Ticket = {
  id: "PF-103",
  slug: "brightness-filter-in-place",
  title: "Ship the first filter: brightness and the enhanced for trap",
  xp: 200,
  learningGoal: {
    level: "easy",
    goal: "Apply a pixel-wise operation with clamping, both into a new array and in place, and avoid the enhanced-for trap: the loop variable is a copy, so writing needs row[c].",
    techniques: ["Pixel-wise map over every cell", "Clamping to 0-255", "New array vs changing in place", "Enhanced for: value copy vs element write"],
  },
  briefing: `You made it through onboarding! 🚀 This is your first ticket that **ships in the product**.

Mini Photoshop's brightness slider calls the \`Filters.brighten\` you write. Whatever your Java code computes is shown directly in the image editor.

There is also a bug from QA: the "Exposure +10" button, which changes the image in place, does nothing at all 🐛 The previous engineer used an enhanced for loop. You'll find out why that has no effect and fix it.`,
  objectives: [
    "See a grayscale image as an int[][] where each value is a brightness from 0 to 255",
    "Implement a pixel-wise operation and clamp the result to 0–255",
    "Return a new array without changing the original image",
    "Explain why changing the for-each variable doesn't change the array, but changing row[c] does",
  ],
  blocks: [
    {
      type: "markdown",
      md: `## Image = 2D array

A grayscale image can be stored as \`int[][] image\`:

- \`image.length\` is the **height** (number of rows), \`image[0].length\` is the **width** (number of columns).
- \`image[r][c]\` is the pixel in row r, column c: **0 = black, 255 = white**.

In the image preview (🖼 Try on an image, next to ▶ Run main), move the mouse over the image to see each pixel's \`(row, col)\` and brightness. Click to change its value.`,
    },
    { type: "viz-link", vizIndex: 0, label: "see how pixels map to the array, then brighten a real image" },
    {
      type: "predict",
      id: "pf105-clamp",
      question: "A pixel is 250 and brightness goes +20. What goes wrong if you store the result as is?",
      options: ["Nothing, it is just 270", "It is outside the valid 0–255 range, so it displays wrong", "Java turns it into 255 automatically", "Compile error"],
      answer: 1,
      explain: "An `int` can hold 270, and Java won't limit it for you. But a pixel must be 0–255, so we **clamp** it ourselves: below 0 becomes 0, above 255 becomes 255.",
    },
    {
      type: "markdown",
      md: `## Clamp

~~~java
static int clamp(int v) {
    if (v < 0) return 0;
    if (v > 255) return 255;
    return v;
}
~~~

(You can also write \`Math.max(0, Math.min(255, v))\`.)

## The enhanced for trap

In 2D, an enhanced for gives the outer loop **a reference to one row** each time (type \`int[]\`), and the inner loop **a copy of one int** each time.

~~~java
for (int[] row : img) {
    for (int value : row) {
        System.out.println(value);
    }
}
~~~`,
    },
    { type: "viz-link", vizIndex: 1, label: "Pick \"Enhanced for\" and watch what row and value refer to at each step" },
    {
      type: "predict",
      id: "pf103-bug",
      question: "This is the bug QA reported. What does it print?",
      code: `int[][] img = {{10, 20}, {30, 40}};
for (int[] row : img) {
    for (int v : row) {
        v += 10;
    }
}
System.out.println(img[0][0]);`,
      options: ["10", "20", "Compile error", "ArrayIndexOutOfBoundsException"],
      answer: 0,
      explain: "`v` is a **copy** of the element (a primitive int). Changing `v` changes only the local variable; the array is untouched. But `row` is a reference to the real inner array, so `row[c] += 10` does change the array.",
    },
    {
      type: "callout",
      tone: "info",
      md: "Rule of thumb: for-each is for **reading**. When you need to **change** elements or need the index, use a regular index loop (at least for the inner loop: `for (int c = 0; c < row.length; c++) row[c] = ...;`).",
    },
    {
      type: "markdown",
      md: `## Your task

In \`Filters.java\`, implement:

1. \`clamp(int v)\`: limit v to 0–255.
2. \`brighten(int[][] img, int delta)\`: return a **new** array of the same size where each pixel = \`clamp(img[r][c] + delta)\`. Do not change \`img\`.
3. \`brightenInPlace(int[][] img, int delta)\`: fix the previous engineer's version so it **really changes the array that was passed in**, clamped to 0–255.

All of them must handle jagged arrays. Once the tests pass, press **🖼 Try on an image** next to ▶ Run main, then **Apply brighten with my Java**, and your code processes a real image!`,
    },
    {
      type: "callout",
      tone: "info",
      md: "The label under the image tells you where the result came from: only **\"Computed by your Java code\"** means your `brighten` produced it. Mini Photoshop never secretly computes it in JavaScript.",
    },
  ],
  visualizations: [
    { type: "image-lab", title: "Mini Photoshop", filter: "brighten" },
    { type: "traversal", title: "Enhanced for", modes: ["enhanced-for", "row-major"], rows: 3, cols: 3 },
  ],
  task: {
    instructions: "Implement `clamp`, `brighten` (returns a new image) and fix `brightenInPlace` (changes the image), then process an image with your Java code.",
    mainClass: "Filters",
    testClass: "FiltersTest",
    files: [
      {
        path: "Filters.java",
        content: `import java.util.Arrays;

public class Filters {

    /** Limits v to 0..255 */
    public static int clamp(int v) {
        // TODO
        return v;
    }

    /**
     * Returns a new image: each pixel = clamp(original value + delta).
     * Must not change img.
     */
    public static int[][] brighten(int[][] img, int delta) {
        // TODO
        return img;
    }

    /** Adds delta to every pixel of img itself, clamped to 0..255 (no return value). */
    public static void brightenInPlace(int[][] img, int delta) {
        // Written by the previous engineer. It has a bug:
        for (int[] row : img) {
            for (int v : row) {
                v = clamp(v + delta);
            }
        }
    }

    public static void main(String[] args) {
        int[][] img = {
            {0, 100, 200},
            {50, 150, 250}
        };
        int[][] out = brighten(img, 30);
        System.out.println("brightened: " + Arrays.deepToString(out));
        System.out.println("original:   " + Arrays.deepToString(img) + "  (should still be [[0, 100, 200], [50, 150, 250]])");
        brightenInPlace(img, 10);
        System.out.println("after in-place +10: " + Arrays.deepToString(img) + "  (should be [[10, 110, 210], [60, 160, 255]])");
    }
}
`,
      },
      {
        path: "FiltersTest.java",
        readOnly: true,
        content: `import tutor.Check;

public class FiltersTest {

    static void test1_clamp() {
        Check.equal(0, Filters.clamp(-20), "clamp(-20)");
        Check.equal(128, Filters.clamp(128), "clamp(128)");
        Check.equal(255, Filters.clamp(300), "clamp(300)");
    }

    static void test2_brightenBasic() {
        int[][] out = Filters.brighten(new int[][]{{0, 100}, {50, 150}}, 30);
        Check.equal(new int[][]{{30, 130}, {80, 180}}, out, "brighten +30");
    }

    static void test3_brightenClamps() {
        Check.equal(new int[][]{{255, 255, 255}}, Filters.brighten(new int[][]{{250, 255, 240}}, 20), "above 255 must clamp");
        Check.equal(new int[][]{{0}, {0, 150}}, Filters.brighten(new int[][]{{10}, {0, 200}}, -50), "below 0 must clamp (negative delta, jagged)");
    }

    static void test4_doesNotModifyInput() {
        int[][] img = {{1, 2}, {3, 4}};
        int[][] out = Filters.brighten(img, 10);
        Check.notSame(img, out, "brighten returned img itself (the same array object it received). Create a NEW array with new int[...] and write the results there, so the original picture is kept");
        Check.notSame(img[0], out[0], "out[0] is the same row object as img[0]. Create every row with new int[img[r].length]");
        Check.equal(new int[][]{{1, 2}, {3, 4}}, img, "the original image changed. brighten may only read img and must write into the new array");
    }

    static void test5_inPlaceChangesArray() {
        int[][] img = {{10, 20}, {30, 40}};
        Filters.brightenInPlace(img, 10);
        Check.equal(new int[][]{{20, 30}, {40, 50}}, img, "array after brightenInPlace(+10). Changing the for-each variable v does not change the array: write row[c]");
    }

    static void test6_inPlaceClampsJagged() {
        int[][] img = {{5}, {250, 7}};
        Filters.brightenInPlace(img, -10);
        Check.equal(new int[][]{{0}, {240, 0}}, img, "brightenInPlace(-10) on a jagged array, clamped at 0");
        Filters.brightenInPlace(img, 20);
        Check.equal(new int[][]{{20}, {255, 20}}, img, "brightenInPlace(+20), clamped at 255");
    }
}
`,
      },
    ],
    testLabels: {
      test1_clamp: "clamp at the edges",
      test2_brightenBasic: "brighten, basic case",
      test3_brightenClamps: "brighten clamps above 255 and below 0",
      test4_doesNotModifyInput: "brighten keeps the original image",
      test5_inPlaceChangesArray: "brightenInPlace really changes the array",
      test6_inPlaceClampsJagged: "brightenInPlace clamps, jagged rows",
    },
    hints: [
      "Write `clamp` first, then call it for every pixel in `brighten` and `brightenInPlace`.",
      "New array: `int[][] out = new int[img.length][];`, then for each row `out[r] = new int[img[r].length];` (this handles jagged arrays too).",
      "The `brightenInPlace` bug: `v` is just a copy. Getting `row` with a for-each is fine, but the inner loop needs an index: `row[c] = clamp(row[c] + delta);`",
    ],
  },
};

const pf104: Ticket = {
  id: "PF-104",
  slug: "matrix-algorithms",
  title: "Getting ready for rotate: diagonals and transpose",
  xp: 150,
  learningGoal: {
    level: "easy",
    goal: "Loop with one index when the shape allows it (diagonals), and build a new array with swapped dimensions (transpose).",
    techniques: ["Diagonal access [i][i] and [i][n-1-i]", "Single loop vs nested loop cost", "Allocating new int[cols][rows]", "Non-square matrices"],
  },
  briefing: `The product manager wants "Rotate 90°" soon. The first step of a rotation is the **transpose**: rows become columns.

The image-analysis team also needs the brightness along the diagonals. In this ticket you'll implement these matrix algorithms and compare their time complexity.`,
  objectives: [
    "Implement diagonal sums and the transpose",
    "Explain the difference between O(1), O(N) and O(R·C)",
    "Explain why a transpose needs O(R·C) extra space",
    "Handle non-square matrices",
  ],
  blocks: [
    {
      type: "markdown",
      md: `## A diagonal needs only one loop

In an N×N matrix the **main diagonal** is \`m[i][i]\` and the **anti-diagonal** is \`m[i][N - 1 - i]\`.

~~~java
int sum = 0;
for (int i = 0; i < m.length; i++) {
    sum += m[i][i];
}
~~~

It visits only N cells, so it is **O(N)**. Scanning every cell and checking \`r == c\` would be **O(N²)**, a lot of wasted work.`,
    },
    { type: "viz-link", vizIndex: 0, label: "Compare the number of reads for \"Main diagonal\" and \"Max\"" },
    {
      type: "predict",
      id: "pf104-complexity",
      question: "What are the time and extra-space complexity of transposing an R×C matrix?",
      options: ["Time O(R), space O(1)", "Time O(R·C), space O(R·C)", "Time O(1), space O(R·C)", "Time O(R·C), space O(1)"],
      answer: 1,
      explain: "Every element is copied once → O(R·C) time; the result is a new C×R array → O(R·C) extra space. (A square matrix can be transposed in place, but that is an advanced exercise.)",
    },
    {
      type: "markdown",
      md: `## Transpose

After transposing, \`t[c][r] = m[r][c]\`. If m is R×C, t is **C×R**:

~~~java
int[][] t = new int[m[0].length][m.length];
~~~

## Your task

In \`MatrixTools.java\`, implement:

1. \`mainDiagonalSum(int[][] m)\`: the sum of the main diagonal (m is N×N).
2. \`antiDiagonalSum(int[][] m)\`: the sum of the anti-diagonal (m is N×N).
3. \`transpose(int[][] m)\`: return a **new** C×R array; do not change m.`,
    },
  ],
  visualizations: [
    { type: "matrix-algo", title: "Matrix Algorithm Lab", algorithms: ["main-diagonal", "anti-diagonal", "row-sum", "column-sum", "max", "transpose"] },
  ],
  task: {
    instructions: "Implement `mainDiagonalSum`, `antiDiagonalSum` and `transpose`. The transpose must work for non-square matrices.",
    mainClass: "MatrixTools",
    testClass: "MatrixToolsTest",
    files: [
      {
        path: "MatrixTools.java",
        content: `import java.util.Arrays;

public class MatrixTools {

    /** m is N x N: returns m[0][0] + m[1][1] + ... */
    public static int mainDiagonalSum(int[][] m) {
        // TODO: one loop is enough
        return 0;
    }

    /** m is N x N: returns m[0][N-1] + m[1][N-2] + ... */
    public static int antiDiagonalSum(int[][] m) {
        // TODO
        return 0;
    }

    /** Returns the transpose of m (a new array). m is R x C, the result is C x R. */
    public static int[][] transpose(int[][] m) {
        // TODO
        return m;
    }

    public static void main(String[] args) {
        int[][] m = {
            {1, 2, 3},
            {4, 5, 6},
            {7, 8, 9}
        };
        System.out.println("main diagonal = " + mainDiagonalSum(m));
        System.out.println("anti diagonal = " + antiDiagonalSum(m));
        int[][] wide = {{1, 2, 3}, {4, 5, 6}};
        System.out.println("transpose     = " + Arrays.deepToString(transpose(wide)));
    }
}
`,
      },
      {
        path: "MatrixToolsTest.java",
        readOnly: true,
        content: `import tutor.Check;

public class MatrixToolsTest {

    static final int[][] M3 = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};

    static void test1_mainDiagonal() {
        Check.equal(15, MatrixTools.mainDiagonalSum(Check.copy(M3)), "3x3 main diagonal");
        Check.equal(34, MatrixTools.mainDiagonalSum(new int[][]{{1, 2, 3, 4}, {5, 6, 7, 8}, {9, 10, 11, 12}, {13, 14, 15, 16}}), "4x4 main diagonal");
    }

    static void test2_antiDiagonal() {
        Check.equal(15, MatrixTools.antiDiagonalSum(Check.copy(M3)), "3x3 anti-diagonal");
        Check.equal(5, MatrixTools.antiDiagonalSum(new int[][]{{1, 2}, {3, 4}}), "2x2 anti-diagonal");
    }

    static void test3_singleCell() {
        Check.equal(7, MatrixTools.mainDiagonalSum(new int[][]{{7}}), "1x1 main diagonal");
        Check.equal(7, MatrixTools.antiDiagonalSum(new int[][]{{7}}), "1x1 anti-diagonal");
    }

    static void test4_transposeSquare() {
        Check.equal(new int[][]{{1, 4, 7}, {2, 5, 8}, {3, 6, 9}}, MatrixTools.transpose(Check.copy(M3)), "3x3 transpose");
    }

    static void test5_transposeWide() {
        Check.equal(new int[][]{{1, 4}, {2, 5}, {3, 6}}, MatrixTools.transpose(new int[][]{{1, 2, 3}, {4, 5, 6}}), "2x3 transposes to 3x2");
    }

    static void test6_doesNotModifyInput() {
        int[][] m = {{1, 2}, {3, 4}};
        int[][] t = MatrixTools.transpose(m);
        Check.notSame(m, t, "transpose should return a new array, not m itself");
        Check.equal(new int[][]{{1, 2}, {3, 4}}, m, "the original m must not change");
    }
}
`,
      },
    ],
    testLabels: {
      test1_mainDiagonal: "Main diagonal (3×3, 4×4)",
      test2_antiDiagonal: "Anti-diagonal (3×3, 2×2)",
      test3_singleCell: "1×1 matrix",
      test4_transposeSquare: "Transpose 3×3",
      test5_transposeWide: "Transpose non-square 2×3 → 3×2",
      test6_doesNotModifyInput: "Returns a new array, input unchanged",
    },
    hints: [
      "Main diagonal: `for (int i = 0; i < m.length; i++) sum += m[i][i];`",
      "On the anti-diagonal, the column is `m.length - 1 - i`.",
      "Transpose: first `new int[m[0].length][m.length]`, then two loops with `t[c][r] = m[r][c]`.",
    ],
  },
};

const pf105: Ticket = {
  id: "PF-105",
  issuedByDefault: false,
  slug: "brightness-filter",
  title: "Ship the first filter: brightness",
  xp: 200,
  learningGoal: {
    level: "easy",
    goal: "Apply a pixel-wise operation into a new array and keep every value in range.",
    techniques: ["Pixel-wise map over every cell", "Clamping to 0-255", "Returning a new array", "Leaving the input unchanged"],
  },
  briefing: `You made it through onboarding! 🚀 This is your first ticket that **ships in the product**.

Mini Photoshop's brightness slider calls the \`Filters.brighten\` you write. Whatever your Java code computes is shown directly in the image editor.`,
  objectives: [
    "See a grayscale image as an int[][] where each value is a brightness from 0 to 255",
    "Use the pixel inspector to match coordinates with array elements",
    "Implement a pixel-wise operation and clamp the result to 0–255",
    "Return a new array without changing the original image",
  ],
  blocks: [
    {
      type: "markdown",
      md: `## Image = 2D array

A grayscale image can be stored as \`int[][] image\`:

- \`image.length\` is the **height** (number of rows), \`image[0].length\` is the **width** (number of columns).
- \`image[r][c]\` is the pixel in row r, column c: **0 = black, 255 = white**.

In the image preview (🖼 Try on an image, next to ▶ Run main), move the mouse over the image to see each pixel's \`(row, col)\` and brightness. Click to change its value.`,
    },
    { type: "viz-link", vizIndex: 0, label: "see how pixels map to the array, then brighten a real image" },
    {
      type: "predict",
      id: "pf105-clamp",
      question: "A pixel is 250 and brightness goes +20. What goes wrong if you store the result as is?",
      options: ["Nothing, it is just 270", "It is outside the valid 0–255 range, so it displays wrong", "Java turns it into 255 automatically", "Compile error"],
      answer: 1,
      explain: "An `int` can hold 270, and Java won't limit it for you. But a pixel must be 0–255, so we **clamp** it ourselves: below 0 becomes 0, above 255 becomes 255.",
    },
    {
      type: "markdown",
      md: `## Clamp

~~~java
static int clamp(int v) {
    if (v < 0) return 0;
    if (v > 255) return 255;
    return v;
}
~~~

(You can also write \`Math.max(0, Math.min(255, v))\`.)

## Your task

In \`Filters.java\`, implement \`brighten(int[][] img, int delta)\`:

1. Create a **new** array of the same size.
2. Each pixel = \`clamp(img[r][c] + delta)\`.
3. Do not change \`img\`.

Once the tests pass, press **🖼 Try on an image** next to ▶ Run main, then **Apply brighten with my Java**, and your code processes a real image!`,
    },
    {
      type: "callout",
      tone: "info",
      md: "The label under the image tells you where the result came from: only **\"Computed by your Java code\"** means your `brighten` produced it. Mini Photoshop never secretly computes it in JavaScript.",
    },
  ],
  visualizations: [{ type: "image-lab", title: "Mini Photoshop", filter: "brighten" }],
  task: {
    instructions: "Implement `clamp` and `brighten`, then process an image with your Java code.",
    mainClass: "Filters",
    testClass: "FiltersTest",
    files: [
      {
        path: "Filters.java",
        content: `public class Filters {

    /** Limits v to 0..255 */
    public static int clamp(int v) {
        // TODO
        return v;
    }

    /**
     * Returns a new image: each pixel = clamp(original value + delta).
     * Must not change img.
     */
    public static int[][] brighten(int[][] img, int delta) {
        // TODO
        return img;
    }

    public static void main(String[] args) {
        int[][] img = {
            {0, 100, 200},
            {50, 150, 250}
        };
        int[][] out = brighten(img, 30);
        System.out.println("brightened: " + java.util.Arrays.deepToString(out));
        System.out.println("original:   " + java.util.Arrays.deepToString(img) + "  (should still be [[0, 100, 200], [50, 150, 250]])");
    }
}
`,
      },
      {
        path: "FiltersTest.java",
        readOnly: true,
        content: `import tutor.Check;

public class FiltersTest {

    static void test1_clamp() {
        Check.equal(0, Filters.clamp(-20), "clamp(-20)");
        Check.equal(128, Filters.clamp(128), "clamp(128)");
        Check.equal(255, Filters.clamp(300), "clamp(300)");
    }

    static void test2_brightenBasic() {
        int[][] out = Filters.brighten(new int[][]{{0, 100}, {50, 150}}, 30);
        Check.equal(new int[][]{{30, 130}, {80, 180}}, out, "brighten +30");
    }

    static void test3_clampHigh() {
        int[][] out = Filters.brighten(new int[][]{{250, 255, 240}}, 20);
        Check.equal(new int[][]{{255, 255, 255}}, out, "above 255 must clamp");
    }

    static void test4_clampLow() {
        int[][] out = Filters.brighten(new int[][]{{10}, {0}, {200}}, -50);
        Check.equal(new int[][]{{0}, {0}, {150}}, out, "below 0 must clamp (negative delta)");
    }

    static void test5_doesNotModifyInput() {
        int[][] img = {{1, 2}, {3, 4}};
        int[][] out = Filters.brighten(img, 10);
        Check.notSame(img, out, "brighten returned img itself (the same array object it received). Create a NEW array with new int[...] and write the results there, so the original picture is kept");
        Check.notSame(img[0], out[0], "out[0] is the same row object as img[0]. Create every row with new int[img[r].length]");
        Check.equal(new int[][]{{1, 2}, {3, 4}}, img, "the original image changed. brighten may only read img and must write into the new array");
    }
}
`,
      },
    ],
    testLabels: {
      test1_clamp: "clamp at the edges",
      test2_brightenBasic: "brighten, basic case",
      test3_clampHigh: "above 255 must clamp",
      test4_clampLow: "Clamps below 0",
      test5_doesNotModifyInput: "Original image unchanged",
    },
    hints: [
      "Write `clamp` first, then call it for every pixel in `brighten`.",
      "New array: `int[][] out = new int[img.length][];`, then for each row `out[r] = new int[img[r].length];` (this handles jagged arrays too).",
      "Writing `int[][] out = img;` only copies the reference (remember aliasing from PF-101?).",
    ],
  },
};

export const tickets: Ticket[] = [pf101, pf102, pf103, pf104, pf105];
