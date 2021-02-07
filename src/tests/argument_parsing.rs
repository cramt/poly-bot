#[cfg(test)]
mod argument_parsing {
    use crate::command::argument_parser::discord_tag_argument_parser::DiscordTagArgumentParser;
    use crate::command::argument_parser::from_string_argument_parser::{ColorArgumentParser, FromStringArgumentParser, RelationshipTypeArgumentParser, U64ArgumentParser};
    use crate::command::argument_parser::string_argument_parser::StringArgumentParser;
    use crate::command::argument_parser::ArgumentParser;

    use crate::model::color::Color;
    use crate::model::relationship_type::RelationshipType;
    use crate::command::argument_parser::or_argument_parser::OrArgumentParser;

    #[test]
    fn single_string_argument_parsing() {
        let mut str = "hello".to_string();

        let output = StringArgumentParser::new().parse(&mut str).unwrap();
        assert_eq!("", str);
        assert_eq!("hello", output);
    }

    #[test]
    fn double_string_argument_parsing() {
        let mut str = "hello there".to_string();
        let output1 = StringArgumentParser::new().parse(&mut str).unwrap();
        assert_eq!("there", str);
        assert_eq!("hello", output1);
        let output2 = StringArgumentParser::new().parse(&mut str).unwrap();
        assert_eq!("", str);
        assert_eq!("there", output2);
    }

    #[test]
    fn parse_number_u64() {
        let mut str = "1 2".to_string();
        let output1: u64 = FromStringArgumentParser::new().parse(&mut str).unwrap();
        assert_eq!("2", str);
        assert_eq!(1, output1);
        let output2: u64 = FromStringArgumentParser::new().parse(&mut str).unwrap();
        assert_eq!("", str);
        assert_eq!(2, output2);
    }

    #[test]
    fn parse_color() {
        let mut str = "white".to_string();
        let output = ColorArgumentParser::new().parse(&mut str).unwrap();
        assert_eq!("", str);
        assert_eq!(Color::default(), output);
    }

    #[test]
    fn parse_relationship() {
        let mut str = "sexual".to_string();
        let output = RelationshipTypeArgumentParser::new()
            .parse(&mut str)
            .unwrap();
        assert_eq!("", str);
        assert_eq!(RelationshipType::Sexual, output);
    }

    #[test]
    fn parse_discord_tag_with_exclamation_mark() {
        let mut str = "<@!123>".to_string();
        let output = DiscordTagArgumentParser::new().parse(&mut str).unwrap();
        assert_eq!("", str);
        assert_eq!(123, output);
    }

    #[test]
    fn parse_discord_tag_without_exclamation_mark() {
        let mut str = "<@123>".to_string();
        let output = DiscordTagArgumentParser::new().parse(&mut str).unwrap();
        assert_eq!("", str);
        assert_eq!(123, output);
    }

    #[test]
    fn parse_or_color_or_number() {
        let mut str = "2".to_string();
        let output = OrArgumentParser::<ColorArgumentParser, U64ArgumentParser>::new().parse(&mut str).unwrap();
        assert_eq!(2, output.b().unwrap())
    }
}
