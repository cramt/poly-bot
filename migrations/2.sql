CREATE TABLE polymap_cache (
    data bytea NOT NULL, 
    discord_ids text[] NOT NULL,
    guild_id text PRIMARY KEY
)

CREATE OR REPLACE FUNCTION post_user_change_polymap_cache_invalidation()
  RETURNS trigger AS
$BODY$
DECLARE
	discord text;
	guild text;
BEGIN
   SELECT users.discord_id, users.guild_id INTO discord, guild FROM users WHERE id = get_topmost_system(NEW.id);
   DELETE FROM polymap_cache WHERE 
   polymap_cache.guild_id = guild OR
   discord = ANY(polymap_cache.discord_ids);
   RETURN NEW;
END;
$BODY$
LANGUAGE plpgsql;

CREATE TRIGGER user_change_polymap_cache_invalidation
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE PROCEDURE post_user_change_polymap_cache_invalidation()

CREATE OR REPLACE FUNCTION post_relationship_change_polymap_cache_invalidation()
  RETURNS trigger AS
$BODY$
DECLARE
	left_discord text;
	left_guild text;
	right_discord text;
	right_guild text;
BEGIN
   SELECT users.discord_id, users.guild_id INTO left_discord, left_guild FROM users WHERE id = get_topmost_system(NEW.left_user_id);
   SELECT users.discord_id, users.guild_id INTO right_discord, right_guild FROM users WHERE id = get_topmost_system(NEW.right_user_id);
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
   RETURN NEW;
END;
$BODY$
LANGUAGE plpgsql;

CREATE TRIGGER relationship_change_polymap_cache_invalidation
AFTER INSERT OR UPDATE OR DELETE ON relationships
FOR EACH ROW EXECUTE PROCEDURE post_relationship_change_polymap_cache_invalidation()