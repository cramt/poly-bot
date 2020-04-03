import fetch from "node-fetch"

export interface SystemModel {
    id: string
    name: string | null
    description: string | null
    tag: string | null
    avatar_irl: string | null
    tz: string | null
    created: Date
}

export interface MemberModel {
    id: string
    name: string | null
    display_name: string | null
    description: string | null
    color: string | null
    avatar_url: string | null
    birthday: Date | null
    prefix: string | null
    suffix: string | null
    proxy_tags: {
        prefix: string | null
        suffix: string | null
    }[]
    keep_proxy: boolean
    created: Date
}

export class PluralKitApi {
    token: string | null = null;
    systemInfo: SystemModel | null = null;
    memberInfo: MemberModel[] | null = null;
    systemId: string | null = null;
    discordId: string | null = null;

    private constructor() {

    }

    public static fromSystemId(systemId: string): Promise<PluralKitApi | null> {
        let api = new PluralKitApi();
        api.systemId = systemId;
        return api.init()
    }

    public static fromToken(token: string): Promise<PluralKitApi | null> {
        let api = new PluralKitApi();
        api.token = token;
        return api.init()
    }

    public static fromDiscord(discordId: string): Promise<PluralKitApi | null> {
        let api = new PluralKitApi();
        api.discordId = discordId;
        return api.init()
    }

    private async init(): Promise<PluralKitApi | null> {
        if (await this.valid()) {
            return this
        }
        return null
    }

    private async request<T>(url: string) {
        return await (await fetch(url, this.token ? {
            headers: {
                Authorization: this.token
            }
        } : {})).json() as T
    }

    async getSystemInfo() {
        if (this.systemInfo !== null) {
            return this.systemInfo
        }
        let url = "https://api.pluralkit.me/v1";
        if (this.systemId !== null) {
            url += "/s/" + this.systemId
        } else if (this.discordId !== null) {
            url += "/a/" + this.discordId
        } else {
            url += "/s"
        }
        this.systemInfo = await this.request<SystemModel>(url);
        return this.systemInfo
    }

    async valid() {
        try {
            await this.getSystemInfo();
            return true;
        } catch (e) {
            return false;
        }
    }

    async getMembersInfo() {
        if (this.memberInfo !== null) {
            return this.memberInfo
        }
        this.memberInfo = await this.request<MemberModel[]>("https://api.pluralkit.me/v1/s/" + this.systemInfo?.id + "/members");
        return this.memberInfo
    }
}