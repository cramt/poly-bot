export type Gender = "FEMME" | "MASC" | "NEUTER" | "SYSTEM"

export class User {
    discordId: string | null = null
    guildId: string | null = null;
    name: string
    gender: Gender
    id: number | null = null
    systemId: number | null = null;
    system: User | null = null;
    constructor(name: string, gender: Gender, guildId: string | null, discordId: string | null, id: number | null, systemId: number | null) {
        this.name = name.split(".").map(x => {
            x = x.split(" ").map(y => {
                return y.charAt(0).toUpperCase() + y.slice(1).toLowerCase()
            }).join(" ")
            return x.charAt(0).toUpperCase() + x.slice(1)
        }).join(".")
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
}

export const genderToColor = {
    "FEMME": "#F7A8B8",
    "MASC": "#55CDFC",
    "NEUTER": "#FFFFFF",
    "SYSTEM": "#FFE599"
}