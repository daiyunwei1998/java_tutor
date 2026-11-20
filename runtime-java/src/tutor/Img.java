package tutor;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;

/**
 * Grayscale image I/O for Mini Photoshop previews.
 * Text format: first line "rows cols", then rows lines of space-separated 0..255 values.
 */
public final class Img {
    private Img() {}

    public static int[][] read(String path) throws IOException {
        String text = new String(Files.readAllBytes(Paths.get(path)), StandardCharsets.UTF_8).trim();
        String[] lines = text.split("\n");
        String[] dims = lines[0].trim().split(" ");
        int rows = Integer.parseInt(dims[0]);
        int cols = Integer.parseInt(dims[1]);
        int[][] img = new int[rows][cols];
        for (int r = 0; r < rows; r++) {
            String[] parts = lines[r + 1].trim().split(" ");
            for (int c = 0; c < cols; c++) img[r][c] = Integer.parseInt(parts[c]);
        }
        return img;
    }

    /** Prints the image between markers so the browser can parse it out of stdout. */
    public static void write(int[][] img) {
        StringBuilder sb = new StringBuilder("@@IMG_BEGIN\n");
        if (img == null) {
            sb.append("null\n");
        } else {
            int cols = img.length == 0 || img[0] == null ? 0 : img[0].length;
            sb.append(img.length).append(' ').append(cols).append('\n');
            for (int[] row : img) {
                if (row == null) { sb.append("null\n"); continue; }
                for (int c = 0; c < row.length; c++) {
                    if (c > 0) sb.append(' ');
                    sb.append(row[c]);
                }
                sb.append('\n');
            }
        }
        sb.append("@@IMG_END");
        System.out.println(sb);
    }
}
