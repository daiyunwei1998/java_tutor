import type { Ticket } from "../types";

/*
 * Sprint 1 of the PixelForge "Mini Photoshop" project = AP CSA Unit 9 (2D arrays), lessons 1–4,
 * plus the first real filter. Content is data only; it is rendered by the generic ticket workspace.
 * Markdown uses ~~~ fences so it can live inside template literals.
 */

const pf101: Ticket = {
  id: "PF-101",
  slug: "image-buffer-memory",
  title: "Image buffer 健康檢查：2D 陣列與記憶體",
  sprint: "Sprint 1 · Onboarding",
  xp: 100,
  dependsOn: [],
  briefing: `歡迎加入 **PixelForge Studio**！🎉 我們在做一個在瀏覽器裡跑的 Mini Photoshop。

在我們的程式裡，每一張影像都是一個 \`int[][]\`（我們叫它 *image buffer*）。上週有人把一個 row 是 \`null\` 的 buffer 丟進濾鏡，整個 app 就 crash 了 😅

你的第一張 ticket：寫兩個工具方法，讓團隊可以在處理影像前先檢查 buffer 是否健康。`,
  objectives: [
    "分辨「陣列變數」和「陣列物件」",
    "說明 int[][] 其實是「裝著 int[] 參考的陣列」",
    "指出外層陣列 (outer array) 和內層陣列 (inner arrays)",
    "解釋為什麼 jagged array（每列長度不同）在 Java 是合法的",
  ],
  blocks: [
    {
      type: "markdown",
      md: `## int[][] 到底是什麼？

在 Java 裡，\`int[][] a\` 的意思是：**a 是一個陣列，裡面每一格裝的是「指向一個 int[] 的參考 (reference)」**。

- \`a\` 這個 **變數** 存的是一個參考，指向 **外層陣列物件**。
- 外層陣列的每一格 \`a[0]\`、\`a[1]\`… 又各自指向一個 **內層陣列物件**（真正存放數字的地方）。
- 每個內層陣列都是獨立的物件，所以它們的長度可以不同，這就是 **jagged array**。

~~~java
int[][] a = new int[3][];   // 只建立外層陣列，3 格都是 null
a[0] = new int[]{1, 2, 3};
a[1] = new int[]{4};
a[2] = new int[]{5, 6};
~~~`,
    },
    { type: "viz-link", vizIndex: 0, label: "打開右邊的 Array vs Memory，一步一步建立上面這個陣列" },
    {
      type: "callout",
      tone: "warn",
      md: "右邊顯示的記憶體位址（像 `@0x1A40`）是 **教學用的模擬值**，不是真的 JVM 位址。Java 不保證陣列物件在記憶體裡放在哪裡，也不保證它們彼此相鄰。",
    },
    {
      type: "predict",
      id: "pf101-null",
      question: "執行下面的程式，會印出什麼？",
      code: `int[][] a = new int[3][];
System.out.println(a[1]);`,
      options: ["0", "null", "[]", "編譯錯誤"],
      answer: 1,
      explain: "`new int[3][]` 只建立了外層陣列。外層陣列每一格裝的是 int[] 的參考，預設值是 `null`，內層陣列還沒被建立。",
    },
    {
      type: "predict",
      id: "pf101-alias",
      question: "下面的程式最後印出什麼？",
      code: `int[][] a = {{1, 2}, {3, 4}};
int[][] b = a;
b[0][0] = 9;
System.out.println(a[0][0]);`,
      options: ["1", "9", "編譯錯誤", "執行時錯誤"],
      answer: 1,
      explain: "`b = a` 沒有複製陣列，只是複製了參考。a 和 b 指向 **同一個** 外層陣列物件（aliasing），所以透過 b 修改，從 a 也看得到。右邊選「Aliasing」可以看到兩個箭頭指向同一個物件。",
    },
    {
      type: "markdown",
      md: `## 這張 ticket 要你做的事

在 \`ImageBuffer.java\` 實作：

1. \`countPixels(int[][] img)\`：回傳所有 row 加起來共有幾個元素。**null 的 row 算 0 個**。
2. \`isRectangular(int[][] img)\`：每一個 row 都不是 \`null\`，而且長度都跟第 0 列一樣時回傳 \`true\`。外層長度是 0 的陣列也算 \`true\`。

做完按 **✓ 執行測試**，全部通過就可以 **Merge**。`,
    },
  ],
  visualizations: [
    { type: "array-memory", title: "Array vs Memory", presets: ["jagged", "rectangular", "alias", "shared-row", "null-row"] },
  ],
  task: {
    instructions: "實作 `countPixels` 和 `isRectangular`。注意 jagged array 和 `null` row！",
    mainClass: "ImageBuffer",
    testClass: "ImageBufferTest",
    files: [
      {
        path: "ImageBuffer.java",
        content: `public class ImageBuffer {

    /**
     * 回傳所有 row 的元素總數。
     * null 的 row 視為 0 個元素。
     */
    public static int countPixels(int[][] img) {
        // TODO: 走訪每一個 row，把長度加起來
        return 0;
    }

    /**
     * 每一個 row 都不是 null，而且長度都和 img[0] 一樣時回傳 true。
     * img.length == 0 時回傳 true。
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
        Check.equal(9, ImageBuffer.countPixels(img), "3x3 的像素數");
    }

    static void test2_jagged() {
        int[][] img = {{1, 2, 3}, {4}, {5, 6}};
        Check.equal(6, ImageBuffer.countPixels(img), "jagged array 的像素數");
    }

    static void test3_nullRow() {
        int[][] img = new int[3][];
        img[0] = new int[]{1, 2};
        img[2] = new int[]{3};
        Check.equal(3, ImageBuffer.countPixels(img), "有 null row 的像素數");
    }

    static void test4_isRectangularTrue() {
        Check.isTrue(ImageBuffer.isRectangular(new int[][]{{1, 2}, {3, 4}, {5, 6}}), "3x2 應該是 rectangular");
    }

    static void test5_isRectangularJagged() {
        Check.isTrue(!ImageBuffer.isRectangular(new int[][]{{1, 2, 3}, {4}, {5, 6}}), "jagged array 不是 rectangular");
    }

    static void test6_isRectangularNullRow() {
        int[][] img = new int[2][];
        img[0] = new int[]{1};
        Check.isTrue(!ImageBuffer.isRectangular(img), "有 null row 就不是 rectangular");
    }

    static void test7_empty() {
        Check.equal(0, ImageBuffer.countPixels(new int[0][]), "空陣列的像素數");
        Check.isTrue(ImageBuffer.isRectangular(new int[0][]), "空陣列算 rectangular");
    }
}
`,
      },
    ],
    testLabels: {
      test1_rectangular: "3×3 矩陣的像素數",
      test2_jagged: "jagged array 的像素數",
      test3_nullRow: "null row 算 0 個",
      test4_isRectangularTrue: "3×2 是 rectangular",
      test5_isRectangularJagged: "jagged 不是 rectangular",
      test6_isRectangularNullRow: "有 null row 不是 rectangular",
      test7_empty: "空陣列 (edge case)",
    },
    hints: [
      "外層迴圈走 `img.length` 個 row；每個 row 是 `img[r]`，它的長度是 `img[r].length`。",
      "在讀 `img[r].length` 之前，先檢查 `img[r] == null`，不然會 NullPointerException。",
      "`isRectangular`：先處理 `img.length == 0`，再把 `img[0]` 的長度記下來，跟其他 row 比。別忘了 `img[0]` 自己也可能是 null。",
    ],
  },
};

