-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('parent', 'child')),
  full_name TEXT,
  date_of_birth DATE,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'en',
  theme_preference TEXT DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
  biometric_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- =====================================================
-- PARENT-CHILD RELATIONSHIPS
-- =====================================================
CREATE TABLE public.parent_child_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'parent' CHECK (relationship_type IN ('parent', 'guardian')),
  login_method TEXT NOT NULL CHECK (login_method IN ('own_email', 'parent_code')),
  access_code TEXT,
  code_hash TEXT,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, child_id),
  CHECK (parent_id != child_id)
);

-- =====================================================
-- GRADE SYSTEMS
-- =====================================================
CREATE TABLE public.grade_systems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  country TEXT,
  description JSONB,
  grades JSONB NOT NULL,
  best_grade TEXT NOT NULL,
  worst_grade TEXT NOT NULL,
  is_percentage BOOLEAN DEFAULT FALSE,
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SUBJECT CATEGORIES
-- =====================================================
CREATE TABLE public.subject_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name JSONB NOT NULL,
  icon TEXT,
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SUBJECTS
-- =====================================================
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES public.subject_categories(id) ON DELETE SET NULL,
  name JSONB NOT NULL,
  is_language_subject BOOLEAN DEFAULT FALSE,
  is_custom BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BONUS FACTORS
-- =====================================================
CREATE TABLE public.bonus_factors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  factor_type TEXT NOT NULL CHECK (factor_type IN ('term', 'class', 'subject', 'grade')),
  key TEXT NOT NULL,
  value DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, child_id, factor_type, key)
);

-- =====================================================
-- TERM GRADES
-- =====================================================
CREATE TABLE public.term_grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  school_year TEXT NOT NULL,
  term_type TEXT NOT NULL CHECK (term_type IN ('mid', 'full')),
  grade_system_id UUID NOT NULL REFERENCES public.grade_systems(id),
  class_level INTEGER NOT NULL CHECK (class_level > 0 AND class_level <= 13),
  total_subjects INTEGER DEFAULT 0,
  average_grade DECIMAL(5,2),
  total_bonus DECIMAL(10,2),
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SUBJECT GRADES
-- =====================================================
CREATE TABLE public.subject_grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  term_grade_id UUID NOT NULL REFERENCES public.term_grades(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id),
  grade_value TEXT NOT NULL,
  grade_numeric DECIMAL(5,2) NOT NULL,
  bonus_points DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(term_grade_id, subject_id)
);

-- =====================================================
-- AUDIT LOGS
-- =====================================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TRANSLATIONS
-- =====================================================
CREATE TABLE public.translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL,
  locale TEXT NOT NULL,
  value TEXT NOT NULL,
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(key, locale)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_term_grades_child ON public.term_grades(child_id);
CREATE INDEX idx_subject_grades_term ON public.subject_grades(term_grade_id);
CREATE INDEX idx_relationships_parent ON public.parent_child_relationships(parent_id);
CREATE INDEX idx_relationships_child ON public.parent_child_relationships(child_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX idx_translations_key_locale ON public.translations(key, locale);
CREATE INDEX idx_bonus_factors_user ON public.bonus_factors(user_id, child_id);

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bonus_factors_updated_at BEFORE UPDATE ON public.bonus_factors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_term_grades_updated_at BEFORE UPDATE ON public.term_grades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subject_grades_updated_at BEFORE UPDATE ON public.subject_grades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_translations_updated_at BEFORE UPDATE ON public.translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();