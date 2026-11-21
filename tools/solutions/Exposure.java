import java.util.Arrays;

public class Exposure {

    /** Returns the sum of all pixels, using enhanced for */
    public static int total(int[][] img) {
        int sum = 0;
        for (int[] row : img) {
            for (int v : row) {        // reading through v is fine
                sum += v;
            }
        }
        return sum;
    }

    /** Adds delta to every pixel (changes img itself) */
    public static void addToAll(int[][] img, int delta) {
        for (int[] row : img) {
            // v in "for (int v : row)" is only a copy of the value, so changing it changes nothing.
            // To change the array, write through an index.
            for (int c = 0; c < row.length; c++) {
                row[c] += delta;
            }
        }
    }

    /** How many pixels are > threshold */
    public static int countAbove(int[][] img, int threshold) {
        int count = 0;
        for (int[] row : img) {
            for (int v : row) {
                if (v > threshold) {
                    count++;
                }
            }
        }
        return count;
    }

    public static void main(String[] args) {
        int[][] img = {{10, 20, 30}, {40, 50, 60}};
        System.out.println("total = " + total(img));
        addToAll(img, 10);
        System.out.println("after +10: " + Arrays.deepToString(img));
        System.out.println("above 45: " + countAbove(img, 45));
    }
}
