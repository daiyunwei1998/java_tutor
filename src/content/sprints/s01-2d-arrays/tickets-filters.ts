import type { Ticket } from "../../types";

/*
 * Sprint 1, part 2: the Mini Photoshop filters (PF-201..PF-205).
 * Same format as tickets.ts: content is data only, Markdown uses ~~~ fences so it can live inside template literals.
 * Reference solutions live in tools/solutions/<mainClass>.java; check them with tools/verify-content.mjs.
 */

const pf201: Ticket = {
  id: "PF-201",
  slug: "grayscale",
  title: "Grayscale conversion: three channels into one image",
  xp: 150,
  briefing: `Users keep uploading **color** photos, but every filter we have works on grayscale \`int[][]\` images.

A color image is stored as three separate channels: \`red\`, \`green\` and \`blue\`. Each one is an \`int[][]\` of the same size, with values 0–255. Your job: combine the three channels into a single grayscale image so the rest of the pipeline can use it.`,
  objectives: [
    "Traverse several 2D arrays of the same shape in lockstep with one pair of indices",
    "Validate that arrays really have the same shape before using them together",
    "Compare a simple average with a weighted (luma) formula",
    "Use integer arithmetic to stay in the 0–255 range without floating point",
  ],
  blocks: [
    {
      type: "markdown",
      md: `## One pixel, three arrays

For a color image, the pixel at row \`r\`, column \`c\` is made of three numbers:

~~~java
int red   = redChannel[r][c];
int green = greenChannel[r][c];
int blue  = blueChannel[r][c];
~~~

The same \`[r][c]\` indexes all three arrays. So one nested loop over the shape of the image is enough to visit every pixel in all three channels.`,
    },
    { type: "viz-link", vizIndex: 0, label: "See it with a real photo: split it into its red, green and blue arrays, then compute average and luma for any pixel" },
    {
      type: "predict",
      id: "pf201-avg",
      question: "A pixel has red = 200, green = 100, blue = 51. What does (red + green + blue) / 3 give in Java?",
      options: ["117", "117.0", "117.33", "118"],
      answer: 0,
      explain: "200 + 100 + 51 = 351, and 351 / 3 = 117 exactly. With int operands Java does integer division, so even when the sum is not divisible by 3 the result is truncated, never rounded up.",
    },
    {
      type: "markdown",
      md: `## Average vs luma

The simple average treats the three colors equally. Human eyes are much more sensitive to green than to blue, so a pure green and a pure blue pixel look very different in brightness, but the average gives them the same gray.

The **luma** formula weights the channels:

~~~text
gray = 0.299 * red + 0.587 * green + 0.114 * blue
~~~

To stay in integer math, multiply everything by 1000 and divide at the end:

~~~java
int gray = (299 * red + 587 * green + 114 * blue) / 1000;
~~~

The weights add up to 1000, so a white pixel (255, 255, 255) stays 255.`,
    },
    { type: "viz-link", vizIndex: 1, label: "Open Mini Photoshop on the right and compare average vs luma on a color image" },
    {
      type: "predict",
      id: "pf201-shape",
      question: "red is 2×3 and green is 3×2. Both have 6 elements. Can you safely combine them pixel by pixel?",
      options: ["Yes, they have the same number of pixels", "No, green[0][2] does not exist", "Only with an enhanced for loop", "Yes, Java resizes them automatically"],
      answer: 1,
      explain: "Same element count is not the same shape. A loop over red's shape would read green[0][2], but green's rows only have 2 columns, so you get ArrayIndexOutOfBoundsException. Always compare the number of rows and every row's length.",
    },
    {
      type: "markdown",
      md: `## Your task

In \`Grayscale.java\` implement:

1. \`sameShape(int[][] a, int[][] b)\`: \`true\` when both have the same number of rows and every row \`r\` has the same length in both.
2. \`average(red, green, blue)\`: a **new** image where each pixel is \`(r + g + b) / 3\`.
3. \`luma(red, green, blue)\`: a **new** image where each pixel is \`(299 * r + 587 * g + 114 * b) / 1000\`.

Both \`average\` and \`luma\` must throw \`IllegalArgumentException\` when the three channels do not all have the same shape. Do not modify the channels.`,
    },
  ],
  visualizations: [
    { type: "concept", title: "Concept: RGB → gray", concept: "rgb-grayscale" },
    { type: "filter-lab", title: "Mini Photoshop", filter: "grayscale" },
  ],
  task: {
    instructions: "Implement `sameShape`, `average` and `luma`. Reject channels with different shapes.",
    mainClass: "Grayscale",
    testClass: "GrayscaleTest",
    files: [
      {
        path: "Grayscale.java",
        content: `import java.util.Arrays;

public class Grayscale {

    /** True when a and b have the same number of rows and each row has the same length. */
    public static boolean sameShape(int[][] a, int[][] b) {
        // TODO: compare a.length with b.length, then every row length
        return false;
    }

    /**
     * Returns a new image: each pixel = (red + green + blue) / 3.
     * Throws IllegalArgumentException if the channels do not all have the same shape.
     */
    public static int[][] average(int[][] red, int[][] green, int[][] blue) {
        // TODO
        return red;
    }

    /**
     * Returns a new image: each pixel = (299 * red + 587 * green + 114 * blue) / 1000.
     * Throws IllegalArgumentException if the channels do not all have the same shape.
     */
    public static int[][] luma(int[][] red, int[][] green, int[][] blue) {
        // TODO
        return red;
    }

    public static void main(String[] args) {
        // One pure red, one pure green and one pure blue pixel
        int[][] red   = {{255, 0, 0}};
        int[][] green = {{0, 255, 0}};
        int[][] blue  = {{0, 0, 255}};
        System.out.println("average = " + Arrays.deepToString(average(red, green, blue)));
        System.out.println("luma    = " + Arrays.deepToString(luma(red, green, blue)));
    }
}
`,
      },
      {
        path: "GrayscaleTest.java",
        readOnly: true,
        content: `import tutor.Check;

public class GrayscaleTest {

    static final int[][] R = {{255, 0, 0}, {255, 200, 10}};
    static final int[][] G = {{0, 255, 0}, {255, 100, 20}};
    static final int[][] B = {{0, 0, 255}, {255, 51, 30}};

    static void test1_sameShape() {
        Check.isTrue(Grayscale.sameShape(new int[][]{{1, 2}, {3, 4}}, new int[][]{{0, 0}, {0, 0}}), "two 2x2 arrays have the same shape");
        Check.isTrue(!Grayscale.sameShape(new int[][]{{1, 2, 3}, {4, 5, 6}}, new int[][]{{1, 2}, {3, 4}, {5, 6}}), "2x3 and 3x2 are different shapes");
        Check.isTrue(!Grayscale.sameShape(new int[][]{{1, 2}, {3, 4}}, new int[][]{{1, 2}, {3}}), "a shorter row makes the shape different");
        Check.isTrue(!Grayscale.sameShape(new int[][]{{1}}, new int[][]{{1}, {2}}), "different number of rows");
    }

    static void test2_average() {
        Check.equal(new int[][]{{85, 85, 85}, {255, 117, 20}}, Grayscale.average(Check.copy(R), Check.copy(G), Check.copy(B)), "average of the channels");
    }

    static void test3_averageTruncates() {
        Check.equal(new int[][]{{0, 1}}, Grayscale.average(new int[][]{{1, 1}}, new int[][]{{1, 1}}, new int[][]{{0, 3}}), "integer division truncates (2/3 = 0, 5/3 = 1)");
    }

    static void test4_luma() {
        Check.equal(new int[][]{{76, 149, 29}, {255, 124, 18}}, Grayscale.luma(Check.copy(R), Check.copy(G), Check.copy(B)), "luma of the channels");
    }

    static void test5_rejectsDifferentShapes() {
        boolean thrown = false;
        try {
            Grayscale.luma(new int[][]{{1, 2}}, new int[][]{{1, 2}}, new int[][]{{1}});
        } catch (IllegalArgumentException e) {
            thrown = true;
        }
        Check.isTrue(thrown, "luma should throw IllegalArgumentException when the blue channel has a different shape");
        thrown = false;
        try {
            Grayscale.average(new int[][]{{1}, {2}}, new int[][]{{1}}, new int[][]{{1}, {2}});
        } catch (IllegalArgumentException e) {
            thrown = true;
        }
        Check.isTrue(thrown, "average should throw IllegalArgumentException when the green channel has a different shape");
    }

    static void test6_doesNotModifyInput() {
        int[][] r = Check.copy(R), g = Check.copy(G), b = Check.copy(B);
        int[][] out = Grayscale.luma(r, g, b);
        Check.notSame(r, out, "luma should return a new array, not the red channel");
        Check.equal(R, r, "the red channel should not be modified");
        Check.equal(G, g, "the green channel should not be modified");
        Check.equal(B, b, "the blue channel should not be modified");
    }
}
`,
      },
    ],
    testLabels: {
      test1_sameShape: "sameShape: rows and every row length",
      test2_average: "average of three channels",
      test3_averageTruncates: "average uses integer division",
      test4_luma: "luma weights 299 / 587 / 114",
      test5_rejectsDifferentShapes: "different shapes throw IllegalArgumentException",
      test6_doesNotModifyInput: "returns a new image, channels untouched",
    },
    hints: [
      "`sameShape`: if `a.length != b.length` return false; then loop `r` and compare `a[r].length` with `b[r].length`.",
      "At the top of `average` and `luma`: `if (!sameShape(red, green) || !sameShape(red, blue)) throw new IllegalArgumentException(\"channels differ\");`",
      "Create the result row by row: `out[r] = new int[red[r].length];`, then fill it with one inner loop that reads `red[r][c]`, `green[r][c]` and `blue[r][c]`.",
    ],
  },
};

