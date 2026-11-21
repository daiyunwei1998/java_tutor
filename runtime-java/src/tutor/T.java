package tutor;

import java.io.ByteArrayOutputStream;
import java.lang.reflect.Array;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collection;
import java.util.IdentityHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

/**
 * Recorder for the step-through debugger. Instrumented student code (see {@link Instrument}) calls
 * {@link #enter}/{@link #exit} around every method and {@link #at} before every statement.
 *
 * Once the start line (the student's first breakpoint) is reached, every {@code at} records a snapshot:
 * the call stack with each frame's variables, and every array/object reachable from them. Snapshots use the
 * same JSON shape as the Knowledge Space traces (src/lib/trace.ts), so the same viewer can draw them.
 */
public final class T {
    private T() {}

    static int maxSteps = 1000;
    private static final int MAX_OBJECTS = 60;
    private static final int MAX_ITEMS = 24;
    private static final int MAX_STRING = 60;

    /** Thrown when the step limit is reached; an Error so that student catch (Exception e) blocks don't swallow it. */
    static final class StepLimit extends Error {
        StepLimit() { super("step limit", null, false, false); }
    }

    private static final class Frame {
        final String name;
        final Class<?> owner;
        int file = -1;
        int line;
        String names = "";
        Object[] vals;

        Frame(String name, Class<?> owner) {
            this.name = name;
            this.owner = owner;
        }
    }

    private static ArrayList<Frame> stack = new ArrayList<>();
    private static boolean recording;
    private static boolean busy;
    private static int steps;
    private static StringBuilder out;
    private static IdentityHashMap<Object, Integer> ids;
    private static LinkedHashSet<Class<?>> classes;
    private static ClassLoader userLoader;
    private static ByteArrayOutputStream stdout;

    /**
     * Resets the recorder.
     * @param fromStart record from the very first statement; otherwise recording starts at the first
     *                  breakpoint hit (Instrument passes bp = true, or the breakpoint's condition, on those lines)
     */
    static void reset(boolean fromStart, int limit, ClassLoader loader, ByteArrayOutputStream so) {
        stack = new ArrayList<>();
        recording = fromStart;
        busy = false;
        steps = 0;
        maxSteps = limit;
        out = new StringBuilder();
        ids = new IdentityHashMap<>();
        classes = new LinkedHashSet<>();
        userLoader = loader;
        stdout = so;
    }

    static boolean reached() { return recording; }
    static int steps() { return steps; }
    static String json() { return "[" + out + "]"; }

    // ------------------------------------------------------------------ called by instrumented code

    public static void enter(String name, Class<?> owner) {
        if (stack == null) stack = new ArrayList<>();
        stack.add(new Frame(name, owner));
        if (classes != null && owner != null) classes.add(owner);
    }

    public static void exit() {
        if (stack != null && !stack.isEmpty()) stack.remove(stack.size() - 1);
    }

    public static void at(int file, int line, String names, Object[] vals) {
        at(file, line, names, vals, false);
    }

    /** A statement on a breakpoint line: bp is true, or the value of the breakpoint's condition. */
    public static void at(int file, int line, String names, Object[] vals, boolean bp) {
        if (busy || out == null || stack.isEmpty()) return;
        Frame f = stack.get(stack.size() - 1);
        f.file = file;
        f.line = line;
        f.names = names;
        f.vals = vals;
        if (!recording) {
            if (!bp) return;
            recording = true;
        }
        if (steps >= maxSteps) throw new StepLimit();
        busy = true;
        try {
            record(file, line, bp);
        } finally {
            busy = false;
        }
    }

    /** Same as {@link #at}, used inside loop conditions: {@code while (T.check(..) && (i < n))}. */
    public static boolean check(int file, int line, String names, Object[] vals) {
        at(file, line, names, vals, false);
        return true;
    }

    public static boolean check(int file, int line, String names, Object[] vals, boolean bp) {
        at(file, line, names, vals, bp);
        return true;
    }

    // ------------------------------------------------------------------ snapshots

    /** The final "program finished" step: no frames, only static fields. */
    static void finish() {
        if (!recording || out == null) return;
        stack = new ArrayList<>();
        busy = true;
        try {
            record(-1, 0, false);
        } finally {
            busy = false;
        }
    }

