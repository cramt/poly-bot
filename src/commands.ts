import { Command, AnyArgument, OrArgument, SpecificArgument, DiscordUserArgument, CommandResponseReaction, CommandReponseInSameChannel, UserArgument, CommandReponseNone, CommandResponseFile, AdminCommand, AnyArgumentCommand } from "./Command";
import * as Discord from "discord.js"
import { User, Gender } from "./User";
import { getType } from "./utilities";
import { createNewUser, getUserByDiscordId, createNewRelationship, removeRelationship, getAllInGuild, getRelationshipsByUsers, removeUserAndTheirRelationshipsByDiscordId, removeUserAndTheirRelationshipsByUsername, setDiscordIdForUser, genderStringToInt, createNewPolySystem } from "./db";
import { Relationship, RelationshipType } from "./Relationship";
import { prefix } from "./index"
import { polyMapGenerate } from "./polyMapGenerate";
import { PluralKitApi } from "./PluralKitApi"
import { PluralSystem } from "./PluralSystem";

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
                let guildId = (input.channel as Discord.TextChannel).guild.id
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
                let user = new User(name, gender, guildId, discordID)

                if (await createNewUser(user)) {
                    return new CommandResponseReaction("👍")
                }
                else {
                    return new CommandReponseInSameChannel("there is already a person with that name on this discord server")
                }
            }),


    new Command("me", "print out information about yourself", [], async input => {
        let guildId = (input.channel as Discord.TextChannel).guild.id
        let user = (await getUserByDiscordId(guildId, input.author.id))
        if (user === null) {
            return new CommandReponseInSameChannel("you have not been added yet")
        }
        let relationships = await getRelationshipsByUsers(guildId, [user])
        return new CommandReponseInSameChannel("```name: " + user.name + "\ngender: " + user.gender.toLowerCase() + relationships.map(x => "\nyoure in a " + x.type.toLowerCase() + " relationship with " + (user?.name === x.rightUser.name ? x.leftUser.name : x.rightUser.name)).join("") + "```")
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
            let guildId = (input.channel as Discord.TextChannel).guild.id
            let [leftUser, rightUser] = await Promise.all([parseDiscordUserOrUser(input.args[0], guildId), parseDiscordUserOrUser(input.args[1], guildId)])
            if (leftUser.name === rightUser.name) {
                return new CommandReponseInSameChannel("you cant make a relationship with yourself")
            }
            let relationship = new Relationship(input.args[2].toUpperCase() as RelationshipType, leftUser, rightUser, guildId)
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
            let guildId = (input.channel as Discord.TextChannel).guild.id
            let [leftUser, rightUser] = await Promise.all([parseDiscordUserOrUser(input.args[0], guildId), parseDiscordUserOrUser(input.args[1], guildId)])
            await removeRelationship(guildId, leftUser.name, rightUser.name)
            return new CommandReponseInSameChannel("all relationships between " + leftUser.name + " and " + rightUser.name + " has been deleted")
        }),

    new Command("generate", "generates the polycule map", [], async input => {
        let guildId = (input.channel as Discord.TextChannel).guild.id
        let all = await getAllInGuild(guildId)
        let buffer = await polyMapGenerate(all.users, all.relationships)
        return new CommandResponseFile(buffer, "polycule_map.png")
    }),

    new AnyArgumentCommand("generate-personal", "generates the polycule map for an individual person", async input => {
        let guildId = (input.channel as Discord.TextChannel).guild.id
        let relationships = await getRelationshipsByUsers(guildId, (await Promise.all(input.args.map(async x => {
            let a = new OrArgument(new DiscordUserArgument(), new UserArgument());
            if (!await a.valid(x, input.channel)) {
                return null
            }
            return await parseDiscordUserOrUser(await a.parse(x, input.channel), guildId)
        }))).filter(x => x !== null) as User[])
        let users: User[] = []
        relationships.forEach(rel => {
            users.push(rel.leftUser)
            users.push(rel.rightUser)
        })
        let buffer = await polyMapGenerate(users, relationships)
        return new CommandResponseFile(buffer, "polycule_map.png")
    }),

    new Command("remove-me", "deletes you from the polycule and all relationships youre in", [], async input => {
        let guildId = (input.channel as Discord.TextChannel).guild.id
        await removeUserAndTheirRelationshipsByDiscordId(guildId, input.author.id)
        return new CommandResponseReaction("👍")
    }),

    new AdminCommand("remove", "removes a person from polycule", [new UserArgument()], async input => {
        let guildId = (input.channel as Discord.TextChannel).guild.id
        await removeUserAndTheirRelationshipsByUsername(guildId, (input.args[0] as User).name)
        return new CommandResponseReaction("👍")
    }),

    new Command("im", "adds your @ to a user without an @", [new UserArgument()], async input => {
        let user = input.args[0] as User
        if (user.discordId !== null) {
            return new CommandReponseInSameChannel("this user already have an @")
        }
        user.discordId = input.author.id
        await setDiscordIdForUser(user)
        return new CommandResponseReaction("👍");
    }),

    /*
    new Command("add-system", "add your system to the polycule", [], async input => {
        let channel = input.channel as Discord.TextChannel
        let api = await PluralKitApi.fromDiscord(input.author.id)
        if (api === null) {
            return new CommandReponseInSameChannel("you dont have a pluralkit system")
        }
        let argProblems = (await Promise.all([(async () => {
            if (await getUserByDiscordId(channel.guild.id, input.author.id) !== null) {
                return new CommandReponseInSameChannel("you already have a non-plural user, please delete that one first")
            }
            return null
        })(), (async () => {
            if (!await api.valid()) {
                return new CommandReponseInSameChannel("not a valid token")
            }
            return null
        })()])).filter(x => x !== null)
        if (argProblems.length > 0) {
            return argProblems[0]!
        }
        await createNewPolySystem(new PluralSystem(input.author.id, (await api.getSystemInfo()).id))
        return new CommandResponseReaction("👍");
    })*/

    /*new AnyArgumentCommand("im-plural", "changed your user to a plural user", async input => {
        let guild = (input.channel as Discord.TextChannel).guild
        if (input.args.length % 2 === 0) {
            return new CommandReponseInSameChannel("can only take an unqual amount of arguments")
        }
        if (input.args.length < 4) {
            return new CommandReponseInSameChannel("you need to add atleast on member of the system")
        }
        let api = new PluralKitApi(input.args[0])
        let systemInfo = await api.getSystemInfo();
        let memberInfo = await api.getMembersInfo();
        input.args = input.args.slice(1)
        let users: User[] = []
        for (let i = 0; i < input.args.length; i += 2) {
            let member = memberInfo.filter(x => x.id === input.args[i] || x.name?.toLocaleLowerCase() == input.args[i].toLocaleLowerCase())[0] || null
            if (member === null) {
                return new CommandReponseInSameChannel(input.args[i] + " could not be found")
            }
            if (!Object.getOwnPropertyNames(genderStringToInt).map(x => x.toLowerCase()).includes(input.args[i + 1])) {
                return new CommandReponseInSameChannel(input.args[i + 1] + " is not a gender")
            }
            users.push(new User(member.name!, input.args[i + 1].toUpperCase(), guild.id, input.author.id, systemInfo.id, member.id))
        }
        await changeToPlural(guild.id, input.author.id, api, users)
        return new CommandResponseReaction("👍");
    })*/
]