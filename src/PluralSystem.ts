import { PluralKitApi } from "./PluralKitApi"
import { getType } from "./utilities"

export class PluralSystem {
    discordId: string
    systemId: string
    constructor(discordId: string, systemId: string, ) {
        this.discordId = discordId
        this.systemId = systemId
    }
}