const pf102: Ticket = {
  id: "PF-102",
  slug: "row-column-major",
  title: "直方圖統計：Row-major 與 Column-major 走訪",
  sprint: "Sprint 1 · Onboarding",
  xp: 120,
  dependsOn: ["PF-101"],
  briefing: `設計師想在 Mini Photoshop 加一個「亮度分布」面板：要知道 **每一列 (row)** 和 **每一欄 (column)** 的亮度總和。

這張 ticket 你會學到兩種走訪 2D 陣列的順序，以及為什麼順序有時候會影響效能。`,
  objectives: [
    "區分「邏輯座標 (r, c)」、「走訪順序」和「實體儲存方式」",
    "寫出 row-major 與 column-major 的巢狀迴圈",
    "理解 locality（區域性）的概念，以及它的限制",
  ],
  blocks: [
    {
      type: "markdown",
      md: `## 兩種走訪順序

**Row-major**：一列一列走，外層迴圈是 row。

~~~java
for (int r = 0; r < m.length; r++)
    for (int c = 0; c < m[r].length; c++)
        visit(m[r][c]);
~~~

**Column-major**：一欄一欄走，外層迴圈是 column（通常假設矩陣是 rectangular）。

~~~java
for (int c = 0; c < m[0].length; c++)
    for (int r = 0; r < m.length; r++)
        visit(m[r][c]);
~~~`,
    },
    { type: "viz-link", vizIndex: 0, label: "在右邊用 Step ▶ 比較兩種順序，觀察 r 和 c 怎麼變" },
    {
      type: "predict",
      id: "pf102-order",
      question: "m = {{1, 2, 3}, {4, 5, 6}}，用 column-major 走訪並依序印出，結果是？",
      options: ["1 2 3 4 5 6", "1 4 2 5 3 6", "6 5 4 3 2 1", "1 3 5 2 4 6"],
      answer: 1,
      explain: "外層是 column：先走第 0 欄 (1, 4)，再第 1 欄 (2, 5)，最後第 2 欄 (3, 6)。",
    },
    {
      type: "markdown",
      md: `## 效能和 locality

右邊的「連續記憶體模型」是一個 **假想** 的情況：如果整個矩陣放在一塊連續記憶體裡，

- row-major 存放時位置是 \`offset = r * cols + c\`
- column-major 存放時位置是 \`offset = c * rows + r\`

CPU 一次會把相鄰的一小段資料（cache line）讀進來，所以 **連續地讀** 通常比 **跳著讀** 快。`,
    },
    {
      type: "callout",
      tone: "warn",
      md: "Java 的 `int[][]` **不是** 一整塊連續的矩陣，而是「陣列的陣列」：每一列是獨立的物件。在同一列裡面依序讀通常有比較好的 locality，但實際快慢取決於 JVM 最佳化、硬體和怎麼做 benchmark，**不能說 row-major 一定比較快**。",
    },
    {
      type: "markdown",
      md: `## 這張 ticket 要你做的事

在 \`BrightnessStats.java\` 實作：

1. \`rowSums(int[][] m)\`：回傳長度為 \`m.length\` 的陣列，第 r 格是第 r 列的總和。
2. \`columnSums(int[][] m)\`：回傳長度為欄數的陣列，第 c 格是第 c 欄的總和（假設 m 是 rectangular）。
3. 如果 \`m.length == 0\`，兩個方法都回傳 \`new int[0]\`。`,
    },
  ],
  visualizations: [{ type: "traversal", title: "Traversal Lab", modes: ["row-major", "column-major"], rows: 3, cols: 4 }],
  task: {
    instructions: "實作 `rowSums` 和 `columnSums`。哪一個的外層迴圈應該是 column？",
    mainClass: "BrightnessStats",
    testClass: "BrightnessStatsTest",
    files: [
      {
        path: "BrightnessStats.java",
        content: `import java.util.Arrays;

public class BrightnessStats {

    /** 第 r 格 = 第 r 列 (row) 的總和 */
    public static int[] rowSums(int[][] m) {
        int[] sums = new int[m.length];
        // TODO
        return sums;
    }

    /** 第 c 格 = 第 c 欄 (column) 的總和。假設 m 是 rectangular。 */
    public static int[] columnSums(int[][] m) {
        // TODO: 想一想 m.length == 0 的時候，要怎麼知道欄數？
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
        Check.equal(new int[0], BrightnessStats.rowSums(new int[0][0]), "rowSums 空陣列");
        Check.equal(new int[0], BrightnessStats.columnSums(new int[0][0]), "columnSums 空陣列");
    }
}
`,
      },
    ],
    testLabels: {
      test1_rowSums: "rowSums（2×3）",
      test2_columnSums: "columnSums（2×3）",
      test3_tallMatrix: "非正方形 3×2",
      test4_singleCell: "1×1 矩陣",
      test5_empty: "空陣列 (edge case)",
    },
    hints: [
      "`rowSums`：外層迴圈走 r，內層走 c，把 `m[r][c]` 加到 `sums[r]`。",
      "`columnSums` 的結果長度是欄數 `m[0].length`，但只有在 `m.length > 0` 時才能讀 `m[0]`。",
      "`columnSums` 用 column-major：外層 `for (int c ...)`，內層 `for (int r ...)`，加到 `sums[c]`。",
    ],
  },
};

