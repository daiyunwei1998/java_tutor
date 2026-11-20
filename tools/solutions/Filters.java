public class Filters {
    public static int clamp(int v) { return Math.max(0, Math.min(255, v)); }
    public static int[][] brighten(int[][] img, int d) { int[][] o = new int[img.length][]; for (int r = 0; r < img.length; r++) { o[r] = new int[img[r].length]; for (int c = 0; c < img[r].length; c++) o[r][c] = clamp(img[r][c] + d); } return o; }
    public static void main(String[] a) {}
}
