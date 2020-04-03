ALTER TABLE users
    ADD CONSTRAINT unique_discord_id UNIQUE (discord_id)