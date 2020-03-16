export type Gender = "FEMME" | "MASC" | "NEUTRAL" | "SYSTEM"

export function constructUser(name: string, gender: Gender, guildId: string | null, discordId: string | null, id: number | null, systemId: number | null): User {
    if (discordId !== null) {
        return new DiscordUser(name, gender, id, systemId, discordId)
    }
    else if (guildId !== null) {
        return new GuildUser(name, gender, id, systemId, guildId)
    }
    else {
        throw new Error("a user needs to be either a discord user or a guild user")
    }
}

export abstract class User {
    name: string
    gender: Gender
    id: number | null = null
    systemId: number | null = null;
    private _system: User | null = null;
    members: User[] = [];
    constructor(name: string, gender: Gender, id: number | null, systemId: number | null) {
        this.name = name
        this.gender = gender
        this.id = id;
        this.systemId = systemId;
    }
    set system(sys: User | null) {
        this._system = sys
        if (sys !== null && !sys.members.includes(this)) {
            sys.members.push(this)
        }
    }
    get system(): User | null {
        return this._system
    }
}

export class GuildUser extends User {
    guildId: string;
    constructor(name: string, gender: Gender, id: number | null, systemId: number | null, guildId: string) {
        super(name, gender, id, systemId)
        this.guildId = guildId
    }
    toDiscordUser(discordId: string) {
        let discordUser: DiscordUser = Object.setPrototypeOf(this, DiscordUser.prototype);
        (discordUser as any).guildId = undefined
        discordUser.discordId = discordId
        return discordUser
    }
}

export class DiscordUser extends User {
    discordId: string;
    constructor(name: string, gender: Gender, id: number | null, systemId: number | null, discordId: string) {
        super(name, gender, id, systemId)
        this.discordId = discordId
    }
    toGuildUser(guildId: string) {
        let guildUser: GuildUser = Object.setPrototypeOf(this, GuildUser.prototype);
        (guildUser as any).discordId = undefined
        guildUser.guildId = guildId
        return guildUser
    }
}

export const genderToColor = {
    "FEMME": "#F7A8B8",
    "MASC": "#55CDFC",
    "NEUTRAL": "#FFFFFF",
    "SYSTEM": "#FFE599"
}