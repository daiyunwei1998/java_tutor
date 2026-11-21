import type { Ticket } from "../../types";

/*
 * Sprint 1, part 3: classic 2D array algorithms in Mini Photoshop clothes (PF-207..PF-209).
 * Same format as tickets.ts: content is data only, Markdown uses ~~~ fences so it can live inside template literals.
 * Reference solutions live in tools/solutions/<mainClass>.java; check them with tools/verify-content.mjs.
 */

const pf207: Ticket = {
  id: "PF-207",
  issuedByDefault: false,
  slug: "life-texture",
  title: "Living textures: a cell simulation with 8 neighbors",
  xp: 250,
  learningGoal: {
    level: "medium",
    goal: "Count the 8 neighbors of each cell and compute a whole new generation from the old grid (double buffering).",
    techniques: ["8-neighbor offset loops skipping the center", "Out-of-bounds treated as dead", "Double buffering: read old, write new", "Running several generations"],
  },
  briefing: `The design team wants an animated **"Living texture"** background for the editor's start screen. It is a black-and-white grid where every cell is alive (\`1\`) or dead (\`0\`), and the whole grid changes one **generation** at a time following three tiny rules. Simple rules, surprisingly lively patterns.

You already looked at the 8 pixels around a pixel in the box blur (PF-203). This time the neighbors decide whether a cell lives or dies, and there is a trap: every cell must look at the **old** grid, even after you have computed new values for its neighbors.`,
  objectives: [
    "Visit the 8 neighbors of a cell with two offset loops (dr, dc from -1 to 1) and skip the cell itself",
    "Treat positions outside the grid as dead instead of crashing",
    "Compute a whole new generation into a separate array so every cell reads the old values",
    "Explain what goes wrong when the new values are written into the grid you are still reading",
  ],
  blocks: [
    {
      type: "markdown",
      md: `## The rules

Every cell has up to **8 neighbors**: the cells above, below, left, right and the four diagonals. Cells outside the grid count as dead. To go from one generation to the next, look at each cell and its number of live neighbors \`n\`:

| The cell is now | n | Next generation |
|---|---|---|
| alive (1) | 2 or 3 | stays alive |
| alive (1) | 0, 1, or 4 and more | dies (too lonely or too crowded) |
| dead (0) | exactly 3 | comes alive |
| dead (0) | anything else | stays dead |

## Counting the 8 neighbors

Instead of writing 8 separate \`if\` statements, loop over the **offsets**. \`dr\` and \`dc\` each go from \`-1\` to \`1\`, which gives 9 combinations. The combination \`dr == 0 && dc == 0\` is the cell itself, so skip it:

~~~java
for (int dr = -1; dr <= 1; dr++) {
    for (int dc = -1; dc <= 1; dc++) {
        if (dr == 0 && dc == 0) continue;   // not my own neighbor
        int nr = r + dr, nc = c + dc;
        // nr or nc can be -1 or past the end here!
    }
}
~~~

Before you read \`grid[nr][nc]\`, check that \`nr\` and \`nc\` are inside the grid. A corner cell only has 3 real neighbors, an edge cell has 5.`,
    },
    { type: "viz-link", vizIndex: 0, label: "Pick any cell and step through its 8 neighbor offsets, including the ones that fall off the grid" },
    {
      type: "predict",
      id: "pf207-count",
      question: "What does countNeighbors(g, 1, 1) return?",
      code: `int[][] g = {
    {0, 1, 0},
    {1, 1, 0},
    {0, 0, 1}
};`,
      options: ["3", "4", "2", "8"],
      answer: 0,
      explain: "The 8 cells around [1][1] are 0, 1, 0 (row 0), 1 and 0 (left and right) and 0, 0, 1 (row 2): 3 live neighbors. 4 would be the answer if you forgot to skip the cell itself, which is also 1.",
    },
    {
      type: "markdown",
      md: `## Why you need a second array

It is tempting to write the new value straight back into \`grid[r][c]\`. But the loop goes row by row. By the time it reaches row 1, row 0 has already been **overwritten** with next-generation values, while row 2 still holds the old ones. Cell \`[1][1]\` would count a mix of two generations, and the result is wrong.

The fix is the same idea as in the blur: **read from one array, write into another.**

~~~java
int[][] next = new int[grid.length][grid[0].length];
// ... next[r][c] = (rule applied to grid and countNeighbors(grid, r, c))
return next;
~~~

\`grid\` stays untouched until the whole generation is done.`,
    },
    {
      type: "predict",
      id: "pf207-in-place",
      question: "A buggy nextGeneration writes each new value straight into grid[r][c], going row by row from the top. When it reaches grid[1][1], which generation do its neighbors come from?",
      options: [
        "All of them are from the old generation",
        "All of them are from the new generation",
        "A mix: row 0 and grid[1][0] are already new, the rest is still old",
        "It cannot read them, it throws an exception",
      ],
      answer: 2,
      explain: "Row 0 and grid[1][0] were visited before grid[1][1], so they already hold next-generation values. grid[1][2] and row 2 are still old. The rules are meant for one generation at a time, so this mix gives the wrong answer. Switch the viz to \"One generation\" and try the in-place option.",
    },
    { type: "viz-link", vizIndex: 1, label: "Step through one generation, then switch to writing into the same array and compare" },
    {
      type: "markdown",
      md: `## Your task

In \`Life.java\` implement:

1. \`countNeighbors(grid, r, c)\`: how many of the 8 neighbors of \`grid[r][c]\` are alive. Cells outside the grid count as dead. The cell itself does not count.
2. \`nextGeneration(grid)\`: a **new** grid with the next generation. \`grid\` itself must not change.
3. \`run(grid, generations)\`: the grid after that many generations (\`run(grid, 0)\` is just \`grid\`).

Then press ▶ Run: the vertical line of three cells (a "blinker") should turn horizontal and back.`,
    },
    { type: "viz-link", vizIndex: 2, label: "Press Play and watch three classic patterns: one walks, one flips, one never changes" },
  ],
  visualizations: [
    { type: "concept", title: "Concept: counting 8 neighbors", concept: "life-neighbors", start: "count" },
    { type: "concept", title: "Concept: one generation, two arrays", concept: "life-neighbors", start: "generation" },
    { type: "concept", title: "Concept: many generations", concept: "life-neighbors", start: "play" },
  ],
  task: {
    instructions: "Implement `countNeighbors`, `nextGeneration` and `run`. Always read the old grid and write into a new one.",
    mainClass: "Life",
    testClass: "LifeTest",
    files: [
      {
        path: "Life.java",
        content: `public class Life {

    /** Counts the live cells (1) among the 8 neighbors of grid[r][c]. Cells outside the grid count as dead. */
    public static int countNeighbors(int[][] grid, int r, int c) {
        int count = 0;
        // TODO: loop dr and dc from -1 to 1, skip (0, 0), skip positions outside the grid
        return count;
    }

    /**
     * Returns the next generation as a NEW grid (grid itself is not changed).
     * A live cell with 2 or 3 live neighbors stays alive. A dead cell with exactly 3 comes alive. Every other cell is dead.
     */
    public static int[][] nextGeneration(int[][] grid) {
        int[][] next = new int[grid.length][grid[0].length];
        // TODO: fill next by reading grid
        return next;
    }

    /** Returns the grid after the given number of generations (grid itself is not changed). */
    public static int[][] run(int[][] grid, int generations) {
        // TODO: call nextGeneration the right number of times
        return grid;
    }

    static void print(String title, int[][] grid) {
        System.out.println(title);
        for (int[] row : grid) {
            StringBuilder sb = new StringBuilder("  ");
            for (int v : row) sb.append(v == 1 ? "# " : ". ");
            System.out.println(sb);
        }
    }

    public static void main(String[] args) {
        int[][] blinker = {
            {0, 0, 0, 0, 0},
            {0, 0, 1, 0, 0},
            {0, 0, 1, 0, 0},
            {0, 0, 1, 0, 0},
            {0, 0, 0, 0, 0}
        };
        System.out.println("neighbors of [2][1] = " + countNeighbors(blinker, 2, 1));
        System.out.println("neighbors of [0][0] = " + countNeighbors(blinker, 0, 0));
        print("generation 0:", blinker);
        print("generation 1:", nextGeneration(blinker));
        print("generation 2:", run(blinker, 2));
    }
}
`,
      },
      {
        path: "LifeTest.java",
        readOnly: true,
        content: `import tutor.Check;

public class LifeTest {

    static int[][] blinker() {
        return new int[][]{
            {0, 0, 0, 0, 0},
            {0, 0, 1, 0, 0},
            {0, 0, 1, 0, 0},
            {0, 0, 1, 0, 0},
            {0, 0, 0, 0, 0}
        };
    }

    static void test1_countInside() {
        int[][] g = blinker();
        Check.equal(3, Life.countNeighbors(g, 2, 1), "neighbors of [2][1] (left of the middle)");
        Check.equal(2, Life.countNeighbors(g, 2, 2), "neighbors of [2][2]: the cell itself must not count");
        Check.equal(1, Life.countNeighbors(g, 0, 2), "neighbors of [0][2]");
    }

    static void test2_countEdges() {
        int[][] full = {{1, 1, 1}, {1, 1, 1}, {1, 1, 1}};
        Check.equal(3, Life.countNeighbors(full, 0, 0), "a corner has only 3 neighbors");
        Check.equal(5, Life.countNeighbors(full, 0, 1), "a top edge cell has 5 neighbors");
        Check.equal(5, Life.countNeighbors(full, 1, 2), "a right edge cell has 5 neighbors");
        Check.equal(8, Life.countNeighbors(full, 1, 1), "the middle has 8 neighbors");
        Check.equal(3, Life.countNeighbors(full, 2, 2), "bottom-right corner");
    }

    static void test3_rules() {
        Check.equal(new int[][]{{0, 0, 0}, {0, 0, 0}, {0, 0, 0}}, Life.nextGeneration(new int[][]{{0, 0, 0}, {0, 1, 0}, {0, 0, 0}}), "a lonely cell dies");
        Check.equal(new int[][]{{1, 1}, {1, 1}}, Life.nextGeneration(new int[][]{{1, 1}, {1, 0}}), "a dead cell with exactly 3 neighbors comes alive");
        Check.equal(new int[][]{{1, 0, 1}, {0, 0, 0}, {1, 0, 1}}, Life.nextGeneration(new int[][]{{1, 1, 1}, {1, 1, 1}, {1, 1, 1}}), "crowded cells die (4 or more neighbors)");
    }

    static void test4_blinker() {
        int[][] g = blinker();
        Check.equal(new int[][]{
            {0, 0, 0, 0, 0},
            {0, 0, 0, 0, 0},
            {0, 1, 1, 1, 0},
            {0, 0, 0, 0, 0},
            {0, 0, 0, 0, 0}
        }, Life.nextGeneration(g), "the blinker turns horizontal");
        Check.equal(blinker(), Life.nextGeneration(Life.nextGeneration(g)), "and back to vertical after 2 generations");
    }

    static void test5_newArray() {
        int[][] g = blinker();
        int[][] next = Life.nextGeneration(g);
        Check.equal(blinker(), g, "nextGeneration must not change grid");
        Check.notSame(g, next, "nextGeneration must return a new array, not grid itself");
    }

    static void test6_run() {
        int[][] block = {{0, 0, 0, 0}, {0, 1, 1, 0}, {0, 1, 1, 0}, {0, 0, 0, 0}};
        Check.equal(block, Life.run(block, 5), "a 2 x 2 block never changes");
        Check.equal(blinker(), Life.run(blinker(), 0), "run(grid, 0) gives the grid back");
        Check.equal(Life.nextGeneration(blinker()), Life.run(blinker(), 3), "after 3 generations the blinker is horizontal");
    }

    static void test7_glider() {
        int[][] g = new int[6][6];
        g[0][1] = 1; g[1][2] = 1; g[2][0] = 1; g[2][1] = 1; g[2][2] = 1;
        int[][] moved = new int[6][6];
        moved[1][2] = 1; moved[2][3] = 1; moved[3][1] = 1; moved[3][2] = 1; moved[3][3] = 1;
        Check.equal(moved, Life.run(g, 4), "after 4 generations the glider moved one cell down and one cell right");
    }
}
`,
      },
    ],
    testLabels: {
      test1_countInside: "countNeighbors inside the grid",
      test2_countEdges: "countNeighbors at corners and edges",
      test3_rules: "the three rules (lonely, birth, crowded)",
      test4_blinker: "a blinker flips every generation",
      test5_newArray: "nextGeneration returns a new grid",
      test6_run: "run for several generations",
      test7_glider: "a glider moves diagonally",
    },
    hints: [
      "`countNeighbors`: two loops `for (int dr = -1; dr <= 1; dr++)` and the same for `dc`. `continue` when both are 0. Compute `nr = r + dr`, `nc = c + dc` and skip them if `nr < 0 || nr >= grid.length || nc < 0 || nc >= grid[nr].length`.",
      "`nextGeneration`: for every `r, c` compute `n = countNeighbors(grid, r, c)`. If `grid[r][c] == 1`, the cell lives when `n == 2 || n == 3`. Otherwise it lives when `n == 3`. Write the answer into `next[r][c]`, never into `grid`.",
      "`run`: keep a variable `cur = grid` and repeat `cur = nextGeneration(cur)` `generations` times.",
    ],
  },
};

