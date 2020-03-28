ALTER TABLE public.relationships
    ADD CONSTRAINT fk_left_user_id FOREIGN KEY (left_user_id) REFERENCES public.users (id) ON DELETE CASCADE;

ALTER TABLE public.relationships
    ADD CONSTRAINT fk_right_user_id FOREIGN KEY (right_user_id) REFERENCES public.users (id) ON DELETE CASCADE;

ALTER TABLE public.users
    ADD CONSTRAINT fk_system_id FOREIGN KEY (system_id) REFERENCES public.users(id) ON DELETE CASCADE;