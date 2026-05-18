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

  type User {
    id: String!
    email: String!
    role: String!
    firstname: String!
    lastname: String!
    picture: String
    phoneNumber: String
    city: String!
    cp: String!
    address: String!
  }

  input CreateDishInput {
    restaurantId: String!
    name: String!
    description: String!
    price: Float!
    image: String
  }

  input UpdateDishInput {
    name: String
    description: String
    price: Float
    image: String
  }

  input OrderItemInput {
    dishId: String!
    quantity: Int!
  }

  input CreateOrderInput {
    restaurantId: String!
    items: [OrderItemInput!]!
  }

  type Query {
    restaurants: [Restaurant!]!
    restaurant(id: String!): Restaurant
    restaurantDishes(restaurantId: String!): [Dish!]!
    dishes: [Dish!]!
    orders: [Order!]!
    me: User
  }

  type Mutation {
    createDish(input: CreateDishInput!): Dish!
    updateDish(id: String!, input: UpdateDishInput!): Dish!
    createOrder(input: CreateOrderInput!): Order!
    updateOrderStatus(id: String!, status: String!): Order!
  }
`;
