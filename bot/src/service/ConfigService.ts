import {exit} from "node:process";
import * as process from "process";

export type AppConfig = {
    backendUrl: string;
    dbHost: string;
    dbName: string;
    dbPassword: string;
    dbPort: number | null;
    dbUser: string;
    vkAccessToken: string;
    vkGroupId: number;
}

export default class ConfigService {
    getEnv(key: string, defaultValue: string | null = null): string | null {
        return (key in process.env) ? process.env[key]! : defaultValue;
    }

    getNumericEnv(key: string, defaultValue: number | null = null): number | null {
        const result = this.getEnv(key);
        return result == null ? defaultValue : parseInt(result);
    }

    requireEnv(key: string): string {
        const result = this.getEnv(key);
        if (result == undefined) {
            console.error(`This app needs environment variable '${key}' to be set.`);
            exit(1);
        }
        return result;
    }

    requireNumericEnv(key: string): number {
        const result = this.getNumericEnv(key);
        if (result == null) {
            console.error(`This app needs environment variable '${key}' to be set.`);
            exit(1);
        }
        return result;
    }

    getAppConfig(): AppConfig {
        return {
            backendUrl: this.requireEnv('BACKEND_URL'),
            dbHost: this.requireEnv('DB_HOST'),
            dbName: this.requireEnv('DB_NAME'),
            dbPassword: this.requireEnv('DB_PASSWORD'),
            dbPort: this.getNumericEnv('DB_PORT'),
            dbUser: this.requireEnv('DB_USER'),
            vkAccessToken: this.requireEnv('VK_ACCESS_TOKEN'),
            vkGroupId: this.requireNumericEnv('VK_GROUP_ID'),
        }
    }
}