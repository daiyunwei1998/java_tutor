/** Team utilities. */
public class Roster {

    /** Total hp of every hero in the array, whatever kind of hero each one is. */
    public static int totalHp(Hero[] party) {
        int total = 0;
        for (Hero h : party) {
            total = total + h.getHp();
        }
        return total;
    }
}
