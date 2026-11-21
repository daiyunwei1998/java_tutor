package tutor;

import java.util.ArrayList;
import java.util.List;

import org.eclipse.jdt.internal.compiler.CompilationResult;
import org.eclipse.jdt.internal.compiler.DefaultErrorHandlingPolicies;
import org.eclipse.jdt.internal.compiler.ast.AbstractMethodDeclaration;
import org.eclipse.jdt.internal.compiler.ast.Argument;
import org.eclipse.jdt.internal.compiler.ast.Block;
import org.eclipse.jdt.internal.compiler.ast.CaseStatement;
import org.eclipse.jdt.internal.compiler.ast.CompilationUnitDeclaration;
import org.eclipse.jdt.internal.compiler.ast.ConstructorDeclaration;
import org.eclipse.jdt.internal.compiler.ast.DoStatement;
import org.eclipse.jdt.internal.compiler.ast.ExplicitConstructorCall;
import org.eclipse.jdt.internal.compiler.ast.Expression;
import org.eclipse.jdt.internal.compiler.ast.ForStatement;
import org.eclipse.jdt.internal.compiler.ast.ForeachStatement;
import org.eclipse.jdt.internal.compiler.ast.IfStatement;
import org.eclipse.jdt.internal.compiler.ast.LabeledStatement;
import org.eclipse.jdt.internal.compiler.ast.LocalDeclaration;
import org.eclipse.jdt.internal.compiler.ast.Statement;
import org.eclipse.jdt.internal.compiler.ast.SwitchStatement;
import org.eclipse.jdt.internal.compiler.ast.SynchronizedStatement;
import org.eclipse.jdt.internal.compiler.ast.TryStatement;
import org.eclipse.jdt.internal.compiler.ast.TypeDeclaration;
import org.eclipse.jdt.internal.compiler.ast.TypeReference;
import org.eclipse.jdt.internal.compiler.ast.WhileStatement;
import org.eclipse.jdt.internal.compiler.batch.CompilationUnit;
import org.eclipse.jdt.internal.compiler.classfmt.ClassFileConstants;
import org.eclipse.jdt.internal.compiler.impl.CompilerOptions;
import org.eclipse.jdt.internal.compiler.parser.Parser;
import org.eclipse.jdt.internal.compiler.problem.DefaultProblemFactory;
import org.eclipse.jdt.internal.compiler.problem.ProblemReporter;

/**
 * Rewrites student source for the step-through debugger.
 *
 * Before every statement (and before every loop-condition check) a call to {@link T#at} is inserted that
 * reports the line and the values of the local variables in scope. Every method body is wrapped in
 * {@code T.enter(..); try { .. } finally { T.exit(); }} so the debugger knows the call stack.
 *
 * Only text without newlines is inserted, so line numbers (and stack traces) stay the same as in the
 * student's file. Parsing uses the Eclipse compiler's own parser (ecj is already loaded for compiling).
 */
public final class Instrument {
    private Instrument() {}

    private static final class Ins {
        final int pos;
        final int order; // closers (0) go before openers (1) at the same position
        final int seq;
        final String text;

        Ins(int pos, int order, int seq, String text) {
            this.pos = pos;
            this.order = order;
            this.seq = seq;
            this.text = text;
        }
    }

    private final List<Ins> ins = new ArrayList<>();
    private String src;
    private int[] lineStarts;
    private int fileIndex;
    private boolean addInits;
    private java.util.Map<Integer, String> breakpoints = java.util.Collections.emptyMap();
    private boolean collecting = true;
    private final java.util.Set<String> allLocals = new java.util.HashSet<>();

    /**
     * @param addInits give local variables declared without a value a default value, so they can be shown
     *                 from their declaration on. If that breaks compilation (e.g. lambdas that need the
     *                 variable to be effectively final), the runner retries with false: such variables are
     *                 then only shown in frames where they are guaranteed to be assigned (never, here).
     */
    public static String rewrite(String source, int fileIndex, boolean addInits) {
        return rewrite(source, fileIndex, addInits, java.util.Collections.emptyMap());
    }

    /**
     * @param breakpoints line → condition ("" = always) of this file's breakpoints. Statements on those lines
     *                    pass the condition's value to the recorder, which starts recording the first time it is
     *                    true and marks those steps so the viewer's Continue can stop there. The condition is
     *                    ordinary Java compiled together with the student's code, so it can use any variable in
     *                    scope on that line.
     */
    public static String rewrite(String source, int fileIndex, boolean addInits, java.util.Map<Integer, String> breakpoints) {
        Instrument in = new Instrument();
        in.breakpoints = breakpoints;
        in.src = source;
        in.fileIndex = fileIndex;
        in.addInits = addInits;
        in.lineStarts = lineStarts(source);
        CompilationUnitDeclaration cud = parse(source);
        if (cud == null || cud.types == null) return source;
        // First pass: learn every local variable name, so a breakpoint condition is only checked where all the
        // local variables it mentions are in scope (e.g. not before `int row` is declared on that line).
        for (TypeDeclaration t : cud.types) in.type(t, "");
        in.ins.clear();
        in.collecting = false;
        for (TypeDeclaration t : cud.types) in.type(t, "");
        return in.apply();
    }