const pf103: Ticket = {
  id: "PF-103",
  slug: "enhanced-for",
  title: "曝光調整：Enhanced for 的陷阱",
  sprint: "Sprint 1 · Onboarding",
  xp: 120,
  dependsOn: ["PF-102"],
  briefing: `QA 回報一個 bug：「曝光 +10」按鈕按下去，影像完全沒變 🐛

前一位工程師用了 enhanced for loop 來改像素值。這張 ticket 你要搞懂為什麼那樣寫沒效果，然後寫出正確的版本。`,
  objectives: [
    "讀懂 enhanced for (for-each) 的語法",
    "把巢狀 enhanced for 改寫成 index 版本，反之亦然",
    "解釋為什麼修改 for-each 的區域變數不會改到陣列，但修改 row[c] 會",
  ],
  blocks: [
    {
      type: "markdown",
      md: `## Enhanced for

~~~java
int[] values = {1, 2, 3};
for (int value : values) {
    System.out.println(value);
}
~~~

2D 版本：外層每次拿到的是 **一個 row 的參考**（型別是 \`int[]\`），內層每次拿到的是 **一個 int 的複本**。

~~~java
for (int[] row : matrix) {
    for (int value : row) {
        System.out.println(value);
    }
}
~~~`,
    },
    { type: "viz-link", vizIndex: 0, label: "在右邊選「enhanced for」，看 row 和 value 每一步指向哪裡" },
    {
      type: "predict",
      id: "pf103-bug",
      question: "這就是 QA 回報的 bug。執行後印出什麼？",
      code: `int[][] img = {{10, 20}, {30, 40}};
for (int[] row : img) {
    for (int v : row) {
        v += 10;
    }
}
System.out.println(img[0][0]);`,
      options: ["10", "20", "編譯錯誤", "ArrayIndexOutOfBoundsException"],
      answer: 0,
      explain: "`v` 是陣列元素的 **複本**（primitive int）。改 `v` 只改到區域變數，陣列本身沒變。但 `row` 是指向真正內層陣列的參考，所以寫 `row[c] += 10` 就會改到陣列。",
    },
    {
      type: "callout",
      tone: "info",
      md: "規則：for-each 適合 **讀取**。需要 **修改** 元素，或需要知道 index 時，用一般的 index for loop（或至少內層用 index：`for (int c = 0; c < row.length; c++) row[c] += 10;`）。",
    },
    {
      type: "markdown",
      md: `## 這張 ticket 要你做的事

在 \`Exposure.java\` 實作：

1. \`total(int[][] img)\`：用 **enhanced for** 算出所有像素總和。
2. \`addToAll(int[][] img, int delta)\`：把每個像素加上 \`delta\`，**直接修改傳進來的陣列**（不用回傳）。
3. \`countAbove(int[][] img, int threshold)\`：數有幾個像素 **大於** threshold。

這些方法要能處理 jagged array。`,
    },
  ],
  visualizations: [{ type: "traversal", title: "Enhanced for 視覺化", modes: ["enhanced-for", "row-major"], rows: 3, cols: 3 }],
  task: {
    instructions: "實作 `total`、`addToAll`、`countAbove`。`addToAll` 要真的改到陣列！",
    mainClass: "Exposure",
    testClass: "ExposureTest",
    files: [
      {
        path: "Exposure.java",
        content: `import java.util.Arrays;

public class Exposure {

    /** 用 enhanced for 回傳所有像素總和 */
    public static int total(int[][] img) {
        int sum = 0;
        // TODO
        return sum;
    }

    /** 每個像素加上 delta（直接修改 img） */
    public static void addToAll(int[][] img, int delta) {
        // 這是前一位工程師寫的，有 bug：
        for (int[] row : img) {
            for (int v : row) {
                v += delta;
            }
        }
    }

    /** 有幾個像素 > threshold */
    public static int countAbove(int[][] img, int threshold) {
        // TODO
        return 0;
    }

    public static void main(String[] args) {
        int[][] img = {{10, 20, 30}, {40, 50, 60}};
        System.out.println("total = " + total(img));
        addToAll(img, 10);
        System.out.println("after +10: " + Arrays.deepToString(img));
        System.out.println("above 45: " + countAbove(img, 45));
    }
}
`,
      },
      {
        path: "ExposureTest.java",
        readOnly: true,
        content: `import tutor.Check;

public class ExposureTest {

    static void test1_total() {
        Check.equal(210, Exposure.total(new int[][]{{10, 20, 30}, {40, 50, 60}}), "total 2x3");
    }

    static void test2_totalJagged() {
        Check.equal(15, Exposure.total(new int[][]{{1, 2, 3}, {4}, {5}}), "total jagged");
    }

    static void test3_addToAllModifiesArray() {
        int[][] img = {{10, 20}, {30, 40}};
        Exposure.addToAll(img, 10);
        Check.equal(new int[][]{{20, 30}, {40, 50}}, img, "addToAll 後的陣列");
    }

    static void test4_addToAllNegativeJagged() {
        int[][] img = {{5}, {6, 7}};
        Exposure.addToAll(img, -5);
        Check.equal(new int[][]{{0}, {1, 2}}, img, "addToAll(-5) jagged");
    }

    static void test5_countAbove() {
        int[][] img = {{10, 50}, {45, 46}, {100}};
        Check.equal(3, Exposure.countAbove(img, 45), "countAbove 45（等於 45 不算）");
    }
}
`,
      },
    ],
    testLabels: {
      test1_total: "total（2×3）",
      test2_totalJagged: "total（jagged）",
      test3_addToAllModifiesArray: "addToAll 真的改到陣列",
      test4_addToAllNegativeJagged: "addToAll 負數 + jagged",
      test5_countAbove: "countAbove（嚴格大於）",
    },
    hints: [
      "`total` 可以直接用兩層 for-each：`for (int[] row : img) for (int v : row) sum += v;`",
      "`addToAll` 的 bug：`v` 只是複本。外層用 for-each 拿到 `row` 沒問題，但內層要用 index：`row[c] += delta`。",
      "`countAbove` 要用 `>`，不是 `>=`。",
    ],
  },
};

