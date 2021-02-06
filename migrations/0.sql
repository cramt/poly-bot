CREATE TABLE users
(
    id            BIGSERIAL,
    name          TEXT     NOT NULL,
    color         BYTEA,
    parent_system BIGINT,
    discord_id    BIGINT UNIQUE,
    PRIMARY KEY (id),
    FOREIGN KEY (parent_system) REFERENCES users (id) ON DELETE CASCADE
)
