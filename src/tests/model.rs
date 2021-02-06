#[cfg(test)]
mod model {
    mod color {
        use crate::model::color::Color;

        #[test]
        fn bits_to_color() {
            let parsed_color: Color = [
                0u8,
                0,
                0
            ].into();
            assert_eq!(
                Color::default(),
                parsed_color
            )
        }
    }
}