    private static void record(int file, int line, boolean bp) {
        Snap s = new Snap();
        StringBuilder frames = new StringBuilder();
        boolean first = true;
        for (Class<?> c : classes) {
            String vars = s.statics(c);
            if (vars == null) continue;
            if (!first) frames.append(',');
            first = false;
            frames.append("{\"name\":").append(Json.str(simpleName(c) + " (static)")).append(",\"static\":true,\"vars\":[").append(vars).append("]}");
        }
        for (Frame f : stack) {
            if (!first) frames.append(',');
            first = false;
            frames.append("{\"name\":").append(Json.str(f.name)).append(",\"file\":").append(f.file).append(",\"line\":").append(f.line).append(",\"vars\":[");
            if (f.vals != null) {
                String[] names = f.names.split(",");
                for (int i = 0; i < f.vals.length && i < names.length; i++) {
                    if (i > 0) frames.append(',');
                    frames.append("{\"name\":").append(Json.str(names[i])).append(",\"v\":").append(s.val(f.vals[i])).append('}');
                }
            }
            frames.append("]}");
        }
        String heap = s.heap();
        if (steps > 0) out.append(',');
        out.append("{\"file\":").append(file).append(",\"line\":").append(line).append(bp ? ",\"bp\":true" : "")
                .append(",\"outBytes\":").append(stdout == null ? 0 : stdout.size())
                .append(",\"frames\":[").append(frames).append("],\"heap\":[").append(heap).append("]}");
        steps++;
    }

    private static String simpleName(Class<?> c) {
        String n = c.getName();
        return n.substring(n.lastIndexOf('.') + 1).replace('$', '.');
    }

    private static boolean isUser(Class<?> c) {
        return c != null && userLoader != null && c.getClassLoader() == userLoader;
    }

    /** One snapshot: values are written as JSON; referenced objects are queued and written afterwards. */
    private static final class Snap {
        final ArrayDeque<Object> queue = new ArrayDeque<>();
        final IdentityHashMap<Object, Boolean> queued = new IdentityHashMap<>();

        String statics(Class<?> c) {
            StringBuilder sb = new StringBuilder();
            int n = 0;
            try {
                for (Field f : c.getDeclaredFields()) {
                    int m = f.getModifiers();
                    if (!Modifier.isStatic(m) || f.isSynthetic()) continue;
                    // constants (static final numbers / strings) never change; leave them out
                    if (Modifier.isFinal(m) && (f.getType().isPrimitive() || f.getType() == String.class)) continue;
                    f.setAccessible(true);
                    if (n++ > 0) sb.append(',');
                    sb.append("{\"name\":").append(Json.str(f.getName())).append(",\"v\":").append(val(f.get(null))).append('}');
                }
            } catch (Throwable t) {
                return null;
            }
            return n == 0 ? null : sb.toString();
        }

        String val(Object o) {
            if (o == null) return "{\"t\":\"null\"}";
            String p = primitive(o);
            if (p != null) return "{\"t\":\"p\",\"v\":" + Json.str(p) + "}";
            if (!queued.containsKey(o)) {
                if (queued.size() >= MAX_OBJECTS) return "{\"t\":\"p\",\"v\":\"…\"}";
                queued.put(o, Boolean.TRUE);
                queue.add(o);
            }
            return "{\"t\":\"r\",\"id\":\"#" + id(o) + "\"}";
        }

        String primitive(Object o) {
            if (o instanceof String) return quote((String) o, '"');
            if (o instanceof Character) return quote(String.valueOf(o), '\'');
            if (o instanceof Number || o instanceof Boolean) return String.valueOf(o);
            if (o instanceof Enum) return ((Enum<?>) o).name();
            if (o instanceof Class) return ((Class<?>) o).getSimpleName() + ".class";
            return null;
        }

        String heap() {
            StringBuilder sb = new StringBuilder();
            boolean first = true;
            while (!queue.isEmpty()) {
                Object o = queue.poll();
                if (!first) sb.append(',');
                first = false;
                sb.append(obj(o));
            }
            return sb.toString();
        }

