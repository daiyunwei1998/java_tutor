import java.util.Arrays;

public class BrightnessStats {

    /** slot r = sum of row r */
    public static int[] rowSums(int[][] m) {
        int[] sums = new int[m.length];
        for (int r = 0; r < m.length; r++) {          // outer loop: rows (row-major)
            for (int c = 0; c < m[r].length; c++) {
                sums[r] += m[r][c];
            }
        }
        return sums;
    }

    /** slot c = sum of column c. Assumes m is rectangular. */
    public static int[] columnSums(int[][] m) {
        if (m.length == 0) {
            return new int[0];                        // no rows, so no columns either
        }
        int[] sums = new int[m[0].length];
        for (int c = 0; c < m[0].length; c++) {       // outer loop: columns (column-major)
            for (int r = 0; r < m.length; r++) {
                sums[c] += m[r][c];
            }
        }
        return sums;
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
