

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


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."category_type" AS ENUM (
    'service',
    'course'
);


ALTER TYPE "public"."category_type" OWNER TO "postgres";


CREATE TYPE "public"."content_status" AS ENUM (
    'draft',
    'published',
    'archived'
);


ALTER TYPE "public"."content_status" OWNER TO "postgres";


CREATE TYPE "public"."course_level_type" AS ENUM (
    'Beginner',
    'Intermediate',
    'Advanced'
);


ALTER TYPE "public"."course_level_type" OWNER TO "postgres";


CREATE TYPE "public"."course_mode_type" AS ENUM (
    'Online',
    'Offline',
    'Hybrid'
);


ALTER TYPE "public"."course_mode_type" OWNER TO "postgres";


CREATE TYPE "public"."institution_grade_type" AS ENUM (
    'school',
    'college',
    'both',
    'corporate'
);


ALTER TYPE "public"."institution_grade_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'admin',
    'editor'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_default_role_to_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
    VALUES (NEW.id, 'editor', NOW(), NOW());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."assign_default_role_to_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."call_recruitment_form_webhook"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  payload json;
begin
  payload := json_build_object('record', row_to_json(NEW));
  perform net.http_post(
    url := 'https://itvhjkgfafikpqmuunlh.supabase.co/functions/v1/send-recruitment-email',
    headers := json_build_object('Content-Type', 'application/json'),
    body := payload::text
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."call_recruitment_form_webhook"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_delete"("user_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid AND role = 'owner'
  );
END;
$$;


