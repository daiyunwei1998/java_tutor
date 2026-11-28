/** Your scratch file: try things here and press ▶ Run main. (The game ignores this file.) */
public class Main {
    public static void main(String[] args) {
        Hero aria = new Hero("Aria", 100);
        aria.setLevel(5);
        System.out.println("level is now " + aria.getLevel());
        System.out.println("hp is " + aria.getHp());
        aria.introduce();
    }
}
