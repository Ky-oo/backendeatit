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

const ids = {
  user: "11111111-1111-4111-8111-111111111111",
  restaurateur: "22222222-2222-4222-8222-222222222222",
  restaurant: "33333333-3333-4333-8333-333333333333",
  dishBurger: "44444444-4444-4444-8444-444444444444",
  dishFries: "55555555-5555-4555-8555-555555555555",
  order: "66666666-6666-4666-8666-666666666666",
  orderItemBurger: "77777777-7777-4777-8777-777777777777",
  orderItemFries: "88888888-8888-4888-8888-888888888888",
};

async function main() {
  const password = await hash("Password123!", 10);

  await prisma.user.upsert({
    where: { email: "client@example.com" },
    create: {
      id: ids.user,
      email: "client@example.com",
      password,
      firstname: "Camille",
      lastname: "Martin",
      phoneNumber: "0600000001",
      role: "USER",
      city: "Paris",
      cp: "75001",
      address: "10 rue de Rivoli",
      details: "Code porte 1234",
    },
    update: {
      password,
      firstname: "Camille",
      lastname: "Martin",
      phoneNumber: "0600000001",
      role: "USER",
      city: "Paris",
      cp: "75001",
      address: "10 rue de Rivoli",
      details: "Code porte 1234",
    },
  });

  await prisma.user.upsert({
    where: { email: "restaurateur@example.com" },
    create: {
      id: ids.restaurateur,
      email: "restaurateur@example.com",
      password,
      firstname: "Nadia",
      lastname: "Benali",
      phoneNumber: "0600000002",
      role: "RESTAURANT",
      city: "Paris",
      cp: "75011",
      address: "25 avenue Parmentier",
    },
    update: {
      password,
      firstname: "Nadia",
      lastname: "Benali",
      phoneNumber: "0600000002",
      role: "RESTAURANT",
      city: "Paris",
      cp: "75011",
      address: "25 avenue Parmentier",
    },
  });

  await prisma.restaurant.upsert({
    where: { id: ids.restaurant },
    create: {
      id: ids.restaurant,
      userId: ids.restaurateur,
      name: "Le Comptoir Test",
      description: "Restaurant de seed pour le developpement.",
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5",
      rating: 4.6,
      deliveryTime: "25-35 min",
      deliveryFee: 2.99,
      cuisine: "Burgers",
      distance: 2,
    },
    update: {
      userId: ids.restaurateur,
      name: "Le Comptoir Test",
      description: "Restaurant de seed pour le developpement.",
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5",
      rating: 4.6,
      deliveryTime: "25-35 min",
      deliveryFee: 2.99,
      cuisine: "Burgers",
      distance: 2,
    },
  });

  await prisma.dish.upsert({
    where: { id: ids.dishBurger },
    create: {
      id: ids.dishBurger,
      restaurantId: ids.restaurant,
      name: "Burger maison",
      description: "Bun brioche, steak, cheddar, pickles et sauce maison.",
      price: 12.5,
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
    },
    update: {
      restaurantId: ids.restaurant,
      name: "Burger maison",
      description: "Bun brioche, steak, cheddar, pickles et sauce maison.",
      price: 12.5,
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
    },
  });

  await prisma.dish.upsert({
    where: { id: ids.dishFries },
    create: {
      id: ids.dishFries,
      restaurantId: ids.restaurant,
      name: "Frites fraiches",
      description: "Pommes de terre coupees maison.",
      price: 4.5,
      image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877",
    },
    update: {
      restaurantId: ids.restaurant,
      name: "Frites fraiches",
      description: "Pommes de terre coupees maison.",
      price: 4.5,
      image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877",
    },
  });

  await prisma.order.upsert({
    where: { id: ids.order },
    create: {
      id: ids.order,
      userId: ids.user,
      restaurantId: ids.restaurant,
      date: new Date("2026-04-29T12:00:00.000Z"),
      total: 29.5,
      status: "PENDING",
      items: {
        create: [
          {
            id: ids.orderItemBurger,
            dishId: ids.dishBurger,
            quantity: 2,
            price: 25,
          },
          {
            id: ids.orderItemFries,
            dishId: ids.dishFries,
            quantity: 1,
            price: 4.5,
          },
        ],
      },
    },
    update: {
      userId: ids.user,
      restaurantId: ids.restaurant,
      date: new Date("2026-04-29T12:00:00.000Z"),
      total: 29.5,
      status: "PENDING",
      items: {
        deleteMany: {},
        create: [
          {
            id: ids.orderItemBurger,
            dishId: ids.dishBurger,
            quantity: 2,
            price: 25,
          },
          {
            id: ids.orderItemFries,
            dishId: ids.dishFries,
            quantity: 1,
            price: 4.5,
          },
        ],
      },
    },
  });
}

main()
  .then(async () => {
    console.log("Seed data inserted successfully.");
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
