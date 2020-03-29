import { Command, AnyArgument, OrArgument, SpecificArgument, DiscordUserArgument, CommandResponseReaction, CommandReponseInSameChannel, UserArgument, CommandResponseFile, AdminCommand, StringExcludedArgument, StandardArgumentList, VariableArgumentList, OptionalArgumentList, CommandReponseNone } from "./Command";
import * as Discord from "discord.js"
import { User, Gender, genderToColor, GuildUser, DiscordUser } from "./User";
import * as db from "./db";
import { Relationship, RelationshipType, relationshipTypeToColor } from "./Relationship";
import { prefix } from "./index"
import { polyMapGenerate, cachedPolyMapGenerate } from "./polyMapGenerate";

export async function parseDiscordUserOrUser(thing: User | Discord.User): Promise<User> {
    if ((thing as User).gender === undefined) {
        return await db.users.getByDiscordId((thing as Discord.User).id) as User
    }
    return thing as User
}

export const commands: Command[] = [
    new Command("help", "prints all the commands the bot has available", new StandardArgumentList(), async () => {
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
            let discordUser = input.args[2].value as Discord.User | "me";
            if (discordUser === "me") {
                discordUser = input.author;
            }
            let gender = (input.args[1].value + "").toUpperCase() as Gender
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
        new StandardArgumentList(new AnyArgument(),
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


    new Command("about", "print out information about someone", new OptionalArgumentList([
        {
            argument: new OrArgument(
                new DiscordUserArgument(),
                new UserArgument(),
                new SpecificArgument("me")),
            type: "default",
            default: "me"
        }
    ]), async input => {
        let _user = input.args[0].value as Discord.User | User | "me"
        if (_user === "me") {
            _user = input.author
        }
        let user = await parseDiscordUserOrUser(_user)
        if (user === null) {
            return new CommandReponseInSameChannel("you have not been added yet")
        }
        let relationships = await db.relationships.getByUsers([user, ...await db.users.getMembers(user)])
        return new CommandReponseInSameChannel("```name: " + user.name + "\ngender: " + user.gender.toLowerCase() + relationships.map(x => {
            let you = x.rightUser!
            let them = x.leftUser!
            if (user.getTopMostSystem().id === you.getTopMostSystem().id) {
                [them, you] = [you, them]
            }
            return "\n" + you.name + " is in a " + x.type.toLowerCase() + " relationship with " + them.name
        }).join("") + "```")
    }),

    new Command("add-relationship",
        "creates a new relationship between 2 people",
        new OptionalArgumentList([{
            argument: new OrArgument(
                new DiscordUserArgument(),
                new UserArgument(),
                new SpecificArgument("me")
            ),
            type: "default",
            default: "me"
        },
        {
            argument: new OrArgument(
                new DiscordUserArgument(),
                new UserArgument()),
            type: "required"
        },
        {
            argument: new SpecificArgument(...Object.getOwnPropertyNames(relationshipTypeToColor).map(x => x.toLowerCase())),
            type: "required"
        }])
        , async input => {
            let _user = input.args[0].value as Discord.User | User | "me"
            if (_user === "me") {
                _user = input.author
            }
            let user = await parseDiscordUserOrUser(_user);
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
        new OptionalArgumentList([{
            argument: new OrArgument(
                new DiscordUserArgument(),
                new UserArgument(),
                new SpecificArgument("me")
            ),
            type: "default",
            default: "me"
        },
        {
            argument: new OrArgument(
                new DiscordUserArgument(),
                new UserArgument()),
            type: "required"
        }])
        , async input => {
            let guildId = (input.channel as Discord.TextChannel).guild.id
            let [leftUser, rightUser] = await Promise.all([parseDiscordUserOrUser(input.args[0].value), parseDiscordUserOrUser(input.args[1].value)])
            await db.relationships.delete(new Relationship("CUDDLES WITH", leftUser.id!, rightUser.id!, guildId))
            return new CommandReponseInSameChannel("all relationships between " + leftUser.name + " and " + rightUser.name + " has been deleted")
        }),

    new Command("generate", "generates the polycule map", new StandardArgumentList(), async input => {
        let guildId = (input.channel as Discord.TextChannel).guild.id
        let all = await db.getAllInGuild(guildId, input.guild.members.map(x => x.id))
        if(all.users.length === 0){
            return new CommandReponseInSameChannel("cant generate empty map")
        }
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

    new Command("rename-me", "changes your name", new StandardArgumentList( new AnyArgument()), async input => {
        let user = await db.users.getByDiscordId(input.author.id)
        user!.name = input.args[0].value
        if (db.users.update(user!)) {
            return new CommandResponseReaction("👍")
        }
        else {
            return new CommandReponseInSameChannel("could not find your Discord ID in the database. use 'rename <username>' to rename local users")
        }
    }), 

    new Command("rename", "changes the name of a user", new StandardArgumentList( new UserArgument(), new AnyArgument()), async input => {
        let user = await parseDiscordUserOrUser(input.args[0].value)
        user.name = input.args[1].value
        db.users.update(user)
        return new CommandResponseReaction("👍")
    }),

    new Command("remove-me", "deletes you from the polycule and all relationships youre in", new StandardArgumentList(), async input => {
        await db.users.deleteByDiscord(input.author.id)
        return new CommandResponseReaction("👍")
    }),

    new Command("remove-me", "deletes member of your system and all the relationships they are in", new StandardArgumentList(new UserArgument()), async input => {
        let user = input.args[0].value as User;
        if (user instanceof DiscordUser) {
            if (user.discordId === input.author.id) {
                await db.users.delete(user);
                return new CommandResponseReaction("👍")
            }
        }
        return new CommandResponseReaction("you dont have rights over that user")
    }),

    new AdminCommand("remove", "removes a local user", new StandardArgumentList(new UserArgument()), async input => {
        let user = input.args[0].value as User;
        if (user instanceof GuildUser) {
            if (user.guildId === input.guild.id) {
                await db.users.delete(user);
                return new CommandResponseReaction("👍")
            }
        }
        return new CommandResponseReaction("you dont have rights over that user")
    }),

    new Command("to-global", "changes your user to a global one", new StandardArgumentList(new UserArgument()), async input => {
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
            return new CommandReponseInSameChannel("this user is already global")
        }
    }),

    new Command("to-local", "changes your user to a local one", new OptionalArgumentList([{
        argument: new OrArgument(new UserArgument(), new DiscordUserArgument(), new SpecificArgument("me")),
        type: "default",
        default: "me"
    }]), async input => {
        let user = input.args[0].value as User | Discord.User | "me"
        if (user === "me") {
            user = input.author
        }
        user = await parseDiscordUserOrUser(user);
        if (user instanceof DiscordUser) {
            user = user.toGuildUser(input.guild.id)
            if (await db.users.update(user)) {
                return new CommandResponseReaction("👍");
            }
            else {
                return new CommandReponseInSameChannel("there was a database error")
            }
        }
        else {
            return new CommandReponseInSameChannel("this user is already local")
        }
    }),

    new Command("add-member", "adds a member to your system", new OptionalArgumentList([{
        argument: new OrArgument(new UserArgument(), new DiscordUserArgument(), new SpecificArgument("me")),
        type: "default",
        default: "me"
    },
    {
        argument: new AnyArgument(),
        type: "required"
    },
    {
        argument: new SpecificArgument(...Object.getOwnPropertyNames(genderToColor).map(x => x.toLowerCase())),
        type: "required"
    }
    ]), async input => {
        let system = input.args[0].value as User | Discord.User | "me"
        if (system === "me") {
            system = input.author
        }
        system = await parseDiscordUserOrUser(system);
        if (system.gender != "SYSTEM") {
            system.gender = "SYSTEM"
            db.users.update(system)
        }
        let member = new GuildUser(input.args[1].value, (input.args[2].value + "").toUpperCase() as Gender, null, system.id, "");
        db.users.add(member)
        return new CommandReponseNone();
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
]