const pf202: Ticket = {
  id: "PF-202",
  slug: "flip",
  title: "Flip horizontal and vertical",
  xp: 150,
  briefing: `Design asked for the most requested feature after brightness: **Flip**. The toolbar will have "Flip horizontal" (mirror left ↔ right) and "Flip vertical" (upside down).

There is also an old in-place mirror used by the thumbnail generator that was never finished. Please write that one too, it saves memory on big images.`,
  objectives: [
    "Map each output position to the matching input position with index arithmetic",
    "Reverse a row in place by swapping pairs from both ends",
    "Know why a swap loop must stop at the middle",
    "Build an output whose rows are new arrays, not shared with the input",
  ],
  blocks: [
    {
      type: "markdown",
      md: `## Where does each pixel go?

For an image with \`rows\` rows and \`cols\` columns:

| Operation | out[r][c] comes from |
|---|---|
| Flip horizontal | \`img[r][cols - 1 - c]\` |
| Flip vertical | \`img[rows - 1 - r][c]\` |

Writing the formula as "where does this output pixel come from" means you visit each output cell exactly once, and you never have to worry about overwriting something you still need.`,
    },
    { type: "viz-link", vizIndex: 0, label: "Step through where every output pixel comes from, and watch the in-place swap stop at the middle" },
    { type: "viz-link", vizIndex: 1, label: "Open Mini Photoshop and try both flips on the smiley with your Java code" },
    {
      type: "predict",
      id: "pf202-swap",
      question: "This loop tries to mirror one row in place. What is row after it runs?",
      code: `int[] row = {1, 2, 3, 4};
for (int c = 0; c < row.length; c++) {
    int tmp = row[c];
    row[c] = row[row.length - 1 - c];
    row[row.length - 1 - c] = tmp;
}`,
      options: ["{4, 3, 2, 1}", "{1, 2, 3, 4}", "{4, 2, 3, 1}", "ArrayIndexOutOfBoundsException"],
      answer: 1,
      explain: "The first half of the loop reverses the row, and the second half swaps every pair back. Each pair is swapped twice. An in-place reversal must stop at the middle: `c < row.length / 2`.",
    },
    {
      type: "predict",
      id: "pf202-odd",
      question: "A row has 5 elements. With the loop `for (int c = 0; c < row.length / 2; c++)`, which index is never swapped?",
      options: ["0", "2", "4", "None, all are swapped"],
      answer: 1,
      explain: "5 / 2 = 2, so c takes the values 0 and 1, swapping (0, 4) and (1, 3). The middle element at index 2 stays where it is, and that is exactly right: it is its own mirror image.",
    },
    {
      type: "callout",
      tone: "warn",
      md: "For **flip vertical** it is tempting to write `out[r] = img[rows - 1 - r];`. That copies a reference to the input row, so `out` and `img` share their rows: editing the flipped image would also change the original. The tests check this. Copy the values into a new row instead.",
    },
    {
      type: "markdown",
      md: `## Your task

In \`Flip.java\` implement:

1. \`flipHorizontal(int[][] img)\`: returns a **new** image mirrored left ↔ right.
2. \`flipVertical(int[][] img)\`: returns a **new** image upside down. Every row must be a new array.
3. \`mirrorInPlace(int[][] img)\`: mirrors left ↔ right **inside** \`img\` itself by swapping, and returns nothing.

Images are rectangular for this ticket.`,
    },
  ],
  visualizations: [
    { type: "concept", title: "Concept: index mapping", concept: "flip-mapping" },
    { type: "filter-lab", title: "Mini Photoshop", filter: "flip" },
  ],
  task: {
    instructions: "Implement `flipHorizontal`, `flipVertical` (both return new images) and `mirrorInPlace` (modifies the image).",
    mainClass: "Flip",
    testClass: "FlipTest",
    files: [
      {
        path: "Flip.java",
        content: `import java.util.Arrays;

public class Flip {

    /** Returns a new image mirrored left <-> right. img is not modified. */
    public static int[][] flipHorizontal(int[][] img) {
        // TODO: out[r][c] = img[r][cols - 1 - c]
        return img;
    }

    /** Returns a new image upside down. Every row of the result is a new array. */
    public static int[][] flipVertical(int[][] img) {
        // TODO: out[r][c] = img[rows - 1 - r][c]
        return img;
    }

    /** Mirrors every row of img left <-> right in place (swap from both ends). */
    public static void mirrorInPlace(int[][] img) {
        // TODO: only go to the middle of each row
    }

    public static void main(String[] args) {
        int[][] img = {
            {1, 2, 3},
            {4, 5, 6}
        };
        System.out.println("horizontal = " + Arrays.deepToString(flipHorizontal(img)));
        System.out.println("vertical   = " + Arrays.deepToString(flipVertical(img)));
        mirrorInPlace(img);
        System.out.println("in place   = " + Arrays.deepToString(img));
    }
}
`,
      },
      {
        path: "FlipTest.java",
        readOnly: true,
        content: `import tutor.Check;

public class FlipTest {

    static final int[][] M = {{1, 2, 3}, {4, 5, 6}};

    static void test1_horizontal() {
        Check.equal(new int[][]{{3, 2, 1}, {6, 5, 4}}, Flip.flipHorizontal(Check.copy(M)), "flipHorizontal 2x3");
        Check.equal(new int[][]{{2, 1}, {4, 3}, {6, 5}}, Flip.flipHorizontal(new int[][]{{1, 2}, {3, 4}, {5, 6}}), "flipHorizontal 3x2");
    }

    static void test2_vertical() {
        Check.equal(new int[][]{{4, 5, 6}, {1, 2, 3}}, Flip.flipVertical(Check.copy(M)), "flipVertical 2x3");
        Check.equal(new int[][]{{5, 6}, {3, 4}, {1, 2}}, Flip.flipVertical(new int[][]{{1, 2}, {3, 4}, {5, 6}}), "flipVertical 3x2 (middle row stays)");
    }

    static void test3_newArrays() {
        int[][] img = Check.copy(M);
        int[][] h = Flip.flipHorizontal(img);
        int[][] v = Flip.flipVertical(img);
        Check.notSame(img, h, "flipHorizontal should return a new array");
        Check.notSame(img, v, "flipVertical should return a new array");
        Check.equal(M, img, "the input should not be modified");
    }

    static void test4_verticalDoesNotShareRows() {
        int[][] img = Check.copy(M);
        int[][] v = Flip.flipVertical(img);
        v[0][0] = 99;
        Check.equal(M, img, "changing the flipped image changed the original: out[r] = img[...] shares the row, copy the values instead");
    }

    static void test5_mirrorInPlaceEven() {
        int[][] img = {{1, 2, 3, 4}, {5, 6, 7, 8}};
        Flip.mirrorInPlace(img);
        Check.equal(new int[][]{{4, 3, 2, 1}, {8, 7, 6, 5}}, img, "mirrorInPlace with an even width");
    }

    static void test6_mirrorInPlaceOdd() {
        int[][] img = {{1, 2, 3, 4, 5}};
        Flip.mirrorInPlace(img);
        Check.equal(new int[][]{{5, 4, 3, 2, 1}}, img, "mirrorInPlace with an odd width");
    }

    static void test7_singleColumn() {
        Check.equal(new int[][]{{1}, {2}}, Flip.flipHorizontal(new int[][]{{1}, {2}}), "flipHorizontal of a single column");
        int[][] one = {{7}};
        Flip.mirrorInPlace(one);
        Check.equal(new int[][]{{7}}, one, "mirrorInPlace of 1x1");
    }
}
`,
      },
    ],
    testLabels: {
      test1_horizontal: "flipHorizontal",
      test2_vertical: "flipVertical",
      test3_newArrays: "flips return new arrays",
      test4_verticalDoesNotShareRows: "flipVertical does not share rows",
      test5_mirrorInPlaceEven: "mirrorInPlace, even width",
      test6_mirrorInPlaceOdd: "mirrorInPlace, odd width",
      test7_singleColumn: "single column and 1×1",
    },
    hints: [
      "Start with `int rows = img.length, cols = img[0].length; int[][] out = new int[rows][cols];`",
      "`flipVertical`: read `img[rows - 1 - r][c]` into `out[r][c]` with two loops. Do not assign whole rows.",
      "`mirrorInPlace`: for each row, `for (int c = 0; c < row.length / 2; c++)` swap `row[c]` and `row[row.length - 1 - c]` with a temporary variable.",
    ],
  },
};

