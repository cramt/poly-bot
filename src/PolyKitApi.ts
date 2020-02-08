export interface SystemModel {
    id: string
    name: string | null
    description: string | null
    tag: string | null
    avatar_irl: string | null
    tz: string | null
    created: Date
}

export class PolyKitApi {
    token: string
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
        let result = this.request<SystemModel>("https://api.pluralkit.me/v1/s")
        console.log(result)
    }
}