import java.util.ArrayList;
import java.util.Arrays;

/**
 * One "brightness adjustment" in the filter stack.
 * Each BrightnessAdjust object must remember its own amount,
 * so when the user changes a setting later, only that object changes.
 */
public class BrightnessAdjust {

    private int amount;

    /** A new object must start valid: the amount goes through setAmount's range rule too. */
    public BrightnessAdjust(int amount) {
        setAmount(amount);
    }

    /** The only place that changes amount: keep it in -255..255. */
    public void setAmount(int amount) {
        this.amount = Math.max(-255, Math.min(255, amount));
    }

    public int getAmount() {
        return amount;
    }

    /**
     * Adjusts brightness with THIS object's own amount and returns a new image.
     * No amount parameter needed: the object remembers it. Do not modify img.
     */
    public int[][] apply(int[][] img) {
        int[][] out = new int[img.length][];
        for (int r = 0; r < img.length; r++) {
            out[r] = new int[img[r].length];
            for (int c = 0; c < img[r].length; c++) {
                out[r][c] = clamp(img[r][c] + amount);
            }
        }
        return out;
    }

    /** Needs no object data, so it is static. */
    public static int clamp(int v) {
        return Math.max(0, Math.min(255, v));
    }

    /** Press ▶ Run main: the new filter stack. One list, and each adjustment carries its own setting. */
    public static void main(String[] args) {
        int[][] original = {{100, 150}, {200, 250}};

        ArrayList<BrightnessAdjust> stack = new ArrayList<BrightnessAdjust>();
        stack.add(new BrightnessAdjust(20));
        stack.add(new BrightnessAdjust(-50));

        // The user changes the first adjustment from +20 to +35: only that one object changes.
        stack.get(0).setAmount(35);

        int[][] img = original;
        for (BrightnessAdjust adj : stack) {
            img = adj.apply(img);
            System.out.println("after " + adj.getAmount() + ": " + Arrays.deepToString(img));
        }
        System.out.println("original is untouched: " + Arrays.deepToString(original));
    }
}
