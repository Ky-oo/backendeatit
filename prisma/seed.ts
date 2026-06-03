import dotenvx from "@dotenvx/dotenvx";
import { hash } from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";

dotenvx.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed the database");
}

const adapterUrl = databaseUrl.trim().replace("@mariadb:", "@127.0.0.1:");
const adapter = new PrismaMariaDb(adapterUrl);
const prisma = new PrismaClient({ adapter });

type UserRole = "USER" | "RESTAURANT" | "ADMIN";
type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "DELIVERED"
  | "CANCELLED";

type UserFixture = {
  key: string;
  id: string;
  email: string;
  passwordKey?: "admin" | "default";
  firstname: string;
  lastname: string;
  phoneNumber: string;
  role: UserRole;
  city: string;
  cp: string;
  address: string;
  details?: string;
  picture?: string;
};

type RestaurantFixture = {
  key: string;
  id: string;
  ownerKey: string;
  name: string;
  description: string;
  image: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  cuisine: string;
  distance: number;
};

type DishFixture = {
  key: string;
  id: string;
  restaurantKey: string;
  name: string;
  description: string;
  price: number;
  image: string;
};

type OrderFixture = {
  id: string;
  userKey: string;
  restaurantKey: string;
  date: string;
  status: OrderStatus;
  items: Array<{
    id: string;
    dishKey: string;
    quantity: number;
  }>;
};

const users: UserFixture[] = [
  {
    key: "admin",
    id: "10000000-0000-4000-8000-000000000001",
    email: "user@example.com",
    passwordKey: "admin",
    firstname: "Alex",
    lastname: "Admin",
    phoneNumber: "0600000000",
    role: "ADMIN",
    city: "Paris",
    cp: "75001",
    address: "1 rue de la Demo",
    details: "Compte admin de presentation",
  },
  {
    key: "client",
    id: "11111111-1111-4111-8111-111111111111",
    email: "client@example.com",
    firstname: "Camille",
    lastname: "Martin",
    phoneNumber: "0600000001",
    role: "USER",
    city: "Paris",
    cp: "75001",
    address: "10 rue de Rivoli",
    details: "Code porte 1234",
  },
  {
    key: "restaurateur",
    id: "22222222-2222-4222-8222-222222222222",
    email: "restaurateur@example.com",
    firstname: "Nadia",
    lastname: "Benali",
    phoneNumber: "0600000002",
    role: "RESTAURANT",
    city: "Paris",
    cp: "75011",
    address: "25 avenue Parmentier",
  },
  {
    key: "owner-mateo",
    id: "10000000-0000-4000-8000-000000000004",
    email: "mateo.owner@example.com",
    firstname: "Mateo",
    lastname: "Rossi",
    phoneNumber: "0600000004",
    role: "RESTAURANT",
    city: "Paris",
    cp: "75009",
    address: "16 rue des Martyrs",
  },
  {
    key: "owner-yuki",
    id: "10000000-0000-4000-8000-000000000005",
    email: "yuki.owner@example.com",
    firstname: "Yuki",
    lastname: "Tanaka",
    phoneNumber: "0600000005",
    role: "RESTAURANT",
    city: "Paris",
    cp: "75002",
    address: "7 rue Sainte-Anne",
  },
  {
    key: "lea",
    id: "10000000-0000-4000-8000-000000000006",
    email: "lea.client@example.com",
    firstname: "Lea",
    lastname: "Dubois",
    phoneNumber: "0600000006",
    role: "USER",
    city: "Paris",
    cp: "75010",
    address: "8 quai de Valmy",
    details: "Interphone Dubois",
  },
  {
    key: "hugo",
    id: "10000000-0000-4000-8000-000000000007",
    email: "hugo.client@example.com",
    firstname: "Hugo",
    lastname: "Leroy",
    phoneNumber: "0600000007",
    role: "USER",
    city: "Paris",
    cp: "75018",
    address: "4 rue Lepic",
  },
  {
    key: "ines",
    id: "10000000-0000-4000-8000-000000000008",
    email: "ines.client@example.com",
    firstname: "Ines",
    lastname: "Moreau",
    phoneNumber: "0600000008",
    role: "USER",
    city: "Paris",
    cp: "75015",
    address: "12 rue du Commerce",
    details: "Dernier etage",
  },
  {
    key: "thomas",
    id: "10000000-0000-4000-8000-000000000009",
    email: "thomas.client@example.com",
    firstname: "Thomas",
    lastname: "Bernard",
    phoneNumber: "0600000009",
    role: "USER",
    city: "Paris",
    cp: "75005",
    address: "21 rue Monge",
  },
  {
    key: "sofia",
    id: "10000000-0000-4000-8000-000000000010",
    email: "sofia.client@example.com",
    firstname: "Sofia",
    lastname: "Garcia",
    phoneNumber: "0600000010",
    role: "USER",
    city: "Paris",
    cp: "75013",
    address: "30 avenue d'Italie",
  },
];

