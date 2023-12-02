import {VK} from "vk-io";
import {Context} from "../Context";

export type VkUser = {
    id: number,
    firstName: string,
    lastName: string
}

const CACHE_TTL = 15 * 60 * 1000;

export default class VkUsersService {
    private vk!: VK;

    constructor(private context: Context) {
        context.onReady(() => {
            this.vk = this.context.vk!;
        });
    }

    private apiCache: Map<number, { firstName: string; lastName: string; timer: NodeJS.Timeout }> = new Map();

    async getUser(id: number): Promise<VkUser | null> {
        const cacheEntry = this.apiCache.get(id);
        if (cacheEntry)
            return { id, firstName: cacheEntry.firstName, lastName: cacheEntry.lastName };

        try {
            const user = await this.fetchUser(id);
            const timer = setTimeout(() => { this.apiCache.delete(id) }, CACHE_TTL);
            this.apiCache.set(id, { firstName: user.firstName, lastName: user.lastName, timer });
            return user;
        } catch (error) {
            console.error('Failed to fetch user:', error);
            return null;
        }
    }

    async getUsers(ids: number[]): Promise<Map<number, VkUser>> {
        const users: Map<number, VkUser> = new Map();
        const idsToFetch: number[] = [];

        for (const id of ids) {
            const cachedUser = this.apiCache.get(id);
            if (cachedUser) {
                users.set(id, { id, firstName: cachedUser.firstName, lastName: cachedUser.lastName });
            } else {
                if (id > 0)
                    idsToFetch.push(id);
                else if (id == 0)
                    users.set(id, this.createMockUser(id, "(me)", ""));
                else
                    users.set(id, this.createMockUser(id, "__vk_group__", ""));
            }
        }

        if (idsToFetch.length > 0) {
            const response = await this.vk.api.users.get({
                user_ids: idsToFetch,
                fields: ["first_name_nom", "last_name_nom"],
            });
            for (const responseItem of response) {
                const id = responseItem.id;
                const user = { id, firstName: responseItem.first_name_nom, lastName: responseItem.last_name_nom }
                users.set(id, user);
                const timer = setTimeout(() => { this.apiCache.delete(id) }, CACHE_TTL);
                this.apiCache.set(id, { firstName: user.firstName, lastName: user.lastName, timer });
            }
        }

        return users;
    }

    private async fetchUser(id: number): Promise<VkUser> {
        if (id > 0) {
            const response = await this.vk.api.users.get({
                user_ids: [id],
                fields: ["first_name_nom", "last_name_nom"],
            });

            const firstName = response[0].first_name_nom;
            const lastName = response[0].last_name_nom;
            return { id, firstName, lastName };
        } else if (id == 0) { // This bot
            return this.createMockUser(id, "(me)", "");
        } else { // Group, not user
            return this.createMockUser(id, "__vk_group__", "");
        }
    }
    private createMockUser(id: number, firstName: string, lastName: string): VkUser {
        return {
            id,
            firstName: firstName,
            lastName: lastName,
        };
    }
}