const pf203: Ticket = {
  id: "PF-203",
  slug: "box-blur",
  title: "Box blur: 3×3 neighborhoods and bounds checks",
  xp: 200,
  briefing: `Next up: the **Blur** button. The simplest blur replaces every pixel with the average of the 3×3 square around it.

Last time someone tried this, the app crashed on the first pixel with \`ArrayIndexOutOfBoundsException\` 💥 because the corner pixel has no neighbor above it or to its left. This time, handle the edges properly.`,
  objectives: [
    "Visit the 3×3 neighborhood of a cell with row and column offsets",
    "Write a bounds check so edge and corner pixels never index outside the array",
    "Average only the neighbors that exist",
    "Read from the original image and write to a separate output",
  ],
  blocks: [
    {
      type: "markdown",
      md: `## The neighborhood of (r, c)

The 3×3 neighborhood is every cell \`(r + dr, c + dc)\` with \`dr\` and \`dc\` each in \`-1, 0, 1\`:

~~~java
for (int dr = -1; dr <= 1; dr++) {
    for (int dc = -1; dc <= 1; dc++) {
        int nr = r + dr, nc = c + dc;
        // use img[nr][nc] ... but only if it exists!
    }
}
~~~

## Bounds check

A position is inside the image when

~~~java
nr >= 0 && nr < img.length && nc >= 0 && nc < img[nr].length
~~~

The order matters: \`&&\` stops at the first \`false\`, so \`img[nr]\` is only read once we know \`nr\` is a valid row.`,
    },
    { type: "viz-link", vizIndex: 0, label: "Step through the blur cell by cell: which neighbors exist, the sum, the count and the average" },
    {
      type: "predict",
      id: "pf203-corner",
      question: "In a 4×4 image, how many cells of the 3×3 neighborhood of the corner (0, 0) are inside the image?",
      options: ["9", "6", "4", "3"],
      answer: 2,
      explain: "Rows -1, 0, 1 and columns -1, 0, 1: only rows 0–1 and columns 0–1 exist, so 2 × 2 = 4 cells. An edge pixel (not a corner) has 6, and an interior pixel has all 9.",
    },
    { type: "viz-link", vizIndex: 1, label: "Open Mini Photoshop and blur the checkerboard a few times" },
    {
      type: "predict",
      id: "pf203-inplace",
      question: "What goes wrong if you write the blurred value straight back into img[r][c] while you are still blurring?",
      options: ["Nothing, it is the same result", "Later pixels average values that were already blurred", "Java throws an exception", "Only the corners change"],
      answer: 1,
      explain: "When you reach (r, c + 1), its left neighbor (r, c) already holds the blurred value instead of the original one. The result depends on the loop order and is not a real box blur. Always read from img and write into a new array.",
    },
    {
      type: "markdown",
      md: `## Your task

In \`Blur.java\` implement:

1. \`inBounds(int[][] img, int r, int c)\`: \`true\` when \`img[r][c]\` exists.
2. \`average3x3(int[][] img, int r, int c)\`: the average (integer division) of the cells of the 3×3 neighborhood of \`(r, c)\` **that are inside the image**.
3. \`boxBlur(int[][] img)\`: a **new** image where every pixel is \`average3x3(img, r, c)\`. Do not modify \`img\`.`,
    },
  ],
  visualizations: [
    { type: "concept", title: "Concept: 3×3 average", concept: "box-blur" },
    { type: "filter-lab", title: "Mini Photoshop", filter: "blur" },
  ],
  task: {
    instructions: "Implement `inBounds`, `average3x3` and `boxBlur`. Edge and corner pixels average only the neighbors that exist.",
    mainClass: "Blur",
    testClass: "BlurTest",
    files: [
      {
        path: "Blur.java",
        content: `import java.util.Arrays;

public class Blur {

    /** True when (r, c) is a valid position in img. */
    public static boolean inBounds(int[][] img, int r, int c) {
        // TODO
        return true;
    }

    /**
     * Average of the cells in the 3x3 neighborhood of (r, c) that are inside img.
     * Uses integer division: sum / count.
     */
    public static int average3x3(int[][] img, int r, int c) {
        // TODO: loop dr and dc from -1 to 1, skip positions outside img
        return img[r][c];
    }

    /** Returns a new image where every pixel is average3x3(img, r, c). img is not modified. */
    public static int[][] boxBlur(int[][] img) {
        // TODO
        return img;
    }

    public static void main(String[] args) {
        int[][] img = {
            {0,   0,   0, 0},
            {0, 180, 180, 0},
            {0, 180, 180, 0},
            {0,   0,   0, 0}
        };
        for (int[] row : boxBlur(img)) {
            System.out.println(Arrays.toString(row));
        }
    }
}
`,
      },
      {
        path: "BlurTest.java",
        readOnly: true,
        content: `import tutor.Check;

public class BlurTest {

    static final int[][] M = {
        {10, 20, 30},
        {40, 50, 60},
        {70, 80, 90}
    };

    static void test1_inBounds() {
        Check.isTrue(Blur.inBounds(M, 0, 0), "(0, 0) is inside");
        Check.isTrue(Blur.inBounds(M, 2, 2), "(2, 2) is inside a 3x3 image");
        Check.isTrue(!Blur.inBounds(M, -1, 0), "row -1 is outside");
        Check.isTrue(!Blur.inBounds(M, 0, 3), "column 3 is outside a 3x3 image");
        Check.isTrue(!Blur.inBounds(M, 3, 1), "row 3 is outside a 3x3 image");
        Check.isTrue(!Blur.inBounds(new int[][]{{1, 2, 3}, {4, 5}}, 1, 2), "(1, 2) is outside when row 1 only has 2 elements");
    }

    static void test2_center() {
        Check.equal(50, Blur.average3x3(Check.copy(M), 1, 1), "center pixel averages all 9 cells");
    }

    static void test3_corner() {
        Check.equal(30, Blur.average3x3(Check.copy(M), 0, 0), "corner (0, 0) averages 4 cells: (10 + 20 + 40 + 50) / 4");
        Check.equal(70, Blur.average3x3(Check.copy(M), 2, 2), "corner (2, 2) averages 4 cells");
    }

    static void test4_edge() {
        Check.equal(35, Blur.average3x3(Check.copy(M), 0, 1), "top edge (0, 1) averages 6 cells: 210 / 6");
        Check.equal(45, Blur.average3x3(Check.copy(M), 1, 0), "left edge (1, 0) averages 6 cells: 270 / 6");
    }

    static void test5_boxBlur() {
        Check.equal(new int[][]{{30, 35, 40}, {45, 50, 55}, {60, 65, 70}}, Blur.boxBlur(Check.copy(M)), "boxBlur 3x3");
        Check.equal(new int[][]{{50, 66, 66, 50}}, Blur.boxBlur(new int[][]{{0, 100, 100, 0}}), "boxBlur of a 1x4 strip: 100 / 2 = 50, 200 / 3 = 66");
    }

    static void test6_readsOriginal() {
        int[][] img = {{0, 90, 0}};
        Check.equal(new int[][]{{45, 30, 45}}, Blur.boxBlur(img), "every pixel must use the ORIGINAL neighbors, not already blurred ones");
        Check.equal(new int[][]{{0, 90, 0}}, img, "the input should not be modified");
    }

    static void test7_singlePixel() {
        Check.equal(new int[][]{{77}}, Blur.boxBlur(new int[][]{{77}}), "1x1 image stays the same");
    }
}
`,
      },
    ],
    testLabels: {
      test1_inBounds: "inBounds inside / outside",
      test2_center: "center pixel: 9 neighbors",
      test3_corner: "corner pixels: 4 neighbors",
      test4_edge: "edge pixels: 6 neighbors",
      test5_boxBlur: "boxBlur whole image",
      test6_readsOriginal: "reads the original, returns a new image",
      test7_singlePixel: "1×1 image",
    },
    hints: [
      "`inBounds`: `return r >= 0 && r < img.length && c >= 0 && c < img[r].length;`",
      "In `average3x3` keep two variables, `sum` and `count`. Only add a neighbor when `inBounds(img, r + dr, c + dc)` is true.",
      "`boxBlur`: create `out[r] = new int[img[r].length]`, then `out[r][c] = average3x3(img, r, c)`. Always pass `img`, never `out`.",
    ],
  },
};

