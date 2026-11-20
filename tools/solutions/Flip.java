public class Flip {
    public static int[][] flipHorizontal(int[][] img) {
        int[][] out = new int[img.length][];
        for (int r = 0; r < img.length; r++) {
            int cols = img[r].length;
            out[r] = new int[cols];
            for (int c = 0; c < cols; c++) out[r][c] = img[r][cols - 1 - c];
        }
        return out;
    }
    public static int[][] flipVertical(int[][] img) {
        int rows = img.length;
        int[][] out = new int[rows][];
        for (int r = 0; r < rows; r++) {
            int[] src = img[rows - 1 - r];
            out[r] = new int[src.length];
            for (int c = 0; c < src.length; c++) out[r][c] = src[c];
        }
        return out;
    }
    public static void mirrorInPlace(int[][] img) {
        for (int[] row : img) {
            for (int c = 0; c < row.length / 2; c++) {
                int tmp = row[c];
                row[c] = row[row.length - 1 - c];
                row[row.length - 1 - c] = tmp;
            }
        }
    }
    public static void main(String[] args) {}
}
