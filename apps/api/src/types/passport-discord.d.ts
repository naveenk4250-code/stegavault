declare module 'passport-discord' {
  import { Strategy as PassportStrategy } from 'passport';
  export class Strategy extends PassportStrategy {
    constructor(options: any, verify: any);
  }
}
