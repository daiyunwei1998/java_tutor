package tutor;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.PrintStream;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.net.URL;
import java.net.URLClassLoader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Entry points called from JavaScript (CheerpJ library mode) or from the command line (for local testing).
 * Every method returns a JSON string so the browser side never has to deal with Java objects.
 */
public final class Bridge {
    private static final int MAX_OUTPUT = 64 * 1024;

    private Bridge() {}

    /** Compiles the given space-separated source files (relative to srcDir) into outDir with ecj. */
    public static String compile(String srcDir, String outDir, String files, String extraClasspath) {
        return compile(srcDir, outDir, files, extraClasspath, "");
    }

    /**
     * @param bootClasspath jar with the JDK API classes. Needed in the browser (CheerpJ has no jrt:/ module image
     *                      for ecj to read), in which case we compile at Java 8 language level against that jar.
     *                      Empty = use the running JDK (local testing).
     */
    /** Writes a UTF-8 text file (creating parent folders). Used by the browser runner for student sources. */
    public static boolean writeFile(String path, String content) {
        try {
            File f = new File(path);
            File parent = f.getParentFile();
            if (parent != null) parent.mkdirs();
            java.nio.file.Files.write(f.toPath(), content.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public static String compile(String srcDir, String outDir, String files, String extraClasspath, String bootClasspath) {
        StringWriter out = new StringWriter();
        StringWriter err = new StringWriter();
        List<String> args = new ArrayList<>();
        if (bootClasspath != null && !bootClasspath.isEmpty()) {
            args.addAll(Arrays.asList("-8", "-bootclasspath", bootClasspath));
        } else {
            args.add("-11");
        }
        args.addAll(Arrays.asList("-g", "-proc:none", "-encoding", "UTF-8", "-nowarn", "-d", outDir,
                "-cp", extraClasspath == null ? "" : extraClasspath));
        for (String f : files.trim().split("\\s+")) {
            if (!f.isEmpty()) args.add(srcDir + f);
        }
        boolean ok;
        try {
            ok = org.eclipse.jdt.core.compiler.batch.BatchCompiler.compile(
                    args.toArray(new String[0]), new PrintWriter(out), new PrintWriter(err), null);
        } catch (Throwable t) {
            return "{\"ok\":false,\"diagnostics\":" + Json.str("Compiler crashed: " + stackTrace(t)) + "}";
        }
        String diag = (out.toString() + err.toString()).replace(srcDir, "");
        return "{\"ok\":" + ok + ",\"diagnostics\":" + Json.str(diag) + "}";
    }

    /** Runs mainClass.main(new String[0]) from classDir, capturing stdout/stderr. */
    public static String run(String classDir, String mainClass) {
        Capture cap = Capture.start();
        String status = "completed";
        try {
            Class<?> c = load(classDir, mainClass);
            Method m = c.getMethod("main", String[].class);
            m.invoke(null, (Object) new String[0]);
        } catch (InvocationTargetException e) {
            status = "runtime_error";
            cap.err.print(userStackTrace(e.getCause()));
        } catch (NoSuchMethodException e) {
            status = "runtime_error";
            cap.err.print("找不到 public static void main(String[] args)：" + mainClass);
        } catch (Throwable t) {
            status = "runtime_error";
            cap.err.print(userStackTrace(t));
        } finally {
            cap.stop();
        }
        return "{\"status\":" + Json.str(status) + ",\"stdout\":" + Json.str(cap.stdout())
                + ",\"stderr\":" + Json.str(cap.stderr()) + "}";
    }

    /**
     * Runs every public static no-arg method whose name starts with "test" in testClass.
     * Each test is isolated: an exception in one test does not stop the others.
     */
    public static String runTests(String classDir, String testClass) {
        Capture cap = Capture.start();
        StringBuilder tests = new StringBuilder("[");
        String status = "completed";
        try {
            Class<?> c = load(classDir, testClass);
            List<Method> methods = new ArrayList<>();
            for (Method m : c.getDeclaredMethods()) {
                if (m.getName().startsWith("test") && Modifier.isStatic(m.getModifiers())
                        && m.getParameterCount() == 0) {
                    methods.add(m);
                }
            }
            methods.sort((a, b) -> a.getName().compareTo(b.getName()));
            boolean first = true;
            for (Method m : methods) {
                m.setAccessible(true);
                boolean passed;
                String message;
                try {
                    m.invoke(null);
                    passed = true;
                    message = "";
                } catch (InvocationTargetException e) {
                    Throwable cause = e.getCause();
                    passed = false;
                    if (cause instanceof AssertionError) {
                        message = String.valueOf(cause.getMessage());
                    } else {
                        message = userStackTrace(cause);
                    }
                }
                if (!first) tests.append(',');
                first = false;
                tests.append("{\"name\":").append(Json.str(m.getName()))
                        .append(",\"passed\":").append(passed)
                        .append(",\"message\":").append(Json.str(message)).append('}');
            }
        } catch (Throwable t) {
            status = "runtime_error";
            cap.err.print(userStackTrace(t));
        } finally {
            cap.stop();
        }
        tests.append(']');
        return "{\"status\":" + Json.str(status) + ",\"stdout\":" + Json.str(cap.stdout())
                + ",\"stderr\":" + Json.str(cap.stderr()) + ",\"tests\":" + tests + "}";
    }

    private static Class<?> load(String classDir, String name) throws Exception {
        File dir = new File(classDir);
        URLClassLoader loader = new URLClassLoader(new URL[] {dir.toURI().toURL()}, Bridge.class.getClassLoader());
        return Class.forName(name, true, loader);
    }

    private static String stackTrace(Throwable t) {
        StringWriter sw = new StringWriter();
        t.printStackTrace(new PrintWriter(sw));
        return sw.toString();
    }

    /** Stack trace without the reflection / bridge frames that would only confuse students. */
    static String userStackTrace(Throwable t) {
        StringBuilder sb = new StringBuilder();
        Throwable cur = t;
        int depth = 0;
        while (cur != null && depth < 3) {
            if (depth > 0) sb.append("Caused by: ");
            sb.append(cur.getClass().getName());
            if (cur.getMessage() != null) sb.append(": ").append(cur.getMessage());
            sb.append('\n');
            for (StackTraceElement e : cur.getStackTrace()) {
                String cls = e.getClassName();
                if (cls.startsWith("tutor.") || cls.startsWith("java.") || cls.startsWith("jdk.")
                        || cls.startsWith("sun.")) {
                    continue;
                }
                sb.append("\tat ").append(e).append('\n');
            }
            cur = cur.getCause();
            depth++;
        }
        return sb.toString();
    }

    /** Swaps System.out / System.err for size-limited buffers while user code runs. */
    private static final class Capture {
        final PrintStream oldOut = System.out;
        final PrintStream oldErr = System.err;
        final LimitedStream outBuf = new LimitedStream();
        final LimitedStream errBuf = new LimitedStream();
        PrintStream out;
        PrintStream err;

        static Capture start() {
            Capture c = new Capture();
            try {
                c.out = new PrintStream(c.outBuf, true, "UTF-8");
                c.err = new PrintStream(c.errBuf, true, "UTF-8");
            } catch (java.io.UnsupportedEncodingException e) {
                throw new IllegalStateException(e);
            }
            System.setOut(c.out);
            System.setErr(c.err);
            return c;
        }

        void stop() {
            out.flush();
            err.flush();
            System.setOut(oldOut);
            System.setErr(oldErr);
        }

        String stdout() { return outBuf.text(); }
        String stderr() { return errBuf.text(); }
    }

    private static final class LimitedStream extends ByteArrayOutputStream {
        boolean truncated;

        @Override
        public synchronized void write(int b) {
            if (count >= MAX_OUTPUT) { truncated = true; return; }
            super.write(b);
        }

        @Override
        public synchronized void write(byte[] b, int off, int len) {
            int room = MAX_OUTPUT - count;
            if (room <= 0) { truncated = true; return; }
            if (len > room) { truncated = true; len = room; }
            super.write(b, off, len);
        }

        String text() {
            String s;
            try {
                s = toString("UTF-8");
            } catch (java.io.UnsupportedEncodingException e) {
                s = toString();
            }
            return truncated ? s + "\n…（輸出超過 64KB，已截斷）" : s;
        }
    }

    /** Command-line entry for local testing: compile|run|test. */
    public static void main(String[] args) {
        PrintStream real = System.out;
        switch (args[0]) {
            case "compile": real.println(compile(args[1], args[2], args[3], args.length > 4 ? args[4] : "", args.length > 5 ? args[5] : "")); break;
            case "run": real.println(run(args[1], args[2])); break;
            case "test": real.println(runTests(args[1], args[2])); break;
            default: real.println("usage: compile|run|test");
        }
    }
}
