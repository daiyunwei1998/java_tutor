public class Edges {
    static final int[][] GX = {{-1, 0, 1}, {-2, 0, 2}, {-1, 0, 1}};
    static final int[][] GY = {{-1, -2, -1}, {0, 0, 0}, {1, 2, 1}};
    public static int applyKernel(int[][] img, int r, int c, int[][] kernel) {
        int sum = 0;
        for (int i = 0; i < 3; i++)
            for (int j = 0; j < 3; j++) sum += kernel[i][j] * img[r - 1 + i][c - 1 + j];
        return sum;
    }
    public static int magnitude(int gx, int gy) {
        return Math.min(255, (int) Math.round(Math.sqrt(gx * gx + gy * gy)));
    }
    public static int[][] edges(int[][] img) {
        int rows = img.length, cols = img[0].length;
        int[][] out = new int[rows][cols];
        for (int r = 1; r < rows - 1; r++)
            for (int c = 1; c < cols - 1; c++)
                out[r][c] = magnitude(applyKernel(img, r, c, GX), applyKernel(img, r, c, GY));
        return out;
    }
    public static void main(String[] args) {}
}
