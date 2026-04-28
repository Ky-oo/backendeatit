export const restaurantSchema = `
  type Restaurant {
    id: String!
    name: String!
    cuisine: String!
    deliveryFee: Float!
    deliveryTime: String!
    description: String!
    distance: Float!
    image: String!
    rating: Float!
    userId: String!
    dishes: [Dish!]!
  }

  type Dish {
    id: String!
    restaurantId: String!
    name: String!
    description: String!
    price: Float!
    image: String
  }

  type Order {
    id: String!
    userId: String!
    restaurantId: String!
    total: Float!
    status: String!
    createdAt: String!
    updatedAt: String!
    items: [OrderItem!]!
  }

  type OrderItem {
    id: String!
    dishId: String!
    quantity: Int!
  }

  type Query {
    restaurants: [Restaurant!]!
    restaurant(id: String!): Restaurant
    restaurantDishes(restaurantId: String!): [Dish!]!
  }
`;
