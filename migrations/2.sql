CREATE TABLE public.polymap_cache (
    data bytea NOT NULL, 
    discord_ids text[] NOT NULL,
    guild_id text PRIMARY KEY
);

CREATE OR REPLACE FUNCTION public.post_user_change_polymap_cache_invalidation()
  RETURNS trigger AS
$BODY$
DECLARE
    discord text;
    guild text;
BEGIN
    SELECT users.discord_id, users.guild_id INTO discord, guild FROM users WHERE id = get_topmost_system(OLD.id);
    DELETE FROM polymap_cache WHERE 
    polymap_cache.guild_id = guild OR
    discord = ANY(polymap_cache.discord_ids);
    );
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$BODY$
LANGUAGE plpgsql;

CREATE TRIGGER user_change_polymap_cache_invalidation
BEFORE INSERT OR UPDATE OR DELETE ON public.users
FOR EACH ROW EXECUTE PROCEDURE public.post_user_change_polymap_cache_invalidation();

CREATE OR REPLACE FUNCTION public.post_relationship_change_polymap_cache_invalidation()
  RETURNS trigger AS
$BODY$
DECLARE
	left_discord text;
	left_guild text;
	right_discord text;
	right_guild text;
BEGIN

    SELECT users.discord_id, users.guild_id INTO left_discord, left_guild FROM users WHERE id = get_topmost_system(OLD.left_user_id);
    SELECT users.discord_id, users.guild_id INTO right_discord, right_guild FROM users WHERE id = get_topmost_system(OLD.right_user_id);
    DELETE FROM polymap_cache WHERE
    (
        left_discord = ANY(polymap_cache.discord_ids) 
        AND
        right_discord = ANY(polymap_cache.discord_ids)
    )
    OR
    (
        left_discord = ANY(polymap_cache.discord_ids) 
        AND
        right_guild = polymap_cache.guild_id
    )
    OR
    (
        left_guild = polymap_cache.guild_id
        AND
        right_guild = polymap_cache.guild_id
    )
    OR
    (
        left_guild = polymap_cache.guild_id
        AND
        right_discord = ANY(polymap_cache.discord_ids)
    );
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$BODY$
LANGUAGE plpgsql;

CREATE TRIGGER relationship_change_polymap_cache_invalidation
BEFORE INSERT OR UPDATE OR DELETE ON public.relationships
FOR EACH ROW EXECUTE PROCEDURE public.post_relationship_change_polymap_cache_invalidation();