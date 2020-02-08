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
    token: string
    systemInfo: SystemModel | null = null
    memberInfo: MemberModel[] | null = null
    constructor(token: string) {
        this.token = token
    }

    private async request<T>(url: string) {
        return await (await fetch(url, {
            headers: {
                Authorization: this.token
            }
        })).json() as T
    }

    async getSystemInfo() {
        if (this.systemInfo !== null) {
            return this.systemInfo
        }
        this.systemInfo = await this.request<SystemModel>("https://api.pluralkit.me/v1/s")
        return this.systemInfo
    }

    async getMembersInfo() {
        if (this.memberInfo !== null) {
            return this.memberInfo
        }
        this.memberInfo = await this.request<MemberModel[]>("https://api.pluralkit.me/v1/s/" + this.systemInfo?.id + "/members")
        return this.memberInfo
    }
}