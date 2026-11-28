/** A warrior: a hero with more hp who can roar. */
public class Warrior extends Hero {

    public Warrior(String name) {
        super(name, 130);
    }

    @Override
    public String getBattleCry() {
        return "For the guild!";
    }

    public void roar() {
        System.out.println(getName() + " roars!");
        heal(5);
    }
}
