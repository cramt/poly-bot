export type Gender = "FEMME" | "MASC" | "NEUTER" | "SYSTEM"

export class User {
    name: string
    gender: Gender
    constructor(name: string, gender: Gender) {
        this.name = name.split(" ").map(x => x.toUpperCase()).join(" ");
        this.gender = gender
    }
}

export const genderToColor = {
    "FEMME": "red",
    "MASC": "blue",
    "NEUTER": "white",
    "SYSTEM": "yellow"
}