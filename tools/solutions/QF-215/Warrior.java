/** A warrior: a hero with more hp who can roar, and gains rage when attacking. */
public class Warrior extends Hero {
    private int rage;

    public Warrior(String name) {
        super(name, 130);
    }

    public int getRage() {
        return rage;
    }

    @Override
    public String getBattleCry() {
        return "For the guild!";
    }

    @Override
    public void attack(Hero target) {
        super.attack(target);
        rage = rage + 10;
    }

    @Override
    public String toString() {
        return super.toString() + " rage " + rage;
    }

    public void roar() {
        System.out.println(getName() + " roars!");
        heal(5);
    }
}
