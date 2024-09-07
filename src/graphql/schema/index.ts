export const dummySchema = (`#graphql
    type User {
        id:String
    }
    type Query {
        allUser:[User]
    }
`)