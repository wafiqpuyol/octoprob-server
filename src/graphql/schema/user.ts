import { buildSchema } from 'graphql';

export const userSchema = buildSchema(`#graphql
# used in Oauth login and register
  input Auth {
    username: String!
    email: String!
    password: String!
    socialId: String
    type: String
  }

  input SocialAuth {
    username: String!
    email: String!
    socialId: String
    type: String
  }

  type User {
    id: Int
    username: String
    email: String
    createdAt: String
    googleId: String
    facebookId: String
  }

  type NotificationResult {
    id: ID!
    userId: Int!
    groupName: String!
    emails: String!
  }

  type AuthResponse {
    user: User!
    notifications: [NotificationResult!]!
    message: String
  }

  type AuthLogoutResponse {
    message: String
  }

  type CurrentUserResponse {
    user: User
    notifications: [NotificationResult]
  }

  type Query {
    checkCurrentUser: CurrentUserResponse
  }

  type Mutation {
    loginUser(email: String!, password: String!): AuthResponse!
    registerUser(user: Auth!): AuthResponse!
    authSocialUser(user: SocialAuth!): AuthResponse!
    logout: AuthLogoutResponse!
  }
`);