const pf208: Ticket = {
  id: "PF-208",
  slug: "spiral-reveal",
  title: "Spiral reveal: a transition with shrinking boundaries",
  xp: 250,
  learningGoal: {
    level: "hard",
    goal: "Traverse with four shrinking boundaries, including backwards loops, and stop exactly when the boundaries cross.",
    techniques: ["Four boundary variables top/bottom/left/right", "Backwards loops (c--, r--)", "Shrinking boundaries after each side", "Leftover middle row or column on non-square arrays"],
  },
  briefing: `The slideshow feature needs a new transition: the next photo **spirals in** from the outside. The first pixel to appear is the top-left corner, then the reveal runs clockwise along the edge, and ring by ring it winds into the middle.

To animate it, the front end needs the pixels in **spiral order**. You cannot get that with one pair of nested loops. Instead you keep four boundaries, \`top\`, \`bottom\`, \`left\` and \`right\`, walk along them, and move each one inwards after you used it.`,
  objectives: [
    "Track the part of the image that is still unvisited with four boundary variables",
    "Walk along a row or column backwards with a decreasing loop (c--, r--)",
    "Shrink a boundary after each side and stop when the boundaries cross",
    "Handle the leftover middle row or column of non-square images without visiting it twice",
  ],
  blocks: [
    {
      type: "markdown",
      md: `## Four sides per ring

The unvisited part of the image is always a rectangle: rows \`top\` … \`bottom\` and columns \`left\` … \`right\`, **both ends included** this time. One ring of the spiral is four loops:

| Side | Loop | Then |
|---|---|---|
| top row, left → right | \`c = left; c <= right; c++\` reading \`img[top][c]\` | \`top++\` |
| right column, top → bottom | \`r = top; r <= bottom; r++\` reading \`img[r][right]\` | \`right--\` |
| bottom row, right → left | \`c = right; c >= left; c--\` reading \`img[bottom][c]\` | \`bottom--\` |
| left column, bottom → top | \`r = bottom; r >= top; r--\` reading \`img[r][left]\` | \`left++\` |

After a side is done, its boundary moves inwards, so the next side does not start on the corner again. Repeat while \`top <= bottom && left <= right\`, that is, while something is left.`,
    },
    { type: "viz-link", vizIndex: 0, label: "Step through the spiral and watch the four boundaries move in" },
    {
      type: "predict",
      id: "pf208-bounds",
      question: "A 4 × 5 image starts with top = 0, bottom = 3, left = 0, right = 4. What are the boundaries after the first full ring?",
      options: ["top 1, bottom 2, left 1, right 3", "top 1, bottom 3, left 1, right 4", "top 0, bottom 2, left 0, right 3", "top 1, bottom 1, left 1, right 1"],
      answer: 0,
      explain: "Each of the four sides moves its own boundary inwards by one: top 0 → 1, right 4 → 3, bottom 3 → 2, left 0 → 1. What is left is the 2 × 3 rectangle in the middle.",
    },
    {
      type: "markdown",
      md: `## The leftover middle row

For a square image every ring has four sides. But take a 3 × 5 image. After the outer ring, \`top = bottom = 1\`: one single row is left. The first loop walks along it and does \`top++\`, so now \`top = 2\` and \`bottom = 1\`. If the third loop ran anyway, it would walk along row 1 **again**, backwards.

So the last two sides need a check first:

~~~java
if (top <= bottom) { /* bottom row, right to left */ }
if (left <= right) { /* left column, bottom to top */ }
~~~

The same thing happens with a leftover middle **column** in a tall image.`,
    },
    {
      type: "predict",
      id: "pf208-missing-check",
      question: "spiralOrder runs the bottom-row loop without the if (top <= bottom) check. What happens on a 3 × 5 image?",
      options: [
        "Nothing, the result is the same",
        "The middle row is read a second time, so the output array overflows: ArrayIndexOutOfBoundsException",
        "The middle row is skipped",
        "The loop never ends",
      ],
      answer: 1,
      explain: "The second ring is the single row 6, 7, 8. After it, top = 2 > bottom = 1, but the unchecked loop still walks row 1 from right to left and writes 7 and 6 again. The output array has exactly 15 places, so the extra values run past its end. Try \"without the checks\" in the viz.",
    },
    { type: "viz-link", vizIndex: 1, label: "A 3 × 5 image without the checks: watch the middle row get walked twice, then switch the checks on" },
    {
      type: "markdown",
      md: `## Rings, and what the transition does with your array

\`ring(rows, cols, r, c)\` tells you which ring a cell is on: how many steps it is from the **nearest** edge. The spiral finishes ring 0 completely before it starts ring 1, so the ring number is a quick way to check where a cell will show up.`,
    },
    { type: "viz-link", vizIndex: 2, label: "Click any cell to see its four distances to the edges" },
    { type: "viz-link", vizIndex: 3, label: "Drag the slider: the transition shows every pixel whose revealOrder step is smaller than the frame" },
    {
      type: "markdown",
      md: `## Your task

In \`Spiral.java\` implement:

1. \`ring(rows, cols, r, c)\`: which ring \`(r, c)\` is on. The outer edge is ring 0, one step in is ring 1. *(Hint: how far is the cell from the nearest edge?)*
2. \`spiralOrder(img)\`: all values of \`img\` in clockwise spiral order, starting at the top-left. It must work for any rectangle, including one row or one column.
3. \`revealOrder(rows, cols)\`: a \`rows × cols\` array where each cell holds the step (0, 1, 2, …) at which the transition reveals it. Same walk, but you **write** a counter instead of reading a value.`,
    },
  ],
  visualizations: [
    { type: "concept", title: "Concept: shrinking boundaries", concept: "spiral-bounds", start: "walk" },
    { type: "concept", title: "Concept: the leftover middle row", concept: "spiral-bounds", start: "walk-bug" },
    { type: "concept", title: "Concept: rings", concept: "spiral-bounds", start: "rings" },
    { type: "concept", title: "Concept: the spiral transition on a photo", concept: "spiral-bounds", start: "reveal" },
  ],
  task: {
    instructions: "Implement `ring`, `spiralOrder` and `revealOrder`. Move each boundary in after you used it, and check before the last two sides.",
    mainClass: "Spiral",
    testClass: "SpiralTest",
    files: [
      {
        path: "Spiral.java",
        content: `import java.util.Arrays;

public class Spiral {

    /** Returns the values of img in clockwise spiral order, starting at the top-left corner. */
    public static int[] spiralOrder(int[][] img) {
        int[] out = new int[img.length * img[0].length];
        int k = 0;   // next free place in out
        int top = 0, bottom = img.length - 1, left = 0, right = img[0].length - 1;
        // TODO: while something is left, walk the four sides and move each boundary in
        return out;
    }

    /** Returns a rows x cols array where each cell holds the step (0, 1, 2, ...) at which the spiral reveals it. */
    public static int[][] revealOrder(int rows, int cols) {
        int[][] step = new int[rows][cols];
        // TODO: the same walk as spiralOrder, but write a counter into step
        return step;
    }

    /** Which ring of the spiral (r, c) is on: 0 = the outer edge, 1 = one step in, and so on. */
    public static int ring(int rows, int cols, int r, int c) {
        // TODO
        return 0;
    }

    public static void main(String[] args) {
        int[][] img = {
            {1, 2, 3, 4},
            {5, 6, 7, 8},
            {9, 10, 11, 12}
        };
        System.out.println("spiralOrder = " + Arrays.toString(spiralOrder(img)));
        System.out.println("one row     = " + Arrays.toString(spiralOrder(new int[][]{{1, 2, 3}})));
        System.out.println("revealOrder(3, 4):");
        for (int[] row : revealOrder(3, 4)) System.out.println("  " + Arrays.toString(row));
        System.out.println("ring(5, 5, 2, 1) = " + ring(5, 5, 2, 1));
    }
}
`,
      },
      {
        path: "SpiralTest.java",
        readOnly: true,
        content: `import tutor.Check;

public class SpiralTest {

    // 1, 2, 3, ... row by row
    static int[][] counting(int rows, int cols) {
        int[][] g = new int[rows][cols];
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                g[r][c] = r * cols + c + 1;
        return g;
    }

    static void test1_ring() {
        Check.equal(0, Spiral.ring(5, 5, 0, 3), "ring(5, 5, 0, 3): top edge");
        Check.equal(1, Spiral.ring(5, 5, 2, 1), "ring(5, 5, 2, 1)");
        Check.equal(2, Spiral.ring(5, 5, 2, 2), "ring(5, 5, 2, 2): the middle");
        Check.equal(0, Spiral.ring(5, 5, 3, 4), "ring(5, 5, 3, 4): right edge");
        Check.equal(1, Spiral.ring(4, 6, 2, 3), "ring(4, 6, 2, 3)");
    }

    static void test2_square() {
        Check.equal(new int[]{1, 2, 4, 3}, Spiral.spiralOrder(counting(2, 2)), "2 x 2");
        Check.equal(new int[]{1, 2, 3, 6, 9, 8, 7, 4, 5}, Spiral.spiralOrder(counting(3, 3)), "3 x 3");
        Check.equal(new int[]{1, 2, 3, 4, 8, 12, 16, 15, 14, 13, 9, 5, 6, 7, 11, 10}, Spiral.spiralOrder(counting(4, 4)), "4 x 4");
    }

    static void test3_rectangle() {
        Check.equal(new int[]{1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7}, Spiral.spiralOrder(counting(3, 4)), "3 x 4 (wide)");
        Check.equal(new int[]{1, 2, 3, 6, 9, 12, 11, 10, 7, 4, 5, 8}, Spiral.spiralOrder(counting(4, 3)), "4 x 3 (tall)");
    }

    static void test4_leftoverRowOrColumn() {
        Check.equal(new int[]{1, 2, 3, 4, 5, 10, 15, 14, 13, 12, 11, 6, 7, 8, 9}, Spiral.spiralOrder(counting(3, 5)), "3 x 5 leaves one middle row");
        Check.equal(new int[]{1, 2, 3, 6, 9, 12, 15, 14, 13, 10, 7, 4, 5, 8, 11}, Spiral.spiralOrder(counting(5, 3)), "5 x 3 leaves one middle column");
    }

    static void test5_thin() {
        Check.equal(new int[]{1, 2, 3, 4}, Spiral.spiralOrder(counting(1, 4)), "a single row");
        Check.equal(new int[]{1, 2, 3}, Spiral.spiralOrder(counting(3, 1)), "a single column");
        Check.equal(new int[]{1}, Spiral.spiralOrder(counting(1, 1)), "1 x 1");
    }

    static void test6_revealOrder() {
        Check.equal(new int[][]{{0, 1, 2, 3}, {9, 10, 11, 4}, {8, 7, 6, 5}}, Spiral.revealOrder(3, 4), "revealOrder(3, 4)");
        Check.equal(new int[][]{{0, 1, 2}, {5, 4, 3}}, Spiral.revealOrder(2, 3), "revealOrder(2, 3)");
        Check.equal(new int[][]{{0}, {1}, {2}}, Spiral.revealOrder(3, 1), "revealOrder(3, 1)");
    }

    static void test7_revealMatchesSpiral() {
        int[] seen = Spiral.spiralOrder(Spiral.revealOrder(5, 4));
        int[] expected = new int[20];
        for (int i = 0; i < 20; i++) expected[i] = i;
        Check.equal(expected, seen, "reading revealOrder(5, 4) in spiral order must give 0, 1, 2, ..., 19");
    }
}
`,
      },
    ],
    testLabels: {
      test1_ring: "ring: distance to the nearest edge",
      test2_square: "spiralOrder on square images",
      test3_rectangle: "spiralOrder on wide and tall images",
      test4_leftoverRowOrColumn: "a leftover middle row or column is visited once",
      test5_thin: "one row, one column, 1×1",
      test6_revealOrder: "revealOrder step numbers",
      test7_revealMatchesSpiral: "revealOrder and spiralOrder agree",
    },
    hints: [
      "`ring`: the distances to the four edges are `r`, `c`, `rows - 1 - r` and `cols - 1 - c`. The ring is the smallest of them: `Math.min(Math.min(a, b), Math.min(d, e))`.",
      "`spiralOrder`: `while (top <= bottom && left <= right) { ... }`. Inside: top row with `c` from `left` to `right`, then `top++`. Right column with `r` from `top` to `bottom`, then `right--`.",
      "Then `if (top <= bottom)` walk the bottom row with `c` from `right` down to `left` (`c--`) and do `bottom--`, and `if (left <= right)` walk the left column with `r` from `bottom` down to `top` and do `left++`. Every value goes to `out[k++]`.",
      "`revealOrder`: copy your spiral walk, and instead of `out[k++] = img[r][c]` write `step[r][c] = k++`. The boundaries start at `rows - 1` and `cols - 1`.",
    ],
  },
};

