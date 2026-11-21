import java.util.Arrays;

public class Grayscale {

    /** True when a and b have the same number of rows and each row has the same length. */
    public static boolean sameShape(int[][] a, int[][] b) {
        if (a.length != b.length) {
            return false;
        }
        for (int r = 0; r < a.length; r++) {
            if (a[r].length != b[r].length) {
                return false;
            }
        }
        return true;
    }

    /**
     * Returns a new image: each pixel = (red + green + blue) / 3.
     * Throws IllegalArgumentException if the channels do not all have the same shape.
     */
    public static int[][] average(int[][] red, int[][] green, int[][] blue) {
        if (!sameShape(red, green) || !sameShape(red, blue)) {
            throw new IllegalArgumentException("the three channels must have the same shape");
        }
        int[][] out = new int[red.length][];
        for (int r = 0; r < red.length; r++) {
            out[r] = new int[red[r].length];
            for (int c = 0; c < red[r].length; c++) {
                // the same [r][c] in all three arrays is the same pixel
                out[r][c] = (red[r][c] + green[r][c] + blue[r][c]) / 3;
            }
        }
        return out;
    }

    /**
     * Returns a new image: each pixel = (299 * red + 587 * green + 114 * blue) / 1000.
     * Throws IllegalArgumentException if the channels do not all have the same shape.
     */
    public static int[][] luma(int[][] red, int[][] green, int[][] blue) {
        if (!sameShape(red, green) || !sameShape(red, blue)) {
            throw new IllegalArgumentException("the three channels must have the same shape");
        }
        int[][] out = new int[red.length][];
        for (int r = 0; r < red.length; r++) {
            out[r] = new int[red[r].length];
            for (int c = 0; c < red[r].length; c++) {
                out[r][c] = (299 * red[r][c] + 587 * green[r][c] + 114 * blue[r][c]) / 1000;
            }
        }
        return out;
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