const restaurants: RestaurantFixture[] = [
  {
    key: "comptoir-test",
    id: "33333333-3333-4333-8333-333333333333",
    ownerKey: "admin",
    name: "Le Comptoir Test",
    description: "Burgers genereux, produits frais et sauces maison.",
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
    rating: 4.6,
    deliveryTime: "25-35 min",
    deliveryFee: 2.99,
    cuisine: "Burgers",
    distance: 2,
  },
  {
    key: "maison-bao",
    id: "30000000-0000-4000-8000-000000000002",
    ownerKey: "admin",
    name: "Maison Bao",
    description: "Bao moelleux, nouilles sautees et assiettes asiatiques.",
    image:
      "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1200&q=80",
    rating: 4.8,
    deliveryTime: "20-30 min",
    deliveryFee: 1.99,
    cuisine: "Asiatique",
    distance: 1,
  },
  {
    key: "bella-roma",
    id: "30000000-0000-4000-8000-000000000003",
    ownerKey: "admin",
    name: "Bella Roma",
    description: "Pizzas napolitaines, pasta fraiches et tiramisu classique.",
    image:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
    rating: 4.5,
    deliveryTime: "30-40 min",
    deliveryFee: 2.49,
    cuisine: "Italien",
    distance: 3,
  },
  {
    key: "sushi-lumiere",
    id: "30000000-0000-4000-8000-000000000004",
    ownerKey: "owner-yuki",
    name: "Sushi Lumiere",
    description: "Sushis precis, chirashi colores et bentos du midi.",
    image:
      "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=80",
    rating: 4.7,
    deliveryTime: "25-35 min",
    deliveryFee: 2.99,
    cuisine: "Japonais",
    distance: 2,
  },
  {
    key: "green-garden",
    id: "30000000-0000-4000-8000-000000000005",
    ownerKey: "restaurateur",
    name: "Green Garden",
    description: "Bowls vegetariens, salades composees et jus presses.",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
    rating: 4.4,
    deliveryTime: "15-25 min",
    deliveryFee: 1.49,
    cuisine: "Healthy",
    distance: 1,
  },
  {
    key: "tacos-canal",
    id: "30000000-0000-4000-8000-000000000006",
    ownerKey: "restaurateur",
    name: "Tacos du Canal",
    description: "Tacos, burritos et quesadillas pour les grosses faims.",
    image:
      "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1200&q=80",
    rating: 4.3,
    deliveryTime: "20-30 min",
    deliveryFee: 2.49,
    cuisine: "Mexicain",
    distance: 4,
  },
  {
    key: "curry-club",
    id: "30000000-0000-4000-8000-000000000007",
    ownerKey: "restaurateur",
    name: "Curry Club",
    description: "Currys parfumes, naans chauds et riz basmati.",
    image:
      "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80",
    rating: 4.6,
    deliveryTime: "30-45 min",
    deliveryFee: 2.99,
    cuisine: "Indien",
    distance: 5,
  },
  {
    key: "bistrot-saint-martin",
    id: "30000000-0000-4000-8000-000000000008",
    ownerKey: "owner-mateo",
    name: "Bistrot Saint-Martin",
    description: "Cuisine francaise de quartier, plats mijotes et desserts.",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
    rating: 4.2,
    deliveryTime: "35-45 min",
    deliveryFee: 3.49,
    cuisine: "Francais",
    distance: 3,
  },
  {
    key: "sweet-corner",
    id: "30000000-0000-4000-8000-000000000009",
    ownerKey: "owner-mateo",
    name: "Sweet Corner",
    description: "Pancakes, cookies, boissons glacees et desserts a partager.",
    image:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80",
    rating: 4.5,
    deliveryTime: "20-30 min",
    deliveryFee: 1.99,
    cuisine: "Desserts",
    distance: 2,
  },
];

