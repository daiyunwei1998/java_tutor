/** A hero in Pixel Arena. Every Hero object has its own name and hp. */
public class Hero {
    public String name;
    public int hp;

    public Hero(String name, int hp) {
        this.name = name;
        this.hp = hp;
    }

    public void introduce() {
        System.out.println("I am " + name + ", " + hp + " HP!");
    }
}
