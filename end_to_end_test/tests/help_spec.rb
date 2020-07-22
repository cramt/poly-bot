require "rspec"
require "./discord"

describe "help" do
    discord = Discord.new
    it "has proxy" do
        expect(discord.send("help").message_content).to include("prefix = \"" + Bots.prefix + "\"")
    end
end