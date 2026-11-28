/** A hero in Pixel Arena. */
public class Hero {
    public static final int MAX_LEVEL = 99;
    private static int heroCount = 0;

    private String name;
    private int hp;
    private int maxHp;
    private int level;

    public Hero(String name, int maxHp) {
        this.name = name;
        this.maxHp = maxHp;
        this.hp = maxHp;
        this.level = 1;
        heroCount++;
    }

    public static int getHeroCount() {
        return heroCount;
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
        if (newLevel >= 1 && newLevel <= MAX_LEVEL) {
            level = newLevel;
        }
    }

    public void takeDamage(int amount) {
        if (amount < 0) {
            return;
        }
        hp = clampHp(hp - amount);
    }

    public void heal(int amount) {
        if (amount < 0) {
            return;
        }
        hp = clampHp(hp + amount);
    }

    public void attack(Hero target) {
        int damage = calculateDamage();
        System.out.println(name + " attacks " + target.getName() + " for " + damage + "!");
        target.takeDamage(damage);
    }

    /** Shown in the game's attack preview. */
    public int previewDamage() {
        return calculateDamage();
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

    private int clampHp(int value) {
        if (value < 0) {
            return 0;
        }
        if (value > maxHp) {
            return maxHp;
        }
        return value;
    }

    private int calculateDamage() {
        return 6 + level * 3;
    }
}