    private static CompilationUnitDeclaration parse(String source) {
        CompilerOptions o = new CompilerOptions();
        o.sourceLevel = ClassFileConstants.JDK1_8;
        o.complianceLevel = ClassFileConstants.JDK1_8;
        o.originalSourceLevel = ClassFileConstants.JDK1_8;
        o.originalComplianceLevel = ClassFileConstants.JDK1_8;
        ProblemReporter pr = new ProblemReporter(DefaultErrorHandlingPolicies.proceedWithAllProblems(), o, new DefaultProblemFactory());
        Parser p = new Parser(pr, false);
        CompilationUnit u = new CompilationUnit(source.toCharArray(), "Main.java", "UTF-8");
        return p.parse(u, new CompilationResult(u, 0, 1, 100));
    }

    private static int[] lineStarts(String s) {
        List<Integer> l = new ArrayList<>();
        l.add(0);
        for (int i = 0; i < s.length(); i++) if (s.charAt(i) == '\n') l.add(i + 1);
        int[] a = new int[l.size()];
        for (int i = 0; i < a.length; i++) a[i] = l.get(i);
        return a;
    }

    private int line(int pos) {
        int lo = 0, hi = lineStarts.length - 1;
        while (lo < hi) {
            int mid = (lo + hi + 1) >>> 1;
            if (lineStarts[mid] <= pos) lo = mid; else hi = mid - 1;
        }
        return lo + 1;
    }

    private void add(int pos, int order, String text) {
        ins.add(new Ins(pos, order, ins.size(), text));
    }

    private String apply() {
        ins.sort((a, b) -> a.pos != b.pos ? Integer.compare(a.pos, b.pos) : a.order != b.order ? Integer.compare(a.order, b.order) : Integer.compare(a.seq, b.seq));
        StringBuilder sb = new StringBuilder(src.length() + ins.size() * 40);
        int last = 0;
        for (Ins i : ins) {
            sb.append(src, last, i.pos).append(i.text);
            last = i.pos;
        }
        sb.append(src.substring(last));
        return sb.toString();
    }

    // ------------------------------------------------------------------ types and methods

    private void type(TypeDeclaration t, String outer) {
        String name = outer.isEmpty() ? new String(t.name) : outer + "." + new String(t.name);
        if (t.methods != null) {
            for (AbstractMethodDeclaration m : t.methods) method(t, m, name);
        }
        if (t.memberTypes != null) {
            for (TypeDeclaration mt : t.memberTypes) type(mt, name);
        }
    }

    private void method(TypeDeclaration owner, AbstractMethodDeclaration m, String typeName) {
        if (m.isAbstract() || m.isNative() || m.isDefaultConstructor() || m.isClinit() || m.bodyStart <= 0) return;
        if ((m.modifiers & ClassFileConstants.AccSynthetic) != 0) return;
        int close = closingBrace(m.bodyEnd);
        if (close < 0) return;
        boolean isCtor = m instanceof ConstructorDeclaration;
        boolean isStatic = (m.modifiers & ClassFileConstants.AccStatic) != 0;
        String shown = isCtor ? "new " + typeName : new String(m.selector);
        List<String> scope = new ArrayList<>();
        if (!isStatic) scope.add("this");
        boolean isMain = isStatic && "main".equals(new String(m.selector));
        if (m.arguments != null) {
            for (Argument a : m.arguments) {
                if (isMain && m.arguments.length == 1) continue; // main's (empty) args only adds noise
                scope.add(new String(a.name));
            }
        }

        int start = m.bodyStart;
        if (isCtor) {
            ExplicitConstructorCall cc = ((ConstructorDeclaration) m).constructorCall;
            if (cc != null && !cc.isImplicitSuper()) start = semicolonEnd(cc.sourceEnd);
        }
        add(start, 1, "tutor.T.enter(" + str(shown) + ", " + typeName + ".class); try {");
        add(close, 0, "} finally { tutor.T.exit(); }");
        if (m.statements != null) {
            statements(m.statements, scope);
        }
    }

    private int closingBrace(int from) {
        for (int i = Math.max(0, from); i < src.length(); i++) {
            char c = src.charAt(i);
            if (c == '}') return i;
            if (!Character.isWhitespace(c)) {
                // bodyEnd normally sits right before the brace; skip a trailing comment if there is one
                int j = skipComment(i);
                if (j == i) return -1;
                i = j - 1;
            }
        }
        return -1;
    }

