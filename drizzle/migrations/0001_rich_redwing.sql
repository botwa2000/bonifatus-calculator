ALTER TYPE "public"."user_role" ADD VALUE 'admin';--> statement-breakpoint
CREATE TABLE "quick_grades" (
	"id" text PRIMARY KEY NOT NULL,
	"child_id" text NOT NULL,
	"subject_id" text NOT NULL,
	"grading_system_id" text NOT NULL,
	"class_level" integer NOT NULL,
	"grade_value" text NOT NULL,
	"grade_normalized_100" real,
	"grade_quality_tier" "grade_quality_tier",
	"bonus_points" real,
	"note" text,
	"graded_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "quick_grades" ADD CONSTRAINT "quick_grades_child_id_user_profiles_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quick_grades" ADD CONSTRAINT "quick_grades_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quick_grades" ADD CONSTRAINT "quick_grades_grading_system_id_grading_systems_id_fk" FOREIGN KEY ("grading_system_id") REFERENCES "public"."grading_systems"("id") ON DELETE no action ON UPDATE no action;