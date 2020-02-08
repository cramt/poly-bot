import { Command, AnyArgument, OrArgument, SpecificArgument, DiscordUserArgument, CommandResponseReaction, CommandReponseInSameChannel, UserArgument, CommandReponseNone, CommandResponseFile, AdminCommand } from "./Command";
import * as Discord from "discord.js"
import { User, Gender } from "./User";
import { getType } from "./utilities";
import { createNewUser, getUserByDiscordId, createNewRelationship, removeRelationship, getAllInGuild, getRelationshipsByUser, removeUserAndTheirRelationshipsByDiscordId, removeUserAndTheirRelationshipsByUsername } from "./db";
import { Relationship, RelationshipType } from "./Relationship";
import { prefix } from "./index"
import { polyMapGenerate } from "./polyMapGenerate";

async function parseDiscordUserOrUser(thing: User | Discord.User, guildId: string): Promise<User> {
    if ((thing as User).gender === undefined) {
        return await getUserByDiscordId(guildId, (thing as Discord.User).id) as User
    }
    return thing as User
}

export const commands: Command[] = [
    new Command("help", "prints all the commands the bot has available", [], async input => {
        let str = "```"
        str += "prefix = \"" + prefix + "\"\r\n\r\n"
        str += commands.map(x => x.name + ": " + x.description + x.arguments.map((x, i) => "\r\nargument " + i + ": " + x.description).join("")).join("\r\n\r\n\r\n")
        str += "```"
        return new CommandReponseInSameChannel(str)
    }),

    new Command("add",
        "adds you to the polycule",
        [
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


    new Command("me", "print out information about yourself", [], async input => {
        let user = (await getUserByDiscordId(input.channel.guild.id, input.author.id))
        if (user === null) {
            return new CommandReponseInSameChannel("you have not been added yet")
        }
        let relationships = await getRelationshipsByUser(input.channel.guild.id, user)
        return new CommandReponseInSameChannel("```name: " + user.name + "\ngender: " + user.gender.toLowerCase() + relationships.map(x => "\nyoure in a " + x.type.toLowerCase() + " relationship with " + x.rightUser.name).join("") + "```")
    }),

    new Command("new-relationship",
        "creates a new relationship between 2 people",
        [
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
            if (leftUser.name === rightUser.name) {
                return new CommandReponseInSameChannel("you cant make a relationship with yourself")
            }
            let relationship = new Relationship(input.args[2].toUpperCase() as RelationshipType, leftUser, rightUser, input.channel.guild.id)
            if (await createNewRelationship(relationship)) {
                return new CommandReponseInSameChannel("a " + relationship.type.toLowerCase() + " relationship between " + leftUser.name + " and " + rightUser.name + " has been created")
            }
            else {
                return new CommandReponseInSameChannel("a relationship like that already exists")
            }
        }),

    new Command("remove-relationship",
        "removes all relationships between to people",
        [
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
        }),

    new Command("generate", "generates the polycule map", [], async input => {
        let all = await getAllInGuild(input.channel.guild.id)
        let buffer = await polyMapGenerate(all.users, all.relationships)
        return new CommandResponseFile(buffer, "polycule_map.png")
    }),

    new Command("remove-me", "deletes you from the polycule and all relationships youre in", [], async input => {
        await removeUserAndTheirRelationshipsByDiscordId(input.channel.guild.id, input.author.id)
        return new CommandResponseReaction("👍")
    }),

    new AdminCommand("remove", "removes a person from polycule", [new UserArgument()], async input => {
        await removeUserAndTheirRelationshipsByUsername(input.channel.guild.id, (input.args[0] as User).name)
        return new CommandResponseReaction("👍")
    })
]