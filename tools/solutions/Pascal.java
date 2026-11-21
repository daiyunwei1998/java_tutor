import java.util.Arrays;

public class Pascal {

    /**
     * Returns the first n rows of Pascal's triangle as a jagged array: row r has exactly r + 1 entries.
     * Both ends of a row are 1. Every other entry is the sum of the two entries above it.
     */
    public static int[][] pascal(int n) {
        int[][] tri = new int[n][];
        for (int r = 0; r < n; r++) {
            tri[r] = new int[r + 1];                                  // each row gets its own length
            tri[r][0] = 1;
            tri[r][r] = 1;
            for (int c = 1; c < r; c++) {                             // only the inside of the row
                tri[r][c] = tri[r - 1][c - 1] + tri[r - 1][c];
            }
        }
        return tri;
    }

    /** Returns the sum of every row of a jagged array. */
    public static int[] rowSums(int[][] tri) {
        int[] sums = new int[tri.length];
        for (int r = 0; r < tri.length; r++) {
            for (int c = 0; c < tri[r].length; c++) {                // this row's length, not tri[0].length
                sums[r] += tri[r][c];
            }
        }
        return sums;
    }

    /** Returns a size x size smooth blur kernel: k[r][c] = w[r] * w[c], where w is row size - 1 of the triangle. */
    public static int[][] kernel(int size) {
        int[] w = pascal(size)[size - 1];
        int[][] k = new int[size][size];
        for (int r = 0; r < size; r++) {
            for (int c = 0; c < size; c++) {
                k[r][c] = w[r] * w[c];
            }
        }
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
