require "discordrb"
require "json"

secret = JSON.parse(File.read("SECRET.json"))
threads = secret["bots"].map { |x| Thread.new { Discordrb::Bot.new token: x } }
threads.each(&:join)
bots = threads.map(&:value)
threads = secret["guilds"].map { |x| Thread.new do
  for bot in bots do s = bot.server(x)
  if s != nil
    return s
  end
  end
end
}
threads.each(&:join)
guilds = threads.map(&:value)


a = Discordrb::Bot.new token: ""
a.message() do |event|
  
end