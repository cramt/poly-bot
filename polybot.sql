--
-- PostgreSQL database dump
--

-- Dumped from database version 12.1
-- Dumped by pg_dump version 12.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: plural_system; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plural_system (
    system_id text NOT NULL,
    discord_id text NOT NULL
);


--
-- Name: relationships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.relationships (
    relationship_type integer NOT NULL,
    left_username text NOT NULL,
    right_username text NOT NULL,
    guild_id text NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    guild_id text NOT NULL,
    username text NOT NULL,
    discord_id text,
    gender integer NOT NULL,
    plural_system_id text,
    plural_member_id text
);


--
-- Name: relationships no_same_relationships; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relationships
    ADD CONSTRAINT no_same_relationships UNIQUE (left_username, right_username, relationship_type);


--
-- Name: plural_system plural_system_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plural_system
    ADD CONSTRAINT plural_system_pkey PRIMARY KEY (system_id);


--
-- Name: users users_guild_id_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_guild_id_username_key UNIQUE (guild_id, username);


--
-- PostgreSQL database dump complete
--

