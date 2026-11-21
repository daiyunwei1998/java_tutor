import java.util.Arrays;

public class Life {

    /** Counts the live cells (1) among the 8 neighbors of grid[r][c]. Cells outside the grid count as dead. */
    public static int countNeighbors(int[][] grid, int r, int c) {
        int count = 0;
        for (int dr = -1; dr <= 1; dr++) {
            for (int dc = -1; dc <= 1; dc++) {
                if (dr == 0 && dc == 0) continue;                  // the cell itself is not its own neighbor
                int nr = r + dr, nc = c + dc;
                if (nr < 0 || nr >= grid.length || nc < 0 || nc >= grid[nr].length) continue;
                count += grid[nr][nc];
            }
        }
        return count;
    }

    /**
     * Returns the next generation as a NEW grid (grid itself is not changed).
     * A live cell with 2 or 3 live neighbors stays alive. A dead cell with exactly 3 comes alive. Every other cell is dead.
     */
    public static int[][] nextGeneration(int[][] grid) {
        int[][] next = new int[grid.length][grid[0].length];
        for (int r = 0; r < grid.length; r++) {
            for (int c = 0; c < grid[r].length; c++) {
                int n = countNeighbors(grid, r, c);                 // always read the OLD grid
                if (grid[r][c] == 1) next[r][c] = (n == 2 || n == 3) ? 1 : 0;
                else next[r][c] = (n == 3) ? 1 : 0;
            }
        }
        return next;
    }

    /** Returns the grid after the given number of generations (grid itself is not changed). */
    public static int[][] run(int[][] grid, int generations) {
        int[][] cur = grid;
        for (int g = 0; g < generations; g++) cur = nextGeneration(cur);
        return cur;
    }

    static void print(String title, int[][] grid) {
        System.out.println(title);
        for (int[] row : grid) {
            StringBuilder sb = new StringBuilder("  ");
            for (int v : row) sb.append(v == 1 ? "# " : ". ");
            System.out.println(sb);
        }
    }

    public static void main(String[] args) {
        int[][] blinker = {
            {0, 0, 0, 0, 0},
            {0, 0, 1, 0, 0},
            {0, 0, 1, 0, 0},
            {0, 0, 1, 0, 0},
            {0, 0, 0, 0, 0}
        };
        System.out.println("neighbors of [2][1] = " + countNeighbors(blinker, 2, 1));
        System.out.println("neighbors of [0][0] = " + countNeighbors(blinker, 0, 0));
        print("generation 0:", blinker);
        print("generation 1:", nextGeneration(blinker));
        print("generation 2:", run(blinker, 2));
    }
}
