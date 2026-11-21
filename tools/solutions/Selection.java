import java.util.Arrays;

public class Selection {

    /**
     * Returns a new height x width image: the part of img that starts at row top, column left.
     * The rectangle is always fully inside img.
     */
    public static int[][] crop(int[][] img, int top, int left, int height, int width) {
        int[][] out = new int[height][width];
        for (int r = top; r < top + height; r++) {          // starts and stops partway down the image
            for (int c = left; c < left + width; c++) {
                out[r - top][c - left] = img[r][c];          // shift back so out starts at [0][0]
            }
        }
        return out;
    }

    /**
     * Sets every pixel with top <= r < bottom and left <= c < right to value (changes img itself).
     * Parts of the rectangle outside img are skipped. Returns how many pixels were set.
     */
    public static int fillRect(int[][] img, int top, int left, int bottom, int right, int value) {
        int count = 0;
        int rStart = Math.max(0, top);                       // clip the rows to the image once
        int rEnd = Math.min(img.length, bottom);
        for (int r = rStart; r < rEnd; r++) {
            int cStart = Math.max(0, left);
            int cEnd = Math.min(img[r].length, right);
            for (int c = cStart; c < cEnd; c++) {
                img[r][c] = value;
                count++;
            }
        }
        return count;
    }

    /** Transposes a square image in place: img[r][c] and img[c][r] trade places. */
    public static void transposeInPlace(int[][] img) {
        for (int r = 0; r < img.length; r++) {
            for (int c = 0; c < r; c++) {                    // lower triangle only: each pair is swapped once
                int tmp = img[r][c];
                img[r][c] = img[c][r];
                img[c][r] = tmp;
            }
        }
    }

    /** Mirrors every row left <-> right in place. (Already done, from PF-202.) */
    public static void mirrorRows(int[][] img) {
        for (int[] row : img) {
            for (int c = 0; c < row.length / 2; c++) {
                int tmp = row[c];
                row[c] = row[row.length - 1 - c];
                row[row.length - 1 - c] = tmp;
            }
        }
    }

    /** Rotates a square image 90 degrees clockwise in place. */
    public static void rotateInPlace(int[][] img) {
        transposeInPlace(img);
        mirrorRows(img);
    }

    public static void main(String[] args) {
        int[][] img = {
            {11, 12, 13, 14, 15},
            {21, 22, 23, 24, 25},
            {31, 32, 33, 34, 35},
            {41, 42, 43, 44, 45}
        };
        System.out.println("crop(img, 1, 2, 2, 3) = " + Arrays.deepToString(crop(img, 1, 2, 2, 3)));

        int painted = fillRect(img, 2, 3, 6, 9, 0);   // hangs off the bottom-right corner
        System.out.println("fillRect painted " + painted + " pixels");
        for (int[] row : img) System.out.println("  " + Arrays.toString(row));

        int[][] sq = {
            {1, 2, 3},
            {4, 5, 6},
            {7, 8, 9}
        };
        transposeInPlace(sq);
        System.out.println("transposed = " + Arrays.deepToString(sq));
        transposeInPlace(sq);
        rotateInPlace(sq);
        System.out.println("rotated    = " + Arrays.deepToString(sq));
    }
}
