
use eyre::*;

pub fn aggregate_errors(v: Vec<Report>) -> Option<Report> {
    match v.len() {
        0 | 1 => v.into_iter().nth(0),
        _ => Some(eyre!(format!(
            "multiple errors occured: {}",
            v.into_iter()
                .map(|x| format!("\r\n{:?}", x))
                .collect::<String>()
        ))),
    }
}