const dishes: DishFixture[] = [
  {
    key: "burger-maison",
    id: "44444444-4444-4444-8444-444444444444",
    restaurantKey: "comptoir-test",
    name: "Burger maison",
    description: "Bun brioche, steak, cheddar, pickles et sauce maison.",
    price: 12.5,
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "frites-fraiches",
    id: "55555555-5555-4555-8555-555555555555",
    restaurantKey: "comptoir-test",
    name: "Frites fraiches",
    description: "Pommes de terre coupees maison, double cuisson.",
    price: 4.5,
    image:
      "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "menu-smash",
    id: "40000000-0000-4000-8000-000000000003",
    restaurantKey: "comptoir-test",
    name: "Menu smash",
    description: "Smash burger, frites et boisson artisanale.",
    price: 16.9,
    image:
      "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "cookie-chocolat",
    id: "40000000-0000-4000-8000-000000000004",
    restaurantKey: "comptoir-test",
    name: "Cookie chocolat",
    description: "Cookie moelleux aux pepites de chocolat noir.",
    price: 3.4,
    image:
      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "bao-porc",
    id: "40000000-0000-4000-8000-000000000005",
    restaurantKey: "maison-bao",
    name: "Bao porc caramel",
    description: "Deux baos vapeur, porc confit et pickles de concombre.",
    price: 10.9,
    image:
      "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "bao-veggie",
    id: "40000000-0000-4000-8000-000000000006",
    restaurantKey: "maison-bao",
    name: "Bao tofu croustillant",
    description: "Tofu pane, sauce sesame et crudites croquantes.",
    price: 9.9,
    image:
      "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "nouilles-sate",
    id: "40000000-0000-4000-8000-000000000007",
    restaurantKey: "maison-bao",
    name: "Nouilles sautees",
    description: "Nouilles aux legumes, oeuf mollet et sauce soja.",
    price: 12.8,
    image:
      "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "menu-bao",
    id: "40000000-0000-4000-8000-000000000008",
    restaurantKey: "maison-bao",
    name: "Menu bao midi",
    description: "Bao au choix, salade asiatique et boisson maison.",
    price: 15.5,
    image:
      "https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "pizza-margherita",
    id: "40000000-0000-4000-8000-000000000009",
    restaurantKey: "bella-roma",
    name: "Pizza Margherita",
    description: "Tomate San Marzano, mozzarella fior di latte et basilic.",
    price: 11.9,
    image:
      "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "pizza-diavola",
    id: "40000000-0000-4000-8000-000000000010",
    restaurantKey: "bella-roma",
    name: "Pizza Diavola",
    description: "Spianata piquante, tomate, mozzarella et huile pimentee.",
    price: 14.2,
    image:
      "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "pasta-truffe",
    id: "40000000-0000-4000-8000-000000000011",
    restaurantKey: "bella-roma",
    name: "Pasta creme de truffe",
    description: "Tagliatelle fraiches, champignons et creme de truffe.",
    price: 16.5,
    image:
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "tiramisu",
    id: "40000000-0000-4000-8000-000000000012",
    restaurantKey: "bella-roma",
    name: "Tiramisu maison",
    description: "Mascarpone, cafe et cacao amer.",
    price: 5.9,
    image:
      "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "plateau-saumon",
    id: "40000000-0000-4000-8000-000000000013",
    restaurantKey: "sushi-lumiere",
    name: "Plateau saumon",
    description: "Sushis, makis et sashimis saumon.",
    price: 18.9,
    image:
      "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "chirashi-thon",
    id: "40000000-0000-4000-8000-000000000014",
    restaurantKey: "sushi-lumiere",
    name: "Chirashi thon avocat",
    description: "Riz vinaigre, thon rouge, avocat et sesame.",
    price: 17.5,
    image:
      "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "bento-poulet",
    id: "40000000-0000-4000-8000-000000000015",
    restaurantKey: "sushi-lumiere",
    name: "Bento poulet katsu",
    description: "Poulet pane, riz, salade de chou et sauce tonkatsu.",
    price: 15.8,
    image:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "mochi-mangue",
    id: "40000000-0000-4000-8000-000000000016",
    restaurantKey: "sushi-lumiere",
    name: "Mochis mangue",
    description: "Deux mochis glaces a la mangue.",
    price: 5.2,
    image:
      "https://images.unsplash.com/photo-1584501173481-d93828e11c13?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "bowl-quinoa",
    id: "40000000-0000-4000-8000-000000000017",
    restaurantKey: "green-garden",
    name: "Bowl quinoa avocat",
    description: "Quinoa, avocat, pois chiches, crudites et sauce tahini.",
    price: 12.9,
    image:
      "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "salade-cesar-veggie",
    id: "40000000-0000-4000-8000-000000000018",
    restaurantKey: "green-garden",
    name: "Salade cesar veggie",
    description: "Laitue, tofu grille, parmesan et croutons.",
    price: 11.4,
    image:
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "wrap-falafel",
    id: "40000000-0000-4000-8000-000000000019",
    restaurantKey: "green-garden",
    name: "Wrap falafel",
    description: "Galette, falafels, houmous, concombre et menthe.",
    price: 9.8,
    image:
      "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "jus-detox",
    id: "40000000-0000-4000-8000-000000000020",
    restaurantKey: "green-garden",
    name: "Jus detox",
    description: "Pomme, concombre, citron vert et gingembre.",
    price: 4.9,
    image:
      "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "tacos-boeuf",
    id: "40000000-0000-4000-8000-000000000021",
    restaurantKey: "tacos-canal",
    name: "Tacos boeuf braise",
    description: "Tortillas, boeuf effiloche, salsa et coriandre.",
    price: 10.8,
    image:
      "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "burrito-poulet",
    id: "40000000-0000-4000-8000-000000000022",
    restaurantKey: "tacos-canal",
    name: "Burrito poulet",
    description: "Poulet marine, riz, haricots noirs et fromage.",
    price: 12.4,
    image:
      "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "quesadilla",
    id: "40000000-0000-4000-8000-000000000023",
    restaurantKey: "tacos-canal",
    name: "Quesadilla fromage",
    description: "Tortilla grillee, cheddar fondant et pico de gallo.",
    price: 8.9,
    image:
      "https://images.unsplash.com/photo-1618040996337-56904b7850b9?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "nachos",
    id: "40000000-0000-4000-8000-000000000024",
    restaurantKey: "tacos-canal",
    name: "Nachos a partager",
    description: "Chips de mais, cheddar, jalapenos, salsa et guacamole.",
    price: 9.5,
    image:
      "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "butter-chicken",
    id: "40000000-0000-4000-8000-000000000025",
    restaurantKey: "curry-club",
    name: "Butter chicken",
    description: "Poulet tandoori, sauce tomate epicee et riz basmati.",
    price: 15.2,
    image:
      "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "dal-makhani",
    id: "40000000-0000-4000-8000-000000000026",
    restaurantKey: "curry-club",
    name: "Dal makhani",
    description: "Lentilles noires mijotees, creme et epices douces.",
    price: 11.7,
    image:
      "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "naan-fromage",
    id: "40000000-0000-4000-8000-000000000027",
    restaurantKey: "curry-club",
    name: "Naan fromage",
    description: "Pain indien garni au fromage, cuit au tandoor.",
    price: 4.2,
    image:
      "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "lassi-mangue",
    id: "40000000-0000-4000-8000-000000000028",
    restaurantKey: "curry-club",
    name: "Lassi mangue",
    description: "Yaourt, mangue et cardamome.",
    price: 4.8,
    image:
      "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "boeuf-bourguignon",
    id: "40000000-0000-4000-8000-000000000029",
    restaurantKey: "bistrot-saint-martin",
    name: "Boeuf bourguignon",
    description: "Boeuf mijote, carottes, champignons et pommes vapeur.",
    price: 17.9,
    image:
      "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "croque-monsieur",
    id: "40000000-0000-4000-8000-000000000030",
    restaurantKey: "bistrot-saint-martin",
    name: "Croque monsieur",
    description: "Pain de campagne, jambon, comte et bechamel.",
    price: 10.5,
    image:
      "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "soupe-oignon",
    id: "40000000-0000-4000-8000-000000000031",
    restaurantKey: "bistrot-saint-martin",
    name: "Soupe a l'oignon",
    description: "Oignons confits, bouillon maison et fromage gratine.",
    price: 8.8,
    image:
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "creme-brulee",
    id: "40000000-0000-4000-8000-000000000032",
    restaurantKey: "bistrot-saint-martin",
    name: "Creme brulee",
    description: "Vanille bourbon et caramel croquant.",
    price: 6.2,
    image:
      "https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "pancakes",
    id: "40000000-0000-4000-8000-000000000033",
    restaurantKey: "sweet-corner",
    name: "Pancakes sirop d'erable",
    description: "Trois pancakes moelleux, fruits rouges et sirop d'erable.",
    price: 9.6,
    image:
      "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "brownie",
    id: "40000000-0000-4000-8000-000000000034",
    restaurantKey: "sweet-corner",
    name: "Brownie noix",
    description: "Brownie chocolat noir, noix de pecan et creme anglaise.",
    price: 5.7,
    image:
      "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "cheesecake",
    id: "40000000-0000-4000-8000-000000000035",
    restaurantKey: "sweet-corner",
    name: "Cheesecake citron",
    description: "Base biscuit, creme citronnee et zeste frais.",
    price: 6.4,
    image:
      "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=900&q=80",
  },
  {
    key: "iced-latte",
    id: "40000000-0000-4000-8000-000000000036",
    restaurantKey: "sweet-corner",
    name: "Iced latte vanille",
    description: "Cafe froid, lait, vanille et glacons.",
    price: 4.9,
    image:
      "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=80",
  },
];

