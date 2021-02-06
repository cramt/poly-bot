pub mod command;
pub mod config;
pub mod dao;
pub mod migration_constants;
pub mod model;
pub mod polymap_generator;
pub mod tests;
pub mod utilities;

use headless_chrome::protocol::page::ScreenshotFormat;
use headless_chrome::Browser;
use percent_encoding::{utf8_percent_encode, NON_ALPHANUMERIC};
use std::fs::File;
use std::io::Write;

use tokio_postgres::Error;

#[tokio::main]
async fn main() -> Result<(), Error> {
    let svg = r#"<svg viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg">
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
</svg>
    "#;
    let browser = Browser::default().unwrap();
    let _ = browser.wait_for_initial_tab().unwrap();
    let tab = browser.new_tab().unwrap();
    tab.navigate_to(
        format!(
            "data:text/html,{}",
            utf8_percent_encode(svg, NON_ALPHANUMERIC)
        )
        .as_str(),
    );
    let svg = tab.wait_for_element("svg").unwrap();
    tab.evaluate(r#"
        document.getElementsByTagName("svg")[0].style.overflow = "hidden";
        document.getElementsByTagName("svg")[0].style.background = "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABQAAAAMABAMAAACJGtf+AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAD1BMVEVbzvqZwOD1qbj97vH///8ruxH3AAAAAWJLR0QEj2jZUQAAAAd0SU1FB+IEBg0YFNeqNkIAAAQVSURBVHja7dJBDQAgAAOxWcACFrCAf01IgN9C0kq4XAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcDOgKBOKDIgBMSAYEAOCATEgGBADggExIBgQA4IBMSAYEAOCATEgGBADggExIBgQA4IBMSAYEAOCATEgGBADYkAwIAYEA2JAMCAGBANiQDAgBgQDYkAwIAYEA2JAMCAGBANiQDAgBgQDYkAwIAYEA2JAMCAGBANiQAwIBsSAYEAMCAbEgGBADAgGxIBgQAwIBsSAYEAMCAbEgGBADAgGxIBgQAwIBsSAYEAMCAbEgBhQAgyIAcGAGBAMiAHBgBgQDIgBwYAYEAyIAcGAGBAMiAHBgBgQDIgBwYAYEAyIAcGAGBAMiAHBgBgQA4IBMSAYEAOCATEgGBADggExIBgQA4IBMSAYEAOCATEgGBADggH5ZMAFRdlQZEAMiAHBgBgQDIgBwYAYEAyIAcGAGBAMiAHBgBgQDIgBwYAYEAyIAcGAGBAMiAHBgBgQDIgBwYAYEAOCATEgGBADggExIBgQA4IBMSAYEAOCATEgGBADggExIBgQA4IBMSAYEAOCATEgGBADggExIBgQA2JAMCAGBANiQDAgBgQDYkAwIAYEA2JAMCAGBANiQDAgBgQDYkAwIAYEA2JAMCAGBANiQDAgBsSAEmBADAgGxIBgQAwIBsSAYEAMCAbEgGBADAgGxIBgQAwIBsSAYEAMCAbEgGBADAgGxIBgQAwIBsSAGBAMiAHBgBgQDIgBwYAYEAyIAcGAGBAMiAHBgBgQDIgBwYAYEN4HXFCUCUUGxIAYEAyIAcGAGBAMiAHBgBgQDIgBwYAYEAyIAcGAGBAMiAHBgBgQDIgBwYAYEAyIAcGAGBAMiAExIBgQA4IBMSAYEAOCATEgGBADggExIBgQA4IBMSAYEAOCATEgGBADggExIBgQA4IBMSAYEAOCATEgBgQDYkAwIAYEA2JAMCAGBANiQDAgBgQDYkAwIAYEA2JAMCAGBANiQDAgBgQDYkAwIAYEA2JADCgBBsSAYEAMCAbEgGBADAgGxIBgQAwIBsSAYEAMCAbEgGBADAgGxIBgQAwIBsSAYEAMCAbEgGBADIgBwYAYEAyIAcGAGBAMiAHBgBgQDIgBwYAYEAyIAcGAGBAMiAHBgHwy4ICiAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADcHJcM6eZjs9OqAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE4LTA0LTA2VDEzOjI0OjIwKzAwOjAwSqSOtwAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxOC0wNC0wNlQxMzoyNDoyMCswMDowMDv5NgsAAAAASUVORK5CYII=')";
        document.getElementsByTagName("svg")[0].style.backgroundSize = "contain";
    "#, false).unwrap();
    let png = svg.capture_screenshot(ScreenshotFormat::PNG).unwrap();
    File::create("idk.png").unwrap().write(&png).unwrap();
    Ok(())
}
