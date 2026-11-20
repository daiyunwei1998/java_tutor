public class Pipeline {
    static String name(String step) {
        int space = step.indexOf(' ');
        return space < 0 ? step : step.substring(0, space);
    }
    static int amount(String step) {
        int space = step.indexOf(' ');
        return Integer.parseInt(step.substring(space + 1).trim());
    }
    public static int[][] copy(int[][] img) {
        int[][] out = new int[img.length][];
        for (int r = 0; r < img.length; r++) out[r] = img[r].clone();
        return out;
    }
    public static int[][] applyStep(int[][] img, String step) {
        String n = name(step);
        if (n.equals("invert")) return Ops.invert(img);
        if (n.equals("threshold")) return Ops.threshold(img, amount(step));
        if (n.equals("darken")) {
            int[][] out = copy(img);
            Ops.darkenInPlace(out, amount(step));
            return out;
        }
        throw new IllegalArgumentException("unknown step: " + step);
    }
    public static int[][] run(int[][] img, String[] steps) {
        int[][] current = copy(img);
        for (String s : steps) current = applyStep(current, s);
        return current;
    }
    public static int[][][] history(int[][] img, String[] steps) {
        int[][][] frames = new int[steps.length + 1][][];
        frames[0] = copy(img);
        for (int k = 0; k < steps.length; k++) frames[k + 1] = applyStep(frames[k], steps[k]);
        return frames;
    }
    public static void main(String[] args) {}
}
