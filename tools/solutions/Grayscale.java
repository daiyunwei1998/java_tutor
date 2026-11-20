public class Grayscale {
    public static boolean sameShape(int[][] a, int[][] b) {
        if (a.length != b.length) return false;
        for (int r = 0; r < a.length; r++) if (a[r].length != b[r].length) return false;
        return true;
    }
    private static void check(int[][] red, int[][] green, int[][] blue) {
        if (!sameShape(red, green) || !sameShape(red, blue)) throw new IllegalArgumentException("channels differ");
    }
    public static int[][] average(int[][] red, int[][] green, int[][] blue) {
        check(red, green, blue);
        int[][] out = new int[red.length][];
        for (int r = 0; r < red.length; r++) {
            out[r] = new int[red[r].length];
            for (int c = 0; c < red[r].length; c++) out[r][c] = (red[r][c] + green[r][c] + blue[r][c]) / 3;
        }
        return out;
    }
    public static int[][] luma(int[][] red, int[][] green, int[][] blue) {
        check(red, green, blue);
        int[][] out = new int[red.length][];
        for (int r = 0; r < red.length; r++) {
            out[r] = new int[red[r].length];
            for (int c = 0; c < red[r].length; c++) out[r][c] = (299 * red[r][c] + 587 * green[r][c] + 114 * blue[r][c]) / 1000;
        }
        return out;
    }
    public static void main(String[] args) {}
}
