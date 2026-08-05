import type { Response } from 'express';
export declare class AuthController {
    googleLogin(): void;
    googleCallback(req: any, res: Response): void;
    discordLogin(): void;
    discordCallback(req: any, res: Response): void;
    linkedinLogin(): void;
    linkedinCallback(req: any, res: Response): void;
}
