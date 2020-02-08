import { User } from "./User"

export type RelationshipType = "ROMANTIC" | "SEXUAL" | "FRIEND" | "LIVES WITH" | "IN SYSTEM WITH" | "CUDDLES WITH"

export class Relationship {
    guildId: string
    type: RelationshipType
    leftUser: User
    rightUser: User
    constructor(type: RelationshipType, leftUser: User, rightUser: User, guildId: string) {
        this.type = type
        if (leftUser.name > rightUser.name) {
            [leftUser, rightUser] = [rightUser, leftUser]
        }
        this.leftUser = leftUser;
        this.rightUser = rightUser;
        this.guildId = guildId
    }
}

export const relationshipTypeToColor = {
    "ROMANTIC": "red",
    "SEXUAL": "purple",
    "FRIEND": "green",
    "LIVES WITH": "yellow",
    "IN SYSTEM WITH": "blue",
    "CUDDLES WITH": "orange",
}