CREATE TABLE relationships
(
    id                BIGSERIAL,
    relationship_type SMALLINT NOT NULL,
    right_user_id     BIGINT  NOT NULL,
    left_user_id      BIGINT  NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (right_user_id) REFERENCES users (id),
    FOREIGN KEY (left_user_id) REFERENCES users (id)
)
