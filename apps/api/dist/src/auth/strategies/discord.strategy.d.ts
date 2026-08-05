import { Strategy } from 'passport-discord';
declare const DiscordStrategy_base: new (...args: [options: any, verify: any] | [options: any]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class DiscordStrategy extends DiscordStrategy_base {
    constructor();
    validate(accessToken: string, refreshToken: string, profile: any, done: Function): Promise<any>;
}
export {};
