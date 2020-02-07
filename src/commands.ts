import { Command, AnyArgument, OrArgument, SpecificArgument, DiscordUserArgument, CommandResponseReaction, CommandReponseInSameChannel, UserArgument, CommandReponseNone } from "./Command";
import * as Discord from "discord.js"
import { User, Gender } from "./User";
import { getType } from "./utilities";
import { createNewUser, getUserByDiscordId, createNewRelationship, removeRelationship } from "./db";
import { Relationship, RelationshipType } from "./Relationship";

async function parseDiscordUserOrUser(thing: User | Discord.User, guildId: string): Promise<User> {
    if ((thing as User).gender === undefined) {
        return await getUserByDiscordId(guildId, (thing as Discord.User).id) as User
    }
    return thing as User
}

export const commands: Command[] = [
    new Command("add", [
        new AnyArgument(),
        new OrArgument(
            new SpecificArgument("me", "unknown"),
            new DiscordUserArgument()),
        new SpecificArgument("femme", "masc", "neuter", "system")], async input => {

            let name = input.args[0] as string
            let discordUser = input.args[1] as Discord.User | "me" | "unknown" | null
            if (discordUser === "unknown") {
                discordUser = null;
            }
            else if (discordUser === "me") {
                discordUser = input.author
            }
            let discordID: string | null = null
            if (getType(discordUser) === "object") {
                discordID = discordUser?.id!
            }
            let gender = (input.args[2] + "").toUpperCase() as Gender
            let user = new User(name, gender, input.channel.guild.id, discordID)

            if (await createNewUser(user)) {
                return new CommandResponseReaction("👍")
            }
            else {
                return new CommandReponseInSameChannel("there is already a person with that name on this discord server")
            }
        }),


    new Command("me", [], async input => {
        let user = await getUserByDiscordId(input.channel.guild.id, input.author.id)
        if (user === null) {
            return new CommandReponseInSameChannel("you have not been added yet")
        }
        return new CommandReponseInSameChannel("```name: " + user.name + "\ngender: " + user.gender.toLowerCase() + "```")
    }),

    new Command("new-relationship", [
        new OrArgument(
            new UserArgument(),
            new DiscordUserArgument()
        ),
        new OrArgument(
            new UserArgument(),
            new DiscordUserArgument()
        ),
        new SpecificArgument("romantic", "sexual", "friend", "lives with", "in system with", "cuddles with")
    ], async input => {
        let [leftUser, rightUser] = await Promise.all([parseDiscordUserOrUser(input.args[0], input.channel.guild.id), parseDiscordUserOrUser(input.args[1], input.channel.guild.id)])

        let relationship = new Relationship(input.args[2].toUpperCase() as RelationshipType, leftUser, rightUser, input.channel.guild.id)
        await createNewRelationship(relationship)
        return new CommandReponseInSameChannel("a " + relationship.type.toLowerCase() + " relationship between " + leftUser.name + " and " + rightUser.name + " has been created")
    }),

    new Command("remove-relationship", [
        new OrArgument(
            new UserArgument(),
            new DiscordUserArgument()
        ),
        new OrArgument(
            new UserArgument(),
            new DiscordUserArgument()
        ),
    ], async input => {
        let [leftUser, rightUser] = await Promise.all([parseDiscordUserOrUser(input.args[0], input.channel.guild.id), parseDiscordUserOrUser(input.args[1], input.channel.guild.id)])
        await removeRelationship(input.channel.guild.id, leftUser.name, rightUser.name)
        return new CommandReponseInSameChannel("all relationships between " + leftUser.name + " and " + rightUser.name + " has been deleted")
    })
]