const pf204: Ticket = {
  id: "PF-204",
  slug: "sobel-edges",
  title: "Edge detection with Sobel kernels",
  xp: 250,
  briefing: `Marketing wants a "Sketch" effect that turns photos into line drawings. Under the hood that is **edge detection**: find the places where brightness changes quickly.

The Sobel operator does this with two small 3×3 **kernels**, and a kernel is just another \`int[][]\`. You already know how to visit a 3×3 neighborhood from the blur ticket. Now you will weight each neighbor instead of averaging them.`,
  objectives: [
    "Use a small 2D array (a kernel) as weights over a 3×3 neighborhood",
    "Line up kernel indices [i][j] with image positions (r - 1 + i, c - 1 + j)",
    "Combine two gradients into one edge strength and clamp it to 0–255",
    "Handle the border explicitly instead of reading outside the array",
  ],
  blocks: [
    {
      type: "markdown",
      md: `## Kernels

~~~java
static final int[][] GX = {
    {-1, 0, 1},
    {-2, 0, 2},
    {-1, 0, 1}
};
static final int[][] GY = {
    {-1, -2, -1},
    { 0,  0,  0},
    { 1,  2,  1}
};
~~~

To apply a kernel at \`(r, c)\`, lay it over the 3×3 neighborhood so that the kernel's center \`[1][1]\` sits on \`(r, c)\`. Then multiply each pair and add everything up:

~~~java
sum += kernel[i][j] * img[r - 1 + i][c - 1 + j];   // i and j go from 0 to 2
~~~

\`GX\` responds to brightness that changes from left to right (a vertical edge). \`GY\` responds to changes from top to bottom (a horizontal edge).`,
    },
    { type: "viz-link", vizIndex: 0, label: "Slide the kernels over real pixel values and see every multiplication, then the edges of a whole photo" },
    {
      type: "predict",
      id: "pf204-flat",
      question: "Every pixel in a 3×3 area is 120. What does GX give at the center?",
      options: ["0", "120", "480", "-120"],
      answer: 0,
      explain: "The weights of GX add up to 0 (-1 - 2 - 1 + 1 + 2 + 1). On a flat area every weight multiplies the same value, so the result is 0. No change in brightness means no edge.",
    },
    {
      type: "markdown",
      md: `## Edge strength

At each pixel you get two numbers, \`gx\` and \`gy\`. The edge strength is the length of the vector \`(gx, gy)\`:

~~~java
int strength = (int) Math.round(Math.sqrt(gx * gx + gy * gy));
~~~

It can go far above 255 (up to about 1442), so clamp it with \`Math.min(255, strength)\`.

## The border

The kernel needs a full 3×3 neighborhood, which border pixels do not have. For this ticket the rule is simple: **every pixel in the first and last row and the first and last column is 0** in the output.`,
    },
    {
      type: "predict",
      id: "pf204-border",
      question: "The image is 5 rows × 6 columns. How many pixels get a real Sobel value (not the border 0)?",
      options: ["30", "20", "12", "9"],
      answer: 2,
      explain: "Interior rows are 1..3 (3 rows) and interior columns are 1..4 (4 columns), so 3 × 4 = 12. In general (rows - 2) × (cols - 2).",
    },
    { type: "viz-link", vizIndex: 1, label: "Open Mini Photoshop and run your edge detector on the circle" },
    {
      type: "markdown",
      md: `## Your task

In \`Edges.java\` implement:

1. \`applyKernel(int[][] img, int r, int c, int[][] kernel)\`: the weighted sum of the 3×3 neighborhood of \`(r, c)\`. You may assume \`(r, c)\` is not on the border.
2. \`magnitude(int gx, int gy)\`: \`sqrt(gx² + gy²)\` rounded to the nearest int, at most 255.
3. \`edges(int[][] img)\`: a **new** image of the same size. Border pixels are 0, every other pixel is \`magnitude(applyKernel(img, r, c, GX), applyKernel(img, r, c, GY))\`.`,
    },
  ],
  visualizations: [
    { type: "concept", title: "Concept: Sobel kernels", concept: "sobel" },
    { type: "filter-lab", title: "Mini Photoshop", filter: "edges" },
  ],
  task: {
    instructions: "Implement `applyKernel`, `magnitude` and `edges`. Border pixels of the result are 0.",
    mainClass: "Edges",
    testClass: "EdgesTest",
    files: [
      {
        path: "Edges.java",
        content: `import java.util.Arrays;

public class Edges {

    static final int[][] GX = {
        {-1, 0, 1},
        {-2, 0, 2},
        {-1, 0, 1}
    };

    static final int[][] GY = {
        {-1, -2, -1},
        { 0,  0,  0},
        { 1,  2,  1}
    };

    /**
     * Weighted sum of the 3x3 neighborhood of (r, c):
     * kernel[i][j] * img[r - 1 + i][c - 1 + j] for i, j in 0..2.
     * (r, c) is never on the border.
     */
    public static int applyKernel(int[][] img, int r, int c, int[][] kernel) {
        // TODO
        return 0;
    }

    /** sqrt(gx * gx + gy * gy), rounded, at most 255. */
    public static int magnitude(int gx, int gy) {
        // TODO
        return 0;
    }

    /** New image: border pixels are 0, other pixels are the Sobel edge strength. */
    public static int[][] edges(int[][] img) {
        // TODO
        return img;
    }

    public static void main(String[] args) {
        // A dark left half and a bright right half: one vertical edge in the middle
        int[][] img = {
            {0, 0, 200, 200},
            {0, 0, 200, 200},
            {0, 0, 200, 200},
            {0, 0, 200, 200}
        };
        System.out.println("gx at (1, 1) = " + applyKernel(img, 1, 1, GX));
        for (int[] row : edges(img)) {
            System.out.println(Arrays.toString(row));
        }
    }
}
`,
      },
      {
        path: "EdgesTest.java",
        readOnly: true,
        content: `import tutor.Check;

public class EdgesTest {

    static final int[][] FLAT = {{90, 90, 90}, {90, 90, 90}, {90, 90, 90}};
    static final int[][] VERTICAL_STEP = {{0, 0, 60}, {0, 0, 60}, {0, 0, 60}};
    static final int[][] HORIZONTAL_STEP = {{0, 0, 0}, {0, 0, 0}, {50, 50, 50}};

    static void test1_flatArea() {
        Check.equal(0, Edges.applyKernel(Check.copy(FLAT), 1, 1, Edges.GX), "GX on a flat area");
        Check.equal(0, Edges.applyKernel(Check.copy(FLAT), 1, 1, Edges.GY), "GY on a flat area");
    }

    static void test2_verticalEdge() {
        Check.equal(240, Edges.applyKernel(Check.copy(VERTICAL_STEP), 1, 1, Edges.GX), "GX on a vertical edge: (1 + 2 + 1) * 60");
        Check.equal(0, Edges.applyKernel(Check.copy(VERTICAL_STEP), 1, 1, Edges.GY), "GY on a vertical edge");
    }

    static void test3_horizontalEdge() {
        Check.equal(0, Edges.applyKernel(Check.copy(HORIZONTAL_STEP), 1, 1, Edges.GX), "GX on a horizontal edge");
        Check.equal(200, Edges.applyKernel(Check.copy(HORIZONTAL_STEP), 1, 1, Edges.GY), "GY on a horizontal edge: (1 + 2 + 1) * 50");
    }

    static void test4_kernelPosition() {
        int[][] img = {{1, 2, 3, 4}, {5, 6, 7, 8}, {9, 10, 11, 12}};
        int[][] k = {{0, 0, 0}, {0, 0, 0}, {0, 0, 1}};
        Check.equal(12, Edges.applyKernel(img, 1, 2, k), "kernel[2][2] lines up with img[r + 1][c + 1]");
        int[][] k2 = {{1, 0, 0}, {0, 0, 0}, {0, 0, 0}};
        Check.equal(2, Edges.applyKernel(img, 1, 2, k2), "kernel[0][0] lines up with img[r - 1][c - 1]");
    }

    static void test5_magnitude() {
        Check.equal(5, Edges.magnitude(3, 4), "magnitude(3, 4)");
        Check.equal(5, Edges.magnitude(-3, -4), "magnitude(-3, -4)");
        Check.equal(3, Edges.magnitude(2, 2), "magnitude(2, 2) = 2.83 rounds to 3");
        Check.equal(255, Edges.magnitude(240, 200), "magnitude above 255 is clamped");
    }

    static void test6_edgesImage() {
        int[][] img = {
            {0, 0, 50, 50},
            {0, 0, 50, 50},
            {0, 0, 50, 50},
            {0, 0, 50, 50}
        };
        int[][] expected = {
            {0, 0, 0, 0},
            {0, 200, 200, 0},
            {0, 200, 200, 0},
            {0, 0, 0, 0}
        };
        Check.equal(expected, Edges.edges(img), "edges of a 4x4 vertical step (border is 0)");
    }

    static void test7_newImage() {
        int[][] img = Check.copy(VERTICAL_STEP);
        int[][] out = Edges.edges(img);
        Check.notSame(img, out, "edges should return a new array");
        Check.equal(VERTICAL_STEP, img, "the input should not be modified");
        Check.equal(new int[][]{{0, 0, 0}, {0, 240, 0}, {0, 0, 0}}, out, "3x3 image: only the center gets a value");
        Check.equal(new int[][]{{0, 0}, {0, 0}}, Edges.edges(new int[][]{{9, 9}, {9, 9}}), "2x2 image is all border");
    }
}
`,
      },
    ],
    testLabels: {
      test1_flatArea: "flat area gives 0",
      test2_verticalEdge: "GX finds a vertical edge",
      test3_horizontalEdge: "GY finds a horizontal edge",
      test4_kernelPosition: "kernel lines up with the neighborhood",
      test5_magnitude: "magnitude: round and clamp",
      test6_edgesImage: "edges on a whole image",
      test7_newImage: "new image, border is 0",
    },
    hints: [
      "`applyKernel`: two loops `i` and `j` from 0 to 2, `sum += kernel[i][j] * img[r - 1 + i][c - 1 + j];`",
      "`magnitude`: `int m = (int) Math.round(Math.sqrt(gx * gx + gy * gy)); return Math.min(255, m);`",
      "`edges`: `new int[rows][cols]` is already all 0, so you only need to fill rows 1..rows-2 and columns 1..cols-2.",
    ],
  },
};