const pf104: Ticket = {
  id: "PF-104",
  slug: "matrix-algorithms",
  title: "旋轉功能準備：對角線與轉置 (Transpose)",
  sprint: "Sprint 1 · Onboarding",
  xp: 150,
  dependsOn: ["PF-103"],
  briefing: `產品經理想在下個 sprint 加「旋轉 90°」。旋轉的第一步是 **轉置 (transpose)**：把 row 變成 column。

另外，影像分析團隊需要算對角線的亮度。這張 ticket 你會實作這些矩陣演算法，並且比較它們的時間複雜度。`,
  objectives: [
    "實作對角線總和與轉置",
    "說明 O(1)、O(N)、O(R·C) 的差別",
    "說明轉置需要 O(R·C) 的額外空間",
    "處理非正方形矩陣",
  ],
  blocks: [
    {
      type: "markdown",
      md: `## 對角線只需要一層迴圈

N×N 矩陣的 **主對角線** 是 \`m[i][i]\`，**副對角線** 是 \`m[i][N - 1 - i]\`。

~~~java
int sum = 0;
for (int i = 0; i < m.length; i++) {
    sum += m[i][i];
}
~~~

只走了 N 格，所以是 **O(N)**；如果掃描每一格再判斷 \`r == c\`，就變成 **O(N²)**，做了很多白工。`,
    },
    { type: "viz-link", vizIndex: 0, label: "在右邊比較「主對角線」和「整個矩陣總和」的存取次數" },
    {
      type: "predict",
      id: "pf104-complexity",
      question: "對一個 R×C 的矩陣做轉置 (transpose)，時間和額外空間複雜度是？",
      options: ["時間 O(R)、空間 O(1)", "時間 O(R·C)、空間 O(R·C)", "時間 O(1)、空間 O(R·C)", "時間 O(R·C)、空間 O(1)"],
      answer: 1,
      explain: "每個元素都要被複製一次 → O(R·C) 時間；結果是一個新的 C×R 陣列 → O(R·C) 額外空間。（正方形矩陣可以原地轉置，但那是進階題。）",
    },
    {
      type: "markdown",
      md: `## Transpose

轉置後 \`t[c][r] = m[r][c]\`。如果 m 是 R×C，t 就是 **C×R**：

~~~java
int[][] t = new int[m[0].length][m.length];
~~~

## 這張 ticket 要你做的事

在 \`MatrixTools.java\` 實作：

1. \`mainDiagonalSum(int[][] m)\`：主對角線總和（m 是 N×N）。
2. \`antiDiagonalSum(int[][] m)\`：副對角線總和（m 是 N×N）。
3. \`transpose(int[][] m)\`：回傳 **新的** C×R 陣列，不可以修改 m。`,
    },
  ],
  visualizations: [
    { type: "matrix-algo", title: "Matrix Algorithm Lab", algorithms: ["main-diagonal", "anti-diagonal", "row-sum", "column-sum", "max", "transpose"] },
  ],
  task: {
    instructions: "實作 `mainDiagonalSum`、`antiDiagonalSum`、`transpose`。轉置要支援非正方形矩陣。",
    mainClass: "MatrixTools",
    testClass: "MatrixToolsTest",
    files: [
      {
        path: "MatrixTools.java",
        content: `import java.util.Arrays;

public class MatrixTools {

    /** m 是 N x N：回傳 m[0][0] + m[1][1] + ... */
    public static int mainDiagonalSum(int[][] m) {
        // TODO: 只需要一層迴圈
        return 0;
    }

    /** m 是 N x N：回傳 m[0][N-1] + m[1][N-2] + ... */
    public static int antiDiagonalSum(int[][] m) {
        // TODO
        return 0;
    }

    /** 回傳 m 的轉置（新的陣列）。m 是 R x C，結果是 C x R。 */
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
        Check.equal(15, MatrixTools.mainDiagonalSum(Check.copy(M3)), "3x3 主對角線");
        Check.equal(34, MatrixTools.mainDiagonalSum(new int[][]{{1, 2, 3, 4}, {5, 6, 7, 8}, {9, 10, 11, 12}, {13, 14, 15, 16}}), "4x4 主對角線");
    }

    static void test2_antiDiagonal() {
        Check.equal(15, MatrixTools.antiDiagonalSum(Check.copy(M3)), "3x3 副對角線");
        Check.equal(5, MatrixTools.antiDiagonalSum(new int[][]{{1, 2}, {3, 4}}), "2x2 副對角線");
    }

    static void test3_singleCell() {
        Check.equal(7, MatrixTools.mainDiagonalSum(new int[][]{{7}}), "1x1 主對角線");
        Check.equal(7, MatrixTools.antiDiagonalSum(new int[][]{{7}}), "1x1 副對角線");
    }

    static void test4_transposeSquare() {
        Check.equal(new int[][]{{1, 4, 7}, {2, 5, 8}, {3, 6, 9}}, MatrixTools.transpose(Check.copy(M3)), "3x3 轉置");
    }

    static void test5_transposeWide() {
        Check.equal(new int[][]{{1, 4}, {2, 5}, {3, 6}}, MatrixTools.transpose(new int[][]{{1, 2, 3}, {4, 5, 6}}), "2x3 轉置成 3x2");
    }

    static void test6_doesNotModifyInput() {
        int[][] m = {{1, 2}, {3, 4}};
        int[][] t = MatrixTools.transpose(m);
        Check.notSame(m, t, "transpose 應該回傳新的陣列，而不是原本的 m");
        Check.equal(new int[][]{{1, 2}, {3, 4}}, m, "原本的 m 不應該被修改");
    }
}
`,
      },
    ],
    testLabels: {
      test1_mainDiagonal: "主對角線（3×3、4×4）",
      test2_antiDiagonal: "副對角線（3×3、2×2）",
      test3_singleCell: "1×1 矩陣",
      test4_transposeSquare: "轉置 3×3",
      test5_transposeWide: "轉置非正方形 2×3 → 3×2",
      test6_doesNotModifyInput: "不修改輸入、回傳新陣列",
    },
    hints: [
      "主對角線：`for (int i = 0; i < m.length; i++) sum += m[i][i];`",
      "副對角線的 column 是 `m.length - 1 - i`。",
      "轉置：先 `new int[m[0].length][m.length]`，再用兩層迴圈 `t[c][r] = m[r][c]`。",
    ],
  },
};

