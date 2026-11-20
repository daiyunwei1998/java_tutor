package tutor;

import java.util.Arrays;

/**
 * Tiny assertion library used by exercise test classes. Messages are written for students (Traditional Chinese).
 */
public final class Check {
    private Check() {}

    public static void isTrue(boolean condition, String message) {
        if (!condition) throw new AssertionError(message);
    }

    public static void equal(int expected, int actual, String what) {
        if (expected != actual) {
            throw new AssertionError(what + ": expected " + expected + ", but got " + actual);
        }
    }

    public static void equal(long expected, long actual, String what) {
        if (expected != actual) {
            throw new AssertionError(what + ": expected " + expected + ", but got " + actual);
        }
    }

    public static void equal(double expected, double actual, double tolerance, String what) {
        if (Math.abs(expected - actual) > tolerance) {
            throw new AssertionError(what + ": expected " + expected + ", but got " + actual);
        }
    }

    public static void equal(Object expected, Object actual, String what) {
        if (expected == null ? actual != null : !expected.equals(actual)) {
            throw new AssertionError(what + ": expected " + expected + ", but got " + actual);
        }
    }

    public static void equal(int[] expected, int[] actual, String what) {
        if (!Arrays.equals(expected, actual)) {
            throw new AssertionError(what + ": expected " + Arrays.toString(expected)
                    + ", but got " + Arrays.toString(actual));
        }
    }

    public static void equal(int[][] expected, int[][] actual, String what) {
        if (!Arrays.deepEquals(expected, actual)) {
            throw new AssertionError(what + ":\n  expected " + Arrays.deepToString(expected)
                    + "\n  but got  " + Arrays.deepToString(actual));
        }
    }

    public static void notSame(Object a, Object b, String message) {
        if (a == b) throw new AssertionError(message);
    }

    public static int[][] copy(int[][] m) {
        if (m == null) return null;
        int[][] c = new int[m.length][];
        for (int i = 0; i < m.length; i++) c[i] = m[i] == null ? null : m[i].clone();
        return c;
    }
}
