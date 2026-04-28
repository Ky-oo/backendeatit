import dotenvx from "@dotenvx/dotenvx";

// overload: false → les variables déjà présentes dans process.env (injectées
// par docker-compose) ont priorité sur celles du .env déchiffré.
// Ex: DATABASE_URL=mysql://mysql:3306 injecté par Docker ne sera pas écrasé
// par la valeur localhost:3307 du .env de développement.
dotenvx.config({ overload: false });
