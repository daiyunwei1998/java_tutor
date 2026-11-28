/** A hero in Pixel Arena. */
public class Hero {
    private String name;
    private int hp;
    private int maxHp;
    private int level;

    public Hero(String name, int maxHp) {
        this.name = name;
        this.maxHp = maxHp;
        this.hp = maxHp;
        this.level = 1;
    }

    public String getName() {
        return name;
    }

    public int getHp() {
        return hp;
    }

    public int getMaxHp() {
        return maxHp;
    }

    public int getLevel() {
        return level;
    }

    public void setLevel(int newLevel) {
        if (newLevel >= 1 && newLevel <= 99) {
            level = newLevel;
        }
    }

    public void takeDamage(int amount) {
        if (amount < 0) {
            return;
        }
        hp = hp - amount;
        if (hp < 0) {
            hp = 0;
        }
    }

    public void heal(int amount) {
        if (amount < 0) {
            return;
        }
        hp = hp + amount;
        if (hp > maxHp) {
            hp = maxHp;
        }
    }

    public String getHpBar() {
        int filled = hp * 10 / maxHp;
        String bar = "";
        for (int i = 0; i < 10; i++) {
            if (i < filled) {
                bar += "#";
            } else {
                bar += "-";
            }
        }
        return "[" + bar + "] " + hp + "/" + maxHp;
    }
}
