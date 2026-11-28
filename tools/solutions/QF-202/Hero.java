/** A hero in Pixel Arena. */
public class Hero {
    public String name;
    private int level;
    private int hp;

    public Hero(String name, int hp) {
        this.name = name;
        this.hp = hp;
        this.level = 1;
    }

    public void introduce() {
        System.out.println("I am " + name + ", Lv " + level + ", " + hp + " HP!");
    }

    public int getHp() {
        return hp;
    }

    public int getLevel() {
        return level;
    }

    public void setLevel(int newLevel) {
        level = newLevel;
    }
}
