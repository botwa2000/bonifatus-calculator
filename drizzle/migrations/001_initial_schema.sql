CREATE TYPE "public"."text_direction" AS ENUM('ltr', 'rtl');--> statement-breakpoint
CREATE TYPE "public"."theme_preference" AS ENUM('light', 'dark', 'system');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('parent', 'child');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."invite_status" AS ENUM('pending', 'accepted', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."relationship_type" AS ENUM('parent', 'guardian', 'tutor');--> statement-breakpoint
CREATE TYPE "public"."grade_quality_tier" AS ENUM('best', 'second', 'third', 'below');--> statement-breakpoint
CREATE TYPE "public"."scale_type" AS ENUM('letter', 'numeric', 'percentage');--> statement-breakpoint
CREATE TYPE "public"."term_type" AS ENUM('midterm', 'final', 'semester', 'quarterly');--> statement-breakpoint
CREATE TYPE "public"."event_severity" AS ENUM('info', 'warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."rate_limit_action" AS ENUM('login', 'register', 'password_reset', 'api_request', 'email_send');--> statement-breakpoint
CREATE TYPE "public"."security_event_type" AS ENUM('login_success', 'login_failure', 'password_reset', 'email_change', 'suspicious_activity', 'account_lockout', 'rate_limit_exceeded', 'unauthorized_access_attempt');--> statement-breakpoint
CREATE TYPE "public"."verification_purpose" AS ENUM('email_verification', 'password_reset');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"image" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "languages" (
	"code" text PRIMARY KEY NOT NULL,
	"name_native" text NOT NULL,
	"name_english" text NOT NULL,
	"text_direction" text_direction DEFAULT 'ltr' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"role" "user_role" NOT NULL,
	"full_name" text NOT NULL,
	"date_of_birth" date NOT NULL,
	"avatar_url" text,
	"preferred_language" text DEFAULT 'en' NOT NULL,
	"theme_preference" "theme_preference" DEFAULT 'system' NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"notification_preferences" jsonb DEFAULT '{"email_grade_reminders":true,"email_reward_updates":true,"email_security_alerts":true}'::jsonb NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"terms_accepted_at" timestamp,
	"privacy_policy_accepted_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parent_child_invites" (
	"id" text PRIMARY KEY NOT NULL,
	"parent_id" text NOT NULL,
	"child_id" text,
	"code" text NOT NULL,
	"status" "invite_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp,
	CONSTRAINT "parent_child_invites_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "parent_child_relationships" (
	"id" text PRIMARY KEY NOT NULL,
	"parent_id" text NOT NULL,
	"child_id" text NOT NULL,
	"relationship_type" "relationship_type" DEFAULT 'parent' NOT NULL,
	"invitation_status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp,
	"invited_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_parent_child" UNIQUE("parent_id","child_id"),
	CONSTRAINT "no_self_relationship" CHECK ("parent_child_relationships"."parent_id" != "parent_child_relationships"."child_id")
);
--> statement-breakpoint
CREATE TABLE "grading_systems" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text,
	"name" jsonb,
	"description" jsonb,
	"country_code" text,
	"scale_type" "scale_type" NOT NULL,
	"best_is_highest" boolean DEFAULT true NOT NULL,
	"min_value" real,
	"max_value" real,
	"passing_threshold" real,
	"grade_definitions" jsonb,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subject_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" jsonb NOT NULL,
	"description" jsonb,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subject_grades" (
	"id" text PRIMARY KEY NOT NULL,
	"term_grade_id" text NOT NULL,
	"subject_id" text,
	"grade_value" text,
	"grade_numeric" real,
	"grade_normalized_100" real,
	"grade_quality_tier" "grade_quality_tier",
	"subject_weight" real DEFAULT 1,
	"bonus_points" real,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" text PRIMARY KEY NOT NULL,
	"name" jsonb NOT NULL,
	"description" jsonb,
	"category_id" text,
	"is_core_subject" boolean DEFAULT false,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_custom" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "term_grades" (
	"id" text PRIMARY KEY NOT NULL,
	"child_id" text NOT NULL,
	"school_year" text NOT NULL,
	"term_type" "term_type" NOT NULL,
	"grading_system_id" text NOT NULL,
	"class_level" integer NOT NULL,
	"term_name" text,
	"status" text DEFAULT 'submitted',
	"total_bonus_points" real,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bonus_factor_defaults" (
	"id" text PRIMARY KEY NOT NULL,
	"factor_type" text NOT NULL,
	"factor_key" text NOT NULL,
	"factor_value" real NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_bonus_factors" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"child_id" text,
	"factor_type" text NOT NULL,
	"factor_key" text NOT NULL,
	"factor_value" real NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rate_limit_tracking" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"action_type" "rate_limit_action" NOT NULL,
	"window_start" timestamp NOT NULL,
	"attempt_count" integer DEFAULT 1 NOT NULL,
	"last_attempt_at" timestamp DEFAULT now() NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"locked_until" timestamp
);
--> statement-breakpoint
CREATE TABLE "security_events" (
	"id" text PRIMARY KEY NOT NULL,
	"event_type" "security_event_type" NOT NULL,
	"severity" "event_severity" DEFAULT 'info' NOT NULL,
	"user_id" text,
	"ip_address" text NOT NULL,
	"user_agent" text,
	"event_metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"email" text NOT NULL,
	"code" text NOT NULL,
	"purpose" "verification_purpose" NOT NULL,
	"expires_at" timestamp NOT NULL,
	"verified_at" timestamp,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_preferred_language_languages_code_fk" FOREIGN KEY ("preferred_language") REFERENCES "public"."languages"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_child_invites" ADD CONSTRAINT "parent_child_invites_parent_id_user_profiles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_child_invites" ADD CONSTRAINT "parent_child_invites_child_id_user_profiles_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."user_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_child_relationships" ADD CONSTRAINT "parent_child_relationships_parent_id_user_profiles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_child_relationships" ADD CONSTRAINT "parent_child_relationships_child_id_user_profiles_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_child_relationships" ADD CONSTRAINT "parent_child_relationships_invited_by_user_profiles_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_grades" ADD CONSTRAINT "subject_grades_term_grade_id_term_grades_id_fk" FOREIGN KEY ("term_grade_id") REFERENCES "public"."term_grades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_grades" ADD CONSTRAINT "subject_grades_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_category_id_subject_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."subject_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "term_grades" ADD CONSTRAINT "term_grades_child_id_user_profiles_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "term_grades" ADD CONSTRAINT "term_grades_grading_system_id_grading_systems_id_fk" FOREIGN KEY ("grading_system_id") REFERENCES "public"."grading_systems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bonus_factors" ADD CONSTRAINT "user_bonus_factors_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bonus_factors" ADD CONSTRAINT "user_bonus_factors_child_id_user_profiles_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_codes" ADD CONSTRAINT "verification_codes_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;