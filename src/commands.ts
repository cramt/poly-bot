import { Command, AnyArgument, OrArgument, SpecificArgument, DiscordUserArgument, CommandResponseReaction, CommandReponseInSameChannel, UserArgument, CommandReponseNone, CommandResponseFile, AdminCommand, StringExcludedArgument, CommandReponseBase, CacheCommand, ArgumentList, StandardArgumentList, VariableArgumentList, OptionalArgumentList } from "./Command";
import * as Discord from "discord.js"
import { User, Gender, genderToColor, constructUser, GuildUser, DiscordUser } from "./User";
import { getType } from "./utilities";
import * as db from "./db";
import { Relationship, RelationshipType, relationshipTypeToColor } from "./Relationship";
import { prefix } from "./index"
import { polyMapGenerate } from "./polyMapGenerate";

async function parseDiscordUserOrUser(thing: User | Discord.User): Promise<User> {
    if ((thing as User).gender === undefined) {
        return await db.users.getByDiscordId((thing as Discord.User).id) as User
    }
    return thing as User
}

export const commands: Command[] = [
    new Command("help", "prints all the commands the bot has available", new StandardArgumentList(), async input => {
        let str = "```"
        str += "prefix = \"" + prefix + "\"\r\n\r\n"
        //TODO
        //str += commands.map(x => x.name + ": " + x.description + x.arguments.map((x, i) => "\r\nargument " + i + ": " + (x.usage !== "" ? x.usage + ", can be" : "") + x.description).join("")).join("\r\n\r\n\r\n")
        str += "```"
        return new CommandReponseInSameChannel(str)
    }),

    new Command("add-global",
        "adds you to the polycule",
        new OptionalArgumentList([
            {
                argument: new AnyArgument(),
                type: "required"
            },
            {
                argument: new SpecificArgument(...Object.getOwnPropertyNames(genderToColor).map(x => x.toLowerCase())),
                type: "required"
            },
            {
                argument: new DiscordUserArgument(),
                type: "default",
                default: "me"
            },
        ])
        , async input => {
            let name = input.args[0].value as string
            let discordUser = input.args[1].value as Discord.User | "me";
            if (discordUser === "me") {
                discordUser = input.author;
            }
            let gender = (input.args[2] + "").toUpperCase() as Gender
            let user = new DiscordUser(name, gender, null, null, discordUser.id)
            if (await db.users.add(user)) {
                return new CommandResponseReaction("👍")
            }
            else {
                return new CommandReponseInSameChannel("there is already a person with that name on this discord server")
            }
        }),
    new Command("add-local",
        "adds you to the polycule",
        new StandardArgumentList(new StringExcludedArgument("_"),
            new SpecificArgument(...Object.getOwnPropertyNames(genderToColor).map(x => x.toLowerCase())))
        , async input => {
            let guildId = (input.channel as Discord.TextChannel).guild.id
            let name = input.args[0].value as string
            let gender = (input.args[1].value + "").toUpperCase() as Gender
            let user = new GuildUser(name, gender, null, null, guildId)
            if (await db.users.add(user)) {
                return new CommandResponseReaction("👍")
            }
            else {
                return new CommandReponseInSameChannel("there is already a person with that name on this discord server")
            }
        }),


    new Command("me", "print out information about yourself", new StandardArgumentList(), async input => {
        let guildId = (input.channel as Discord.TextChannel).guild.id
        let user = (await db.users.getByDiscordId(input.author.id)) as User
        if (user === null) {
            return new CommandReponseInSameChannel("you have not been added yet")
        }
        let relationships = await db.relationships.getByUsers([user, ...await db.users.getMembers(user)])
        return new CommandReponseInSameChannel("```name: " + user.name + "\ngender: " + user.gender.toLowerCase() + relationships.map(x => {
            let you = x.rightUser
            let them = x.leftUser
            if (!user.name.startsWith(you!.name)) {
                [them, you] = [you, them]
            }
            return "\n" + you!.name + " is in a " + x.type.toLowerCase() + " relationship with " + them!.name
        }).join("") + "```")
    }),

    new Command("new-relationship",
        "creates a new relationship between 2 people",
        new StandardArgumentList(new OrArgument(
            new UserArgument(),
            new DiscordUserArgument()
        ),
            new OrArgument(
                new UserArgument(),
                new DiscordUserArgument()
            ),
            new SpecificArgument(...Object.getOwnPropertyNames(relationshipTypeToColor).map(x => x.toLowerCase())))
        , async input => {
            let guildId = (input.channel as Discord.TextChannel).guild.id
            let [leftUser, rightUser] = await Promise.all([parseDiscordUserOrUser(input.args[0].value), parseDiscordUserOrUser(input.args[1].value)])
            if (leftUser.name === rightUser.name) {
                return new CommandReponseInSameChannel("you cant make a relationship with yourself")
            }
            let relationship = new Relationship(input.args[2].value.toUpperCase() as RelationshipType, leftUser, rightUser, guildId)
            if (await db.relationships.add(relationship)) {
                return new CommandReponseInSameChannel("a " + relationship.type.toLowerCase() + " relationship between " + leftUser.name + " and " + rightUser.name + " has been created")
            }
            else {
                return new CommandReponseInSameChannel("a relationship like that already exists")
            }
        }),

    new Command("remove-relationship",
        "removes all relationships between to people",
        new StandardArgumentList(new OrArgument(
            new UserArgument(),
            new DiscordUserArgument()
        ),
            new OrArgument(
                new UserArgument(),
                new DiscordUserArgument()
            ))
        , async input => {
            let guildId = (input.channel as Discord.TextChannel).guild.id
            let [leftUser, rightUser] = await Promise.all([parseDiscordUserOrUser(input.args[0].value), parseDiscordUserOrUser(input.args[1].value)])
            await db.relationships.delete(new Relationship("CUDDLES WITH", leftUser.id!, rightUser.id!, guildId))
            return new CommandReponseInSameChannel("all relationships between " + leftUser.name + " and " + rightUser.name + " has been deleted")
        }),

    new Command("generate", "generates the polycule map", new StandardArgumentList(), async input => {
        let guildId = (input.channel as Discord.TextChannel).guild.id
        let all = await db.getAllInGuild(guildId, input.guild.members.map(x => x.id))
        let buffer = await polyMapGenerate(all.users, all.relationships)
        return new CommandResponseFile(buffer, "polycule_map.png")
    }),

    new Command("generate-system", "generates the polycule map but only for a system", new StandardArgumentList(new UserArgument()), async input => {
        let system = input.args[0].value as User
        let members = (await db.users.getMembers(system)).concat(system)
        let relationships = await db.relationships.getByUsers(members)
        let buffer = await polyMapGenerate(members, relationships)
        return new CommandResponseFile(buffer, "polycule_map.png")
    }),

    new Command("generate-personal", "generates the polycule map for an individual person", new VariableArgumentList(
        new OrArgument(
            new DiscordUserArgument(),
            new UserArgument())),
        async input => {
            let guildId = (input.channel as Discord.TextChannel).guild.id

            let startUsers = await Promise.all(input.args.map(x => parseDiscordUserOrUser(x.value)))

            let relationships = (await db.relationships.getByUsers(startUsers)).filter(x => x !== null)
            let users: User[] = []
            relationships.forEach(rel => {
                users.push(rel.leftUser!)
                users.push(rel.rightUser!)
            })
            let buffer = await polyMapGenerate(users, relationships)
            return new CommandResponseFile(buffer, "polycule_map.png")
        }),

    new Command("remove-me", "deletes you from the polycule and all relationships youre in", new StandardArgumentList(), async input => {
        let guildId = (input.channel as Discord.TextChannel).guild.id
        await db.users.deleteByDiscord(input.author.id)
        return new CommandResponseReaction("👍")
    }),

    new Command("remove-me", "deletes member of your system and all the relationships they are in", new StandardArgumentList(new UserArgument()), async input => {
        return new CommandReponseInSameChannel("not implemented yet")
    }),

    new AdminCommand("remove", "removes a person from polycule", new StandardArgumentList(new UserArgument()), async input => {
        return new CommandReponseInSameChannel("not implemented yet")
    }),

    new Command("im", "adds your @ to a user without an @", new StandardArgumentList(new UserArgument()), async input => {
        let user = input.args[0].value as User
        if (user instanceof GuildUser) {
            user = user.toDiscordUser(input.author.id)
            if (await db.users.update(user)) {
                return new CommandResponseReaction("👍");
            }
            else {
                return new CommandReponseInSameChannel("there was a database error")
            }
        }
        else {
            return new CommandReponseInSameChannel("this user already have an @")
        }
    }),

    new Command("bernie-time", "its bernie time 😎", new StandardArgumentList(), async input => {
        let guildId = (input.channel as Discord.TextChannel).guild.id
        let all = await db.getAllInGuild(guildId, input.guild.members.map(x => x.id))
        let bernie = new GuildUser("President Bernie Sanders", "MASC", null, null, guildId)
        all.users.push(bernie);
        all.users.forEach(user => {
            all.relationships.push(new Relationship("ROMANTIC", bernie, user, guildId))
        })
        let buffer = await polyMapGenerate(all.users, all.relationships)
        return new CommandResponseFile(buffer, "polycule_map.png")
    })

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