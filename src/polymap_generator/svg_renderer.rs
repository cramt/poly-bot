use headless_chrome::protocol::page::ScreenshotFormat;
use headless_chrome::Browser;
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
    );
    let svg = tab.wait_for_element("svg").unwrap();
    tab.evaluate(r#"
        document.getElementsByTagName("svg")[0].style.overflow = "hidden";
        document.getElementsByTagName("svg")[0].style.background = "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABQAAAAMABAMAAACJGtf+AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAD1BMVEVbzvqZwOD1qbj97vH///8ruxH3AAAAAWJLR0QEj2jZUQAAAAd0SU1FB+IEBg0YFNeqNkIAAAQVSURBVHja7dJBDQAgAAOxWcACFrCAf01IgN9C0kq4XAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcDOgKBOKDIgBMSAYEAOCATEgGBADggExIBgQA4IBMSAYEAOCATEgGBADggExIBgQA4IBMSAYEAOCATEgGBADYkAwIAYEA2JAMCAGBANiQDAgBgQDYkAwIAYEA2JAMCAGBANiQDAgBgQDYkAwIAYEA2JAMCAGBANiQAwIBsSAYEAMCAbEgGBADAgGxIBgQAwIBsSAYEAMCAbEgGBADAgGxIBgQAwIBsSAYEAMCAbEgBhQAgyIAcGAGBAMiAHBgBgQDIgBwYAYEAyIAcGAGBAMiAHBgBgQDIgBwYAYEAyIAcGAGBAMiAHBgBgQA4IBMSAYEAOCATEgGBADggExIBgQA4IBMSAYEAOCATEgGBADggH5ZMAFRdlQZEAMiAHBgBgQDIgBwYAYEAyIAcGAGBAMiAHBgBgQDIgBwYAYEAyIAcGAGBAMiAHBgBgQDIgBwYAYEAOCATEgGBADggExIBgQA4IBMSAYEAOCATEgGBADggExIBgQA4IBMSAYEAOCATEgGBADggExIBgQA2JAMCAGBANiQDAgBgQDYkAwIAYEA2JAMCAGBANiQDAgBgQDYkAwIAYEA2JAMCAGBANiQDAgBsSAEmBADAgGxIBgQAwIBsSAYEAMCAbEgGBADAgGxIBgQAwIBsSAYEAMCAbEgGBADAgGxIBgQAwIBsSAGBAMiAHBgBgQDIgBwYAYEAyIAcGAGBAMiAHBgBgQDIgBwYAYEN4HXFCUCUUGxIAYEAyIAcGAGBAMiAHBgBgQDIgBwYAYEAyIAcGAGBAMiAHBgBgQDIgBwYAYEAyIAcGAGBAMiAExIBgQA4IBMSAYEAOCATEgGBADggExIBgQA4IBMSAYEAOCATEgGBADggExIBgQA4IBMSAYEAOCATEgBgQDYkAwIAYEA2JAMCAGBANiQDAgBgQDYkAwIAYEA2JAMCAGBANiQDAgBgQDYkAwIAYEA2JADCgBBsSAYEAMCAbEgGBADAgGxIBgQAwIBsSAYEAMCAbEgGBADAgGxIBgQAwIBsSAYEAMCAbEgGBADIgBwYAYEAyIAcGAGBAMiAHBgBgQDIgBwYAYEAyIAcGAGBAMiAHBgHwy4ICiAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADcHJcM6eZjs9OqAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE4LTA0LTA2VDEzOjI0OjIwKzAwOjAwSqSOtwAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxOC0wNC0wNlQxMzoyNDoyMCswMDowMDv5NgsAAAAASUVORK5CYII=')";
        document.getElementsByTagName("svg")[0].style.backgroundSize = "cover";
    "#, false).unwrap();
    let png = svg.capture_screenshot(ScreenshotFormat::PNG).unwrap();
    tab.close_with_unload().unwrap();
    Some(png)
}
