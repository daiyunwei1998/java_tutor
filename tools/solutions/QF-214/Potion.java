/** A potion in the backpack. */
public class Potion {
    private String color;
    private int healAmount;

    public Potion(String color, int healAmount) {
        this.color = color;
        this.healAmount = healAmount;
    }

    public String getColor() {
        return color;
    }

    public int getHealAmount() {
        return healAmount;
    }

    /** True only if other is this very same object. */
    public boolean isSameObject(Potion other) {
        return this == other;
    }

    @Override
    public String toString() {
        return color + " potion (+" + healAmount + ")";
    }

    @Override
    public boolean equals(Object other) {
        if (!(other instanceof Potion)) {
            return false;
        }
        Potion p = (Potion) other;
        return color.equals(p.color) && healAmount == p.healAmount;
    }
}