const orders: OrderFixture[] = [
  {
    id: "66666666-6666-4666-8666-666666666666",
    userKey: "client",
    restaurantKey: "comptoir-test",
    date: "2026-05-21T10:15:00.000Z",
    status: "PENDING",
    items: [
      { id: "77777777-7777-4777-8777-777777777777", dishKey: "burger-maison", quantity: 2 },
      { id: "88888888-8888-4888-8888-888888888888", dishKey: "frites-fraiches", quantity: 1 },
    ],
  },
  {
    id: "60000000-0000-4000-8000-000000000002",
    userKey: "lea",
    restaurantKey: "comptoir-test",
    date: "2026-05-21T11:05:00.000Z",
    status: "CONFIRMED",
    items: [
      { id: "70000000-0000-4000-8000-000000000003", dishKey: "menu-smash", quantity: 1 },
      { id: "70000000-0000-4000-8000-000000000004", dishKey: "cookie-chocolat", quantity: 2 },
    ],
  },
  {
    id: "60000000-0000-4000-8000-000000000003",
    userKey: "hugo",
    restaurantKey: "maison-bao",
    date: "2026-05-21T11:35:00.000Z",
    status: "PREPARING",
    items: [
      { id: "70000000-0000-4000-8000-000000000005", dishKey: "bao-porc", quantity: 2 },
      { id: "70000000-0000-4000-8000-000000000006", dishKey: "nouilles-sate", quantity: 1 },
    ],
  },
  {
    id: "60000000-0000-4000-8000-000000000004",
    userKey: "ines",
    restaurantKey: "maison-bao",
    date: "2026-05-20T18:30:00.000Z",
    status: "DELIVERED",
    items: [
      { id: "70000000-0000-4000-8000-000000000007", dishKey: "menu-bao", quantity: 2 },
      { id: "70000000-0000-4000-8000-000000000008", dishKey: "bao-veggie", quantity: 1 },
    ],
  },
  {
    id: "60000000-0000-4000-8000-000000000005",
    userKey: "thomas",
    restaurantKey: "bella-roma",
    date: "2026-05-21T12:20:00.000Z",
    status: "READY",
    items: [
      { id: "70000000-0000-4000-8000-000000000009", dishKey: "pizza-diavola", quantity: 1 },
      { id: "70000000-0000-4000-8000-000000000010", dishKey: "tiramisu", quantity: 1 },
    ],
  },
  {
    id: "60000000-0000-4000-8000-000000000006",
    userKey: "sofia",
    restaurantKey: "bella-roma",
    date: "2026-05-19T19:45:00.000Z",
    status: "DELIVERED",
    items: [
      { id: "70000000-0000-4000-8000-000000000011", dishKey: "pizza-margherita", quantity: 2 },
      { id: "70000000-0000-4000-8000-000000000012", dishKey: "pasta-truffe", quantity: 1 },
    ],
  },
  {
    id: "60000000-0000-4000-8000-000000000007",
    userKey: "client",
    restaurantKey: "sushi-lumiere",
    date: "2026-05-21T09:40:00.000Z",
    status: "PENDING",
    items: [
      { id: "70000000-0000-4000-8000-000000000013", dishKey: "plateau-saumon", quantity: 1 },
      { id: "70000000-0000-4000-8000-000000000014", dishKey: "mochi-mangue", quantity: 2 },
    ],
  },
  {
    id: "60000000-0000-4000-8000-000000000008",
    userKey: "lea",
    restaurantKey: "sushi-lumiere",
    date: "2026-05-20T13:25:00.000Z",
    status: "CONFIRMED",
    items: [
      { id: "70000000-0000-4000-8000-000000000015", dishKey: "chirashi-thon", quantity: 1 },
      { id: "70000000-0000-4000-8000-000000000016", dishKey: "bento-poulet", quantity: 1 },
    ],
  },
  {
    id: "60000000-0000-4000-8000-000000000009",
    userKey: "hugo",
    restaurantKey: "green-garden",
    date: "2026-05-21T08:10:00.000Z",
    status: "PREPARING",
    items: [
      { id: "70000000-0000-4000-8000-000000000017", dishKey: "bowl-quinoa", quantity: 1 },
      { id: "70000000-0000-4000-8000-000000000018", dishKey: "jus-detox", quantity: 1 },
    ],
  },
  {
    id: "60000000-0000-4000-8000-000000000010",
    userKey: "ines",
    restaurantKey: "green-garden",
    date: "2026-05-20T12:55:00.000Z",
    status: "DELIVERED",
    items: [
      { id: "70000000-0000-4000-8000-000000000019", dishKey: "salade-cesar-veggie", quantity: 2 },
      { id: "70000000-0000-4000-8000-000000000020", dishKey: "wrap-falafel", quantity: 1 },
    ],
  },
  {
    id: "60000000-0000-4000-8000-000000000011",
    userKey: "thomas",
    restaurantKey: "tacos-canal",
    date: "2026-05-21T12:45:00.000Z",
    status: "READY",
    items: [
      { id: "70000000-0000-4000-8000-000000000021", dishKey: "tacos-boeuf", quantity: 3 },
      { id: "70000000-0000-4000-8000-000000000022", dishKey: "nachos", quantity: 1 },
    ],
  },
  {
    id: "60000000-0000-4000-8000-000000000012",
    userKey: "sofia",
    restaurantKey: "tacos-canal",
    date: "2026-05-18T20:00:00.000Z",
    status: "DELIVERED",
    items: [
      { id: "70000000-0000-4000-8000-000000000023", dishKey: "burrito-poulet", quantity: 2 },
      { id: "70000000-0000-4000-8000-000000000024", dishKey: "quesadilla", quantity: 1 },
    ],
  },
  {
    id: "60000000-0000-4000-8000-000000000013",
    userKey: "client",
    restaurantKey: "curry-club",
    date: "2026-05-21T13:05:00.000Z",
    status: "PENDING",
    items: [
      { id: "70000000-0000-4000-8000-000000000025", dishKey: "butter-chicken", quantity: 1 },
      { id: "70000000-0000-4000-8000-000000000026", dishKey: "naan-fromage", quantity: 2 },
    ],
  },
  {
    id: "60000000-0000-4000-8000-000000000014",
    userKey: "lea",
    restaurantKey: "curry-club",
    date: "2026-05-19T18:40:00.000Z",
    status: "DELIVERED",
    items: [
      { id: "70000000-0000-4000-8000-000000000027", dishKey: "dal-makhani", quantity: 1 },
      { id: "70000000-0000-4000-8000-000000000028", dishKey: "lassi-mangue", quantity: 2 },
    ],
  },
  {
    id: "60000000-0000-4000-8000-000000000015",
    userKey: "hugo",
    restaurantKey: "bistrot-saint-martin",
    date: "2026-05-21T12:00:00.000Z",
    status: "CONFIRMED",
    items: [
      { id: "70000000-0000-4000-8000-000000000029", dishKey: "boeuf-bourguignon", quantity: 1 },
      { id: "70000000-0000-4000-8000-000000000030", dishKey: "creme-brulee", quantity: 1 },
    ],
  },
  {
    id: "60000000-0000-4000-8000-000000000016",
    userKey: "ines",
    restaurantKey: "bistrot-saint-martin",
    date: "2026-05-18T12:20:00.000Z",
    status: "DELIVERED",
    items: [
      { id: "70000000-0000-4000-8000-000000000031", dishKey: "croque-monsieur", quantity: 2 },
      { id: "70000000-0000-4000-8000-000000000032", dishKey: "soupe-oignon", quantity: 1 },
    ],
  },
  {
    id: "60000000-0000-4000-8000-000000000017",
    userKey: "thomas",
    restaurantKey: "sweet-corner",
    date: "2026-05-21T14:30:00.000Z",
    status: "PREPARING",
    items: [
      { id: "70000000-0000-4000-8000-000000000033", dishKey: "pancakes", quantity: 1 },
      { id: "70000000-0000-4000-8000-000000000034", dishKey: "iced-latte", quantity: 1 },
    ],
  },
  {
    id: "60000000-0000-4000-8000-000000000018",
    userKey: "sofia",
    restaurantKey: "sweet-corner",
    date: "2026-05-20T16:10:00.000Z",
    status: "DELIVERED",
    items: [
      { id: "70000000-0000-4000-8000-000000000035", dishKey: "brownie", quantity: 2 },
      { id: "70000000-0000-4000-8000-000000000036", dishKey: "cheesecake", quantity: 1 },
    ],
  },
];

