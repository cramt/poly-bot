use headless_chrome::protocol::page::ScreenshotFormat;
use headless_chrome::Browser;
use macros::include_base64;
use once_cell::sync::Lazy;
use percent_encoding::{utf8_percent_encode, NON_ALPHANUMERIC};

use std::sync::Mutex;

static CHROMIUM: Lazy<Mutex<Browser>> = Lazy::new(|| {
    let b = Browser::default().unwrap();
    b.wait_for_initial_tab().unwrap();
    Mutex::new(b)
});

pub async fn render_svg<S: AsRef<str>>(svg: S) -> Option<Vec<u8>> {
    let browser = CHROMIUM.lock().unwrap();
    let tab = browser.new_tab().unwrap();
    tab.navigate_to(
        format!(
            "data:text/html,{}",
            utf8_percent_encode(svg.as_ref(), NON_ALPHANUMERIC)
        )
        .as_str(),
    )
    .unwrap();
    let svg = tab.wait_for_element("svg").unwrap();
    tab.evaluate(format!(r#"
        document.getElementsByTagName("svg")[0].style.overflow = "hidden";
        document.getElementsByTagName("svg")[0].style.background = "url('data:image/png;base64,{}')";
        document.getElementsByTagName("svg")[0].style.backgroundSize = "cover";
    "#, include_base64!("./res/trans_flag.png")).as_str(), false).unwrap();
    let png = svg.capture_screenshot(ScreenshotFormat::PNG).unwrap();
    tab.close_with_unload().unwrap();
    Some(png)
}
