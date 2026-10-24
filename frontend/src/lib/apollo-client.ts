import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql',
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      const code = err.extensions?.code;
      const msg = err.message?.toLowerCase() || '';
      if (
        code === 'UNAUTHENTICATED' ||
        msg.includes('unauthorized') ||
        msg.includes('session expired') ||
        msg.includes('session has been revoked') ||
        msg.includes('no longer active')
      ) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('fixflow_token');
          localStorage.removeItem('fixflow_user');
        }
      }
    }
  }
});

const authLink = setContext((_, { headers }) => {
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('fixflow_token');
  }

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
