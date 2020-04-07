require 'rspec'
require "./discord"

describe "add-local" do
    discord = Discord.new
    it "can add" do
        expect(discord.send("add-local test neutral").is_thumbs_up).to be_truthy
    end
end