    private int skipComment(int i) {
        if (src.startsWith("//", i)) {
            int e = src.indexOf('\n', i);
            return e < 0 ? src.length() : e;
        }
        if (src.startsWith("/*", i)) {
            int e = src.indexOf("*/", i + 2);
            return e < 0 ? src.length() : e + 2;
        }
        return i;
    }

    /** Position right after the statement's terminating ';' (or after pos if there is none). */
    private int semicolonEnd(int pos) {
        if (pos < src.length() && src.charAt(pos) == ';') return pos + 1;
        int i = pos + 1;
        while (i < src.length()) {
            char c = src.charAt(i);
            if (Character.isWhitespace(c)) { i++; continue; }
            int j = skipComment(i);
            if (j != i) { i = j; continue; }
            return c == ';' ? i + 1 : pos + 1;
        }
        return pos + 1;
    }

    // ------------------------------------------------------------------ statements

    /** Statements of one block; declarations extend the scope for the statements after them. */
    private void statements(Statement[] list, List<String> outer) {
        List<String> scope = new ArrayList<>(outer);
        int lastDeclStart = -1;
        for (Statement s : list) {
            if (s instanceof ExplicitConstructorCall) continue;
            if (s instanceof LocalDeclaration) {
                LocalDeclaration d = (LocalDeclaration) s;
                // `int a = 1, b;` is two declarations sharing one statement: report once, before the first.
                if (d.declarationSourceStart != lastDeclStart) at(d.declarationSourceStart, scope, false);
                lastDeclStart = d.declarationSourceStart;
                boolean isFinal = (d.modifiers & ClassFileConstants.AccFinal) != 0;
                if (d.initialization == null) {
                    if (addInits && !isFinal) {
                        add(d.sourceEnd + 1, 1, " = " + defaultValue(d.type));
                        scope.add(new String(d.name));
                    }
                } else {
                    scope.add(new String(d.name));
                }
                continue;
            }
            statement(s, scope, false);
        }
    }

    /** One statement. If it is the unbraced body of an if/loop, it is wrapped in braces first. */
    private void statement(Statement s, List<String> scope, boolean wrap) {
        if (s == null) return;
        if (s instanceof Block) {
            Block b = (Block) s;
            if (b.statements != null) statements(b.statements, scope);
            return;
        }
        int start = s.sourceStart;
        if (s instanceof LabeledStatement) {
            // the label must stay directly in front of its loop
            statement(((LabeledStatement) s).statement, scope, wrap);
            return;
        }
        if (wrap) {
            add(start, 1, "{");
            add(end(s), 0, "}");
        }
        at(start, scope, false);
        if (s instanceof IfStatement) {
            IfStatement f = (IfStatement) s;
            statement(f.thenStatement, scope, true);
            statement(f.elseStatement, scope, true);
        } else if (s instanceof ForStatement) {
            ForStatement f = (ForStatement) s;
            List<String> inner = new ArrayList<>(scope);
            if (f.initializations != null) {
                for (Statement init : f.initializations) {
                    if (init instanceof LocalDeclaration) inner.add(new String(((LocalDeclaration) init).name));
                }
            }
            cond(f.condition, inner);
            statement(f.action, inner, true);
        } else if (s instanceof ForeachStatement) {
            ForeachStatement f = (ForeachStatement) s;
            List<String> inner = new ArrayList<>(scope);
            inner.add(new String(f.elementVariable.name));
            statement(f.action, inner, true);
        } else if (s instanceof WhileStatement) {
            WhileStatement w = (WhileStatement) s;
            cond(w.condition, scope);
            statement(w.action, scope, true);
        } else if (s instanceof DoStatement) {
            DoStatement d = (DoStatement) s;
            statement(d.action, scope, true);
            cond(d.condition, scope);
        } else if (s instanceof SwitchStatement) {
            SwitchStatement sw = (SwitchStatement) s;
            if (sw.statements != null) {
                // Declarations in one case are visible in later cases but not assigned there: don't show them.
                List<Statement> run = new ArrayList<>();
                for (Statement x : sw.statements) {
                    if (x instanceof CaseStatement) {
                        if (!run.isEmpty()) statements(run.toArray(new Statement[0]), scope);
                        run.clear();
                    } else {
                        run.add(x);
                    }
                }
                if (!run.isEmpty()) statements(run.toArray(new Statement[0]), scope);
            }
        } else if (s instanceof TryStatement) {
            TryStatement t = (TryStatement) s;
            if (t.resources == null || t.resources.length == 0) {
                statement(t.tryBlock, scope, false);
            }
            if (t.catchBlocks != null) {
                for (int k = 0; k < t.catchBlocks.length; k++) {
                    List<String> inner = new ArrayList<>(scope);
                    if (t.catchArguments != null && k < t.catchArguments.length) inner.add(new String(t.catchArguments[k].name));
                    statement(t.catchBlocks[k], inner, false);
                }
            }
            statement(t.finallyBlock, scope, false);
        } else if (s instanceof SynchronizedStatement) {
            statement(((SynchronizedStatement) s).block, scope, false);
        }
    }

