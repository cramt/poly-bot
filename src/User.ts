export type Gender = "FEMME" | "MASC" | "NEUTER" | "SYSTEM"

export class User {
    discordId: string | null = null
    guildId: string
    name: string
    gender: Gender
    pluralSystemId: string | null
    pluralMemberId: string | null
    constructor(name: string, gender: Gender, guildId: string, discordId: string | null, pluralSystemId: string | null = null, pluralMemberId: string | null = null) {
        this.name = name.split(" ").map(x => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase()).join(" ");
        this.gender = gender
        this.guildId = guildId
        this.discordId = discordId
        this.pluralSystemId = pluralSystemId
        this.pluralMemberId = pluralMemberId
    }
}

export const genderToColor = {
    "FEMME": "#F7A8B8",
    "MASC": "#55CDFC",
    "NEUTER": "#FFFFFF",
    "SYSTEM": "#FFE599"
}