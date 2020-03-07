import { User } from "./User"

export type RelationshipType = "ROMANTIC" | "SEXUAL" | "FRIEND" | "LIVES WITH" | "IN SYSTEM WITH" | "CUDDLES WITH" | "QUEERPLATONIC"

export class Relationship {
    guildId: string
    type: RelationshipType
    leftUserId: number
    rightUserId: number
    leftUser: User | null = null
    rightUser: User | null = null
    constructor(type: RelationshipType, leftUserId: number | User, rightUserId: number | User, guildId: string) {
        this.type = type
        if (typeof leftUserId === "number") {
            this.leftUserId = leftUserId
        }
        else {
            this.leftUserId = leftUserId.id!;
            this.leftUser = leftUserId
        }
        if (typeof rightUserId === "number") {
            this.rightUserId = rightUserId
        }
        else {
            this.rightUserId = rightUserId.id!
            this.rightUser = rightUserId
        }
        this.guildId = guildId
    }
}

export const relationshipTypeToColor: {
    [P in RelationshipType]: string
} = {
    "ROMANTIC": "#ff000",
    "SEXUAL": "#8E7CC3",
    "FRIEND": "#6AA84F",
    "LIVES WITH": "#FFFF00",
    "IN SYSTEM WITH": "#FFE599",
    "CUDDLES WITH": "#F6B26B",
    "QUEERPLATONIC": "#2A2A2A"
}