        private String obj(Object o) {
            String head = "{\"id\":\"#" + id(o) + "\",";
            Class<?> c = o.getClass();
            if (c.isArray()) {
                int len = Array.getLength(o);
                StringBuilder items = new StringBuilder();
                for (int i = 0; i < len && i < MAX_ITEMS; i++) {
                    if (i > 0) items.append(',');
                    items.append(val(Array.get(o, i)));
                }
                if (len > MAX_ITEMS) items.append(",{\"t\":\"p\",\"v\":").append(Json.str("… " + (len - MAX_ITEMS) + " more")).append('}');
                return head + "\"kind\":\"array\",\"type\":" + Json.str(arrayType(c)) + ",\"length\":" + len + ",\"items\":[" + items + "]}";
            }
            if (o instanceof Collection && !isUser(c)) {
                StringBuilder items = new StringBuilder();
                int i = 0;
                int len = ((Collection<?>) o).size();
                try {
                    for (Object x : (Collection<?>) o) {
                        if (i >= MAX_ITEMS) break;
                        if (i++ > 0) items.append(',');
                        items.append(val(x));
                    }
                } catch (RuntimeException e) {
                    // modified while we looked (should not happen between statements)
                }
                if (len > MAX_ITEMS) items.append(",{\"t\":\"p\",\"v\":").append(Json.str("… " + (len - MAX_ITEMS) + " more")).append('}');
                return head + "\"kind\":\"array\",\"type\":" + Json.str(c.getSimpleName()) + ",\"length\":" + len + ",\"items\":[" + items + "]}";
            }
            StringBuilder fields = new StringBuilder();
            int n = 0;
            if (o instanceof Map && !isUser(c)) {
                try {
                    for (Map.Entry<?, ?> e : ((Map<?, ?>) o).entrySet()) {
                        if (n >= MAX_ITEMS) break;
                        Object k = e.getKey();
                        String kp = k == null ? "null" : primitive(k);
                        if (n++ > 0) fields.append(',');
                        fields.append("{\"name\":").append(Json.str(kp != null ? kp : "key " + (n))).append(",\"v\":").append(val(e.getValue())).append('}');
                    }
                } catch (RuntimeException e) {
                    // ignore
                }
            } else if (o instanceof CharSequence) {
                fields.append("{\"name\":\"text\",\"v\":{\"t\":\"p\",\"v\":").append(Json.str(quote(o.toString(), '"'))).append("}}");
            } else if (isUser(c)) {
                List<Class<?>> chain = new ArrayList<>();
                for (Class<?> k = c; k != null && isUser(k); k = k.getSuperclass()) chain.add(0, k);
                for (Class<?> k : chain) {
                    for (Field f : k.getDeclaredFields()) {
                        if (Modifier.isStatic(f.getModifiers()) || f.isSynthetic()) continue;
                        try {
                            f.setAccessible(true);
                            Object v = f.get(o);
                            if (n++ > 0) fields.append(',');
                            fields.append("{\"name\":").append(Json.str(f.getName())).append(",\"v\":").append(val(v)).append('}');
                        } catch (Throwable t) {
                            // inaccessible field: skip
                        }
                    }
                }
            }
            return head + "\"kind\":\"object\",\"type\":" + Json.str(simpleName(c)) + ",\"fields\":[" + fields + "]}";
        }
    }

    private static int id(Object o) {
        Integer i = ids.get(o);
        if (i == null) {
            i = ids.size() + 1;
            ids.put(o, i);
        }
        return i;
    }

    private static String arrayType(Class<?> c) {
        int dims = 0;
        while (c.isArray()) {
            dims++;
            c = c.getComponentType();
        }
        StringBuilder sb = new StringBuilder(simpleName(c));
        for (int i = 0; i < dims; i++) sb.append("[]");
        return sb.toString();
    }

    private static String quote(String s, char q) {
        StringBuilder sb = new StringBuilder().append(q);
        int n = Math.min(s.length(), MAX_STRING);
        for (int i = 0; i < n; i++) {
            char ch = s.charAt(i);
            if (ch == '\n') sb.append("\\n");
            else if (ch == '\t') sb.append("\\t");
            else if (ch == '\0') sb.append("\\0");
            else sb.append(ch);
        }
        if (s.length() > MAX_STRING) sb.append('…');
        return sb.append(q).toString();
    }
}