    /** End position (exclusive) of a statement including its ';' or closing brace. */
    private int end(Statement s) {
        if (s instanceof Block) return braceEnd(s.sourceEnd);
        if (s instanceof IfStatement) {
            IfStatement f = (IfStatement) s;
            return end(f.elseStatement != null ? f.elseStatement : f.thenStatement);
        }
        if (s instanceof ForStatement) return end(((ForStatement) s).action);
        if (s instanceof ForeachStatement) return end(((ForeachStatement) s).action);
        if (s instanceof WhileStatement) return end(((WhileStatement) s).action);
        if (s instanceof LabeledStatement) return end(((LabeledStatement) s).statement);
        if (s instanceof SynchronizedStatement) return end(((SynchronizedStatement) s).block);
        if (s instanceof TryStatement) {
            TryStatement t = (TryStatement) s;
            if (t.finallyBlock != null) return end(t.finallyBlock);
            if (t.catchBlocks != null && t.catchBlocks.length > 0) return end(t.catchBlocks[t.catchBlocks.length - 1]);
            return end(t.tryBlock);
        }
        if (s instanceof SwitchStatement) return braceEnd(s.sourceEnd);
        if (s == null) return -1;
        return semicolonEnd(s.sourceEnd);
    }

    private int braceEnd(int pos) {
        if (pos < src.length() && src.charAt(pos) == '}') return pos + 1;
        int i = src.indexOf('}', pos);
        return i < 0 ? pos + 1 : i + 1;
    }

    /** Wraps a loop condition so each check is reported: (T.at(..) && (cond)). */
    private void cond(Expression c, List<String> scope) {
        if (c == null) return;
        // `while (true)` must stay a constant, or the compiler's reachability rules change
        if (src.substring(c.sourceStart, c.sourceEnd + 1).replaceAll("[()\\s]", "").equals("true")) return;
        int start = c.sourceStart;
        int end = c.sourceEnd + 1;
        add(start, 1, "(" + call(line(start), scope, true) + " && (");
        add(end, 0, "))");
    }

    private void at(int pos, List<String> scope, boolean expr) {
        add(pos, 1, call(line(pos), scope, expr) + (expr ? "" : ";"));
    }

    private String call(int line, List<String> scope, boolean expr) {
        StringBuilder names = new StringBuilder();
        StringBuilder vals = new StringBuilder();
        for (String n : scope) {
            if (names.length() > 0) { names.append(','); vals.append(','); }
            names.append(n);
            vals.append(n);
        }
        String arr = scope.isEmpty() ? "null" : "new Object[]{" + vals + "}";
        if (collecting) allLocals.addAll(scope);
        String bp = "";
        if (breakpoints.containsKey(line)) {
            String cond = breakpoints.get(line).replace('\n', ' ').replace('\r', ' ').trim();
            bp = cond.isEmpty() ? ",true" : inScope(cond, scope) ? ",(" + cond + ")" : ",false";
        }
        return "tutor.T." + (expr ? "check" : "at") + "(" + fileIndex + "," + line + "," + str(names.toString()) + "," + arr + bp + ")";
    }

    /** False if the condition mentions a local variable that is not declared at this point. */
    private boolean inScope(String cond, List<String> scope) {
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("(?<![.\\w$])([A-Za-z_$][\\w$]*)").matcher(cond.replaceAll("\"(?:[^\"\\\\]|\\\\.)*\"", "\"\""));
        while (m.find()) {
            String id = m.group(1);
            if (allLocals.contains(id) && !scope.contains(id)) return false;
        }
        return true;
    }

    private static String defaultValue(TypeReference t) {
        if (t == null || t.dimensions() > 0) return "null";
        char[][] tn = t.getTypeName();
        if (tn == null || tn.length != 1) return "null";
        switch (new String(tn[0])) {
            case "int": case "long": case "short": case "byte": case "double": case "float": return "0";
            case "char": return "(char) 0";
            case "boolean": return "false";
            default: return "null";
        }
    }

    private static String str(String s) {
        return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    /** Command line: java tutor.Instrument File.java */
    public static void main(String[] args) throws Exception {
        String s = new String(java.nio.file.Files.readAllBytes(java.nio.file.Paths.get(args[0])), "UTF-8");
        System.out.println(rewrite(s, 0, true));
    }
}
