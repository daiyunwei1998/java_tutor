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

    /** Adds mana (used by stronger kinds of mages). */
    public void addMana(int amount) {
        if (amount > 0) {
            mana = mana + amount;
        }
    }

    @Override
    public String toString() {
        return super.toString() + " mana " + mana;
    }

    /** A spell: costs 10 mana and deals double damage. */
    @Override
    public void attack(Hero target) {
        if (mana < 10) {
            System.out.println(getName() + " is out of mana!");
            return;
        }
        mana = mana - 10;
        System.out.println(getName() + ": " + getBattleCry());
        int damage = previewDamage() * 2;
        System.out.println(getName() + " casts a spell on " + target.getName() + " for " + damage + "!");
        target.takeDamage(damage);
    }
}