const pf205: Ticket = {
  id: "PF-205",
  slug: "filter-pipeline",
  title: "Bonus: filter pipeline",
  xp: 300,
  briefing: `Power users want **presets**: a list of steps like \`invert\`, \`threshold 128\`, \`darken 40\` applied one after the other, plus a history panel that shows the image after every step.

A teammate already wrote the basic operations in \`Ops.java\` (read-only). Careful: \`darkenInPlace\` is legacy code that **modifies the image you pass in**. The pipeline must never damage the user's original image or the history.`,
  objectives: [
    "Write a deep copy of a 2D array (new outer array and new rows)",
    "Chain operations where each step's output is the next step's input",
    "Protect the input from code that modifies arrays in place",
    "Store a list of images in an int[][][] (an array of 2D arrays)",
  ],
  blocks: [
    {
      type: "markdown",
      md: `## Chaining steps

~~~java
int[][] current = img;
for (String step : steps) {
    current = applyStep(current, step);
}
return current;
~~~

Each step returns a new image, and \`current\` moves on to it. This only works if **no step changes its input**. \`Ops.invert\` and \`Ops.threshold\` are fine. \`Ops.darkenInPlace\` is not: it changes the array you give it and returns nothing.

The fix is to give legacy code a **copy**, never the original:

~~~java
int[][] out = copy(current);
Ops.darkenInPlace(out, amount);
return out;
~~~`,
    },
    { type: "viz-link", vizIndex: 0, label: "Follow one pixel through every frame of the history, frames[k][r][c]" },
    {
      type: "predict",
      id: "pf205-shallow",
      question: "This copy method is used before darkenInPlace. Is the original image safe?",
      code: `static int[][] copy(int[][] img) {
    int[][] out = new int[img.length][];
    for (int r = 0; r < img.length; r++) {
        out[r] = img[r];
    }
    return out;
}`,
      options: ["Yes, out is a new array", "No, out and img still share every row", "Only the first row is shared", "It does not compile"],
      answer: 1,
      explain: "The outer array is new, but `out[r] = img[r]` copies references to the same rows. darkenInPlace changes `out[r][c]`, which is the same int as `img[r][c]`. A deep copy needs `out[r] = img[r].clone()` or a new row filled value by value.",
    },
    {
      type: "markdown",
      md: `## History: an array of images

\`history(img, steps)\` returns an \`int[][][]\`. Element \`[0]\` is a copy of the input, and element \`[k]\` is the image after step \`k\`. With 3 steps the result has length 4.

~~~java
int[][][] frames = new int[steps.length + 1][][];
~~~

\`frames[k]\` is an \`int[][]\`, and \`frames[k][r][c]\` is one pixel of one frame.`,
    },
    {
      type: "predict",
      id: "pf205-3d",
      question: "frames = history(img, steps) with img 4×6 and 2 steps. What is frames[2][3].length?",
      options: ["2", "3", "4", "6"],
      answer: 3,
      explain: "frames[2] is the image after step 2 (4 rows × 6 columns), frames[2][3] is its row 3, and a row has 6 pixels.",
    },
    { type: "viz-link", vizIndex: 1, label: "Open Mini Photoshop and run your own preset" },
    {
      type: "markdown",
      md: `## Your task

In \`Pipeline.java\` (the helpers \`name\` and \`amount\` that read a step are already written):

1. \`copy(int[][] img)\`: a deep copy.
2. \`applyStep(int[][] img, String step)\`: \`"invert"\`, \`"threshold N"\` or \`"darken N"\`. Returns a new image and never changes \`img\`. Any other step name throws \`IllegalArgumentException\`.
3. \`run(int[][] img, String[] steps)\`: applies all steps in order. With no steps it returns a copy, not \`img\` itself.
4. \`history(int[][] img, String[] steps)\`: the input copy plus the image after every step.`,
    },
  ],
  visualizations: [
    { type: "concept", title: "Concept: frames", concept: "pipeline-frames" },
    { type: "filter-lab", title: "Mini Photoshop", filter: "pipeline" },
  ],
  task: {
    instructions: "Implement `copy`, `applyStep`, `run` and `history`. The input image must never change, even with `darken` steps.",
    mainClass: "Pipeline",
    testClass: "PipelineTest",
    files: [
      {
        path: "Pipeline.java",
        content: `import java.util.Arrays;

public class Pipeline {

    /** Name of a step: "threshold 128" -> "threshold". (Already done.) */
    static String name(String step) {
        int space = step.indexOf(' ');
        return space < 0 ? step : step.substring(0, space);
    }

    /** Number of a step: "threshold 128" -> 128. (Already done.) */
    static int amount(String step) {
        int space = step.indexOf(' ');
        return Integer.parseInt(step.substring(space + 1).trim());
    }

    /** Deep copy: a new outer array and a new array for every row. */
    public static int[][] copy(int[][] img) {
        // TODO
        return img;
    }

    /**
     * Applies one step and returns a new image. img is never changed.
     * Steps: "invert", "threshold N" (Ops.threshold), "darken N" (Ops.darkenInPlace on a copy).
     * Any other name: throw IllegalArgumentException.
     */
    public static int[][] applyStep(int[][] img, String step) {
        // TODO: look at name(step)
        return img;
    }

    /** Applies every step in order. With no steps, returns a copy of img. */
    public static int[][] run(int[][] img, String[] steps) {
        // TODO
        return img;
    }

    /** frames[0] = copy of img, frames[k] = image after step k. */
    public static int[][][] history(int[][] img, String[] steps) {
        // TODO
        return new int[0][][];
    }

    public static void main(String[] args) {
        int[][] img = {
            {10, 120, 200},
            {60, 130, 250}
        };
        String[] preset = {"darken 20", "threshold 100", "invert"};
        System.out.println("result   = " + Arrays.deepToString(run(img, preset)));
        System.out.println("original = " + Arrays.deepToString(img));
        System.out.println("frames   = " + history(img, preset).length);
    }
}
`,
      },
      {
        path: "Ops.java",
        readOnly: true,
        content: `/** Basic operations from a teammate. Read-only: use them, do not change them. */
public class Ops {

    /** New image: 255 - value. */
    public static int[][] invert(int[][] img) {
        int[][] out = new int[img.length][];
        for (int r = 0; r < img.length; r++) {
            out[r] = new int[img[r].length];
            for (int c = 0; c < img[r].length; c++) {
                out[r][c] = 255 - img[r][c];
            }
        }
        return out;
    }

    /** New image: 255 where value >= t, otherwise 0. */
    public static int[][] threshold(int[][] img, int t) {
        int[][] out = new int[img.length][];
        for (int r = 0; r < img.length; r++) {
            out[r] = new int[img[r].length];
            for (int c = 0; c < img[r].length; c++) {
                out[r][c] = img[r][c] >= t ? 255 : 0;
            }
        }
        return out;
    }

    /** LEGACY: subtracts amount from every pixel (not below 0) and MODIFIES img. */
    public static void darkenInPlace(int[][] img, int amount) {
        for (int[] row : img) {
            for (int c = 0; c < row.length; c++) {
                row[c] = Math.max(0, row[c] - amount);
            }
        }
    }
}
`,
      },
      {
        path: "PipelineTest.java",
        readOnly: true,
        content: `import tutor.Check;

public class PipelineTest {

    static final int[][] IMG = {{10, 120, 200}, {60, 130, 250}};

    static void test1_deepCopy() {
        int[][] img = Check.copy(IMG);
        int[][] c = Pipeline.copy(img);
        Check.equal(IMG, c, "the copy should have the same values");
        Check.notSame(img, c, "copy should return a new outer array");
        Check.notSame(img[0], c[0], "copy should create new rows too (row 0 is shared)");
        Check.notSame(img[1], c[1], "copy should create new rows too (row 1 is shared)");
    }

    static void test2_singleSteps() {
        Check.equal(new int[][]{{245, 135, 55}, {195, 125, 5}}, Pipeline.applyStep(Check.copy(IMG), "invert"), "invert");
        Check.equal(new int[][]{{0, 255, 255}, {0, 255, 255}}, Pipeline.applyStep(Check.copy(IMG), "threshold 100"), "threshold 100");
        Check.equal(new int[][]{{0, 70, 150}, {10, 80, 200}}, Pipeline.applyStep(Check.copy(IMG), "darken 50"), "darken 50");
    }

    static void test3_darkenKeepsInput() {
        int[][] img = Check.copy(IMG);
        Pipeline.applyStep(img, "darken 50");
        Check.equal(IMG, img, "darken changed the input image: give darkenInPlace a copy");
    }

    static void test4_unknownStep() {
        boolean thrown = false;
        try {
            Pipeline.applyStep(Check.copy(IMG), "sharpen 3");
        } catch (IllegalArgumentException e) {
            thrown = true;
        }
        Check.isTrue(thrown, "an unknown step should throw IllegalArgumentException");
    }

    static void test5_run() {
        int[][] img = Check.copy(IMG);
        int[][] out = Pipeline.run(img, new String[]{"darken 20", "threshold 100", "invert"});
        Check.equal(new int[][]{{255, 0, 0}, {255, 0, 0}}, out, "run darken 20 -> threshold 100 -> invert");
        Check.equal(IMG, img, "run should not change the input image");
    }

    static void test6_runNoSteps() {
        int[][] img = Check.copy(IMG);
        int[][] out = Pipeline.run(img, new String[0]);
        Check.equal(IMG, out, "no steps: same values");
        Check.notSame(img, out, "no steps: return a copy, not the input itself");
    }

    static void test7_history() {
        int[][] img = Check.copy(IMG);
        int[][][] frames = Pipeline.history(img, new String[]{"darken 100", "invert"});
        Check.equal(3, frames.length, "2 steps give 3 frames");
        Check.equal(IMG, frames[0], "frames[0] is the input");
        Check.equal(new int[][]{{0, 20, 100}, {0, 30, 150}}, frames[1], "frames[1] after darken 100");
        Check.equal(new int[][]{{255, 235, 155}, {255, 225, 105}}, frames[2], "frames[2] after invert");
        Check.notSame(img, frames[0], "frames[0] should be a copy, not the input itself");
        Check.equal(IMG, img, "history should not change the input image");
    }
}
`,
      },
    ],
    testLabels: {
      test1_deepCopy: "copy is a deep copy",
      test2_singleSteps: "invert, threshold, darken",
      test3_darkenKeepsInput: "darken does not change the input",
      test4_unknownStep: "unknown step throws",
      test5_run: "run chains the steps",
      test6_runNoSteps: "no steps returns a copy",
      test7_history: "history of every step",
    },
    hints: [
      "`copy`: `out[r] = new int[img[r].length];` then copy each value (or use `img[r].clone()`).",
      "`applyStep`: `String n = name(step);` then `if (n.equals(\"invert\")) return Ops.invert(img);` and so on. Compare Strings with `.equals`, not `==`.",
      "`history`: `frames[0] = copy(img);` then `frames[k + 1] = applyStep(frames[k], steps[k]);` for each step.",
    ],
  },
};

export const tickets: Ticket[] = [pf201, pf202, pf203, pf204, pf205];
