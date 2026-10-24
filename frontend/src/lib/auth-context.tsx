'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { apolloClient } from './apollo-client';
import { UserRole, AccountStatus } from './types';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  status: AccountStatus;
  emailVerified: boolean;
  department?: string;
  phone?: string;
  institutionalId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, pass: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  isLoading: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<AuthUser | null>;
}

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      user {
        id
        email
        firstName
        lastName
        name
        role
        status
        emailVerified
        department
        phone
        institutionalId
      }
    }
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      firstName
      lastName
      name
      role
      status
      emailVerified
      department
      phone
      institutionalId
    }
  }
`;

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {
    throw new Error('AuthProvider not initialized');
  },
  logout: async () => {},
  isLoading: true,
  loading: true,
  isAuthenticated: false,
  refreshUser: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [executeLogin] = useMutation(LOGIN_MUTATION);

  // Authoritatively fetch and verify current user identity from backend via ME_QUERY
  const resolveCurrentUser = React.useCallback(
    async (activeToken?: string | null): Promise<AuthUser | null> => {
      const tokenToUse =
        activeToken ??
        (typeof window !== 'undefined' ? localStorage.getItem('fixflow_token') : null);

      if (!tokenToUse) {
        return null;
      }

      try {
        const res = await apolloClient.query<{ me: AuthUser }>({
          query: ME_QUERY,
          fetchPolicy: 'network-only',
          context: {
            headers: {
              authorization: `Bearer ${tokenToUse}`,
            },
          },
        });

        const meUser = res.data?.me;
        if (meUser) {
          if (
            meUser.status &&
            meUser.status !== 'ACTIVE' &&
            meUser.status !== 'REJECTED'
          ) {
            return null;
          }
          return meUser;
        }
        return null;
      } catch (err: any) {
        const isAuthError =
          err?.graphQLErrors?.some((e: any) => {
            const code = e.extensions?.code;
            const msg = e.message?.toLowerCase() || '';
            return (
              code === 'UNAUTHENTICATED' ||
              code === 'FORBIDDEN' ||
              msg.includes('unauthorized') ||
              msg.includes('session') ||
              msg.includes('revoked') ||
              msg.includes('expired') ||
              msg.includes('not currently in an authorized status')
            );
          }) || false;

        if (isAuthError) {
          throw new Error('UNAUTHENTICATED_SESSION');
        }
        throw err;
      }
    },
    [],
  );

  const logout = React.useCallback(async () => {
    setIsLoading(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fixflow_token');
        localStorage.removeItem('fixflow_user');
      }
      setToken(null);
      setUser(null);
      try {
        await apolloClient.clearStore();
      } catch (e) {
        console.warn('Apollo clearStore on logout error:', e);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = React.useCallback(
    async (email: string, pass: string): Promise<AuthUser> => {
      setIsLoading(true);
      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = pass.trim();

      try {
        // Step 1: Invalidate previous session and clear store prior to new authentication
        if (typeof window !== 'undefined') {
          localStorage.removeItem('fixflow_token');
          localStorage.removeItem('fixflow_user');
        }
        setToken(null);
        setUser(null);
        try {
          await apolloClient.clearStore();
        } catch (e) {
          console.warn('Apollo clearStore on login pre-clean error:', e);
        }

        // Step 2: Execute login mutation
        const res = await executeLogin({
          variables: {
            input: { email: cleanEmail, password: cleanPass },
          },
        });

        const authData = res.data?.login;
        if (!authData?.user || !authData?.accessToken) {
          throw new Error('Authentication response was incomplete. Please try again.');
        }

        const loggedUser: AuthUser = authData.user;
        if (
          loggedUser.status &&
          loggedUser.status !== 'ACTIVE' &&
          loggedUser.status !== 'REJECTED'
        ) {
          await logout();
          throw new Error('Account is not currently in an authorized active state.');
        }

        // Step 3: Persist token to storage and state immediately so any query uses new identity
        if (typeof window !== 'undefined') {
          localStorage.setItem('fixflow_token', authData.accessToken);
        }

        // Step 4: Authoritatively verify identity against backend ME_QUERY
        let resolvedUser: AuthUser = loggedUser;
        try {
          const verified = await resolveCurrentUser(authData.accessToken);
          if (verified) {
            resolvedUser = verified;
          }
        } catch (meErr: any) {
          if (meErr?.message === 'UNAUTHENTICATED_SESSION') {
            await logout();
            throw new Error('Failed to verify institutional session. Please try logging in again.');
          }
          // If transient network glitch occurred, loggedUser from mutation is legitimate
        }

        // Step 5: Update storage, cache, and state with authoritatively resolved user
        if (typeof window !== 'undefined') {
          localStorage.setItem('fixflow_user', JSON.stringify(resolvedUser));
        }
        try {
          apolloClient.writeQuery({
            query: ME_QUERY,
            data: { me: resolvedUser },
          });
        } catch {}

        setToken(authData.accessToken);
        setUser(resolvedUser);

        return resolvedUser;
      } catch (err: any) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('fixflow_token');
          localStorage.removeItem('fixflow_user');
        }
        setToken(null);
        setUser(null);
        try {
          await apolloClient.clearStore();
        } catch {}

        const message = err?.message || '';

        // Check for network or server connection failure
        if (
          message.includes('Failed to fetch') ||
          message.includes('NetworkError') ||
          message.includes('fetch failed') ||
          err?.networkError
        ) {
          throw new Error(
            'FixFlow Authentication Service is currently unreachable. Please verify your connection or ensure the backend server is running.',
          );
        }

        // Check for uniform invalid credentials
        if (message.includes('Invalid email or password credentials')) {
          throw new Error('Invalid institutional credentials. Please check your campus email and password.');
        }

        throw new Error(message || 'Invalid institutional credentials. Please check your campus email and password.');
      } finally {
        setIsLoading(false);
      }
    },
    [executeLogin, logout, resolveCurrentUser],
  );

  const refreshUser = React.useCallback(async (): Promise<AuthUser | null> => {
    try {
      const verified = await resolveCurrentUser(token);
      if (verified) {
        setUser(verified);
        if (typeof window !== 'undefined') {
          localStorage.setItem('fixflow_user', JSON.stringify(verified));
        }
        try {
          apolloClient.writeQuery({
            query: ME_QUERY,
            data: { me: verified },
          });
        } catch {}
        return verified;
      }
      return null;
    } catch {
      return null;
    }
  }, [resolveCurrentUser, token]);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      setIsLoading(true);
      const storedToken =
        typeof window !== 'undefined' ? localStorage.getItem('fixflow_token') : null;
      const storedUser =
        typeof window !== 'undefined' ? localStorage.getItem('fixflow_user') : null;

      if (!storedToken) {
        if (isMounted) {
          setToken(null);
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      // Security: purge any legacy synthetic or mock tokens from prior offline testing
      if (storedToken.startsWith('mock-token-')) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('fixflow_token');
          localStorage.removeItem('fixflow_user');
        }
        if (isMounted) {
          setToken(null);
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      // Pre-hydrate from storage for immediate responsive rendering
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (
            parsed &&
            (parsed.status === 'ACTIVE' || parsed.status === 'REJECTED' || !parsed.status)
          ) {
            if (isMounted) {
              setToken(storedToken);
              setUser(parsed);
            }
          } else {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('fixflow_user');
              localStorage.removeItem('fixflow_token');
            }
          }
        } catch {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('fixflow_user');
          }
        }
      } else {
        if (isMounted) {
          setToken(storedToken);
        }
      }

      // Authoritatively verify token and user identity with backend
      try {
        const verified = await resolveCurrentUser(storedToken);
        if (isMounted) {
          if (verified) {
            setToken(storedToken);
            setUser(verified);
            if (typeof window !== 'undefined') {
              localStorage.setItem('fixflow_user', JSON.stringify(verified));
            }
            try {
              apolloClient.writeQuery({
                query: ME_QUERY,
                data: { me: verified },
              });
            } catch {}
          } else {
            await logout();
          }
        }
      } catch (err: any) {
        if (err?.message === 'UNAUTHENTICATED_SESSION') {
          if (isMounted) {
            await logout();
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [logout, resolveCurrentUser]);

  const isAuthenticated =
    !isLoading &&
    !!user &&
    (user.status === 'ACTIVE' || user.status === 'REJECTED' || !user.status);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isLoading,
        loading: isLoading,
        isAuthenticated,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
