-- Add report card image URL to term_grades
ALTER TABLE "term_grades" ADD COLUMN IF NOT EXISTS "report_card_image_url" TEXT;
