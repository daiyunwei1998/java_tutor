import java.util.ArrayList;
import java.util.Arrays;

/** Invert (negative) filter: every pixel becomes 255 - its value. */
public class InvertFilter extends Filter {

    public InvertFilter() {
        super("Invert");
    }

    @Override
    public int[][] apply(int[][] img) {
        int[][] out = new int[img.length][];
        for (int r = 0; r < img.length; r++) {
            out[r] = new int[img[r].length];
            for (int c = 0; c < img[r].length; c++) {
                out[r][c] = 255 - img[r][c];
            }
        }
        return out;
    }

    /** The editor's pipeline. It only knows one thing: every Filter has apply(int[][] img). */
    public static void main(String[] args) {
        ArrayList<Filter> stack = new ArrayList<Filter>();
        stack.add(new InvertFilter());

        int[][] img = {{0, 100}, {200, 255}};
        System.out.println("original:     " + Arrays.deepToString(img));
        for (Filter f : stack) {
            img = f.apply(img);
            System.out.println("after " + f.getName() + ": " + Arrays.deepToString(img));
        }
    }
}
