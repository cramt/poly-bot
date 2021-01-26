CREATE TABLE users
(
    id            SERIAL,
    name          TEXT     NOT NULL,
    gender        SMALLINT NOT NULL,
    parent_system INTEGER,
    PRIMARY KEY (id),
    FOREIGN KEY (parent_system) REFERENCES users (id)
)
