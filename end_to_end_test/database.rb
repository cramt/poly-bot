require 'pg'
require "./secret.rb"

module Database
  dbArgs = Secret.global["DB"]
  begin
    @con = PG.connect :hostaddr => dbArgs["HOST"], :port => dbArgs["PORT"].to_i, :dbname => dbArgs["NAME"], :user => dbArgs["USER"], :password => dbArgs["PASSWORD"]
    @con.exec("DELETE FROM users")
  rescue PG::Error => e
    puts e
  end

  def self.con
    @con
  end
end