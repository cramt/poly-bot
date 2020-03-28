CREATE OR REPLACE FUNCTION public.get_topmost_system(start_id integer)
RETURNS integer as $$
DECLARE
    curr integer;
BEGIN
	curr = start_id;
    LOOP
		EXIT WHEN (SELECT COUNT(*) FROM users WHERE id = curr AND system_id IS NULL) = 1;
        SELECT system_id FROM users WHERE id = curr INTO curr;
    END LOOP;
    return curr;
END;

$$ LANGUAGE plpgsql;