export type Gender = "FEMME" | "MASC" | "NEUTRAL" | "SYSTEM"

export class User {
    discordId: string | null = null
    guildId: string | null = null;
    name: string
    gender: Gender
    id: number | null = null
    systemId: number | null = null;
    private _system: User | null = null;
    members: User[] = [];
    constructor(name: string, gender: Gender, guildId: string | null, discordId: string | null, id: number | null, systemId: number | null) {
        this.name = name
        this.gender = gender
        if (discordId !== null) {
            this.guildId = null;
        }
        else {
            this.guildId = guildId;
        }
        this.discordId = discordId
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

export const genderToColor = {
    "FEMME": "#F7A8B8",
    "MASC": "#55CDFC",
    "NEUTER": "#FFFFFF",
    "SYSTEM": "#FFE599"
}