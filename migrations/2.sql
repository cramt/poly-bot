
CREATE OR REPLACE FUNCTION public.get_topmost_system(start_id integer)
    RETURNS integer as
$$
DECLARE
    curr_id        integer NOT NULL = start_id;
    curr_system_id integer;
BEGIN
    curr_system_id = NULL;
    LOOP
        SELECT parent_system FROM users WHERE id = curr_id INTO curr_system_id;
        IF curr_system_id IS NULL THEN
            EXIT;
        END IF;
        curr_id = curr_system_id;
    END LOOP;
    return curr_id;
END;

$$ LANGUAGE plpgsql;
