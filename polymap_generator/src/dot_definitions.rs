use config::CONFIG;
use model::relationship::Relationship;
use model::user::User;
use std::io::Write;
use std::ops::Deref;
use std::process::Stdio;
use utilities::shell::shell_raw;

#[derive(Debug, Clone)]
pub struct DotScript(String);

impl DotScript {
    pub fn new(s: String) -> Self {
        Self(s)
    }

    pub fn invoke_graphviz(&self) -> Option<String> {
        let seperator = if cfg!(target_os = "windows") {
            "\\"
        } else {
            "/"
        };
        let fdp = format!(r#"{}{}fdp -Tsvg"#, CONFIG.graphviz_location, seperator);
        let mut p = shell_raw(fdp, false)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .spawn()
            .unwrap();
        p.stdin
            .as_mut()
            .unwrap()
            .write_all(self.as_bytes())
            .unwrap();
        String::from_utf8(p.wait_with_output().unwrap().stdout).ok()
    }
}

impl Deref for DotScript {
    type Target = String;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl Into<String> for DotScript {
    fn into(self) -> String {
        self.0
    }
}

pub trait DotGenerate {
    fn dot_id(&self) -> String;
    fn generate(&self) -> DotScript;
}

impl DotGenerate for User {
    fn dot_id(&self) -> String {
        if self.members.is_empty() {
            self.id.to_string()
        } else {
            format!("cluster_{}", self.id)
        }
    }

    fn generate(&self) -> DotScript {
        DotScript::new(if self.members.is_empty() {
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
                .map(|x| x.into())
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
        })
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

    fn generate(&self) -> DotScript {
        DotScript(format!(
            r#"{} [ color = "{}", arrowhead =none ];"#,
            self.dot_id(),
            self.relationship_type.to_colour()
        ))
    }
}

impl DotGenerate for &[&(dyn DotGenerate + Sync)] {
    fn dot_id(&self) -> String {
        "G".to_string()
    }

    fn generate(&self) -> DotScript {
        let body: String = self
            .into_iter()
            .map(|x| x.generate())
            .map(|x| x.into())
            .collect::<Vec<String>>()
            .join("\r\n");
        DotScript(format!(
            r#"
            graph {} {{
                graph [ splines = "compound", K =0.8, overlap = "10000:prism", bgcolor = " #00000000", compound =true ];
                {}
            }}
            "#,
            self.dot_id(),
            body,
        ))
    }
}

pub fn dot_generate(dots: &[&(dyn DotGenerate + Sync)]) -> DotScript {
    dots.generate()
}
