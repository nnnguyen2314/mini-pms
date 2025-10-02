import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

const uri = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql';

const link = createHttpLink({ uri, credentials: 'include' });

export const apolloClient = new ApolloClient({
  link,
  cache: new InMemoryCache(),
});

export default apolloClient;
