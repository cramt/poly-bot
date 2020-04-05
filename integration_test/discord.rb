require "discordrb"
require "json"
require 'securerandom'

module Bots
    secret = JSON.parse(File.read("SECRET.json"))
    threads = secret["bots"].map {|bot| Thread.new {Discordrb::Bot.new token: bot}}
    threads.each(&:join)
    @bots = threads.map(&:value)
    @bots.each {|bot| Thread.new {bot.run}}
    threads = secret["guilds"].map {|guild| Thread.new {@bots.lazy.map {|bot| bot.server(guild)}.find {|server| !server.nil?}}}
    threads.each(&:join)
    @guilds = threads.map(&:value)

    threads = @bots.map {|| Thread.new {sleep}}

    @bots.each_with_index {|bot, i| bot.ready {threads[i].terminate}}

    threads.each(&:join)

    @guilds.each {|guild| Thread.new {guild.channels.each {|channel| Thread.new {channel.delete}}}}

    @bot = secret["bot_id"]
    secret = JSON.parse(File.read("../SECRET.json"))
    @prefix = secret["PREFIX"]

    @callback_dictionary = {}

    def self.bot
        @bot
    end

    def self.bots
        @bots
    end

    def self.guilds
        @guilds
    end

    def self.prefix
        @prefix
    end

    def self.set_callback(id, &block)
        @callback_dictionary[id] = block
    end

    def self.delete_callback(id)
        @callback_dictionary.delete(id)
    end

    @bots.each_with_index {|bot, i|
        bot.message do |message|
            if message.author.id == Bots.bot
                cb = @callback_dictionary[message.channel.name]
                if cb != nil
                    cb.call({
                                :type => "message",
                                :data => message
                            })
                end
            end
        end
        bot.reaction_add do |reaction|
            cb = @callback_dictionary[reaction.channel.name]
            if cb != nil
                cb.call({
                            :type => "message",
                            :data => reaction
                        })
            end
        end
    }
end

class Discord
    @bot
    @guild
    @channel
    @id
    @timeout

    def initialize(bot_index, guild_index, timeout = 1)
        @timeout = timeout
        @bot = Bots.bots[bot_index]
        @guild = @bot.server(Bots.guilds[guild_index].id)
        @id = SecureRandom.uuid
        @channel = @guild.create_channel @id
    end

    def send(text)
        res = []
        Bots.set_callback(@id) do |value|
            res.push(value)
        end
        text = Bots.prefix + text
        @channel.send_message text
        sleep @timeout
        Bots.delete_callback(@id)
        res
    end
end