import axios, { AxiosError } from 'axios'
import Router from 'next/router';
import { destroyCookie, parseCookies, setCookie } from 'nookies'
import { signOut } from '../contexts/AuthContext';
import { AuthTokenError } from '../errors/AuthTokenError';

let cookies = parseCookies();
let isRefreshing = false;
let failedRequestsQueue = [];

export function setupAPIClient(context = undefined) {

  let cookies = parseCookies(context);

  const api = axios.create({
    baseURL: 'http://localhost:3333/',
    headers: {
      Authorization: `Bearer ${cookies['nextAuth.token']}`
    }
  })
  
  //recebe duas funções como parametro
  //1 - o que fazer se a resposta der sucesso
  //2 - o que fazer se a resposta der errado
  api.interceptors.response.use(response => {
    return response;
  }, (error: AxiosError) => {
    if(error.response?.status === 401){
      if(error.response.data?.code === 'token.expired'){
        //renovar o token
  
        //atualizar cookies salvos
        cookies = parseCookies(context);
        const orgininalConfig  = error.config
  
        //busar dentro dos cookies atualizados o refreshToken
        const { 'nextAuth.refreshToken': refreshToken } = cookies
  
        if(!isRefreshing){
          isRefreshing = true;
  
          api.post('refresh', {
            refreshToken,
          }).then(response => {
            const { token } = response.data

            console.log('refresh')
    
            setCookie(context, 'nextAuth.token', token, {
              maxAge: 60 * 60 * 24 * 30, // 30 days
              path: '/'
            })
      
            setCookie(context, 'nextAuth.refreshToken', response.data.refreshToken, {
              maxAge: 60 * 60 * 24 * 30, // 30 days
              path: '/'
            })
    
            api.defaults.headers['Authorization'] = `Bearer ${token}`
  
            failedRequestsQueue.forEach(request => request.onSuccess(token));
            failedRequestsQueue = [];
          }).catch( err => {
            failedRequestsQueue.forEach(request => request.onFailure(err));
            failedRequestsQueue = [];
  
            if(process.browser){
              signOut();
            }
          }).finally(() => {
            isRefreshing = false;
          })
        }
  
        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({
            onSuccess: (token: string) => {
              orgininalConfig.headers['Authorization'] = `Bearer ${token}`
  
              resolve(api(orgininalConfig))
            },
            onFailure: (err: AxiosError) => {
              reject(err)
            }
          })
        })
  
      } else {
        //deslogar o usuario
        if(process.browser){
          signOut()
        }else {
          return Promise.reject(new AuthTokenError())
        }
  
      }
    }
  
    return Promise.reject(error)
  })

  return api;
}