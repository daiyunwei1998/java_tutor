/** A mage: a hero with less hp who has mana. */
public class Mage extends Hero {
    private int mana;

    public Mage(String name) {
        super(name, 70);
        mana = 50;
    }

    public int getMana() {
        return mana;
    }
}
