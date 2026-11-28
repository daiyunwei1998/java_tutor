import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Pixel Arena preview harness (hidden from students). Builds the world with Arena.setup(), replays the
 * actions the student clicked (one per line in /files/data/game-actions.txt), then prints the world as JSON.
 * It reads object state only the way outside code can: public fields and public getters. Private fields
 * without a getter are reported as unreadable on purpose.
 */
public class GameBridge {
    static final String ACTIONS = "/files/data/game-actions.txt";
    static PrintStream realOut = System.out;

    public static void main(String[] args) throws Exception {
        StringBuilder results = new StringBuilder("[");
        List<Object> world = new ArrayList<Object>();
        String setupError = null;
        String setupOut = "";
        ByteArrayOutputStream buf = new ByteArrayOutputStream();
        System.setOut(new PrintStream(buf, true, "UTF-8"));
        try {
            Method setup = Class.forName("Arena").getMethod("setup");
            Object w = setup.invoke(null);
            if (w instanceof List) for (Object o : (List<?>) w) world.add(o);
            else if (w instanceof Object[]) for (Object o : (Object[]) w) world.add(o);
        } catch (InvocationTargetException e) {
            setupError = describe(e.getCause());
        } catch (Throwable t) {
            setupError = describe(t);
        }
        setupOut = buf.toString("UTF-8");
        List<String> lines = new ArrayList<String>();
        File file = new File(ACTIONS);
        if (file.exists()) {
            BufferedReader in = new BufferedReader(new InputStreamReader(new FileInputStream(file), "UTF-8"));
            for (String l = in.readLine(); l != null; l = in.readLine()) lines.add(l);
            in.close();
        }
        boolean first = true;
        for (String line : lines) {
            if (line.trim().isEmpty()) continue;
            buf.reset();
            String r = act(world, line);
            String out = buf.toString("UTF-8");
            if (!first) results.append(',');
            first = false;
            results.append("{\"action\":").append(str(line)).append(',').append(r).append(",\"out\":").append(str(out)).append('}');
        }
        results.append(']');
        // Reading state may call student getters; their printing must not end up in the speech bubbles.
        buf.reset();
        String state = worldJson(world);
        System.setOut(realOut);
        realOut.println("@@GAME" + "{\"setupError\":" + str(setupError) + ",\"setupOut\":" + str(setupOut)
            + ",\"results\":" + results + "," + state + "}" + "@@END");
    }

    // ---------------- actions ----------------
    // Format: index|kind|name|args   kind = call | set | tryset ; args separated by \u001f, each "i:5", "s:text", "o:2", "d:1.5", "b:true"
    static String act(List<Object> world, String line) {
        String[] parts = line.split("\\|", -1);
        try {
            int idx = Integer.parseInt(parts[0]);
            String kind = parts[1], name = parts[2];
            Object target = world.get(idx);
            String[] raw = parts.length > 3 && !parts[3].isEmpty() ? parts[3].split("\u001f", -1) : new String[0];
            if (kind.equals("set") || kind.equals("tryset")) {
                Field f = findField(target.getClass(), name);
                if (f == null) return err("There is no field called " + name + ".");
                if (!Modifier.isPublic(f.getModifiers())) {
                    return err(name + " is " + access(f.getModifiers()) + ": code outside " + f.getDeclaringClass().getSimpleName()
                        + " cannot change it. (In your own code, the compiler would say: The field "
                        + f.getDeclaringClass().getSimpleName() + "." + name + " is not visible.)");
                }
                Object v = parse(raw.length > 0 ? raw[0] : "", f.getType(), world);
                f.set(target, v);
                return "\"ok\":true,\"result\":" + str(name + " = " + show(v));
            }
            Method m = findMethod(target.getClass(), name, raw, world);
            if (m == null) return err("No public method " + name + " that takes " + raw.length + " argument(s).");
            Class<?>[] types = m.getParameterTypes();
            Object[] vals = new Object[types.length];
            for (int i = 0; i < types.length; i++) vals[i] = parse(raw[i], types[i], world);
            Object ret;
            try {
                ret = m.invoke(Modifier.isStatic(m.getModifiers()) ? null : target, vals);
            } catch (InvocationTargetException e) {
                return err(describe(e.getCause()));
            }
            String shown = m.getReturnType() == void.class ? null : show(ret);
            return "\"ok\":true,\"result\":" + str(shown);
        } catch (Throwable t) {
            return err(describe(t));
        }
    }

    static Field findField(Class<?> c, String name) {
        for (Class<?> k = c; k != null && k != Object.class; k = k.getSuperclass()) {
            try { return k.getDeclaredField(name); } catch (NoSuchFieldException e) { /* look in the superclass */ }
        }
        return null;
    }

    static Method findMethod(Class<?> c, String name, String[] raw, List<Object> world) {
        for (Method m : c.getMethods()) {
            if (!m.getName().equals(name) || m.getParameterCount() != raw.length || m.getDeclaringClass() == Object.class) continue;
            boolean ok = true;
            Class<?>[] t = m.getParameterTypes();
            for (int i = 0; i < t.length && ok; i++) ok = fits(raw[i], t[i], world);
            if (ok) return m;
        }
        return null;
    }

