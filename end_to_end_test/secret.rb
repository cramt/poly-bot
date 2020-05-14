module Secret
  @local = JSON.parse(File.read("SECRET.json"))
  @global = JSON.parse(File.read(File.join(Dir.pwd, "../SECRET.json")))
  def self.local
    @local
  end
  def self.global
    @global
  end
end
