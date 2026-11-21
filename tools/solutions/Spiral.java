import java.util.Arrays;

public class Spiral {

    /** Returns the values of img in clockwise spiral order, starting at the top-left corner. */
    public static int[] spiralOrder(int[][] img) {
        int[] out = new int[img.length * img[0].length];
        int k = 0;
        int top = 0, bottom = img.length - 1, left = 0, right = img[0].length - 1;
        while (top <= bottom && left <= right) {
            for (int c = left; c <= right; c++) out[k++] = img[top][c];          // top row, left to right
            top++;
            for (int r = top; r <= bottom; r++) out[k++] = img[r][right];        // right column, downwards
            right--;
            if (top <= bottom) {                                                  // a row is still left
                for (int c = right; c >= left; c--) out[k++] = img[bottom][c];   // bottom row, right to left
                bottom--;
            }
            if (left <= right) {                                                  // a column is still left
                for (int r = bottom; r >= top; r--) out[k++] = img[r][left];     // left column, upwards
                left++;
            }
        }
        return out;
    }

    /** Returns a rows x cols array where each cell holds the step (0, 1, 2, ...) at which the spiral reveals it. */
    public static int[][] revealOrder(int rows, int cols) {
        int[][] step = new int[rows][cols];
        int k = 0;
        int top = 0, bottom = rows - 1, left = 0, right = cols - 1;
        while (top <= bottom && left <= right) {
            for (int c = left; c <= right; c++) step[top][c] = k++;
            top++;
            for (int r = top; r <= bottom; r++) step[r][right] = k++;
            right--;
            if (top <= bottom) {
                for (int c = right; c >= left; c--) step[bottom][c] = k++;
                bottom--;
            }
            if (left <= right) {
                for (int r = bottom; r >= top; r--) step[r][left] = k++;
                left++;
            }
        }
        return step;
    }

    /** Which ring of the spiral (r, c) is on: 0 = the outer edge, 1 = one step in, and so on. */
    public static int ring(int rows, int cols, int r, int c) {
        return Math.min(Math.min(r, c), Math.min(rows - 1 - r, cols - 1 - c));
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
