import java.util.ArrayList;

/** A party of heroes of any kind. */
public class Party {
    private ArrayList<Hero> members = new ArrayList<Hero>();

    public void add(Hero h) {
        members.add(h);
    }

    public int size() {
        return members.size();
    }

    public void allAttack(Hero target) {
        for (Hero h : members) {
            h.attack(target);
        }
    }

    public int totalHp() {
        int total = 0;
        for (Hero h : members) {
            total = total + h.getHp();
        }
        return total;
    }
}