ALTER FUNCTION "public"."can_delete"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."change_user_role"("target_user_id" "uuid", "new_role" character varying) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    current_user_role VARCHAR;
BEGIN
    -- Check if current user is owner/admin
    SELECT role INTO current_user_role 
    FROM user_roles 
    WHERE user_id = auth.uid();
    
    -- Only owners/admins can change roles
    IF current_user_role NOT IN ('owner', 'admin') THEN
        RAISE EXCEPTION 'Insufficient permissions to change user roles';
    END IF;
    
    -- Prevent users from changing their own role
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot change your own role';
    END IF;
    
    -- Update the role
    UPDATE user_roles 
    SET role = new_role, updated_at = NOW()
    WHERE user_id = target_user_id;
    
    -- Log the change
    RAISE LOG 'User % changed role of user % to %', auth.uid(), target_user_id, new_role;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."change_user_role"("target_user_id" "uuid", "new_role" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_event_slug"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := public.generate_event_slug(NEW.title);
    END IF;
    
    -- Also update meta_title if not provided
    IF NEW.meta_title IS NULL OR NEW.meta_title = '' THEN
        NEW.meta_title := NEW.title;
    END IF;
    
    -- Also update meta_description if not provided
    IF NEW.meta_description IS NULL OR NEW.meta_description = '' THEN
        NEW.meta_description := left(NEW.description, 160);
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."ensure_event_slug"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_event_slug"("event_title" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    base_slug text;
    final_slug text;
    counter integer := 0;
BEGIN
    -- Convert title to slug format
    base_slug := lower(regexp_replace(event_title, '[^a-zA-Z0-9\s]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    
    final_slug := base_slug;
    
    -- Check if slug exists and increment counter if needed
    WHILE EXISTS (SELECT 1 FROM public.events WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$;


ALTER FUNCTION "public"."generate_event_slug"("event_title" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_event_analytics"("user_uuid" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("total_events" bigint, "upcoming_events" bigint, "ongoing_events" bigint, "completed_events" bigint, "cancelled_events" bigint, "total_capacity" bigint, "events_this_month" bigint, "events_this_week" bigint, "most_popular_category" "text", "average_capacity" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    WITH event_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'upcoming') as upcoming,
            COUNT(*) FILTER (WHERE status = 'ongoing') as ongoing,
            COUNT(*) FILTER (WHERE status = 'completed') as completed,
            COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
            COALESCE(SUM(capacity), 0) as total_cap,
            COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) as month_count,
            COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as week_count,
            AVG(capacity) as avg_cap
        FROM public.events e
        WHERE (user_uuid IS NULL OR e.user_id = user_uuid)
    ),
    popular_category AS (
        SELECT category
        FROM public.events e
        WHERE (user_uuid IS NULL OR e.user_id = user_uuid)
        GROUP BY category
        ORDER BY COUNT(*) DESC
        LIMIT 1
    )
    SELECT 
        es.total,
        es.upcoming,
        es.ongoing,
        es.completed,
        es.cancelled,
        es.total_cap,
        es.month_count,
        es.week_count,
        COALESCE(pc.category, 'N/A'),
        ROUND(es.avg_cap, 2)
    FROM event_stats es
    CROSS JOIN popular_category pc;
END;
$$;


ALTER FUNCTION "public"."get_event_analytics"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_events_by_date_range"("start_date" "date", "end_date" "date", "user_uuid" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("event_date" "date", "event_count" bigint, "events" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.event_date,
        COUNT(*) as event_count,
        jsonb_agg(
            jsonb_build_object(
                'id', e.id,
                'title', e.title,
                'event_time', e.event_time,
                'location', e.location,
                'category', e.category,
                'status', e.status,
                'capacity', e.capacity,
                'slug', e.slug
            ) ORDER BY e.event_time
        ) as events
    FROM public.events e
    WHERE 
        e.event_date >= start_date 
        AND e.event_date <= end_date
        AND (user_uuid IS NULL OR e.user_id = user_uuid)
    GROUP BY e.event_date
    ORDER BY e.event_date;
END;
$$;


ALTER FUNCTION "public"."get_events_by_date_range"("start_date" "date", "end_date" "date", "user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_events_by_status"("event_status" "text", "user_uuid" "uuid" DEFAULT NULL::"uuid", "limit_count" integer DEFAULT 20, "offset_count" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "title" "text", "event_date" "date", "event_time" time without time zone, "location" "text", "category" "text", "capacity" integer, "status" "text", "featured_image" "text", "slug" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.event_date,
        e.event_time,
        e.location,
        e.category,
        e.capacity,
        e.status,
        e.featured_image,
        e.slug,
        e.created_at
    FROM public.events e
    WHERE 
        e.status = event_status
        AND (user_uuid IS NULL OR e.user_id = user_uuid)
    ORDER BY 
        CASE 
            WHEN event_status = 'upcoming' THEN e.event_date
            ELSE e.created_at
        END DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$;


ALTER FUNCTION "public"."get_events_by_status"("event_status" "text", "user_uuid" "uuid", "limit_count" integer, "offset_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_events_with_user_info"() RETURNS TABLE("id" "uuid", "user_id" "uuid", "title" "text", "description" "text", "event_date" "date", "event_time" time without time zone, "duration" "text", "location" "text", "organizer_name" "text", "organizer_email" "text", "organizer_phone" "text", "capacity" integer, "category" "text", "price" "text", "registration_deadline" "date", "requirements" "text", "agenda" "text", "speakers" "text"[], "sponsors" "text"[], "additional_contact_info" "text", "status" "text", "event_banner" "text", "featured_image" "text", "event_tags" "text"[], "meta_title" "text", "meta_description" "text", "slug" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.user_id,
        e.title,
        e.description,
        e.event_date,
        e.event_time,
        e.duration,
        e.location,
        e.organizer_name,
        e.organizer_email,
        e.organizer_phone,
        e.capacity,
        e.category,
        e.price,
        e.registration_deadline,
        e.requirements,
        e.agenda,
        e.speakers,
        e.sponsors,
        e.additional_contact_info,
        e.status,
        e.event_banner,
        e.featured_image,
        e.event_tags,
        e.meta_title,
        e.meta_description,
        e.slug,
        e.created_at,
        e.updated_at
    FROM public.events e
    ORDER BY e.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_events_with_user_info"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_popular_event_categories"("user_uuid" "uuid" DEFAULT NULL::"uuid", "limit_count" integer DEFAULT 10) RETURNS TABLE("category" "text", "event_count" bigint, "total_capacity" bigint, "avg_capacity" numeric, "upcoming_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.category,
        COUNT(*) as event_count,
        COALESCE(SUM(e.capacity), 0) as total_capacity,
        ROUND(AVG(e.capacity), 2) as avg_capacity,
        COUNT(*) FILTER (WHERE e.status = 'upcoming') as upcoming_count
    FROM public.events e
    WHERE (user_uuid IS NULL OR e.user_id = user_uuid)
    GROUP BY e.category
    ORDER BY event_count DESC, total_capacity DESC
    LIMIT limit_count;
END;
$$;


ALTER FUNCTION "public"."get_popular_event_categories"("user_uuid" "uuid", "limit_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"("check_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS character varying
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    target_id UUID;
    user_role VARCHAR;
BEGIN
    -- If no user_id provided, check current user
    target_id := COALESCE(check_user_id, auth.uid());
    
    SELECT role INTO user_role 
    FROM user_roles 
    WHERE user_id = target_id;
    
    RETURN COALESCE(user_role, 'no_role');
END;
$$;


ALTER FUNCTION "public"."get_user_role"("check_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    'editor'::user_role
  );
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_pdf_download"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  supabase_url TEXT;
  service_key TEXT;
BEGIN
  -- Get the Supabase URL and service key from vault
  SELECT decrypted_secret INTO supabase_url 
  FROM vault.decrypted_secrets 
  WHERE name = 'SUPABASE_URL';
  
  SELECT decrypted_secret INTO service_key 
  FROM vault.decrypted_secrets 
  WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';
  
  -- Only proceed if we have the credentials
  IF supabase_url IS NOT NULL AND service_key IS NOT NULL THEN
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/send-download-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object('record', to_jsonb(NEW))
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_pdf_download"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."user_role") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND role = _role
  )
$$;


ALTER FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."user_role") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_or_editor"("_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND role IN ('admin', 'editor')
  )
$$;


ALTER FUNCTION "public"."is_admin_or_editor"("_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_editor_or_owner"("user_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid AND role IN ('editor', 'owner')
  );
END;
$$;


ALTER FUNCTION "public"."is_editor_or_owner"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_owner"("user_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid AND role = 'owner'
  );
END;
$$;


ALTER FUNCTION "public"."is_owner"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_contact_form_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  payload JSON;
BEGIN
  -- Build proper JSON (not text)
  payload := json_build_object('record', row_to_json(NEW));

  -- Call Edge Function with correct JSON body
  PERFORM
    supabase_functions.http_request(
      'https://itvhjkgfafikpqmuunlh.supabase.co/functions/v1/dynamic-responder',
      'POST',
      '{"Content-Type": "application/json"}',
      payload::text
    );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_contact_form_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_events"("search_query" "text" DEFAULT ''::"text", "event_category" "text" DEFAULT ''::"text", "event_status" "text" DEFAULT ''::"text", "start_date" "date" DEFAULT NULL::"date", "end_date" "date" DEFAULT NULL::"date", "min_capacity" integer DEFAULT 0, "max_capacity" integer DEFAULT NULL::integer, "user_uuid" "uuid" DEFAULT NULL::"uuid", "limit_count" integer DEFAULT 50, "offset_count" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "user_id" "uuid", "title" "text", "description" "text", "event_date" "date", "event_time" time without time zone, "duration" "text", "location" "text", "organizer_name" "text", "organizer_email" "text", "organizer_phone" "text", "capacity" integer, "category" "text", "price" "text", "registration_deadline" "date", "requirements" "text", "agenda" "text", "speakers" "text"[], "sponsors" "text"[], "additional_contact_info" "text", "status" "text", "event_banner" "text", "featured_image" "text", "event_tags" "text"[], "meta_title" "text", "meta_description" "text", "slug" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.user_id,
        e.title,
        e.description,
        e.event_date,
        e.event_time,
        e.duration,
        e.location,
        e.organizer_name,
        e.organizer_email,
        e.organizer_phone,
        e.capacity,
        e.category,
        e.price,
        e.registration_deadline,
        e.requirements,
        e.agenda,
        e.speakers,
        e.sponsors,
        e.additional_contact_info,
        e.status,
        e.event_banner,
        e.featured_image,
        e.event_tags,
        e.meta_title,
        e.meta_description,
        e.slug,
        e.created_at,
        e.updated_at
    FROM public.events e
    WHERE 
        (search_query = '' OR (
            e.title ILIKE '%' || search_query || '%' OR
            e.description ILIKE '%' || search_query || '%' OR
            e.location ILIKE '%' || search_query || '%' OR
            e.organizer_name ILIKE '%' || search_query || '%' OR
            EXISTS (SELECT 1 FROM unnest(e.event_tags) AS tag WHERE tag ILIKE '%' || search_query || '%')
        ))
        AND (event_category = '' OR e.category = event_category)
        AND (event_status = '' OR e.status = event_status)
        AND (start_date IS NULL OR e.event_date >= start_date)
        AND (end_date IS NULL OR e.event_date <= end_date)
        AND e.capacity >= min_capacity
        AND (max_capacity IS NULL OR e.capacity <= max_capacity)
        AND (user_uuid IS NULL OR e.user_id = user_uuid)
    ORDER BY 
        CASE 
            WHEN e.status = 'upcoming' THEN 1
            WHEN e.status = 'ongoing' THEN 2
            WHEN e.status = 'completed' THEN 3
            ELSE 4
        END,
        e.event_date ASC,
        e.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$;


ALTER FUNCTION "public"."search_events"("search_query" "text", "event_category" "text", "event_status" "text", "start_date" "date", "end_date" "date", "min_capacity" integer, "max_capacity" integer, "user_uuid" "uuid", "limit_count" integer, "offset_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."Request_Blueprint" (
    "id" bigint NOT NULL,
    "name" character varying NOT NULL,
    "email" character varying,
    "phone" "text",
    "designation" "text",
    "Submitted_at" timestamp with time zone
);


ALTER TABLE "public"."Request_Blueprint" OWNER TO "postgres";


ALTER TABLE "public"."Request_Blueprint" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Request_Blueprint_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."acdemia_form" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "course_intrest" "text",
    "message" "text",
    "submitted_at" timestamp with time zone
);


ALTER TABLE "public"."acdemia_form" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_posts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "excerpt" "text" NOT NULL,
    "featured_image" "text",
    "category" "text" NOT NULL,
    "subcategory" "text" DEFAULT ''::"text",
    "meta_title" "text" NOT NULL,
    "meta_description" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tags" "text"[],
    "publish_date" timestamp with time zone DEFAULT "now"(),
    "alt_image" "text",
    "author_name" "text" DEFAULT 'Rareminds'::"text"
);


ALTER TABLE "public"."blog_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blogs_draft" (
    "id" integer NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" character varying(255) NOT NULL,
    "content" "text",
    "excerpt" "text",
    "featured_image" "text",
    "category" character varying(100),
    "subcategory" character varying(100),
    "meta_title" character varying(255),
    "meta_description" "text",
    "slug" character varying(255),
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "publish_date" timestamp without time zone,
    "tags" "text"[],
    "alt_image" "text"
);


ALTER TABLE "public"."blogs_draft" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."blogs_draft_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."blogs_draft_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."blogs_draft_id_seq" OWNED BY "public"."blogs_draft"."id";



CREATE TABLE IF NOT EXISTS "public"."case_study_requests" (
    "id" integer NOT NULL,
    "name" "text",
    "email" "text",
    "pdf_url" "text",
    "institution" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."case_study_requests" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."case_study_requests_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."case_study_requests_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."case_study_requests_id_seq" OWNED BY "public"."case_study_requests"."id";



CREATE TABLE IF NOT EXISTS "public"."contact_form" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "email" "text",
    "role" "text",
    "phone" "text",
    "message" "text",
    "is_processed" boolean DEFAULT false
);


ALTER TABLE "public"."contact_form" OWNER TO "postgres";


COMMENT ON TABLE "public"."contact_form" IS 'Stores website contact form submissions';



COMMENT ON COLUMN "public"."contact_form"."is_processed" IS 'Indicates if this submission has been processed';



CREATE TABLE IF NOT EXISTS "public"."contact_forms" (
    "id" bigint NOT NULL,
    "fullName" "text",
    "jobTitle" "text",
    "company" "text",
    "email" "text",
    "phone" "text",
    "message" "text",
    "categories" "text",
    "submitted_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."contact_forms" OWNER TO "postgres";


ALTER TABLE "public"."contact_forms" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."contact_forms_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."courses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" character varying(255) NOT NULL,
    "slug" character varying(255) NOT NULL,
    "subtitle" character varying(255),
    "course_code" character varying(50),
    "category" "public"."category_type" NOT NULL,
    "institution_type" "public"."institution_grade_type" DEFAULT 'both'::"public"."institution_grade_type" NOT NULL,
    "course_category" character varying(100),
    "description" "text",
    "overview" "text",
    "duration_hours" integer,
    "mode" "public"."course_mode_type",
    "level" "public"."course_level_type",
    "focus" character varying(255),
    "image_url" "text",
    "banner_url" "text",
    "icon" character varying(100),
    "color_gradient" character varying(100),
    "price" numeric(10,2) DEFAULT 0,
    "currency" character varying(10) DEFAULT 'INR'::character varying,
    "benefits" "jsonb" DEFAULT '[]'::"jsonb",
    "what_you_learn" "jsonb" DEFAULT '[]'::"jsonb",
    "who_should_take" "jsonb" DEFAULT '[]'::"jsonb",
    "outcomes" "jsonb" DEFAULT '[]'::"jsonb",
    "curriculum" "jsonb" DEFAULT '[]'::"jsonb",
    "instructors" "jsonb" DEFAULT '[]'::"jsonb",
    "brochure_url" "text",
    "meta_title" character varying(255),
    "meta_description" "text",
    "is_featured" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."demo_bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "university" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "date" "date" NOT NULL,
    "time" time without time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."demo_bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."demo_pdf" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "email" character varying,
    "phone" character varying
);


ALTER TABLE "public"."demo_pdf" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."demo_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "university" "text" NOT NULL,
    "email" "text" NOT NULL,
    "course" "text",
    "message" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."demo_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_otps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "otp" character varying(10) NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."email_otps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_verifications" (
    "id" bigint NOT NULL,
    "email" "text" NOT NULL,
    "otp_code" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "attempts" integer DEFAULT 0
);


ALTER TABLE "public"."email_verifications" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."email_verifications_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."email_verifications_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."email_verifications_id_seq" OWNED BY "public"."email_verifications"."id";



CREATE TABLE IF NOT EXISTS "public"."event_contact" (
    "id" bigint NOT NULL,
    "event_id" "uuid" NOT NULL,
    "event_title" "text" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "organization" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_contact_email_check" CHECK (("email" ~* '^[^@]+@[^@]+\.[^@]+$'::"text")),
    CONSTRAINT "event_contact_phone_check" CHECK (("phone" ~ '^\+?[0-9\- ]{7,}$'::"text"))
);


ALTER TABLE "public"."event_contact" OWNER TO "postgres";


ALTER TABLE "public"."event_contact" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."event_contact_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."event_intrested" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "location" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_intrested" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_registrations" (
    "id" bigint NOT NULL,
    "event_id" "uuid",
    "event_name" "text" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "organization" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "payment_status" character varying(20) DEFAULT 'not_required'::character varying,
    "payment_id" character varying(100),
    "order_id" character varying(100),
    "payment_amount" integer,
    "payment_date" timestamp with time zone,
    "quantity" integer DEFAULT 1 NOT NULL,
    "total_amount" numeric(12,2),
    "payment_currency" character varying(10),
    "payment_verified_at" timestamp with time zone,
    "razorpay_payment_id" character varying(100),
    "payment_method" character varying(50)
);


ALTER TABLE "public"."event_registrations" OWNER TO "postgres";


COMMENT ON COLUMN "public"."event_registrations"."payment_status" IS 'Values: not_required, pending, completed, failed';



COMMENT ON COLUMN "public"."event_registrations"."quantity" IS 'Total number of tickets purchased in the registration';



COMMENT ON COLUMN "public"."event_registrations"."total_amount" IS 'Grand total collected for this registration';



ALTER TABLE "public"."event_registrations" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."event_registrations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "event_date" "date" NOT NULL,
    "event_time" time without time zone NOT NULL,
    "duration" "text" NOT NULL,
    "location" "text" NOT NULL,
    "organizer_name" "text" NOT NULL,
    "organizer_email" "text" NOT NULL,
    "organizer_phone" "text" NOT NULL,
    "capacity" integer DEFAULT 0 NOT NULL,
    "category" "text" NOT NULL,
    "price" "text",
    "registration_deadline" "date",
    "requirements" "text",
    "agenda" "text",
    "sponsors" "text"[] DEFAULT '{}'::"text"[],
    "additional_contact_info" "text",
    "status" "text" DEFAULT 'upcoming'::"text" NOT NULL,
    "event_banner" "text",
    "featured_image" "text",
    "event_tags" "text"[] DEFAULT '{}'::"text"[],
    "meta_title" "text" NOT NULL,
    "meta_description" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "is_physical" boolean,
    "event_link" "text",
    "speakers_details" "jsonb" DEFAULT '[]'::"jsonb",
    "speakers" "text"[] DEFAULT '{}'::"text"[],
    "location_latitude" double precision,
    "location_longitude" double precision,
    "faq" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "events_gallery" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "teaser_video" "text",
    "key_highlights" "text"[] DEFAULT '{}'::"text"[],
    "languages" "text"[] DEFAULT '{}'::"text"[],
    "mobile_featured_image" "text" DEFAULT ''::"text",
    "enquiry_pdf" "text",
    "enquiry_pdf_path" "text",
    CONSTRAINT "events_status_check" CHECK (("status" = ANY (ARRAY['upcoming'::"text", 'ongoing'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."events_calendar" AS
 SELECT "e"."event_date",
    "e"."event_time",
    "e"."title",
    "e"."category",
    "e"."location",
    "e"."capacity",
    "e"."status",
    "e"."slug",
    "e"."featured_image",
    EXTRACT(dow FROM "e"."event_date") AS "day_of_week",
    EXTRACT(week FROM "e"."event_date") AS "week_number",
    EXTRACT(month FROM "e"."event_date") AS "month_number"
   FROM "public"."events" "e"
  WHERE ("e"."status" = ANY (ARRAY['upcoming'::"text", 'ongoing'::"text"]))
  ORDER BY "e"."event_date", "e"."event_time";


ALTER TABLE "public"."events_calendar" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events_draft" (
    "id" integer NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "event_date" "date",
    "event_time" time without time zone,
    "duration" "text",
    "location" "text",
    "organizer_name" "text",
    "organizer_email" "text",
    "organizer_phone" "text",
    "capacity" integer DEFAULT 0,
    "category" "text",
    "price" "text",
    "registration_deadline" "date",
    "requirements" "text",
    "agenda" "text",
    "speakers" "text"[] DEFAULT '{}'::"text"[],
    "sponsors" "text"[] DEFAULT '{}'::"text"[],
    "additional_contact_info" "text",
    "status" "text" DEFAULT 'upcoming'::"text",
    "event_banner" "text",
    "featured_image" "text",
    "event_tags" "text"[] DEFAULT '{}'::"text"[],
    "meta_title" "text" NOT NULL,
    "meta_description" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "publish_date" "date",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "events_draft_status_check" CHECK (("status" = ANY (ARRAY['upcoming'::"text", 'ongoing'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."events_draft" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."events_draft_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."events_draft_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."events_draft_id_seq" OWNED BY "public"."events_draft"."id";



CREATE OR REPLACE VIEW "public"."events_summary" AS
 SELECT "e"."id",
    "e"."title",
    "e"."event_date",
    "e"."event_time",
    "e"."location",
    "e"."category",
    "e"."status",
    "e"."capacity",
    "e"."featured_image",
    "e"."slug",
    "e"."meta_title",
    "e"."meta_description",
    ("left"("e"."description", 200) || '...'::"text") AS "excerpt",
    "array_length"("e"."event_tags", 1) AS "tag_count",
    "e"."created_at"
   FROM "public"."events" "e"
  ORDER BY "e"."created_at" DESC;


ALTER TABLE "public"."events_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fdp_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "institution" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "facultyCount" numeric NOT NULL,
    "message" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."fdp_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."footer_email" (
    "email" character varying DEFAULT ''::character varying,
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "Id" "uuid" DEFAULT "gen_random_uuid"(),
    "p_key" bigint NOT NULL
);


ALTER TABLE "public"."footer_email" OWNER TO "postgres";


ALTER TABLE "public"."footer_email" ALTER COLUMN "p_key" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."footer_email_p_key_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."fsqm_h2_results" (
    "University" "text" NOT NULL,
    "college_code" "text",
    "college_name" "text",
    "team_name" "text",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."fsqm_h2_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fsqm_results" (
    "University" "text" NOT NULL,
    "college_code" "text",
    "college_name" "text",
    "team_name" "text",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."fsqm_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fsqm_winners" (
    "University" "text" NOT NULL,
    "college_code" "text",
    "college_name" "text",
    "team_name" "text",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."fsqm_winners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gmp_h2_results" (
    "University" "text" NOT NULL,
    "college_code" "text",
    "college_name" "text",
    "team_name" "text",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."gmp_h2_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gmp_results" (
    "University" "text" NOT NULL,
    "college_code" "text",
    "college_name" "text",
    "team_name" "text",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."gmp_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gmp_winners" (
    "University" "text" NOT NULL,
    "college_code" "text",
    "college_name" "text",
    "team_name" "text",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."gmp_winners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."government_form" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "address" "text",
    "message" "text",
    "submitted_at" timestamp with time zone
);


ALTER TABLE "public"."government_form" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mc_h2_results" (
    "University" "text" NOT NULL,
    "college_code" "text",
    "college_name" "text",
    "team_name" "text",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."mc_h2_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mc_results" (
    "University" "text" NOT NULL,
    "college_code" "text",
    "college_name" "text",
    "team_name" "text",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."mc_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mc_winners" (
    "University" "text" NOT NULL,
    "college_code" "text",
    "college_name" "text",
    "team_name" "text",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."mc_winners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" bigint NOT NULL,
    "registration_id" bigint,
    "razorpay_order_id" character varying(100) NOT NULL,
    "razorpay_payment_id" character varying(100),
    "amount" integer NOT NULL,
    "currency" character varying(3) DEFAULT 'INR'::character varying,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."payments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."payments_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."payments_id_seq" OWNED BY "public"."payments"."id";



CREATE TABLE IF NOT EXISTS "public"."pdf_downloads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "email" character varying,
    "downloaded_at" timestamp with time zone DEFAULT "now"(),
    "title" "text",
    "user_id" "uuid",
    "pdf_url" "text",
    "company" "text",
    "role" "text",
    "message" "text",
    "download_type" "text" NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "phone" "text"
);


ALTER TABLE "public"."pdf_downloads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "videos_url" "text"[],
    "title" "text" NOT NULL,
    "content_json" "jsonb" NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "conclusion" "text",
    "project_tags" "text",
    "featured_image" "text",
    "meta_title" "text",
    "meta_description" "text",
    "slug" "text"
);


ALTER TABLE "public"."project_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects_draft" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text",
    "project_tags" "text"[],
    "content_json" "jsonb",
    "conclusion" "text",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "featured_image" "text",
    "meta_title" "text",
    "meta_description" "text",
    "slug" "text",
    "video_url" "text"[],
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."projects_draft" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recruitment_forms" (
    "id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "company" character varying(255) NOT NULL,
    "email" character varying(255) NOT NULL,
    "role" character varying(255) NOT NULL,
    "message" "text" NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."recruitment_forms" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."recruitment_forms_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."recruitment_forms_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."recruitment_forms_id_seq" OWNED BY "public"."recruitment_forms"."id";



CREATE TABLE IF NOT EXISTS "public"."recruitment_services" (
    "id" integer NOT NULL,
    "link" "text",
    "title" "text",
    "title_desc" "text",
    "title_cta" "text",
    "title_img" "text",
    "title_img_alt" "text",
    "heading_1" "text",
    "heading_1_desc" "jsonb",
    "heading_2" "text",
    "heading_2_desc" "text",
    "heading_2_list" "jsonb",
    "heading_3" "text",
    "heading_3_desc" "text",
    "heading_3_list" "jsonb",
    "heading_4" "text",
    "heading_4_desc" "text",
    "heading_4_list" "jsonb",
    "cta" "text",
    "heading_5" "text",
    "heading_5_desc" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "meta_title" "text",
    "meta_desc" "text"
);


ALTER TABLE "public"."recruitment_services" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."recruitment_services_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."recruitment_services_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."recruitment_services_id_seq" OWNED BY "public"."recruitment_services"."id";



CREATE TABLE IF NOT EXISTS "public"."training_forms" (
    "id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "company" character varying(255) NOT NULL,
    "email" character varying(255) NOT NULL,
    "role" character varying(255) NOT NULL,
    "message" "text" NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."training_forms" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."training_forms_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."training_forms_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."training_forms_id_seq" OWNED BY "public"."training_forms"."id";



CREATE TABLE IF NOT EXISTS "public"."training_services" (
    "id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "feature_badges" "jsonb" DEFAULT '[]'::"jsonb",
    "programs" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."training_services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "role" character varying(50) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_roles_role_check" CHECK ((("role")::"text" = ANY ((ARRAY['editor'::character varying, 'owner'::character varying, 'admin'::character varying, 'viewer'::character varying])::"text"[])))
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_roles_with_emails" WITH ("security_barrier"='true') AS
 SELECT "ur"."id",
    "ur"."user_id",
    "au"."email",
    "au"."email_confirmed_at",
    "ur"."role",
    "ur"."created_at",
    "ur"."updated_at",
    "au"."last_sign_in_at"
   FROM ("public"."user_roles" "ur"
     JOIN "auth"."users" "au" ON (("ur"."user_id" = "au"."id")));


ALTER TABLE "public"."user_roles_with_emails" OWNER TO "postgres";


ALTER TABLE ONLY "public"."blogs_draft" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."blogs_draft_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."case_study_requests" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."case_study_requests_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."email_verifications" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."email_verifications_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."events_draft" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."events_draft_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."payments" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."payments_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."recruitment_forms" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."recruitment_forms_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."recruitment_services" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."recruitment_services_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."training_forms" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."training_forms_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."Request_Blueprint"
    ADD CONSTRAINT "Request_Blueprint_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."acdemia_form"
    ADD CONSTRAINT "acdemia_student_form_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blogs_draft"
    ADD CONSTRAINT "blogs_draft_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blogs_draft"
    ADD CONSTRAINT "blogs_draft_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."case_study_requests"
    ADD CONSTRAINT "case_study_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_form"
    ADD CONSTRAINT "contact_form_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_forms"
    ADD CONSTRAINT "contact_forms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_course_code_key" UNIQUE ("course_code");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."demo_bookings"
    ADD CONSTRAINT "demo_bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."demo_pdf"
    ADD CONSTRAINT "demo_pdf_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."demo_requests"
    ADD CONSTRAINT "demo_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_otps"
    ADD CONSTRAINT "email_otps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_verifications"
    ADD CONSTRAINT "email_verifications_email_code_unique" UNIQUE ("email", "otp_code");



ALTER TABLE ONLY "public"."email_verifications"
    ADD CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_contact"
    ADD CONSTRAINT "event_contact_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_intrested"
    ADD CONSTRAINT "event_intrested_event_id_email_key" UNIQUE ("event_id", "email");



ALTER TABLE ONLY "public"."event_intrested"
    ADD CONSTRAINT "event_intrested_event_id_phone_key" UNIQUE ("event_id", "phone");



ALTER TABLE ONLY "public"."event_intrested"
    ADD CONSTRAINT "event_intrested_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_registrations"
    ADD CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events_draft"
    ADD CONSTRAINT "events_draft_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."fdp_requests"
    ADD CONSTRAINT "fdp_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."footer_email"
    ADD CONSTRAINT "footer_email_pkey" PRIMARY KEY ("p_key");



ALTER TABLE ONLY "public"."fsqm_h2_results"
    ADD CONSTRAINT "fsqm_h2_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fsqm_results"
    ADD CONSTRAINT "fsqm_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fsqm_winners"
    ADD CONSTRAINT "fsqm_winners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gmp_h2_results"
    ADD CONSTRAINT "gmp_h2_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gmp_results"
    ADD CONSTRAINT "gmp_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gmp_winners"
    ADD CONSTRAINT "gmp_winners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."government_form"
    ADD CONSTRAINT "government_form_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mc_h2_results"
    ADD CONSTRAINT "mc_h2_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mc_results"
    ADD CONSTRAINT "mc_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mc_winners"
    ADD CONSTRAINT "mc_winners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pdf_downloads"
    ADD CONSTRAINT "pdf_downloads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_posts"
    ADD CONSTRAINT "project_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects_draft"
    ADD CONSTRAINT "projects_draft_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recruitment_forms"
    ADD CONSTRAINT "recruitment_forms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recruitment_services"
    ADD CONSTRAINT "recruitment_services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_forms"
    ADD CONSTRAINT "training_forms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_key" UNIQUE ("user_id");



CREATE INDEX "email_otps_email_idx" ON "public"."email_otps" USING "btree" ("email");



CREATE INDEX "email_otps_expires_at_idx" ON "public"."email_otps" USING "btree" ("expires_at");



CREATE INDEX "events_enquiry_pdf_path_idx" ON "public"."events" USING "btree" ("enquiry_pdf_path");



CREATE INDEX "idx_blog_posts_category" ON "public"."blog_posts" USING "btree" ("category");



CREATE INDEX "idx_blog_posts_created_at" ON "public"."blog_posts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_blog_posts_slug" ON "public"."blog_posts" USING "btree" ("slug");



CREATE INDEX "idx_blog_posts_subcategory" ON "public"."blog_posts" USING "btree" ("subcategory");



CREATE INDEX "idx_blog_posts_user_id" ON "public"."blog_posts" USING "btree" ("user_id");



CREATE INDEX "idx_blogs_draft_category" ON "public"."blogs_draft" USING "btree" ("category");



CREATE INDEX "idx_blogs_draft_created_at" ON "public"."blogs_draft" USING "btree" ("created_at");



CREATE INDEX "idx_blogs_draft_publish_date" ON "public"."blogs_draft" USING "btree" ("publish_date");



CREATE INDEX "idx_blogs_draft_slug" ON "public"."blogs_draft" USING "btree" ("slug");



CREATE INDEX "idx_blogs_draft_user_id" ON "public"."blogs_draft" USING "btree" ("user_id");



CREATE INDEX "idx_contact_form_created_at" ON "public"."contact_form" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_contact_form_email" ON "public"."contact_form" USING "btree" ("email");



CREATE INDEX "idx_email_verifications_email" ON "public"."email_verifications" USING "btree" ("email");



CREATE INDEX "idx_email_verifications_expires_at" ON "public"."email_verifications" USING "btree" ("expires_at");



CREATE INDEX "idx_event_registrations_payment_status" ON "public"."event_registrations" USING "btree" ("payment_status");



CREATE INDEX "idx_events_capacity" ON "public"."events" USING "btree" ("capacity");



CREATE INDEX "idx_events_category" ON "public"."events" USING "btree" ("category");



CREATE INDEX "idx_events_category_status" ON "public"."events" USING "btree" ("category", "status");



CREATE INDEX "idx_events_created_at" ON "public"."events" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_events_draft_created_at" ON "public"."events_draft" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_events_draft_slug" ON "public"."events_draft" USING "btree" ("slug");



CREATE INDEX "idx_events_draft_user_id" ON "public"."events_draft" USING "btree" ("user_id");



CREATE INDEX "idx_events_event_date" ON "public"."events" USING "btree" ("event_date");



CREATE INDEX "idx_events_event_date_status" ON "public"."events" USING "btree" ("event_date", "status");



CREATE INDEX "idx_events_event_id" ON "public"."events" USING "btree" ("id");



CREATE INDEX "idx_events_slug" ON "public"."events" USING "btree" ("slug");



CREATE INDEX "idx_events_status" ON "public"."events" USING "btree" ("status");



CREATE INDEX "idx_events_text_search" ON "public"."events" USING "gin" ("to_tsvector"('"english"'::"regconfig", (((("title" || ' '::"text") || "description") || ' '::"text") || "location")));



CREATE INDEX "idx_events_user_id" ON "public"."events" USING "btree" ("user_id");



CREATE INDEX "idx_payments_razorpay_order_id" ON "public"."payments" USING "btree" ("razorpay_order_id");



CREATE INDEX "idx_payments_registration_id" ON "public"."payments" USING "btree" ("registration_id");



CREATE INDEX "idx_payments_status" ON "public"."payments" USING "btree" ("status");



CREATE INDEX "idx_projects_draft_created_at" ON "public"."projects_draft" USING "btree" ("created_at");



CREATE INDEX "idx_projects_draft_slug" ON "public"."projects_draft" USING "btree" ("slug");



CREATE INDEX "idx_projects_draft_uuid" ON "public"."projects_draft" USING "btree" ("id");



CREATE INDEX "idx_user_roles_role" ON "public"."user_roles" USING "btree" ("role");



CREATE INDEX "idx_user_roles_user_id" ON "public"."user_roles" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "ensure_event_draft_slug_trigger" BEFORE INSERT OR UPDATE ON "public"."events_draft" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_event_slug"();



CREATE OR REPLACE TRIGGER "ensure_event_slug_trigger" BEFORE INSERT OR UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_event_slug"();



CREATE OR REPLACE TRIGGER "on_pdf_download_created" AFTER INSERT ON "public"."pdf_downloads" FOR EACH ROW EXECUTE FUNCTION "public"."handle_pdf_download"();



CREATE OR REPLACE TRIGGER "update_blog_posts_updated_at" BEFORE UPDATE ON "public"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_blogs_draft_updated_at" BEFORE UPDATE ON "public"."blogs_draft" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_email_otps_updated_at" BEFORE UPDATE ON "public"."email_otps" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_events_draft_updated_at" BEFORE UPDATE ON "public"."events_draft" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_events_updated_at" BEFORE UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_projects_draft_updated_at" BEFORE UPDATE ON "public"."projects_draft" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_roles_updated_at" BEFORE UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."event_contact"
    ADD CONSTRAINT "event_contact_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_intrested"
    ADD CONSTRAINT "event_intrested_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_registrations"
    ADD CONSTRAINT "event_registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events_draft"
    ADD CONSTRAINT "events_draft_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."event_registrations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pdf_downloads"
    ADD CONSTRAINT "pdf_downloads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."project_posts"
    ADD CONSTRAINT "project_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."projects_draft"
    ADD CONSTRAINT "projects_draft_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_roles"("user_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage all roles" ON "public"."user_roles" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "user_roles_1"
  WHERE (("user_roles_1"."user_id" = "auth"."uid"()) AND (("user_roles_1"."role")::"text" = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::"text"[]))))));



CREATE POLICY "Allow anonymous form submissions" ON "public"."contact_form" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Allow public inserts" ON "public"."pdf_downloads" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Allow public read access" ON "public"."training_services" FOR SELECT USING (true);



CREATE POLICY "Allow public to read own downloads" ON "public"."pdf_downloads" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow system to create roles" ON "public"."user_roles" FOR INSERT WITH CHECK (true);



CREATE POLICY "AllowInsertFDPRequests" ON "public"."fdp_requests" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can view projects_draft" ON "public"."projects_draft" FOR SELECT USING (true);



CREATE POLICY "Anyone can view published blog posts" ON "public"."blog_posts" FOR SELECT USING (true);



CREATE POLICY "Anyone can view published project posts" ON "public"."project_posts" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can delete projects_draft" ON "public"."projects_draft" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can insert blog posts" ON "public"."blog_posts" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Authenticated users can insert project posts" ON "public"."project_posts" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can insert projects_draft" ON "public"."projects_draft" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can update projects_draft" ON "public"."projects_draft" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text")) WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for users based on user_id" ON "public"."pdf_downloads" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Events are viewable by everyone" ON "public"."events" FOR SELECT USING (true);



CREATE POLICY "Owners can delete roles" ON "public"."user_roles" FOR DELETE USING (((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("ur"."role")::"text" = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::"text"[]))))) AND ("user_id" <> "auth"."uid"())));



CREATE POLICY "Owners can read all roles" ON "public"."user_roles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("ur"."role")::"text" = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::"text"[]))))));



CREATE POLICY "Owners can update roles" ON "public"."user_roles" FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("ur"."role")::"text" = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::"text"[]))))) AND ("user_id" <> "auth"."uid"())));



