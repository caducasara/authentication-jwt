export class AuthTokenError extends Error {
  constructor(){
    super('With authentication token.')
  }
}