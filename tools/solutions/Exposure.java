public class Exposure {
    public static int total(int[][] img) { int s = 0; for (int[] row : img) for (int v : row) s += v; return s; }
    public static void addToAll(int[][] img, int d) { for (int[] row : img) for (int c = 0; c < row.length; c++) row[c] += d; }
    public static int countAbove(int[][] img, int t) { int n = 0; for (int[] row : img) for (int v : row) if (v > t) n++; return n; }
    public static void main(String[] a) {}
}