    static boolean fits(String raw, Class<?> t, List<Object> world) {
        char k = raw.isEmpty() ? '?' : raw.charAt(0);
        if (t == int.class || t == Integer.class || t == long.class || t == short.class) return k == 'i';
        if (t == double.class || t == Double.class || t == float.class) return k == 'd' || k == 'i';
        if (t == boolean.class || t == Boolean.class) return k == 'b';
        if (t == String.class) return k == 's';
        if (k == 'o') {
            int i = Integer.parseInt(raw.substring(2));
            return i >= 0 && i < world.size() && t.isInstance(world.get(i));
        }
        return false;
    }

    static Object parse(String raw, Class<?> t, List<Object> world) {
        String v = raw.length() >= 2 ? raw.substring(2) : "";
        if (t == int.class || t == Integer.class) return Integer.parseInt(v.trim());
        if (t == long.class) return Long.parseLong(v.trim());
        if (t == short.class) return Short.parseShort(v.trim());
        if (t == double.class || t == Double.class) return Double.parseDouble(v.trim());
        if (t == float.class) return Float.parseFloat(v.trim());
        if (t == boolean.class || t == Boolean.class) return Boolean.parseBoolean(v.trim());
        if (t == String.class) return v;
        if (raw.startsWith("o:")) return world.get(Integer.parseInt(v));
        throw new IllegalArgumentException("Cannot pass a value of type " + t.getSimpleName() + " from the preview.");
    }

    static String err(String msg) { return "\"ok\":false,\"error\":" + str(msg); }

    static String describe(Throwable t) {
        String n = t.getClass().getSimpleName();
        return t.getMessage() == null ? n : n + ": " + t.getMessage();
    }

    // ---------------- world state ----------------
    static String worldJson(List<Object> world) {
        Set<Class<?>> classes = new LinkedHashSet<Class<?>>();
        StringBuilder objs = new StringBuilder("[");
        for (int i = 0; i < world.size(); i++) {
            Object o = world.get(i);
            if (i > 0) objs.append(',');
            if (o == null) { objs.append("null"); continue; }
            for (Class<?> k = o.getClass(); k != null && k != Object.class; k = k.getSuperclass()) classes.add(k);
            objs.append("{\"cls\":").append(str(o.getClass().getSimpleName()))
                .append(",\"chain\":").append(chain(o.getClass()))
                .append(",\"props\":").append(props(o))
                .append(",\"str\":").append(str(safeToString(o))).append('}');
        }
        objs.append(']');
        StringBuilder cls = new StringBuilder("[");
        boolean first = true;
        for (Class<?> c : classes) {
            if (!first) cls.append(',');
            first = false;
            cls.append(classJson(c));
        }
        cls.append(']');
        return "\"objects\":" + objs + ",\"classes\":" + cls;
    }

    static String chain(Class<?> c) {
        StringBuilder sb = new StringBuilder("[");
        boolean first = true;
        for (Class<?> k = c; k != null; k = k.getSuperclass()) {
            if (!first) sb.append(',');
            first = false;
            sb.append(str(k.getSimpleName()));
        }
        return sb.append(']').toString();
    }

    static String safeToString(Object o) {
        try {
            Method m = o.getClass().getMethod("toString");
            if (m.getDeclaringClass() == Object.class) return null;
            return String.valueOf(o);
        } catch (Throwable t) {
            return null;
        }
    }

    /** Every field of the object, with its value if outside code could read it (public field or public getter). */
    static String props(Object o) {
        StringBuilder sb = new StringBuilder("[");
        boolean first = true;
        Set<String> seen = new LinkedHashSet<String>();
        for (Class<?> k = o.getClass(); k != null && k != Object.class; k = k.getSuperclass()) {
            for (Field f : k.getDeclaredFields()) {
                if (Modifier.isStatic(f.getModifiers()) || f.isSynthetic() || !seen.add(f.getName())) continue;
                String via = null;
                Object v = null;
                boolean readable = false;
                if (Modifier.isPublic(f.getModifiers())) {
                    try { v = f.get(o); readable = true; via = "field"; } catch (Throwable t) { /* not readable */ }
                }
                if (!readable) {
                    Method g = getter(o.getClass(), f.getName(), f.getType());
                    if (g != null) {
                        try { v = g.invoke(o); readable = true; via = g.getName() + "()"; } catch (Throwable t) { /* getter threw */ }
                    }
                }
                if (!first) sb.append(',');
                first = false;
                sb.append("{\"name\":").append(str(f.getName()))
                    .append(",\"type\":").append(str(f.getType().getSimpleName()))
                    .append(",\"access\":").append(str(access(f.getModifiers())))
                    .append(",\"declaredIn\":").append(str(k.getSimpleName()))
                    .append(",\"readable\":").append(readable)
                    .append(",\"via\":").append(str(via))
                    .append(",\"value\":").append(readable ? jsonValue(v) : "null").append('}');
            }
        }
        return sb.append(']').toString();
    }

