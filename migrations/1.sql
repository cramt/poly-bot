CREATE TABLE relationships
(
    id                SERIAL,
    relationship_type SMALLINT NOT NULL,
    right_user_id     INTEGER  NOT NULL,
    left_user_id      INTEGER  NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (right_user_id) REFERENCES users (id),
    FOREIGN KEY (left_user_id) REFERENCES users (id)
)
