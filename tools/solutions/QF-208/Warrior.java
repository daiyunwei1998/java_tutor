/** A warrior: a hero with more hp who can roar. */
public class Warrior extends Hero {

    public Warrior(String name) {
        super(name, 130);
    }

    public void roar() {
        System.out.println(getName() + " roars!");
        heal(5);
    }
}
