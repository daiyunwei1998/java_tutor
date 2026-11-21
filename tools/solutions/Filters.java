import java.util.Arrays;

public class Filters {

    /** Limits v to 0..255 */
    public static int clamp(int v) {
        if (v < 0) {
            return 0;
        }
        if (v > 255) {
            return 255;
        }
        return v;
    }

    /**
     * Returns a new image: each pixel = clamp(old value + delta).
     * Does not modify img.
     */
    public static int[][] brighten(int[][] img, int delta) {
        int[][] out = new int[img.length][];
        for (int r = 0; r < img.length; r++) {
            out[r] = new int[img[r].length];          // a new row, not img[r] itself
            for (int c = 0; c < img[r].length; c++) {
                out[r][c] = clamp(img[r][c] + delta);
            }
        }
        return out;
    }

    /** Adds delta to every pixel of img itself, clamped to 0..255 (no return value). */
    public static void brightenInPlace(int[][] img, int delta) {
        for (int[] row : img) {
            // v in "for (int v : row)" is only a copy of the value, so changing it changes nothing.
            // To change the array, write through an index.
            for (int c = 0; c < row.length; c++) {
                row[c] = clamp(row[c] + delta);
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
