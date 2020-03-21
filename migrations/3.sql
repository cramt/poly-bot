ALTER TABLE relationships
    ADD CONSTRAINT fk_left_user_id FOREIGN KEY (left_user_id) REFERENCES users (id);

ALTER TABLE relationships
    ADD CONSTRAINT fk_right_user_id FOREIGN KEY (right_user_id) REFERENCES users (id);

ALTER TABLE users
    ADD CONSTRAINT fk_system_id FOREIGN KEY (system_id) REFERENCES users(id)