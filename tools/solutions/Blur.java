public class Blur {
    public static boolean inBounds(int[][] img, int r, int c) {
        return r >= 0 && r < img.length && c >= 0 && c < img[r].length;
    }
    public static int average3x3(int[][] img, int r, int c) {
        int sum = 0, count = 0;
        for (int dr = -1; dr <= 1; dr++)
            for (int dc = -1; dc <= 1; dc++)
                if (inBounds(img, r + dr, c + dc)) { sum += img[r + dr][c + dc]; count++; }
        return sum / count;
    }
    public static int[][] boxBlur(int[][] img) {
        int[][] out = new int[img.length][];
        for (int r = 0; r < img.length; r++) {
            out[r] = new int[img[r].length];
            for (int c = 0; c < img[r].length; c++) out[r][c] = average3x3(img, r, c);
        }
        return out;
    }
    public static void main(String[] args) {}
}
