'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'REQUESTER' | 'TECHNICIAN' | 'FACILITY_MANAGER' | 'ADMIN';
  department?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      user {
        id
        email
        name
        role
        department
      }
    }
  }
`;

const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      name
      role
      department
    }
  }
`;

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
  isLoading: true,
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [executeLogin] = useMutation(LOGIN_MUTATION);
  const { data: meData, refetch: refetchMe } = useQuery(ME_QUERY, {
    skip: !token,
    errorPolicy: 'ignore',
  });

  useEffect(() => {
    const storedToken = localStorage.getItem('fixflow_token');
    const storedUser = localStorage.getItem('fixflow_user');
    if (storedToken) {
      setToken(storedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {}
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (meData?.me) {
      setUser(meData.me);
      localStorage.setItem('fixflow_user', JSON.stringify(meData.me));
    }
  }, [meData]);

  const login = async (email: string, pass: string) => {
    const res = await executeLogin({
      variables: {
        input: { email, password: pass },
      },
    });

    const authData = res.data?.login;
    if (authData) {
      setToken(authData.accessToken);
      setUser(authData.user);
      localStorage.setItem('fixflow_token', authData.accessToken);
      localStorage.setItem('fixflow_user', JSON.stringify(authData.user));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('fixflow_token');
    localStorage.removeItem('fixflow_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isLoading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
