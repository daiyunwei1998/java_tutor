import java.util.ArrayList;
import java.util.Arrays;

public class BrightnessFilter extends Filter {

    private int amount;   // what BrightnessFilter itself must remember (Filter already remembers the name)

    public BrightnessFilter(int amount) {
        super("Brightness");
        setAmount(amount);
    }

    public void setAmount(int amount) {
        this.amount = Math.max(-255, Math.min(255, amount));
    }

    public int getAmount() {
        return amount;
    }

    @Override
    public int[][] apply(int[][] img) {
        int[][] out = new int[img.length][];
        for (int r = 0; r < img.length; r++) {
            out[r] = new int[img[r].length];
            for (int c = 0; c < img[r].length; c++) {
                out[r][c] = ImageUtils.clamp(img[r][c] + amount);
            }
        }
        return out;
    }

    /** Press ▶ Run main: the new editor. One list holds every filter, one loop applies them in order. */
    public static void main(String[] args) {
        ArrayList<Filter> stack = new ArrayList<Filter>();
        stack.add(new Filter("Original (does nothing)"));

        stack.add(new BrightnessFilter(40));

        int[][] img = {{100, 150}, {200, 250}};
        for (Filter f : stack) {
            img = f.apply(img);
            System.out.println(f.getName() + " -> " + Arrays.deepToString(img));
        }
    }
}
