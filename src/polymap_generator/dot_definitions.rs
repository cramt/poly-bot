use crate::config::CONFIG;
use crate::model::relationship::Relationship;
use crate::model::user::User;
use crate::utilities::{shell, shell_raw};
use std::process::{Command, Stdio};
use std::io::Write;

pub trait DotGenerate {
    fn dot_id(&self) -> String;
    fn generate(&self) -> String;
}

impl DotGenerate for User {
    fn dot_id(&self) -> String {
        if self.members.is_empty() {
            self.id.to_string()
        } else {
            format!("cluster_{}", self.id)
        }
    }

    fn generate(&self) -> String {
        if self.members.is_empty() {
            format!(
                r#""{}" [ color = "black", fillcolor = "{}", style = "filled", shape =ellipse, fontname = "arial", label = "{}" ];"#,
                self.dot_id(),
                self.color.to_string(),
                self.name
            )
        } else {
            let inner: String = self
                .members
                .iter()
                .map(|x| x.generate())
                .collect::<Vec<String>>()
                .join("\r\n");
            format!(
                r#"subgraph {} {{
            graph [ label = "{}", fontname = "arial" ];
            {}
            }}"#,
                self.dot_id(),
                self.name,
                inner
            )
        }
    }
}

impl DotGenerate for Relationship {
    fn dot_id(&self) -> String {
        format!(
            r#""{}" -- "{}""#,
            self.left_user.dot_id(),
            self.right_user.dot_id()
        )
    }

    fn generate(&self) -> String {
        format!(
            r#"{} [ color = "{}", arrowhead =none ];"#,
            self.dot_id(),
            self.relationship_type.to_colour()
        )
    }
}

pub fn dot_generate(dots: &[&(dyn DotGenerate + Sync)]) -> String {
    let body: String = dots
        .into_iter()
        .map(|x| x.generate())
        .collect::<Vec<String>>()
        .join("\r\n");
    format!(
        r#"
    graph G {{
        graph [ splines = "compound", K =0.8, overlap = "10000:prism", bgcolor = " #00000000", compound =true ];
        {}
    }}
    "#,
        body
    )
}

pub fn invoke_graphviz(s: String) -> Option<String> {
    let seperator = if cfg!(target_os = "windows") {
        "\\"
    } else {
        "/"
    };
    let fdp = format!(
        r#"{}{}fdp -Tsvg"#,
        CONFIG.graphviz_location, seperator
    );
    let mut p = shell_raw(fdp, false)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped()).spawn().unwrap();
    p.stdin.as_mut().unwrap().write_all(s.as_bytes()).unwrap();
    String::from_utf8(p.wait_with_output().unwrap().stdout).ok()
}
