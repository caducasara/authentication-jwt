import { createContext, ReactNode, useEffect, useState } from "react";
import { setupAPIClient } from "../services/api";
import Router from 'next/router'
import { setCookie, parseCookies, destroyCookie } from 'nookies'
import { api } from "../services/apiClient";

type User = {
  email: string;
  permissions: string[];
  roles: string[];
}

type SignInCredentials = {
  email: string;
  password: string;
}

type AuthContextData = {
  signIn(credentials: SignInCredentials): Promise<void>;
  signOut: () => void;
  user: User;
  isAuthenticated: boolean;
}

type AuthProviderProps = {
  children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextData)

let authChannel: BroadcastChannel

export async function signOut() {
  destroyCookie(undefined, 'nextAuth.token')
  destroyCookie(undefined, 'nextAuth.refreshToken')

  authChannel.postMessage('logout')

  Router.push('/')
}

export function AuthProvider({ children }: AuthProviderProps) {

  const [user, setUser] = useState<User>({} as User)
  const isAuthenticated = !!user.email;

  useEffect(() => {

    authChannel = new BroadcastChannel('auth')

    authChannel.onmessage = (message) => {
      switch(message.data){
        case 'logout':
          signOut()
          break;
        // case 'signIn':
        //   Router.push('/dashboard')
        //   break;
        default:
          break;
      }
    }
  }, [])

  useEffect(()=> {
    const {'nextAuth.token': token} = parseCookies();

    if(token) {
      api.get('me')
      .then(response => {
        const {email, permissions, roles } = response.data
        
        setUser({ email, permissions, roles })
      })
      .catch( () => {
        signOut();
      })
    }
  }, [])


  async function signIn({email, password}: SignInCredentials) {
    try { 
      
      const response = await api.post('sessions', { 
        email,
        password
      })
  
      const { token, refreshToken ,permissions, roles } = response.data;

      setCookie(undefined, 'nextAuth.token', token, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      })

      setCookie(undefined, 'nextAuth.refreshToken', refreshToken, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      })

      setUser({
        email,
        permissions,
        roles
      })

      api.defaults.headers['Authorization'] = `Bearer ${token}`

      Router.push('/dashboard')

      // authChannel.postMessage('signIn')
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <AuthContext.Provider value={{isAuthenticated, signIn,  user, signOut}}>
      {children}
    </AuthContext.Provider>
  )
}