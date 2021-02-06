require 'puppeteer'

browser = Puppeteer.launch headless: true

svg = '<svg viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg">
  <style>
    .small { font: italic 13px sans-serif; }
    .heavy { font: bold 30px sans-serif; }

    /* Note that the color of the text is set with the    *
     * fill property, the color property is for HTML only */
    .Rrrrr { font: italic 40px serif; fill: red; }
  </style>

  <text x="20" y="35" class="small">My</text>
  <text x="40" y="35" class="heavy">cat</text>
  <text x="55" y="55" class="small">is</text>
  <text x="65" y="55" class="Rrrrr">Grumpy!</text>
</svg>'
page = browser.new_page
page.set_content("<html><head></head><body>" + svg + "</body></html>")
page.evaluate(<<~JAVASCRIPT)
  () => {
    document.body.style.background = 'transparent';
    document.getElementsByTagName("svg")[0].style.overflow = "hidden";
    document.body.style.overflow = 'hidden'
  }
JAVASCRIPT
result = page.S("svg").screenshot omitBackground: true
page.close
File.write "idk.png", result