const pf105: Ticket = {
  id: "PF-105",
  slug: "brightness-filter",
  title: "第一個濾鏡上線：亮度調整 (Brightness)",
  sprint: "Sprint 1 · Feature",
  xp: 200,
  dependsOn: ["PF-104"],
  briefing: `恭喜你通過 onboarding！🚀 這是你第一張 **會出現在產品上** 的 ticket。

Mini Photoshop 的亮度滑桿會呼叫你寫的 \`Filters.brighten\`。你的 Java 程式算出來的結果，會直接顯示在右邊的編輯器裡。`,
  objectives: [
    "理解灰階影像就是 int[][]，每個值是 0–255 的亮度",
    "用像素檢查器 (pixel inspector) 對照座標和陣列元素",
    "實作逐像素運算 (pixel-wise operation) 並 clamp 到 0–255",
    "回傳新陣列，不修改原始影像",
  ],
  blocks: [
    {
      type: "markdown",
      md: `## 影像 = 2D 陣列

灰階影像可以用 \`int[][] image\` 表示：

- \`image.length\` 是 **高度**（幾列），\`image[0].length\` 是 **寬度**（幾欄）。
- \`image[r][c]\` 是第 r 列、第 c 欄的像素，**0 = 黑、255 = 白**。

在右邊的影像上移動滑鼠，可以看到每個像素的 \`(row, col)\` 和亮度。點一下還可以改它的值。`,
    },
    { type: "viz-link", vizIndex: 0, label: "打開右邊的 Mini Photoshop，看看像素和陣列的對應" },
    {
      type: "predict",
      id: "pf105-clamp",
      question: "一個像素是 250，亮度 +20。如果不做任何處理直接存回去，會發生什麼問題？",
      options: ["沒問題，就是 270", "超出 0–255 的合法範圍，顯示會出錯", "Java 會自動變成 255", "編譯錯誤"],
      answer: 1,
      explain: "`int` 可以存 270，Java 不會幫你限制範圍。但像素只能是 0–255，所以我們要自己 **clamp**：小於 0 變 0，大於 255 變 255。",
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

（也可以寫成 \`Math.max(0, Math.min(255, v))\`。）

## 這張 ticket 要你做的事

在 \`Filters.java\` 實作 \`brighten(int[][] img, int delta)\`：

1. 建立一個 **新的** 同樣大小的陣列。
2. 每個像素 = \`clamp(img[r][c] + delta)\`。
3. 不可以修改 \`img\`。

測試通過後，按右邊的 **用我的 Java 套用**，你的程式就會處理真的影像！`,
    },
    {
      type: "callout",
      tone: "info",
      md: "右邊影像下方會標示結果的來源：**「由你的 Java 程式計算」** 才代表是你的 `brighten` 算出來的。Mini Photoshop 不會用 JavaScript 偷偷幫你算。",
    },
  ],
  visualizations: [{ type: "image-lab", title: "Mini Photoshop", filter: "brighten" }],
  task: {
    instructions: "實作 `clamp` 和 `brighten`，然後在右邊用你的 Java 程式處理影像。",
    mainClass: "Filters",
    testClass: "FiltersTest",
    files: [
      {
        path: "Filters.java",
        content: `public class Filters {

    /** 把 v 限制在 0..255 */
    public static int clamp(int v) {
        // TODO
        return v;
    }

    /**
     * 回傳一張新的影像：每個像素 = clamp(原本的值 + delta)。
     * 不可以修改 img。
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
        for (int[] row : out) {
            System.out.println(java.util.Arrays.toString(row));
        }
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
        Check.equal(new int[][]{{255, 255, 255}}, out, "超過 255 要 clamp");
    }

    static void test4_clampLow() {
        int[][] out = Filters.brighten(new int[][]{{10}, {0}, {200}}, -50);
        Check.equal(new int[][]{{0}, {0}, {150}}, out, "低於 0 要 clamp（負的 delta）");
    }

    static void test5_doesNotModifyInput() {
        int[][] img = {{1, 2}, {3, 4}};
        int[][] out = Filters.brighten(img, 10);
        Check.notSame(img, out, "brighten 應該回傳新的陣列");
        Check.notSame(img[0], out[0], "每一列也要是新的陣列（不要共用 row）");
        Check.equal(new int[][]{{1, 2}, {3, 4}}, img, "原始影像不應該被修改");
    }
}
`,
      },
    ],
    testLabels: {
      test1_clamp: "clamp 邊界值",
      test2_brightenBasic: "brighten 基本情況",
      test3_clampHigh: "超過 255 要 clamp",
      test4_clampLow: "低於 0 要 clamp",
      test5_doesNotModifyInput: "不修改原始影像",
    },
    hints: [
      "先寫好 `clamp`，`brighten` 裡每個像素都呼叫它。",
      "新陣列：`int[][] out = new int[img.length][];`，每一列再 `out[r] = new int[img[r].length];`（這樣 jagged 也能處理）。",
      "如果你寫 `int[][] out = img;`，那只是複製參考（還記得 PF-101 的 aliasing 嗎？）。",
    ],
  },
};

export const sprint1Tickets: Ticket[] = [pf101, pf102, pf103, pf104, pf105];
