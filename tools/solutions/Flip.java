import java.util.Arrays;

public class Flip {

    /** Returns a new image mirrored left <-> right. img is not modified. */
    public static int[][] flipHorizontal(int[][] img) {
        int rows = img.length;
        int cols = img[0].length;
        int[][] out = new int[rows][cols];
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                out[r][c] = img[r][cols - 1 - c];
            }
        }
        return out;
    }

    /** Returns a new image upside down. Every row of the result is a new array. */
    public static int[][] flipVertical(int[][] img) {
        int rows = img.length;
        int cols = img[0].length;
        int[][] out = new int[rows][cols];             // new rows, so nothing is shared with img
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                out[r][c] = img[rows - 1 - r][c];      // copy values, not the row reference
            }
        }
        return out;
    }

    /** Mirrors every row of img left <-> right in place (swap from both ends). */
    public static void mirrorInPlace(int[][] img) {
        for (int[] row : img) {
            for (int c = 0; c < row.length / 2; c++) { // stop at the middle, or every pair is swapped back
                int tmp = row[c];
                row[c] = row[row.length - 1 - c];
                row[row.length - 1 - c] = tmp;
            }
        }
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
