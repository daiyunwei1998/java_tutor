public class ImageBuffer {
    public static int countPixels(int[][] img) { int n = 0; for (int[] row : img) if (row != null) n += row.length; return n; }
    public static boolean isRectangular(int[][] img) {
        if (img.length == 0) return true;
        if (img[0] == null) return false;
        for (int[] row : img) if (row == null || row.length != img[0].length) return false;
        return true;
    }
    public static void main(String[] a) {}
}
