import { User } from "./User"

export type RelationshipType = "ROMANTIC" | "SEXUAL" | "FRIEND" | "LIVES WITH" | "IN SYSTEM WITH" | "CUDDLES WITH"

export class Relationship {
    type: RelationshipType
    leftUser: User
    rightUser: User
    constructor(type: RelationshipType, leftUser: User, rightUser: User) {
        this.type = type
        this.leftUser = leftUser;
        this.rightUser = rightUser
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