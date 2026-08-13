export declare class AppController {
    getApiStatus(): {
        name: string;
        version: string;
        status: string;
        timestamp: string;
        endpoints: {
            oauthGoogle: string;
            oauthDiscord: string;
            oauthLinkedIn: string;
        };
    };
}
