/** An archmage: a mage with extra mana. */
public class Archmage extends Mage {

    public Archmage(String name) {
        super(name);
        addMana(50);
    }

    @Override
    public String getBattleCry() {
        return "Witness true power!";
    }
}
