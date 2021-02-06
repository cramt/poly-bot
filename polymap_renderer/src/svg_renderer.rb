require 'puppeteer'

module SvgRenderer
  @@mutex = Mutex.new
  def self.run(svg)
    @@mutex.synchronize do
      "hello"
    end
  end
end
