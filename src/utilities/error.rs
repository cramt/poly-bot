use color_eyre::Section;
use eyre::*;

pub fn aggregate_errors<T: Iterator<Item = Report>>(mut t: T) -> Option<Report> {
    match t.count() {
        0 | 1 => t.nth(0),
        _ => Ok(t.fold(eyre!("encountered multiple errors"), |report, e| {
            Err(report).error(e).err().unwrap()
        })),
    }
}
