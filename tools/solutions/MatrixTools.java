import java.util.Arrays;

public class MatrixTools {

    /** m is N x N: returns m[0][0] + m[1][1] + ... */
    public static int mainDiagonalSum(int[][] m) {
        int sum = 0;
        for (int i = 0; i < m.length; i++) {
            sum += m[i][i];                  // row and column are the same
        }
        return sum;
    }

    /** m is N x N: returns m[0][N-1] + m[1][N-2] + ... */
    public static int antiDiagonalSum(int[][] m) {
        int sum = 0;
        for (int i = 0; i < m.length; i++) {
            sum += m[i][m.length - 1 - i];   // column counts down while the row counts up
        }
        return sum;
    }

    /** Returns the transpose of m (a new array). m is R x C, the result is C x R. */
    public static int[][] transpose(int[][] m) {
        int rows = m.length;
        int cols = m[0].length;
        int[][] t = new int[cols][rows];
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                t[c][r] = m[r][c];
            }
        }
        return t;
    }

    public static void main(String[] args) {
        int[][] m = {
            {1, 2, 3},
            {4, 5, 6},
            {7, 8, 9}
        };
        System.out.println("main diagonal = " + mainDiagonalSum(m));
        System.out.println("anti diagonal = " + antiDiagonalSum(m));
        int[][] wide = {{1, 2, 3}, {4, 5, 6}};
        System.out.println("transpose     = " + Arrays.deepToString(transpose(wide)));
    }
}
