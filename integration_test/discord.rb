require "discordrb"
require "json"
require 'securerandom'
require "Promises"

module Bots
    secret = JSON.parse(File.read("SECRET.json"))
    threads = secret["bots"].map {|bot| Thread.new {Discordrb::Bot.new token: bot}}
    threads.each(&:join)
    @bots = threads.map(&:value)
    @bots.each {|bot| Thread.new {bot.run}}


    Promise.all(@bots.map {|bot| Promise.new {|resolve| bot.ready {resolve.call}}})

    threads = secret["guilds"].map {|guild| Thread.new {@bots.lazy.map {|bot| bot.server(guild)}.find {|server| !server.nil?}}}
    threads.each(&:join)
    @guilds = threads.map(&:value)

    @guilds.each {|guild|
        Thread.new {
            guild.channels.each {|channel|
                Thread.new {channel.delete}
            }
        }
    }

    cwd = Dir.pwd
    Promise.new { |resolve|
        Dir.chdir("../")
        node_process = IO.popen({"TEST_BOTS" => @bots.map {|x| x.bot_user.id}.join(",")}, "node scripts/run.js") {|node|
            node.each do |x|
                puts x
                if x == "poly-bot online\n"
                    resolve.call
                end
            end
        }
        at_exit {node_process.close}
    }
    Dir.chdir(cwd)

    @bot = secret["bot_id"]
    secret = JSON.parse(File.read(File.join(Dir.pwd, "../SECRET.json")))
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
                            :type => "reaction",
                            :data => reaction
                        })
            end
        end
    }
end

class DiscordResponse
    @responses

    def initialize(responses)
        @responses = responses
    end

    def types
        Set.new(@responses.map {|x| x[:type]}).to_a
    end

    def of_type(type)
        @responses.filter {|x| x[:type] == type}.map {|x| x[:data]}
    end

    def messages
        of_type "message"
    end

    def reactions
        of_type "reaction"
    end

    def message_content
        of_type("message").map(&:content).join
    end

    def is_thumbs_up
        @responses.length == 1 && @responses[0]
    end
end

class Discord
    @bot
    @guild
    @channel
    @id
    @timeout

    def initialize(bot_index = 0, guild_index = 0, timeout = 1)
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
        DiscordResponse.new res
    end
end