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
