import { Strategy } from 'passport-linkedin-oauth2';
declare const LinkedInStrategy_base: new (...args: [options: any, verify: any] | [options: any]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class LinkedInStrategy extends LinkedInStrategy_base {
    constructor();
    validate(accessToken: string, refreshToken: string, profile: any, done: Function): Promise<any>;
}
export {};
