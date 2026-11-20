public class MatrixTools {
    public static int mainDiagonalSum(int[][] m) { int s = 0; for (int i = 0; i < m.length; i++) s += m[i][i]; return s; }
    public static int antiDiagonalSum(int[][] m) { int s = 0; for (int i = 0; i < m.length; i++) s += m[i][m.length - 1 - i]; return s; }
    public static int[][] transpose(int[][] m) { int[][] t = new int[m[0].length][m.length]; for (int r = 0; r < m.length; r++) for (int c = 0; c < m[0].length; c++) t[c][r] = m[r][c]; return t; }
    public static void main(String[] a) {}
}
