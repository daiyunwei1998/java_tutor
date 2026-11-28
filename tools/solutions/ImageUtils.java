public class ImageUtils {

    public static int[][] copy(int[][] img) {
        int[][] out = new int[img.length][];
        for (int r = 0; r < img.length; r++) {
            out[r] = new int[img[r].length];
            for (int c = 0; c < img[r].length; c++) {
                out[r][c] = img[r][c];
            }
        }
        return out;
    }

    public static void main(String[] args) {
        int[][] img = {{10, 20, 30}, {40, 50, 60}};
        int[][] original = copy(img);
        img[0][0] = 255;
        System.out.println("img[0][0]      = " + img[0][0]);
        System.out.println("original[0][0] = " + original[0][0]);
    }
}
