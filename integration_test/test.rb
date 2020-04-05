require "./discord"

discord = Discord.new(0, 0)
a = discord.send("help")
puts a.message_content