CREATE POLICY "Rareminds" ON "public"."demo_bookings" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can delete own blog posts, owners can delete all" ON "public"."blog_posts" FOR DELETE USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("ur"."role")::"text" = 'owner'::"text"))))));



CREATE POLICY "Users can delete own project posts, owners can delete all" ON "public"."project_posts" FOR DELETE USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("ur"."role")::"text" = 'owner'::"text"))))));



CREATE POLICY "Users can delete their own blog posts" ON "public"."blog_posts" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own event drafts" ON "public"."events_draft" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own events" ON "public"."events" FOR DELETE USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND (("user_roles"."role")::"text" = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::"text"[])))))));



CREATE POLICY "Users can delete their own posts" ON "public"."blog_posts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own posts" ON "public"."project_posts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own project posts" ON "public"."project_posts" FOR DELETE USING ((("auth"."uid"() = "user_id") AND ("auth"."role"() = 'authenticated'::"text")));



CREATE POLICY "Users can insert own blog posts" ON "public"."blog_posts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own project posts" ON "public"."project_posts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own downloads" ON "public"."pdf_downloads" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own event drafts" ON "public"."events_draft" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own events" ON "public"."events" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own posts" ON "public"."blog_posts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own posts" ON "public"."project_posts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own OTPs" ON "public"."email_otps" USING (true);



