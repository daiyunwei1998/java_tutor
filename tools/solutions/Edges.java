import java.util.Arrays;

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
        int sum = 0;
        for (int i = 0; i < 3; i++) {
            for (int j = 0; j < 3; j++) {
                // kernel[1][1] sits on (r, c), so kernel[i][j] sits on (r - 1 + i, c - 1 + j)
                sum += kernel[i][j] * img[r - 1 + i][c - 1 + j];
            }
        }
        return sum;
    }

    /** sqrt(gx * gx + gy * gy), rounded, at most 255. */
    public static int magnitude(int gx, int gy) {
        int m = (int) Math.round(Math.sqrt(gx * gx + gy * gy));
        return Math.min(255, m);
    }

    /** New image: border pixels are 0, other pixels are the Sobel edge strength. */
    public static int[][] edges(int[][] img) {
        int rows = img.length;
        int cols = img[0].length;
        int[][] out = new int[rows][cols];             // starts as all 0, so the border is already done
        for (int r = 1; r < rows - 1; r++) {
            for (int c = 1; c < cols - 1; c++) {
                int gx = applyKernel(img, r, c, GX);
                int gy = applyKernel(img, r, c, GY);
                out[r][c] = magnitude(gx, gy);
            }
        }
        return out;
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
