public class ImageBuffer {

    /**
     * Returns the total number of elements in all rows.
     * A null row counts as 0 elements.
     */
    public static int countPixels(int[][] img) {
        int count = 0;
        for (int[] row : img) {
            if (row != null) {          // a null row has no elements
                count += row.length;
            }
        }
        return count;
    }

    /**
     * Returns true when no row is null and every row has the same length as img[0].
     * Returns true when img.length == 0.
     */
    public static boolean isRectangular(int[][] img) {
        if (img.length == 0) {
            return true;
        }
        if (img[0] == null) {
            return false;
        }
        int width = img[0].length;
        for (int[] row : img) {
            if (row == null || row.length != width) {
                return false;
            }
        }
        return true;
    }

    public static void main(String[] args) {
        int[][] a = new int[3][];
        a[0] = new int[]{1, 2, 3};
        a[1] = new int[]{4};
        a[2] = new int[]{5, 6};

        System.out.println("pixels = " + countPixels(a));
        System.out.println("rectangular? " + isRectangular(a));
    }
}
