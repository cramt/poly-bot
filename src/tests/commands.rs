#[cfg(test)]
mod commands {
    use crate::command::string_argument_parser::StringArgumentParser;
    use crate::command::from_string_argument_parser::FromStringArgumentParser;
    use crate::command::ArgumentParser;

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
}
