CREATE TABLE users
(
    id            BIGSERIAL,
    name          TEXT     NOT NULL,
    gender        SMALLINT NOT NULL,
    parent_system BIGINT,
    discord_id    BIGINT   NOT NULL UNIQUE,
    PRIMARY KEY (id),
    FOREIGN KEY (parent_system) REFERENCES users (id) ON DELETE CASCADE
)
