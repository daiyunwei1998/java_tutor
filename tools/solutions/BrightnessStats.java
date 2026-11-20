public class BrightnessStats {
    public static int[] rowSums(int[][] m) { int[] s = new int[m.length]; for (int r = 0; r < m.length; r++) for (int c = 0; c < m[r].length; c++) s[r] += m[r][c]; return s; }
    public static int[] columnSums(int[][] m) { if (m.length == 0) return new int[0]; int[] s = new int[m[0].length]; for (int c = 0; c < m[0].length; c++) for (int r = 0; r < m.length; r++) s[c] += m[r][c]; return s; }
    public static void main(String[] a) {}
}