    static Method getter(Class<?> c, String field, Class<?> type) {
        String cap = Character.toUpperCase(field.charAt(0)) + field.substring(1);
        for (String n : new String[] {"get" + cap, "is" + cap}) {
            try {
                Method m = c.getMethod(n);
                if (!Modifier.isStatic(m.getModifiers())) return m;
            } catch (NoSuchMethodException e) { /* try the next name */ }
        }
        return null;
    }

    static String classJson(Class<?> c) {
        StringBuilder f = new StringBuilder("[");
        boolean first = true;
        for (Field x : c.getDeclaredFields()) {
            if (x.isSynthetic()) continue;
            if (!first) f.append(',');
            first = false;
            String value = "null";
            if (Modifier.isStatic(x.getModifiers()) && Modifier.isPublic(x.getModifiers())) {
                try { value = jsonValue(x.get(null)); } catch (Throwable t) { /* unreadable */ }
            }
            f.append("{\"name\":").append(str(x.getName())).append(",\"type\":").append(str(x.getType().getSimpleName()))
                .append(",\"access\":").append(str(access(x.getModifiers())))
                .append(",\"static\":").append(Modifier.isStatic(x.getModifiers()))
                .append(",\"final\":").append(Modifier.isFinal(x.getModifiers()))
                .append(",\"value\":").append(value).append('}');
        }
        f.append(']');
        StringBuilder m = new StringBuilder("[");
        first = true;
        for (Method x : c.getDeclaredMethods()) {
            if (x.isSynthetic() || x.isBridge() || x.getName().equals("main")) continue;
            if (!first) m.append(',');
            first = false;
            m.append("{\"name\":").append(str(x.getName())).append(",\"returns\":").append(str(x.getReturnType().getSimpleName()))
                .append(",\"params\":").append(params(x.getParameterTypes()))
                .append(",\"access\":").append(str(access(x.getModifiers())))
                .append(",\"static\":").append(Modifier.isStatic(x.getModifiers()))
                .append(",\"overrides\":").append(overrides(c, x))
                .append(",\"staticValue\":").append(staticGetterValue(x)).append('}');
        }
        m.append(']');
        StringBuilder k = new StringBuilder("[");
        first = true;
        for (Constructor<?> x : c.getDeclaredConstructors()) {
            if (x.isSynthetic()) continue;
            if (!first) k.append(',');
            first = false;
            k.append("{\"params\":").append(params(x.getParameterTypes())).append(",\"access\":").append(str(access(x.getModifiers()))).append('}');
        }
        k.append(']');
        Class<?> sup = c.getSuperclass();
        return "{\"name\":" + str(c.getSimpleName()) + ",\"extends\":" + str(sup == null || sup == Object.class ? null : sup.getSimpleName())
            + ",\"fields\":" + f + ",\"methods\":" + m + ",\"ctors\":" + k + "}";
    }

    /** Value of a public static no-argument getter (like getHeroCount()), so the game can show it. */
    static String staticGetterValue(Method x) {
        if (!Modifier.isStatic(x.getModifiers()) || !Modifier.isPublic(x.getModifiers()) || x.getParameterCount() != 0 || x.getReturnType() == void.class) return "null";
        try { return jsonValue(x.invoke(null)); } catch (Throwable t) { return "null"; }
    }

    static boolean overrides(Class<?> c, Method x) {
        if (Modifier.isStatic(x.getModifiers()) || Modifier.isPrivate(x.getModifiers())) return false;
        for (Class<?> k = c.getSuperclass(); k != null; k = k.getSuperclass()) {
            try {
                Method sup = k.getDeclaredMethod(x.getName(), x.getParameterTypes());
                if (!Modifier.isPrivate(sup.getModifiers()) && !Modifier.isStatic(sup.getModifiers())) return true;
            } catch (NoSuchMethodException e) { /* keep looking */ }
        }
        return false;
    }

    static String params(Class<?>[] t) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < t.length; i++) {
            if (i > 0) sb.append(',');
            sb.append(str(t[i].getSimpleName()));
        }
        return sb.append(']').toString();
    }

    static String access(int mod) {
        if (Modifier.isPublic(mod)) return "public";
        if (Modifier.isPrivate(mod)) return "private";
        if (Modifier.isProtected(mod)) return "protected";
        return "package";
    }

    static String show(Object v) {
        if (v == null) return "null";
        if (v instanceof String) return "\"" + v + "\"";
        return String.valueOf(v);
    }

    static String jsonValue(Object v) {
        if (v == null) return "null";
        if (v instanceof Number || v instanceof Boolean) return String.valueOf(v);
        return str(String.valueOf(v));
    }

    static String str(String s) {
        if (s == null) return "null";
        StringBuilder sb = new StringBuilder("\"");
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            switch (ch) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (ch < 0x20) { String hex = Integer.toHexString(ch); sb.append("\\u"); for (int z = hex.length(); z < 4; z++) sb.append('0'); sb.append(hex); }
                    else sb.append(ch);
            }
        }
        return sb.append('"').toString();
    }
}
