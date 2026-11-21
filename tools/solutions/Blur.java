import java.util.Arrays;

public class Blur {

    /** True when (r, c) is a valid position in img. */
    public static boolean inBounds(int[][] img, int r, int c) {
        // check the row first, so img[r] is only read when r is valid
        return r >= 0 && r < img.length && c >= 0 && c < img[r].length;
    }

    /**
     * Average of the cells in the 3x3 neighborhood of (r, c) that are inside img.
     * Uses integer division: sum / count.
     */
    public static int average3x3(int[][] img, int r, int c) {
        int sum = 0;
        int count = 0;
        for (int dr = -1; dr <= 1; dr++) {
            for (int dc = -1; dc <= 1; dc++) {
                if (inBounds(img, r + dr, c + dc)) {
                    sum += img[r + dr][c + dc];
                    count++;
                }
            }
        }
        return sum / count;    // count is at least 1: (r, c) itself
    }

    /** Returns a new image where every pixel is average3x3(img, r, c). img is not modified. */
    public static int[][] boxBlur(int[][] img) {
        int[][] out = new int[img.length][];
        for (int r = 0; r < img.length; r++) {
            out[r] = new int[img[r].length];
            for (int c = 0; c < img[r].length; c++) {
                out[r][c] = average3x3(img, r, c);   // always read from img, never from out
            }
        }
        return out;
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
