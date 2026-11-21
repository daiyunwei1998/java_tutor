import java.util.Arrays;

public class Pipeline {

    /** Name of a step: "threshold 128" -> "threshold". (Already done.) */
    static String name(String step) {
        int space = step.indexOf(' ');
        return space < 0 ? step : step.substring(0, space);
    }

    /** Number of a step: "threshold 128" -> 128. (Already done.) */
    static int amount(String step) {
        int space = step.indexOf(' ');
        return Integer.parseInt(step.substring(space + 1).trim());
    }

    /** Deep copy: a new outer array and a new array for every row. */
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

    /**
     * Applies one step and returns a new image. img is never changed.
     * Steps: "invert", "threshold N" (Ops.threshold), "darken N" (Ops.darkenInPlace on a copy).
     * Any other name: throw IllegalArgumentException.
     */
    public static int[][] applyStep(int[][] img, String step) {
        String n = name(step);
        if (n.equals("invert")) {
            return Ops.invert(img);
        } else if (n.equals("threshold")) {
            return Ops.threshold(img, amount(step));
        } else if (n.equals("darken")) {
            int[][] out = copy(img);              // the legacy method changes its argument: give it a copy
            Ops.darkenInPlace(out, amount(step));
            return out;
        } else {
            throw new IllegalArgumentException("unknown step: " + step);
        }
    }

    /** Applies every step in order. With no steps, returns a copy of img. */
    public static int[][] run(int[][] img, String[] steps) {
        int[][] current = copy(img);
        for (String step : steps) {
            current = applyStep(current, step);   // each output is the next input
        }
        return current;
    }

    /** frames[0] = copy of img, frames[k] = image after step k. */
    public static int[][][] history(int[][] img, String[] steps) {
        int[][][] frames = new int[steps.length + 1][][];
        frames[0] = copy(img);
        for (int k = 0; k < steps.length; k++) {
            frames[k + 1] = applyStep(frames[k], steps[k]);
        }
        return frames;
    }

    public static void main(String[] args) {
        int[][] img = {
            {10, 120, 200},
            {60, 130, 250}
        };
        String[] preset = {"darken 20", "threshold 100", "invert"};
        System.out.println("result   = " + Arrays.deepToString(run(img, preset)));
        System.out.println("original = " + Arrays.deepToString(img));
        System.out.println("frames   = " + history(img, preset).length);
    }
}
