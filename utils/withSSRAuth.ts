import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { destroyCookie, parseCookies } from "nookies";
import { AuthTokenError } from "../errors/AuthTokenError";
import decode from "jwt-decode"
import { validateUserPermission } from "./ValidateUserPermissions";
import Router from "next/router";
import { signOut } from "../contexts/AuthContext";


type WithSSRAuthOptions= {
  permissions?: string[];
  roles?: string[];
}

export function withSSRAuth<p>(fn: GetServerSideProps<p>, options?: WithSSRAuthOptions){
  
  return async (context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<p>> => {
    const cookies = parseCookies(context);
    const token =  cookies['nextAuth.token']

    if(!token){
      return {
        redirect: {
          destination: '/',
          permanent: false
        }
      }
    }

    if(options){
      const user = decode< { permissions: string[], roles: string[] } >(token)
      const { permissions, roles } = options
      
      const userHasValidatePermissions = validateUserPermission({
        user,
        permissions,
        roles
      })

      if(!userHasValidatePermissions) {

        return {
          redirect: {
            destination: '/dashboard',
            permanent: false
          }
        }
      }
    }

    try {
      return await fn(context)
    }catch (err) {

      if(err instanceof AuthTokenError) {
        signOut();
    
        return { 
          redirect: {
            destination: '/',
            permanent: false,
          }
        }
      }
    }
  }
}