const pf209: Ticket = {
  id: "PF-209",
  slug: "smooth-blur-weights",
  title: "Smooth blur: weights from a triangle-shaped array",
  xp: 250,
  learningGoal: {
    level: "medium",
    goal: "Build a jagged array row by row, where each row has its own length and is computed from the row above.",
    techniques: ["Allocating rows one at a time", "Each row from the previous row", "Traversing with tri[r].length", "Building a 2D array from a 1D array"],
  },
  briefing: `The box blur from PF-203 gives all 9 pixels **the same weight**, and the designers say it looks blocky. A smooth blur lets the center pixel count the most and the far corners the least. The classic weights are \`1 2 1\`, \`1 4 6 4 1\`, \`1 6 15 20 15 6 1\` …, and they all come from **Pascal's triangle**.

Your job: build the triangle as a **jagged** array (every row has a different length), and turn one of its rows into a 2D blur kernel.`,
  objectives: [
    "Create a jagged array: allocate the rows first, then give each row its own length",
    "Compute each value from the row above it, with a loop that only covers the inside of the row",
    "Traverse a jagged array safely with tri[r].length instead of one fixed width",
    "Build a 2D array from a 1D array (k[r][c] = w[r] * w[c])",
  ],
  blocks: [
    {
      type: "markdown",
      md: `## A triangle is a jagged array

Pascal's triangle starts with \`1\`. Every row starts and ends with \`1\`, and every value in between is the **sum of the two values above it**:

~~~
row 0:          1
row 1:         1 1
row 2:        1 2 1
row 3:       1 3 3 1
row 4:      1 4 6 4 1
~~~

Shifted to the left, the two values above \`tri[r][c]\` are \`tri[r - 1][c - 1]\` and \`tri[r - 1][c]\`. Row \`r\` has exactly \`r + 1\` values, so the array is **jagged**. You build it in two steps:

~~~java
int[][] tri = new int[n][];   // n rows, but no row arrays yet: every tri[r] is null
tri[r] = new int[r + 1];      // later, inside the loop: give row r its own length
~~~

\`new int[n][n]\` would also compile, but then every row has \`n\` values and the triangle ends in a lot of zeros.`,
    },
    {
      type: "predict",
      id: "pf209-null-row",
      question: "What is tri[2] right after this line?",
      code: `int[][] tri = new int[4][];`,
      options: ["null", "{0, 0, 0}", "{0, 0, 0, 0}", "It does not compile"],
      answer: 0,
      explain: "`new int[4][]` creates only the outer array: 4 slots for row references, all null. No row array exists yet, so `tri[2][0] = 1` would throw a NullPointerException. You must do `tri[2] = new int[3]` first.",
    },
    { type: "viz-link", vizIndex: 0, label: "Build the triangle row by row and see which two values each new value comes from" },
    {
      type: "predict",
      id: "pf209-next-value",
      question: "Row 5 is 1 5 10 10 5 1. What is tri[6][2]?",
      options: ["15", "10", "20", "6"],
      answer: 0,
      explain: "tri[6][2] = tri[5][1] + tri[5][2] = 5 + 10 = 15. The whole row 6 is 1 6 15 20 15 6 1.",
    },
    {
      type: "markdown",
      md: `## Only the inside of the row

The ends are always \`1\`, so set \`tri[r][0]\` and \`tri[r][r]\` directly. The sum is only needed for \`c\` from \`1\` to \`r - 1\`. That is the loop \`for (int c = 1; c < r; c++)\`. Its bound depends on the outer variable, just like the triangle loops in PF-206, and for rows 0 and 1 it runs **0 times**.

Whenever you loop over a jagged array later, use **that row's** length: \`c < tri[r].length\`. Using \`tri[0].length\` for every row is the classic bug. It reads too few values in long rows, and crashes when the first row is the longest.`,
    },
    { type: "viz-link", vizIndex: 1, label: "Try both inner bounds on both arrays: one bug gives a silently wrong answer, the other crashes" },
    {
      type: "markdown",
      md: `## From a row to a kernel

Take row \`size - 1\`, for example \`w = {1, 2, 1}\`. The 2D kernel multiplies the row weight by the column weight, \`k[r][c] = w[r] * w[c]\`:

~~~
1 2 1
2 4 2
1 2 1
~~~

The center gets 4, the edges 2, the corners 1. The blur divides by the total, here 16.`,
    },
    { type: "viz-link", vizIndex: 2, label: "Click a kernel cell to see where its weight comes from, and compare both blurs on a photo" },
    {
      type: "markdown",
      md: `## Your task

In \`Pascal.java\` implement:

1. \`pascal(n)\`: the first \`n\` rows of the triangle as a jagged array. Row \`r\` has exactly \`r + 1\` values. The starter allocates a rectangle, fix that.
2. \`rowSums(tri)\`: the sum of every row of **any** jagged array (not only triangles, and the first row is not always the shortest).
3. \`kernel(size)\`: the \`size × size\` kernel with \`k[r][c] = w[r] * w[c]\`, where \`w\` is row \`size - 1\` of the triangle.`,
    },
  ],
  visualizations: [
    { type: "concept", title: "Concept: building a jagged triangle", concept: "pascal-triangle", start: "build" },
    { type: "concept", title: "Concept: looping over a jagged array", concept: "pascal-triangle", start: "loop" },
    { type: "concept", title: "Concept: from a row to a blur kernel", concept: "pascal-triangle", start: "kernel" },
  ],
  task: {
    instructions: "Implement `pascal`, `rowSums` and `kernel`. Every row of the triangle has its own length.",
    mainClass: "Pascal",
    testClass: "PascalTest",
    files: [
      {
        path: "Pascal.java",
        content: `import java.util.Arrays;

public class Pascal {

    /**
     * Returns the first n rows of Pascal's triangle as a jagged array: row r has exactly r + 1 entries.
     * Both ends of a row are 1. Every other entry is the sum of the two entries above it.
     */
    public static int[][] pascal(int n) {
        int[][] tri = new int[n][n];   // TODO: this is a rectangle. Row r should have r + 1 entries.
        // TODO: fill the rows
        return tri;
    }

    /** Returns the sum of every row of a jagged array. */
    public static int[] rowSums(int[][] tri) {
        int[] sums = new int[tri.length];
        // TODO
        return sums;
    }

    /** Returns a size x size smooth blur kernel: k[r][c] = w[r] * w[c], where w is row size - 1 of the triangle. */
    public static int[][] kernel(int size) {
        int[][] k = new int[size][size];
        // TODO
        return k;
    }

    public static void main(String[] args) {
        int[][] tri = pascal(6);
        for (int[] row : tri) System.out.println("  " + Arrays.toString(row));
        System.out.println("rowSums = " + Arrays.toString(rowSums(tri)));
        System.out.println("kernel(3):");
        for (int[] row : kernel(3)) System.out.println("  " + Arrays.toString(row));
    }
}
`,
      },
      {
        path: "PascalTest.java",
        readOnly: true,
        content: `import tutor.Check;

public class PascalTest {

    static void test1_shape() {
        int[][] tri = Pascal.pascal(5);
        Check.equal(5, tri.length, "pascal(5) has 5 rows");
        for (int r = 0; r < 5; r++) Check.equal(r + 1, tri[r].length, "length of row " + r);
        Check.equal(0, Pascal.pascal(0).length, "pascal(0) has no rows");
    }

    static void test2_values() {
        Check.equal(new int[][]{{1}}, Pascal.pascal(1), "pascal(1)");
        Check.equal(new int[][]{{1}, {1, 1}, {1, 2, 1}, {1, 3, 3, 1}, {1, 4, 6, 4, 1}}, Pascal.pascal(5), "pascal(5)");
    }

    static void test3_bigRow() {
        int[][] tri = Pascal.pascal(11);
        Check.equal(new int[]{1, 10, 45, 120, 210, 252, 210, 120, 45, 10, 1}, tri[10], "row 10");
    }

    static void test4_rowSums() {
        Check.equal(new int[]{1, 2, 4, 8, 16, 32}, Pascal.rowSums(Pascal.pascal(6)), "row sums of the triangle are powers of 2");
        Check.equal(new int[]{1, 5, 15}, Pascal.rowSums(new int[][]{{1}, {2, 3}, {4, 5, 6}}), "rowSums of {{1}, {2, 3}, {4, 5, 6}}");
        Check.equal(new int[]{15, 1, 0}, Pascal.rowSums(new int[][]{{5, 5, 5}, {1}, {}}), "rowSums when the first row is the longest and the last is empty");
    }

    static void test5_kernel3() {
        Check.equal(new int[][]{{1, 2, 1}, {2, 4, 2}, {1, 2, 1}}, Pascal.kernel(3), "kernel(3)");
        Check.equal(new int[][]{{1}}, Pascal.kernel(1), "kernel(1)");
    }

    static void test6_kernel5() {
        int[][] k = Pascal.kernel(5);
        Check.equal(new int[]{1, 4, 6, 4, 1}, k[0], "kernel(5) row 0");
        Check.equal(new int[]{6, 24, 36, 24, 6}, k[2], "kernel(5) middle row");
        int total = 0;
        for (int[] row : k) for (int v : row) total += v;
        Check.equal(256, total, "kernel(5) adds up to 16 * 16 = 256");
    }
}
`,
      },
    ],
    testLabels: {
      test1_shape: "pascal: row r has r + 1 entries",
      test2_values: "pascal: the first rows",
      test3_bigRow: "pascal: row 10",
      test4_rowSums: "rowSums on any jagged array",
      test5_kernel3: "kernel(3) and kernel(1)",
      test6_kernel5: "kernel(5)",
    },
    hints: [
      "`pascal`: start with `int[][] tri = new int[n][];`. In the loop over `r`, do `tri[r] = new int[r + 1];`, then set `tri[r][0] = 1` and `tri[r][r] = 1`.",
      "The inside: `for (int c = 1; c < r; c++) tri[r][c] = tri[r - 1][c - 1] + tri[r - 1][c];`. For rows 0 and 1 this loop does nothing, which is correct.",
      "`rowSums`: the inner loop is `c < tri[r].length`, the length of the row you are on.",
      "`kernel`: `int[] w = pascal(size)[size - 1];` then fill `k[r][c] = w[r] * w[c]` with two loops from 0 to `size`.",
    ],
  },
};

export const tickets: Ticket[] = [pf207, pf208, pf209];