CREATE POLICY "Users can read all blog posts" ON "public"."blog_posts" FOR SELECT USING (true);



CREATE POLICY "Users can read all project posts" ON "public"."project_posts" FOR SELECT USING (true);



CREATE POLICY "Users can read own role" ON "public"."user_roles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own blog posts, owners can update all" ON "public"."blog_posts" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("ur"."role")::"text" = 'owner'::"text"))))));



CREATE POLICY "Users can update own project posts, owners can update all" ON "public"."project_posts" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("ur"."role")::"text" = 'owner'::"text"))))));



CREATE POLICY "Users can update their own blog posts" ON "public"."blog_posts" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own event drafts" ON "public"."events_draft" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own events" ON "public"."events" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND (("user_roles"."role")::"text" = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::"text"[])))))));



CREATE POLICY "Users can update their own posts" ON "public"."blog_posts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own posts" ON "public"."project_posts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own project posts" ON "public"."project_posts" FOR UPDATE USING ((("auth"."uid"() = "user_id") AND ("auth"."role"() = 'authenticated'::"text")));



CREATE POLICY "Users can view their own downloads" ON "public"."pdf_downloads" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own event drafts" ON "public"."events_draft" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own posts" ON "public"."blog_posts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own posts" ON "public"."project_posts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own roles" ON "public"."user_roles" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."blog_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_form" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."demo_bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_otps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events_draft" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fdp_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pdf_downloads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects_draft" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";









GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




































































































































































































































GRANT ALL ON FUNCTION "public"."assign_default_role_to_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."assign_default_role_to_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_default_role_to_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."call_recruitment_form_webhook"() TO "anon";
GRANT ALL ON FUNCTION "public"."call_recruitment_form_webhook"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."call_recruitment_form_webhook"() TO "service_role";



GRANT ALL ON FUNCTION "public"."can_delete"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_delete"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_delete"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."change_user_role"("target_user_id" "uuid", "new_role" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."change_user_role"("target_user_id" "uuid", "new_role" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."change_user_role"("target_user_id" "uuid", "new_role" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_event_slug"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_event_slug"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_event_slug"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_event_slug"("event_title" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_event_slug"("event_title" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_event_slug"("event_title" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_event_analytics"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_event_analytics"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_event_analytics"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_events_by_date_range"("start_date" "date", "end_date" "date", "user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_events_by_date_range"("start_date" "date", "end_date" "date", "user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_events_by_date_range"("start_date" "date", "end_date" "date", "user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_events_by_status"("event_status" "text", "user_uuid" "uuid", "limit_count" integer, "offset_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_events_by_status"("event_status" "text", "user_uuid" "uuid", "limit_count" integer, "offset_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_events_by_status"("event_status" "text", "user_uuid" "uuid", "limit_count" integer, "offset_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_events_with_user_info"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_events_with_user_info"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_events_with_user_info"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_popular_event_categories"("user_uuid" "uuid", "limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_popular_event_categories"("user_uuid" "uuid", "limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_popular_event_categories"("user_uuid" "uuid", "limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role"("check_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"("check_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"("check_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_pdf_download"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_pdf_download"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_pdf_download"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."user_role") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."user_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."user_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_or_editor"("_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_or_editor"("_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_or_editor"("_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_editor_or_owner"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_editor_or_owner"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_editor_or_owner"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_owner"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_owner"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_owner"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_contact_form_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_contact_form_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_contact_form_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."search_events"("search_query" "text", "event_category" "text", "event_status" "text", "start_date" "date", "end_date" "date", "min_capacity" integer, "max_capacity" integer, "user_uuid" "uuid", "limit_count" integer, "offset_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_events"("search_query" "text", "event_category" "text", "event_status" "text", "start_date" "date", "end_date" "date", "min_capacity" integer, "max_capacity" integer, "user_uuid" "uuid", "limit_count" integer, "offset_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_events"("search_query" "text", "event_category" "text", "event_status" "text", "start_date" "date", "end_date" "date", "min_capacity" integer, "max_capacity" integer, "user_uuid" "uuid", "limit_count" integer, "offset_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."Request_Blueprint" TO "anon";
GRANT ALL ON TABLE "public"."Request_Blueprint" TO "authenticated";
GRANT ALL ON TABLE "public"."Request_Blueprint" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Request_Blueprint_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Request_Blueprint_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Request_Blueprint_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."acdemia_form" TO "anon";
GRANT ALL ON TABLE "public"."acdemia_form" TO "authenticated";
GRANT ALL ON TABLE "public"."acdemia_form" TO "service_role";



GRANT ALL ON TABLE "public"."blog_posts" TO "anon";
GRANT ALL ON TABLE "public"."blog_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_posts" TO "service_role";



GRANT ALL ON TABLE "public"."blogs_draft" TO "anon";
GRANT ALL ON TABLE "public"."blogs_draft" TO "authenticated";
GRANT ALL ON TABLE "public"."blogs_draft" TO "service_role";



GRANT ALL ON SEQUENCE "public"."blogs_draft_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."blogs_draft_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."blogs_draft_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."case_study_requests" TO "anon";
GRANT ALL ON TABLE "public"."case_study_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."case_study_requests" TO "service_role";



GRANT ALL ON SEQUENCE "public"."case_study_requests_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."case_study_requests_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."case_study_requests_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."contact_form" TO "anon";
GRANT ALL ON TABLE "public"."contact_form" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_form" TO "service_role";



GRANT ALL ON TABLE "public"."contact_forms" TO "anon";
GRANT ALL ON TABLE "public"."contact_forms" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_forms" TO "service_role";



GRANT ALL ON SEQUENCE "public"."contact_forms_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."contact_forms_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."contact_forms_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."courses" TO "anon";
GRANT ALL ON TABLE "public"."courses" TO "authenticated";
GRANT ALL ON TABLE "public"."courses" TO "service_role";



GRANT ALL ON TABLE "public"."demo_bookings" TO "anon";
GRANT ALL ON TABLE "public"."demo_bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."demo_bookings" TO "service_role";



GRANT ALL ON TABLE "public"."demo_pdf" TO "anon";
GRANT ALL ON TABLE "public"."demo_pdf" TO "authenticated";
GRANT ALL ON TABLE "public"."demo_pdf" TO "service_role";



GRANT ALL ON TABLE "public"."demo_requests" TO "anon";
GRANT ALL ON TABLE "public"."demo_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."demo_requests" TO "service_role";



GRANT ALL ON TABLE "public"."email_otps" TO "anon";
GRANT ALL ON TABLE "public"."email_otps" TO "authenticated";
GRANT ALL ON TABLE "public"."email_otps" TO "service_role";



GRANT ALL ON TABLE "public"."email_verifications" TO "anon";
GRANT ALL ON TABLE "public"."email_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."email_verifications" TO "service_role";



GRANT ALL ON SEQUENCE "public"."email_verifications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."email_verifications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."email_verifications_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."event_contact" TO "anon";
GRANT ALL ON TABLE "public"."event_contact" TO "authenticated";
GRANT ALL ON TABLE "public"."event_contact" TO "service_role";



GRANT ALL ON SEQUENCE "public"."event_contact_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."event_contact_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."event_contact_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."event_intrested" TO "anon";
GRANT ALL ON TABLE "public"."event_intrested" TO "authenticated";
GRANT ALL ON TABLE "public"."event_intrested" TO "service_role";



GRANT ALL ON TABLE "public"."event_registrations" TO "anon";
GRANT ALL ON TABLE "public"."event_registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."event_registrations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."event_registrations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."event_registrations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."event_registrations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."events_calendar" TO "anon";
GRANT ALL ON TABLE "public"."events_calendar" TO "authenticated";
GRANT ALL ON TABLE "public"."events_calendar" TO "service_role";



GRANT ALL ON TABLE "public"."events_draft" TO "anon";
GRANT ALL ON TABLE "public"."events_draft" TO "authenticated";
GRANT ALL ON TABLE "public"."events_draft" TO "service_role";



GRANT ALL ON SEQUENCE "public"."events_draft_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."events_draft_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."events_draft_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."events_summary" TO "anon";
GRANT ALL ON TABLE "public"."events_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."events_summary" TO "service_role";



GRANT ALL ON TABLE "public"."fdp_requests" TO "anon";
GRANT ALL ON TABLE "public"."fdp_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."fdp_requests" TO "service_role";



GRANT ALL ON TABLE "public"."footer_email" TO "anon";
GRANT ALL ON TABLE "public"."footer_email" TO "authenticated";
GRANT ALL ON TABLE "public"."footer_email" TO "service_role";



GRANT ALL ON SEQUENCE "public"."footer_email_p_key_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."footer_email_p_key_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."footer_email_p_key_seq" TO "service_role";



GRANT ALL ON TABLE "public"."fsqm_h2_results" TO "anon";
GRANT ALL ON TABLE "public"."fsqm_h2_results" TO "authenticated";
GRANT ALL ON TABLE "public"."fsqm_h2_results" TO "service_role";



GRANT ALL ON TABLE "public"."fsqm_results" TO "anon";
GRANT ALL ON TABLE "public"."fsqm_results" TO "authenticated";
GRANT ALL ON TABLE "public"."fsqm_results" TO "service_role";



GRANT ALL ON TABLE "public"."fsqm_winners" TO "anon";
GRANT ALL ON TABLE "public"."fsqm_winners" TO "authenticated";
GRANT ALL ON TABLE "public"."fsqm_winners" TO "service_role";



GRANT ALL ON TABLE "public"."gmp_h2_results" TO "anon";
GRANT ALL ON TABLE "public"."gmp_h2_results" TO "authenticated";
GRANT ALL ON TABLE "public"."gmp_h2_results" TO "service_role";



GRANT ALL ON TABLE "public"."gmp_results" TO "anon";
GRANT ALL ON TABLE "public"."gmp_results" TO "authenticated";
GRANT ALL ON TABLE "public"."gmp_results" TO "service_role";



GRANT ALL ON TABLE "public"."gmp_winners" TO "anon";
GRANT ALL ON TABLE "public"."gmp_winners" TO "authenticated";
GRANT ALL ON TABLE "public"."gmp_winners" TO "service_role";



GRANT ALL ON TABLE "public"."government_form" TO "anon";
GRANT ALL ON TABLE "public"."government_form" TO "authenticated";
GRANT ALL ON TABLE "public"."government_form" TO "service_role";



GRANT ALL ON TABLE "public"."mc_h2_results" TO "anon";
GRANT ALL ON TABLE "public"."mc_h2_results" TO "authenticated";
GRANT ALL ON TABLE "public"."mc_h2_results" TO "service_role";



GRANT ALL ON TABLE "public"."mc_results" TO "anon";
GRANT ALL ON TABLE "public"."mc_results" TO "authenticated";
GRANT ALL ON TABLE "public"."mc_results" TO "service_role";



GRANT ALL ON TABLE "public"."mc_winners" TO "anon";
GRANT ALL ON TABLE "public"."mc_winners" TO "authenticated";
GRANT ALL ON TABLE "public"."mc_winners" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."payments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."payments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."payments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pdf_downloads" TO "anon";
GRANT ALL ON TABLE "public"."pdf_downloads" TO "authenticated";
GRANT ALL ON TABLE "public"."pdf_downloads" TO "service_role";



GRANT ALL ON TABLE "public"."project_posts" TO "anon";
GRANT ALL ON TABLE "public"."project_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."project_posts" TO "service_role";



GRANT ALL ON TABLE "public"."projects_draft" TO "anon";
GRANT ALL ON TABLE "public"."projects_draft" TO "authenticated";
GRANT ALL ON TABLE "public"."projects_draft" TO "service_role";



GRANT ALL ON TABLE "public"."recruitment_forms" TO "anon";
GRANT ALL ON TABLE "public"."recruitment_forms" TO "authenticated";
GRANT ALL ON TABLE "public"."recruitment_forms" TO "service_role";



GRANT ALL ON SEQUENCE "public"."recruitment_forms_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."recruitment_forms_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."recruitment_forms_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."recruitment_services" TO "anon";
GRANT ALL ON TABLE "public"."recruitment_services" TO "authenticated";
GRANT ALL ON TABLE "public"."recruitment_services" TO "service_role";



GRANT ALL ON SEQUENCE "public"."recruitment_services_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."recruitment_services_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."recruitment_services_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."training_forms" TO "anon";
GRANT ALL ON TABLE "public"."training_forms" TO "authenticated";
GRANT ALL ON TABLE "public"."training_forms" TO "service_role";



GRANT ALL ON SEQUENCE "public"."training_forms_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."training_forms_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."training_forms_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."training_services" TO "anon";
GRANT ALL ON TABLE "public"."training_services" TO "authenticated";
GRANT ALL ON TABLE "public"."training_services" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles_with_emails" TO "anon";
GRANT ALL ON TABLE "public"."user_roles_with_emails" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles_with_emails" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























drop policy "Users can delete their own events" on "public"."events";

drop policy "Users can update their own events" on "public"."events";

drop policy "Allow public inserts" on "public"."pdf_downloads";

drop policy "Allow public to read own downloads" on "public"."pdf_downloads";

drop policy "Admins can manage all roles" on "public"."user_roles";

drop policy "Owners can delete roles" on "public"."user_roles";

drop policy "Owners can read all roles" on "public"."user_roles";

drop policy "Owners can update roles" on "public"."user_roles";

alter table "public"."user_roles" drop constraint "user_roles_role_check";

alter table "public"."user_roles" add constraint "user_roles_role_check" CHECK (((role)::text = ANY ((ARRAY['editor'::character varying, 'owner'::character varying, 'admin'::character varying, 'viewer'::character varying])::text[]))) not valid;

alter table "public"."user_roles" validate constraint "user_roles_role_check";


  create policy "Users can delete their own events"
  on "public"."events"
  as permissive
  for delete
  to public
using (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND ((user_roles.role)::text = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::text[])))))));



  create policy "Users can update their own events"
  on "public"."events"
  as permissive
  for update
  to public
using (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND ((user_roles.role)::text = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::text[])))))));



  create policy "Allow public inserts"
  on "public"."pdf_downloads"
  as permissive
  for insert
  to anon, authenticated
with check (true);



  create policy "Allow public to read own downloads"
  on "public"."pdf_downloads"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Admins can manage all roles"
  on "public"."user_roles"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles user_roles_1
  WHERE ((user_roles_1.user_id = auth.uid()) AND ((user_roles_1.role)::text = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::text[]))))));



  create policy "Owners can delete roles"
  on "public"."user_roles"
  as permissive
  for delete
  to public
using (((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND ((ur.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[]))))) AND (user_id <> auth.uid())));



  create policy "Owners can read all roles"
  on "public"."user_roles"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND ((ur.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[]))))));



  create policy "Owners can update roles"
  on "public"."user_roles"
  as permissive
  for update
  to public
using (((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND ((ur.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[]))))) AND (user_id <> auth.uid())));



  create policy "Allow user registration"
  on "auth"."users"
  as permissive
  for insert
  to public
with check (true);


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.assign_default_role_to_new_user();


  create policy "Allow delete on events_pdf for authenticated users"
  on "storage"."objects"
  as permissive
  for delete
  to public
using ((bucket_id = 'events_pdf'::text));



  create policy "Allow update in events_pdf"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'events_pdf'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Any authenticated user can upload to events_pdf"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'events_pdf'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Anyone can view service images"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'service-images'::text));



  create policy "Authenticated users can delete service images"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'service-images'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Authenticated users can update service images"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'service-images'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Authenticated users can upload service images"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'service-images'::text) AND (auth.role() = 'authenticated'::text)));



