#[cfg(test)]
mod model {
    mod color {
        use model::color::Color;

        #[test]
        fn bits_to_color() {
            let parsed_color: Color = [255, 255, 255].into();
            assert_eq!(Color::default(), parsed_color)
        }

        #[test]
        fn word_to_color() {
            let parsed_color: Color = "white".parse().unwrap();
            assert_eq!(Color::default(), parsed_color)
        }

        #[test]
        fn rgb_to_color() {
            let parsed_color: Color = "rgb(   255,  255,255  )".parse().unwrap();
            assert_eq!(Color::default(), parsed_color)
        }

        #[test]
        fn hex_to_color() {
            let parsed_color: Color = "#FFFFFF".parse().unwrap();
            assert_eq!(Color::default(), parsed_color);
            let parsed_color: Color = "#ffffff".parse().unwrap();
            assert_eq!(Color::default(), parsed_color)
        }
    }
}