async function main() {
  const passwords = {
    admin: await hash("password123", 10),
    default: await hash("Password123!", 10),
  };

  const userIds = new Map<string, string>();
  for (const user of users) {
    const password = passwords[user.passwordKey ?? "default"];
    const savedUser = await prisma.user.upsert({
      where: { email: user.email },
      create: {
        id: user.id,
        email: user.email,
        password,
        firstname: user.firstname,
        lastname: user.lastname,
        phoneNumber: user.phoneNumber,
        role: user.role,
        city: user.city,
        cp: user.cp,
        address: user.address,
        details: user.details,
        picture: user.picture,
      },
      update: {
        password,
        firstname: user.firstname,
        lastname: user.lastname,
        phoneNumber: user.phoneNumber,
        role: user.role,
        city: user.city,
        cp: user.cp,
        address: user.address,
        details: user.details ?? null,
        picture: user.picture ?? null,
      },
    });

    userIds.set(user.key, savedUser.id);
  }

  const restaurantIds = new Map<string, string>();
  for (const restaurant of restaurants) {
    const ownerId = userIds.get(restaurant.ownerKey);
    if (!ownerId) {
      throw new Error(`Missing owner fixture: ${restaurant.ownerKey}`);
    }

    const savedRestaurant = await prisma.restaurant.upsert({
      where: { name: restaurant.name },
      create: {
        id: restaurant.id,
        userId: ownerId,
        name: restaurant.name,
        description: restaurant.description,
        image: restaurant.image,
        rating: restaurant.rating,
        deliveryTime: restaurant.deliveryTime,
        deliveryFee: restaurant.deliveryFee,
        cuisine: restaurant.cuisine,
        distance: restaurant.distance,
      },
      update: {
        userId: ownerId,
        description: restaurant.description,
        image: restaurant.image,
        rating: restaurant.rating,
        deliveryTime: restaurant.deliveryTime,
        deliveryFee: restaurant.deliveryFee,
        cuisine: restaurant.cuisine,
        distance: restaurant.distance,
      },
    });

    restaurantIds.set(restaurant.key, savedRestaurant.id);
  }

  const dishIds = new Map<string, string>();
  const dishPrices = new Map<string, number>();
  for (const dish of dishes) {
    const restaurantId = restaurantIds.get(dish.restaurantKey);
    if (!restaurantId) {
      throw new Error(`Missing restaurant fixture: ${dish.restaurantKey}`);
    }

    const savedDish = await prisma.dish.upsert({
      where: { id: dish.id },
      create: {
        id: dish.id,
        restaurantId,
        name: dish.name,
        description: dish.description,
        price: dish.price,
        image: dish.image,
      },
      update: {
        restaurantId,
        name: dish.name,
        description: dish.description,
        price: dish.price,
        image: dish.image,
      },
    });

    dishIds.set(dish.key, savedDish.id);
    dishPrices.set(dish.key, savedDish.price);
  }

  for (const order of orders) {
    const userId = userIds.get(order.userKey);
    const restaurantId = restaurantIds.get(order.restaurantKey);
    if (!userId) {
      throw new Error(`Missing user fixture: ${order.userKey}`);
    }
    if (!restaurantId) {
      throw new Error(`Missing restaurant fixture: ${order.restaurantKey}`);
    }

    const items = order.items.map((item) => {
      const dishId = dishIds.get(item.dishKey);
      const unitPrice = dishPrices.get(item.dishKey);
      if (!dishId || unitPrice === undefined) {
        throw new Error(`Missing dish fixture: ${item.dishKey}`);
      }

      return {
        id: item.id,
        dishId,
        quantity: item.quantity,
        price: Number((unitPrice * item.quantity).toFixed(2)),
      };
    });
    const total = Number(
      items.reduce((sum, item) => sum + item.price, 0).toFixed(2),
    );

    await prisma.order.upsert({
      where: { id: order.id },
      create: {
        id: order.id,
        userId,
        restaurantId,
        date: new Date(order.date),
        total,
        status: order.status,
        items: {
          create: items,
        },
      },
      update: {
        userId,
        restaurantId,
        date: new Date(order.date),
        total,
        status: order.status,
        items: {
          deleteMany: {},
          create: items,
        },
      },
    });
  }

  console.log(
    `Seed data inserted successfully: ${users.length} users, ${restaurants.length} restaurants, ${dishes.length} dishes, ${orders.length} orders.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
