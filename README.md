Bonifatus - School Grades Bonus Calculator
📋 PROJECT README
markdown# Bonifatus Calculator - Project Documentation

## 🎯 Project Objective

Bonifatus is a Progressive Web Application (PWA) that enables parents to reward their children for academic achievement through a transparent, configurable bonus points system. The platform calculates bonus points based on grades, with customizable factors for class level, term type, and subject importance, supporting multiple international grading systems.

## 🏗️ Implementation Architecture

### Platform: Progressive Web App (PWA)

**Rationale**: Single codebase for mobile and desktop, installable on devices, offline capability, no app store dependencies, lower maintenance overhead.

### Tech Stack (Production-Grade, Zero-Cost Deployment)

#### Frontend

- **Next.js 14** (App Router) - React framework with SSR, routing, API routes
- **TypeScript** - Type safety and development efficiency
- **Tailwind CSS** - Utility-first styling framework
- **shadcn/ui** - Accessible component library built on Radix UI
- **Framer Motion** - Animations and transitions
- **next-intl** - Type-safe internationalization
- **next-pwa** - PWA functionality (offline, installable)

#### Backend & Database

- **Next.js API Routes** - Serverless API endpoints
- **Supabase** (Free Tier) - Provides:
  - PostgreSQL database (500MB)
  - Authentication (Email, Google, Facebook OAuth)
  - Row Level Security (RLS)
  - Real-time subscriptions
  - File storage (1GB for avatars)
  - 50,000 monthly active users

#### Testing

- **Vitest** - Unit testing framework
- **React Testing Library** - Component testing
- **Playwright** - End-to-end testing
- **Jest** - Test coverage reporting

#### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks for pre-commit checks
- **Commitlint** - Conventional commit messages

#### Deployment & Infrastructure

- **Vercel** (Free Tier) - Hosting platform
  - Automatic deployments from Git
  - Preview deployments for pull requests
  - Custom domain support (bonifatus.com)
  - Automatic HTTPS
  - 100GB bandwidth/month
- **GitHub** - Version control and CI/CD
- **GitHub Actions** - Automated testing and deployment pipeline

#### Monitoring & Analytics

- **Vercel Analytics** - Performance monitoring
- **Sentry** (Free Tier) - Error tracking and reporting
- **Supabase Logs** - Database query monitoring

### Deployment Structure

- **Production**: `bonifatus.com` (main branch)
- **Staging**: `dev.bonifatus.com` (develop branch)
- **Pull Request Previews**: Auto-generated preview URLs

---

## 📊 Feature Analysis & Enhancements

### Core Features (MVP)

#### 1. Bonus Calculator

- Real-time calculation as grades are entered
- Support for multiple international grading systems:
  - A-F (UK, US, Canada, Australia)
  - 1-6 (Germany, Switzerland, Austria)
  - 5-1 (Russia, Ukraine, Eastern Europe)
  - Percentage-based (0-100%)
  - 1-15 (Denmark)
  - 10-1 (Netherlands)
  - 7-1 (Belgium)
- Dynamic subject selection with category grouping
- Search functionality for subjects
- Class level multiplier (1st class = 1x, 2nd = 2x, etc.)
- Term type multiplier (mid-term 0.5x, full-term 1x)
- Grade-based multipliers:
  - Best grade: 2x
  - Second best: 1x
  - Third best: 0x
  - Below third: -1x
- Minimum bonus floor of 0 points

#### 2. User Authentication & Account Management

- Email/password authentication with email verification
- OAuth integration (Google, Facebook)
- Biometric authentication (fingerprint, Face ID) for mobile
- Parent account creation and management
- Child account creation (self-registered or parent-added)
- Parent-child relationship linkage
- Account deletion with data purge
- Personal data editing
- Privacy-compliant consent management for minors

#### 3. Multi-User Role System

- **Parent Role**:
  - Create and manage child accounts
  - Configure custom bonus factors (overrides defaults)
  - View all children's progress and history
  - Define reward catalog (points-to-rewards mapping)
  - Approve grade entries (optional setting)
- **Child/Student Role**:
  - Enter test results independently
  - View personal progress and history
  - Track accumulated bonus points
  - View reward catalog and redemption status

#### 4. Data Management

- Grade entry and storage per term (mid/full)
- Historical tracking of all test results
- Configurable grading system per term (handles school changes)
- Subject categorization and management
- Custom subject creation capability
- Factor customization persistence

#### 5. Progress Tracking & Analytics

- Historical grade trends (charts and tables)
- Average grade calculations per term
- Bonus points accumulation tracking
- Paid/redeemed bonus history
- Subject performance breakdown
- Term-over-term comparison
- Year-over-year progress visualization
- Weak subject identification

#### 6. Internationalization

- Multi-language support (English, German, French at launch)
- All UI text stored in database for dynamic translation
- Language selection per user account
- RTL language support architecture
- Number and date formatting per locale

#### 7. User Experience

- 3-step onboarding tutorial (skippable)
- Dark/Light/System theme modes
- Responsive design (mobile-first approach)
- Offline functionality (PWA caching)
- Push notifications for grade reminders and achievements
- Icon-driven interface with minimal text

### Recommended Enhancements (Post-MVP)

#### Phase 2 Features

1. **Goal Setting System**
   - Children set target grades per subject
   - Visual progress indicators toward goals
   - Goal achievement celebrations

2. **Reward Catalog Management**
   - Parents define reward items with point values
   - Children browse available rewards
   - Redemption tracking and approval workflow
   - Reward history log

3. **Notification System**
   - Grade entry reminders
   - Achievement celebrations
   - Goal milestone alerts
   - Parent approval notifications
   - Weekly/monthly summary digests

4. **Export & Reporting**
   - PDF report generation
   - Parent-teacher conference summaries
   - Academic year overview reports
   - Shareable achievement certificates

#### Phase 3 Features

5. **Multi-Parent Support**
   - Multiple parents linked to one child
   - Separate bonus tracking per parent
   - Joint reward catalogs (optional)
   - Divorce/separated parent scenarios

6. **Gamification Elements**
   - Achievement badge system
   - Milestone rewards (Perfect Score, Most Improved, Consistency Streak)
   - Progress levels and rankings (personal, not comparative)
   - Unlockable themes and avatars

7. **Educational Integration**
   - Study resource links for weak subjects
   - Subject-specific tips and tutorials
   - External platform integrations (Khan Academy, Duolingo, etc.)
   - Calendar integration for exam tracking

8. **Advanced Analytics**
   - Predictive performance modeling
   - Study time correlation (optional tracking)
   - Improvement rate calculations
   - Personalized recommendations

9. **Social Features (Carefully Designed)**
   - Anonymous peer comparison (opt-in, percentage-based)
   - Study group formation
   - Parent community forum
   - Success story sharing (moderated)

10. **Grade Verification**
    - Optional photo upload of grade reports
    - Parent approval workflow before save
    - OCR integration for automatic grade extraction
    - School API integration (future)

---

## 🚨 Identified Flaws & Solutions

### Flaw 1: Bonus Calculation Ambiguity

**Issue**: Negative grade multipliers could theoretically produce negative bonuses, contradicting "minimum 0" rule.

**Solution**:

- Calculate bonus per subject: `subject_bonus = grade_multiplier × class_factor × term_factor × subject_factor`
- Sum all subject bonuses: `total_bonus = Σ(subject_bonuses)`
- Apply floor: `final_bonus = max(0, total_bonus)`
- Display negative subjects in red with improvement suggestions

### Flaw 2: Single-Parent Limitation

**Issue**: "One child, one parent" model doesn't accommodate divorced/separated parents or guardians.

**Solution**:

- Implement many-to-many parent-child relationship
- Each parent has independent factor configuration
- Each parent tracks separate bonus points for same child
- Optional: Shared reward catalog mode
- Child profile shows combined view with filters

### Flaw 3: Grade Integrity

**Issue**: No mechanism to prevent children from falsifying grades.

**Solution**:

- **Trust Mode** (default): Child enters, parent reviews anytime
- **Approval Mode** (optional): Grades pending until parent approves
- **Verification Mode** (premium): Photo upload of grade reports
- Parent receives notification on new grade entry
- Audit log of all grade modifications

### Flaw 4: Subject List Maintenance

**Issue**: Subject offerings vary significantly by country, school type, and curriculum.

**Solution**:

- Comprehensive default subject database (500+ subjects)
- Subjects organized by: Category → Subcategory → Subject
- Custom subject creation per user
- Community suggestion system (moderated approval)
- Subject tagging (language, STEM, arts, etc.)
- Localized subject names per language

### Flaw 5: Abstract Bonus Points

**Issue**: Points have no inherent value without conversion mechanism.

**Solution**:

- **Reward Catalog** feature (Phase 2)
- Parents define rewards with point costs
- Predefined templates (money, privileges, items, experiences)
- Point balance tracking
- Redemption request workflow
- Transaction history

### Flaw 6: Ability vs. Effort Disparity

**Issue**: System rewards absolute performance, not improvement or effort.

**Solution**:

- **Improvement Bonus**: Award points for grade improvements
  - Calculate: `improvement_bonus = (current_grade - previous_grade) × improvement_factor`
  - Configurable improvement multiplier
- **Effort Mode**: Parents can manually award effort points
- Display both performance and improvement metrics

### Flaw 7: Accessibility Not Addressed

**Issue**: No mention of users with disabilities.

**Solution**:

- WCAG 2.1 Level AA compliance mandatory
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode
- Adjustable font sizes
- Color-blind friendly design
- Alternative text for all images
- Form field labels and ARIA attributes

### Flaw 8: Data Privacy for Minors

**Issue**: Children under 13 (COPPA) or 16 (GDPR) require special handling.

**Solution**:

- Age verification during registration
- Parental consent requirement for minors
- Restricted data collection for child accounts
- No advertising or third-party data sharing
- Enhanced privacy controls
- Right to deletion with parental request
- Transparent privacy policy (child-friendly version)

### Flaw 9: Offline Functionality Limited

**Issue**: Calculator requires internet for grade system/subject data.

**Solution**:

- Service Worker caching of grade systems
- IndexedDB storage of user subjects and settings
- Offline queue for grade submissions
- Automatic sync when connection restored
- Offline indicator with pending changes badge

### Flaw 10: Scalability of Factor Customization

**Issue**: Parent adjusts one set of factors for all children, but children may need different incentives.

**Solution**:

- **Option A** (Recommended): Per-child factor configuration
- Inherit from parent defaults with override capability
- Child-specific subject weightings
- "Apply to all children" quick action
- Version history of factor changes

---

## 🔒 Security Requirements

### Authentication & Authorization

- **OAuth 2.0** implementation via Supabase Auth
  - Google OAuth 2.0
  - Facebook Login
- **Email verification** mandatory before account activation
- **JWT tokens** with secure httpOnly cookies
- **Refresh token rotation** mechanism
- **Session timeout**: 7 days idle, 30 days absolute
- **Password requirements**:
  - Minimum 12 characters
  - Mix of uppercase, lowercase, numbers, symbols
  - Password strength indicator
  - Compromised password detection (Have I Been Pwned API)
- **Multi-factor authentication** (Phase 2):
  - TOTP (Time-based One-Time Password)
  - Biometric (device-level)
- **Row Level Security (RLS)** in Supabase:
  - Users can only access their own data
  - Parents can access their children's data
  - Children can access only parent-approved data
- **Role-Based Access Control (RBAC)**:
  - Parent role: Full CRUD on child accounts and grades
  - Child role: CRUD on own grades, Read on parent settings

### Data Protection

- **HTTPS only** - Automatic via Vercel
- **HSTS headers** - Strict-Transport-Security enforcement
- **CSRF protection** - Anti-CSRF tokens in all forms
- **XSS prevention**:
  - Content Security Policy (CSP) headers
  - Input sanitization (DOMPurify)
  - Output encoding
- **SQL injection prevention** - Parameterized queries (Supabase SDK)
- **Input validation**:
  - Server-side validation (Zod schemas)
  - Client-side validation (React Hook Form)
  - Type checking (TypeScript)
- **Rate limiting**:
  - API endpoints: 100 requests/15 minutes per IP
  - Authentication: 5 failed attempts = 15-minute lockout
  - Supabase built-in rate limiting
- **Data encryption**:
  - At rest: Supabase AES-256 encryption
  - In transit: TLS 1.3
- **API key security**:
  - Environment variables only
  - Never committed to repository
  - Key rotation capability
  - Separate keys per environment

### Privacy Compliance

- **GDPR (General Data Protection Regulation)**:
  - Data minimization principle
  - Purpose limitation
  - Storage limitation (7 years retention, then auto-delete)
  - Right to access (data export feature)
  - Right to rectification (edit profile)
  - Right to erasure (delete account with cascade)
  - Right to portability (JSON/CSV export)
  - Privacy by design and default
- **COPPA (Children's Online Privacy Protection Act)**:
  - Parental consent for users under 13
  - Age gate on registration
  - Verifiable parental consent mechanisms
  - Limited data collection for minors
  - No behavioral advertising
  - Parent notification of data practices
- **Cookie consent**:
  - GDPR-compliant cookie banner
  - Essential cookies only by default
  - Analytics opt-in
- **Privacy policy**:
  - Comprehensive, plain-language
  - Child-friendly version
  - Version history
  - Notification of changes
- **Audit logging**:
  - All data access logged (who, what, when)
  - Grade modifications tracked
  - Account changes logged
  - 90-day retention for audit logs

### Child Safety

- **Age verification**:
  - Self-declared age
  - Parental email confirmation for under-13
- **Parental controls**:
  - Approve/deny child's grade entries
  - View all child activity
  - Revoke child account access
  - Set privacy restrictions
- **No public profiles**: All data private by default
- **No social features** for children under 13
- **Restricted data sharing**: No third-party sharing
- **Content moderation**: All user-generated content (custom subjects) reviewed
- **Reporting mechanism**: Abuse reporting available

### Application Security

- **Dependency scanning**:
  - Automated weekly scans (Dependabot)
  - Security patch auto-PRs
- **Secrets management**:
  - Environment variables in Vercel
  - No secrets in code repository
- **Error handling**:
  - Generic error messages to users
  - Detailed logs to Sentry (sanitized)
  - No stack traces exposed
- **API security**:
  - API versioning (/api/v1/)
  - Request validation middleware
  - Response sanitization
- **Logging & monitoring**:
  - Failed login attempts
  - Unusual activity patterns
  - Performance anomalies
  - Error rate thresholds
- **Backup & recovery**:
  - Supabase automated daily backups (7-day retention)
  - Weekly manual backups to separate storage
  - Disaster recovery plan documented

---

## 📐 Project Structure

bonifatus/
├── .github/
│ └── workflows/
│ ├── ci.yml # Continuous integration pipeline
│ ├── deploy-production.yml # Production deployment
│ └── deploy-staging.yml # Staging deployment
│
├── public/
│ ├── icons/ # PWA icons (multiple sizes)
│ ├── locales/ # Static translation files (fallback)
│ ├── manifest.json # PWA manifest
│ └── robots.txt # SEO configuration
│
├── src/
│ ├── app/ # Next.js 14 App Router
│ │ ├── [locale]/ # Internationalized routes
│ │ │ ├── (auth)/ # Authentication route group
│ │ │ │ ├── login/
│ │ │ │ │ ├── page.tsx # Login page (<300 lines)
│ │ │ │ │ └── actions.ts # Server actions
│ │ │ │ ├── register/
│ │ │ │ │ ├── page.tsx
│ │ │ │ │ └── actions.ts
│ │ │ │ └── verify-email/
│ │ │ │ └── page.tsx
│ │ │ │
│ │ │ ├── (dashboard)/ # Protected route group
│ │ │ │ ├── calculator/
│ │ │ │ │ ├── page.tsx # Main calculator
│ │ │ │ │ └── actions.ts
│ │ │ │ ├── progress/
│ │ │ │ │ ├── page.tsx # Progress analytics
│ │ │ │ │ └── components/
│ │ │ │ ├── settings/
│ │ │ │ │ ├── page.tsx
│ │ │ │ │ ├── profile/
│ │ │ │ │ ├── factors/
│ │ │ │ │ └── children/
│ │ │ │ └── layout.tsx # Dashboard layout with nav
│ │ │ │
│ │ │ ├── onboarding/
│ │ │ │ └── page.tsx # 3-step tutorial
│ │ │ │
│ │ │ ├── layout.tsx # Root locale layout
│ │ │ └── page.tsx # Landing/home page
│ │ │
│ │ ├── api/ # API routes
│ │ │ ├── v1/
│ │ │ │ ├── grades/
│ │ │ │ │ ├── route.ts # CRUD operations
│ │ │ │ │ └── [id]/route.ts
│ │ │ │ ├── children/
│ │ │ │ │ └── route.ts
│ │ │ │ ├── subjects/
│ │ │ │ │ └── route.ts
│ │ │ │ ├── factors/
│ │ │ │ │ └── route.ts
│ │ │ │ ├── analytics/
│ │ │ │ │ └── route.ts
│ │ │ │ └── auth/
│ │ │ │ ├── callback/route.ts
│ │ │ │ └── session/route.ts
│ │ │ │
│ │ │ └── webhooks/
│ │ │ └── supabase/route.ts # Database webhooks
│ │ │
│ │ ├── globals.css # Global styles (Tailwind)
│ │ ├── layout.tsx # Root layout
│ │ └── error.tsx # Error boundary
│ │
│ ├── components/ # React components
│ │ ├── ui/ # shadcn/ui components
│ │ │ ├── button.tsx # <200 lines each
│ │ │ ├── input.tsx
│ │ │ ├── select.tsx
│ │ │ ├── dialog.tsx
│ │ │ ├── card.tsx
│ │ │ ├── chart.tsx
│ │ │ └── ...
│ │ │
│ │ ├── calculator/ # Calculator-specific
│ │ │ ├── GradeInput.tsx # Grade entry component
│ │ │ ├── SubjectSelector.tsx # Subject selection
│ │ │ ├── BonusDisplay.tsx # Real-time bonus display
│ │ │ ├── GradeSystemPicker.tsx # Grading system selector
│ │ │ └── CalculatorForm.tsx # Main form container
│ │ │
│ │ ├── progress/ # Analytics components
│ │ │ ├── GradeChart.tsx # Historical chart
│ │ │ ├── BonusHistory.tsx # Bonus timeline
│ │ │ ├── SubjectBreakdown.tsx # Subject performance
│ │ │ └── TrendAnalysis.tsx # Trend visualization
│ │ │
│ │ ├── auth/ # Authentication
│ │ │ ├── LoginForm.tsx
│ │ │ ├── RegisterForm.tsx
│ │ │ ├── OAuthButtons.tsx
│ │ │ └── VerifyEmail.tsx
│ │ │
│ │ ├── shared/ # Shared components
│ │ │ ├── Header.tsx
│ │ │ ├── Footer.tsx
│ │ │ ├── Navigation.tsx
│ │ │ ├── ThemeToggle.tsx
│ │ │ ├── LanguageSelector.tsx
│ │ │ └── ErrorBoundary.tsx
│ │ │
│ │ └── onboarding/
│ │ ├── TutorialStep1.tsx
│ │ ├── TutorialStep2.tsx
│ │ └── TutorialStep3.tsx
│ │
│ ├── lib/ # Utility libraries
│ │ ├── supabase/ # Database client
│ │ │ ├── client.ts # Browser client
│ │ │ ├── server.ts # Server client
│ │ │ ├── middleware.ts # Auth middleware
│ │ │ └── migrations/ # Database migrations
│ │ │
│ │ ├── validations/ # Zod schemas
│ │ │ ├── auth.ts # Auth validations
│ │ │ ├── grade.ts # Grade validations
│ │ │ ├── user.ts # User validations
│ │ │ └── settings.ts # Settings validations
│ │ │
│ │ ├── utils/ # Helper functions
│ │ │ ├── calculator.ts # Bonus calculation logic
│ │ │ ├── formatters.ts # Number/date formatting
│ │ │ ├── validators.ts # Input validators
│ │ │ └── constants.ts # App constants
│ │ │
│ │ ├── hooks/ # Custom React hooks
│ │ │ ├── useAuth.ts # Authentication hook
│ │ │ ├── useGrades.ts # Grade data hook
│ │ │ ├── useTheme.ts # Theme management
│ │ │ └── useLocalStorage.ts # Local storage hook
│ │ │
│ │ └── api/ # API client functions
│ │ ├── grades.ts # Grade API calls
│ │ ├── children.ts # Children API calls
│ │ ├── subjects.ts # Subjects API calls
│ │ └── analytics.ts # Analytics API calls
│ │
│ ├── types/ # TypeScript definitions
│ │ ├── database.ts # Supabase generated types
│ │ ├── entities.ts # Business entities
│ │ ├── api.ts # API request/response types
│ │ └── index.ts # Type exports
│ │
│ ├── config/ # Configuration files
│ │ ├── site.ts # Site metadata
│ │ ├── navigation.ts # Navigation structure
│ │ ├── grade-systems.ts # Grading system definitions
│ │ └── subjects.ts # Subject categories
│ │
│ └── middleware.ts # Next.js middleware (auth check)
│
├── tests/
│ ├── unit/ # Vitest unit tests
│ │ ├── calculator.test.ts
│ │ ├── validators.test.ts
│ │ └── formatters.test.ts
│ │
│ ├── integration/ # Integration tests
│ │ ├── api/
│ │ │ ├── grades.test.ts
│ │ │ └── auth.test.ts
│ │ └── components/
│ │ └── calculator.test.tsx
│ │
│ └── e2e/ # Playwright E2E tests
│ ├── auth-flow.spec.ts
│ ├── calculator-flow.spec.ts
│ └── parent-child-flow.spec.ts
│
├── supabase/
│ ├── migrations/ # Database migrations
│ │ ├── 001_initial_schema.sql
│ │ ├── 002_grade_systems.sql
│ │ ├── 003_subjects.sql
│ │ └── 004_rls_policies.sql
│ │
│ ├── seed.sql # Seed data (grade systems, subjects)
│ └── config.toml # Supabase configuration
│
├── docs/
│ ├── API.md # API documentation
│ ├── DATABASE.md # Database schema documentation
│ ├── DEPLOYMENT.md # Deployment guide
│ ├── DEVELOPMENT.md # Development setup guide
│ ├── SECURITY.md # Security guidelines
│ └── CONTRIBUTING.md # Contribution guidelines
│
├── .env.example # Environment variables template
├── .env.local # Local environment (gitignored)
├── .eslintrc.json # ESLint configuration
├── .gitignore # Git ignore rules
├── .prettierrc # Prettier configuration
├── next.config.js # Next.js configuration
├── package.json # Dependencies
├── playwright.config.ts # Playwright configuration
├── postcss.config.js # PostCSS configuration
├── tailwind.config.ts # Tailwind configuration
├── tsconfig.json # TypeScript configuration
├── vitest.config.ts # Vitest configuration
└── README.md # Project overview

### File Size Compliance

- **Maximum file size**: 300 lines (500 absolute maximum)
- **Component splitting**: Complex components split into sub-components
- **Function extraction**: Utilities in separate files
- **Type separation**: Types in dedicated type files
- **Single Responsibility Principle**: Each file has one clear purpose

---

## 🗄️ Database Schema

### Supabase PostgreSQL Tables

#### `users`

```sql
- id (uuid, PK, auto-generated)
- email (text, unique, not null)
- role (enum: 'parent', 'child')
- full_name (text)
- date_of_birth (date)
- avatar_url (text)
- preferred_language (text, default: 'en')
- theme_preference (enum: 'light', 'dark', 'system')
- biometric_enabled (boolean, default: false)
- created_at (timestamptz)
- updated_at (timestamptz)
- deleted_at (timestamptz, soft delete)
parent_child_relationships
sql- id (uuid, PK)
- parent_id (uuid, FK → users.id)
- child_id (uuid, FK → users.id)
- relationship_type (enum: 'parent', 'guardian', default: 'parent')
- approved (boolean, default: false)
- created_at (timestamptz)
grade_systems
sql- id (uuid, PK)
- name (text, not null) -- "A-F System"
- code (text, unique) -- "us-af"
- country (text)
- description (jsonb) -- {locale: description}
- grades (jsonb) -- [{value: "A", numeric: 95, label: {locale: text}}]
- best_grade (text) -- "A"
- worst_grade (text) -- "F"
- is_percentage (boolean)
- display_order (integer)
- created_at (timestamptz)
subject_categories
sql- id (uuid, PK)
- name (jsonb) -- {locale: name}
- icon (text) -- Icon identifier
- display_order (integer)
- created_at (timestamptz)
subjects
sql- id (uuid, PK)
- category_id (uuid, FK → subject_categories.id)
- name (jsonb) -- {locale: name}
- is_language_subject (boolean, default: false)
- is_custom (boolean, default: false)
- created_by (uuid, FK → users.id, nullable)
- approved (boolean, default: true)
- created_at (timestamptz)
bonus_factors
sql- id (uuid, PK)
- user_id (uuid, FK → users.id, nullable) -- Null = default factors
- factor_type (enum: 'term', 'class', 'subject', 'grade')
- key (text) -- 'full_term', 'mid_term', '1st_class', etc.
- value (decimal(5,2))
- created_at (timestamptz)
- updated_at (timestamptz)
term_grades
sql- id (uuid, PK)
- child_id (uuid, FK → users.id)
- school_year (text) -- "2024-2025"
- term_type (enum: 'mid', 'full')
- grade_system_id (uuid, FK → grade_systems.id)
- class_level (integer) -- 1, 2, 3, etc.
- total_subjects (integer, computed)
- average_grade (decimal(5,2), computed)
- total_bonus (decimal(10,2), computed)
- approved_by (uuid, FK → users.id, nullable)
- approved_at (timestamptz, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)
subject_grades
sql- id (uuid, PK)
- term_grade_id (uuid, FK → term_grades.id)
- subject_id (uuid, FK → subjects.id)
- grade_value (text) -- "A", "5", "85%", etc.
- grade_numeric (decimal(5,2)) -- Normalized 0-100
- bonus_points (decimal(10,2), computed)
- created_at (timestamptz)
- updated_at (timestamptz)
audit_logs
sql- id (uuid, PK)
- user_id (uuid, FK → users.id)
- action (text) -- "grade.create", "user.update", etc.
- resource_type (text) -- "term_grades", "users", etc.
- resource_id (uuid)
- old_values (jsonb)
- new_values (jsonb)
- ip_address (inet)
- user_agent (text)
- created_at (timestamptz)
translations
sql- id (uuid, PK)
- key (text, unique) -- "ui.welcome_message"
- locale (text) -- "en", "de", "fr"
- value (text)
- context (text) -- Additional context for translators
- created_at (timestamptz)
- updated_at (timestamptz)
Row Level Security (RLS) Policies
sql-- Users can only read their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- Parents can view their children's profiles
CREATE POLICY "Parents can view children"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM parent_child_relationships
    WHERE parent_id = auth.uid() AND child_id = users.id
  )
);

-- Children can only create grades for themselves
CREATE POLICY "Children can create own grades"
ON term_grades FOR INSERT
WITH CHECK (child_id = auth.uid());

-- Parents can view children's grades
CREATE POLICY "Parents can view children grades"
ON term_grades FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM parent_child_relationships
    WHERE parent_id = auth.uid() AND child_id = term_grades.child_id
  )
);

-- Similar policies for all tables following least-privilege principle
Indexes for Performance
sqlCREATE INDEX idx_term_grades_child ON term_grades(child_id);
CREATE INDEX idx_subject_grades_term ON subject_grades(term_grade_id);
CREATE INDEX idx_relationships_parent ON parent_child_relationships(parent_id);
CREATE INDEX idx_relationships_child ON parent_child_relationships(child_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_translations_key_locale ON translations(key, locale);

🎯 Development Milestones
Phase 1: Foundation & MVP (Weeks 1-6)
Milestone 1.1: Project Setup (Week 1)

✅ Initialize Next.js 14 project with TypeScript
✅ Configure Tailwind CSS and shadcn/ui
✅ Set up Supabase project and database
✅ Configure ESLint, Prettier, Husky
✅ Create GitHub repository
✅ Set up Vercel deployment
✅ Configure environment variables
✅ Create initial project structure

Deliverables: Working development environment, CI/CD pipeline
Milestone 1.2: Authentication System (Week 2)

✅ Implement Supabase Auth integration
✅ Create login/register pages
✅ Email verification flow
✅ OAuth integration (Google, Facebook)
✅ Password reset functionality
✅ Session management
✅ Protected route middleware
✅ User profile CRUD operations

Deliverables: Functional authentication system, user management
Milestone 1.3: Database Schema & Seed Data (Week 3)

✅ Create all database tables
✅ Implement RLS policies
✅ Write database migrations
✅ Seed grade systems (A-F, 1-6, 5-1, %, 1-15, etc.)
✅ Seed subject categories and subjects
✅ Seed default bonus factors
✅ Create database indexes
✅ Set up audit logging

Deliverables: Complete database schema with seed data
Milestone 1.4: Core Calculator (Weeks 4-5)

✅ Build calculator UI components
✅ Grade system selector
✅ Subject selector with search
✅ Real-time bonus calculation logic
✅ Grade entry form validation
✅ Average calculation
✅ Save functionality for authenticated users
✅ Anonymous calculator mode
✅ Responsive design implementation

Deliverables: Fully functional bonus calculator
Milestone 1.5: Parent-Child Management (Week 5)

✅ Parent account creation
✅ Child account creation (self-registration)
✅ Parent invitation flow (email verification)
✅ Relationship approval workflow
✅ Child list view for parents
✅ Switch between children
✅ Remove child relationship

Deliverables: Multi-user role system, relationship management
Milestone 1.6: Testing & Quality Assurance (Week 6)

✅ Unit tests for calculator logic (Vitest)
✅ Component tests (React Testing Library)
✅ API integration tests
✅ E2E tests for critical flows (Playwright)
✅ Security testing (OWASP Top 10)
✅ Performance testing (Lighthouse)
✅ Accessibility testing (axe, WAVE)
✅ Cross-browser testing

Deliverables: Test coverage >80%, all critical paths tested

Phase 2: Enhanced Features (Weeks 7-10)
Milestone 2.1: Progress Tracking & Analytics (Week 7)

✅ Historical grade charts (Chart.js/Recharts)
✅ Bonus accumulation timeline
✅ Subject performance breakdown
✅ Term comparison views
✅ Year-over-year trends
✅ Weak subject identification
✅ Export to PDF/CSV

Deliverables: Comprehensive analytics dashboard
Milestone 2.2: Internationalization (Week 8)

✅ Implement next-intl
✅ Translation key extraction
✅ English translations (complete)
✅ German translations (complete)
✅ French translations (complete)
✅ Language selector component
✅ RTL support architecture
✅ Number/date formatting per locale
✅ Translation management system

Deliverables: Multi-language support (EN, DE, FR)
Milestone 2.3: Factor Customization (Week 9)

✅ Factor configuration UI
✅ Per-child factor overrides
✅ Preview calculation with custom factors
✅ Reset to defaults functionality
✅ Factor change history
✅ Validation rules for factors

Deliverables: Flexible bonus calculation customization
Milestone 2.4: Onboarding & UX Polish (Week 10)

✅ 3-step tutorial flow
✅ Contextual tooltips
✅ Empty state designs
✅ Loading skeletons
✅ Error state handling
✅ Success notifications
✅ Smooth animations (Framer Motion)
✅ Dark/light theme toggle
✅ Biometric authentication setup

Deliverables: Polished user experience, onboarding flow

Phase 3: Advanced Features (Weeks 11-14)
Milestone 3.1: Reward Catalog (Week 11)

✅ Reward creation interface (parents)
✅ Reward browsing (children)
✅ Point balance tracking
✅ Redemption request workflow
✅ Approval/rejection system
✅ Transaction history
✅ Reward templates library

Deliverables: Complete reward management system
Milestone 3.2: Notification System (Week 12)

✅ Push notification setup (PWA)
✅ Grade entry reminders
✅ Achievement notifications
✅ Approval request alerts
✅ Weekly summary digests
✅ Email notifications (optional)
✅ Notification preferences

Deliverables: Comprehensive notification system
Milestone 3.3: Goal Setting & Gamification (Week 13)

✅ Goal creation interface
✅ Progress tracking toward goals
✅ Achievement badge system
✅ Milestone celebrations
✅ Unlockable themes/avatars
✅ Personal leaderboard (not comparative)

Deliverables: Gamification elements to boost engagement
Milestone 3.4: Multi-Parent Support (Week 14)

✅ Multiple parents per child
✅ Independent bonus tracking per parent
✅ Shared reward catalog (optional)
✅ Joint parent view
✅ Permission management

Deliverables: Support for complex family structures

Phase 4: Production Readiness (Weeks 15-16)
Milestone 4.1: Security Hardening (Week 15)

✅ Penetration testing
✅ Security audit (automated tools)
✅ Rate limiting implementation
✅ CAPTCHA for registration/login
✅ Content Security Policy tuning
✅ Dependency vulnerability scanning
✅ Secrets rotation
✅ Privacy policy finalization
✅ GDPR/COPPA compliance verification

Deliverables: Production-grade security posture
Milestone 4.2: Performance Optimization (Week 15)

✅ Image optimization (Next.js Image)
✅ Code splitting optimization
✅ Bundle size reduction
✅ Database query optimization
✅ Caching strategy implementation
✅ CDN configuration
✅ Lighthouse score >90

Deliverables: Fast, optimized application
Milestone 4.3: Documentation & Knowledge Transfer (Week 16)

✅ Complete API documentation
✅ Database schema documentation
✅ Deployment runbook
✅ Troubleshooting guide
✅ User guide (parents and children)
✅ Video tutorials
✅ FAQs
✅ Contribution guidelines

Deliverables: Comprehensive documentation
Milestone 4.4: Production Launch (Week 16)

✅ Final QA testing
✅ Load testing
✅ Staging environment validation
✅ Production deployment
✅ DNS configuration (bonifatus.com)
✅ Monitoring setup (Sentry, Vercel Analytics)
✅ Backup verification
✅ Launch announcement

Deliverables: Live production application

📋 Component Breakdown
UI Components (shadcn/ui)

Button - Primary, secondary, ghost, link variants
Input - Text, email, password, number inputs
Select - Dropdown select with search
Dialog - Modal dialogs and confirmations
Card - Content containers
Chart - Data visualization (via Recharts)
Form - Form wrapper with validation
Table - Data tables with sorting
Tabs - Tab navigation
Accordion - Collapsible content
Alert - Notifications and alerts
Badge - Status indicators
Avatar - User profile images
Popover - Contextual tooltips
Progress - Progress indicators
Slider - Range inputs (term type selector)
Switch - Toggle switches
Toast - Toast notifications
Skeleton - Loading placeholders

Custom Components
Calculator Module

CalculatorForm - Main container orchestrating calculator
GradeSystemPicker - Grading system selection dropdown
SubjectSelector - Categorized subject selection with search
GradeInput - Individual subject grade entry
BonusDisplay - Real-time bonus calculation display
AverageDisplay - Average grade display
TermSlider - Mid/full term slider toggle
ClassLevelPicker - Class level dropdown (1-12)
SaveGradesButton - Save/update functionality

Progress Module

GradeHistoryChart - Line/bar chart for historical grades
BonusTimelineChart - Bonus accumulation over time
SubjectPerformanceChart - Radar/bar chart per subject
TrendAnalysisCard - Statistical trend insights
ComparisonView - Term-to-term comparison
ExportButton - PDF/CSV export functionality

Auth Module

LoginForm - Email/password login
RegisterForm - New user registration
OAuthButtons - Google/Facebook OAuth
VerifyEmailCard - Email verification status
PasswordResetForm - Password reset flow
BiometricSetup - Fingerprint/Face ID setup

Settings Module

ProfileEditor - Edit user profile
FactorConfigurator - Customize bonus factors
ChildrenManager - Parent's child list management
ThemeToggle - Light/dark/system mode
LanguageSelector - Language preference
NotificationSettings - Notification preferences
DeleteAccount - Account deletion with confirmation

Shared Module

Header - Top navigation bar
Footer - Footer with links
Sidebar - Dashboard sidebar navigation
ErrorBoundary - Error handling wrapper
LoadingSpinner - Loading states
EmptyState - No data placeholders
ConfirmDialog - Confirmation modals

Onboarding Module

TutorialStep1 - Welcome and purpose explanation
TutorialStep2 - How to use calculator
TutorialStep3 - Saving and tracking progress
TutorialProgress - Step indicator


🔄 Development Workflow
Git Branching Strategy

main - Production-ready code, deployed to bonifatus.com
develop - Integration branch, deployed to dev.bonifatus.com
feature/ - Feature branches (e.g., feature/reward-catalog)
bugfix/ - Bug fix branches
hotfix/ - Critical production fixes

Commit Convention
Follow Conventional Commits:
feat: add reward catalog component
fix: correct bonus calculation for negative grades
docs: update API documentation
test: add E2E tests for calculator
refactor: split CalculatorForm into smaller components
style: format code with Prettier
chore: update dependencies
Pull Request Process

Create feature branch from develop
Develop feature with tests
Run linting and tests locally
Push branch and create PR
Automated CI runs tests
Code review by team member
Address review comments
Merge to develop (squash merge)
Deploy to staging automatically
QA testing on staging
Merge to main when ready for production

Code Review Checklist

 Code follows project structure and naming conventions
 Files are under 300 lines (500 max)
 All functions have JSDoc comments
 No hardcoded values (use config/database)
 TypeScript types are properly defined
 Unit tests written for new logic
 Integration tests for API endpoints
 E2E tests for user flows (if applicable)
 No console.log statements (use proper logging)
 Security considerations addressed
 Accessibility requirements met (WCAG 2.1 AA)
 Mobile responsive design verified
 Performance impact assessed
 Error handling implemented
 Loading states implemented
 No TODO/FIXME comments in production code

Testing Strategy

Unit Tests: All utility functions, calculation logic
Component Tests: All UI components in isolation
Integration Tests: API endpoints, database operations
E2E Tests: Critical user journeys (auth, calculator, saving grades)
Coverage Target: >80% overall, 100% for critical paths
Accessibility Tests: Automated axe-core tests
Performance Tests: Lighthouse CI on every PR


🚀 Deployment Guide
Environment Setup
Development Environment Variables
env# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token
Production Environment Variables
Same as above, but with production URLs:
envNEXT_PUBLIC_APP_URL=https://bonifatus.com
# ... production Supabase URL and keys
Staging Environment Variables
envNEXT_PUBLIC_APP_URL=https://dev.bonifatus.com
# ... staging Supabase URL and keys
Vercel Deployment
Initial Setup

Connect GitHub repository to Vercel
Configure build settings:

Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install


Add environment variables in Vercel dashboard
Set up custom domains:

Production: bonifatus.com
Staging: dev.bonifatus.com



Automatic Deployments

Production: Automatically deploys on push to main
Staging: Automatically deploys on push to develop
Preview: Automatically creates preview URL for all PRs

Manual Deployment
bash# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
Database Migrations
Apply Migrations
bash# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
Create New Migration
bash# Create migration file
supabase migration new migration_name

# Edit the SQL file in supabase/migrations/
# Apply migration
supabase db push
Domain Configuration
DNS Settings (bonifatus.com)
A Record:    bonifatus.com → 76.76.21.21 (Vercel IP)
CNAME:       www → cname.vercel-dns.com
CNAME:       dev → cname.vercel-dns.com
SSL/TLS

Automatic HTTPS via Vercel
Certificates auto-renewed

Monitoring Setup
Sentry Error Tracking

Create Sentry project
Add DSN to environment variables
Install @sentry/nextjs
Configure in sentry.client.config.js and sentry.server.config.js

Vercel Analytics

Automatically enabled for all deployments
Real-time metrics dashboard

Supabase Monitoring

Database health dashboard
Query performance insights
API usage metrics


🛡️ Production Checklist
Pre-Launch

 All environment variables configured
 Database migrations applied
 Seed data populated
 RLS policies verified
 OAuth apps configured (Google, Facebook)
 Custom domain configured and SSL verified
 Monitoring tools configured (Sentry, Vercel Analytics)
 Backup strategy implemented
 Privacy policy published
 Terms of service published
 Cookie consent banner implemented
 All tests passing (unit, integration, E2E)
 Lighthouse score >90
 Accessibility audit passed (WCAG 2.1 AA)
 Security audit completed
 Load testing completed
 Cross-browser testing completed
 Mobile responsiveness verified

Post-Launch

 Monitor error rates (Sentry)
 Monitor performance metrics (Vercel Analytics)
 Monitor database performance (Supabase)
 Check user registration flow
 Verify email delivery
 Test OAuth flows
 Monitor API rate limits
 Review logs for anomalies
 Set up automated backups
 Create incident response plan


📞 Support & Maintenance
Issue Tracking

GitHub Issues for bug reports and feature requests
Labels: bug, enhancement, documentation, security
Priority levels: P0-Critical, P1-High, P2-Medium, P3-Low

Maintenance Schedule

Weekly: Dependency updates (patch versions)
Monthly: Security audits, performance reviews
Quarterly: Major dependency updates, feature planning

Backup & Recovery

Database: Daily automated backups (7-day retention)
Manual backups: Weekly to separate storage
Recovery Time Objective (RTO): 4 hours
Recovery Point Objective (RPO): 24 hours

Disaster Recovery Plan

Identify incident severity
Notify stakeholders
Restore from latest backup
Verify data integrity
Resume normal operations
Post-mortem analysis


👥 Team Roles & Responsibilities
Development Team

Full-Stack Developer: Feature implementation, bug fixes
QA Engineer: Testing, quality assurance
DevOps: Deployment, monitoring, infrastructure

Code Ownership

Each feature module has a designated owner
Owners responsible for maintenance and reviews
Ownership documented in CODEOWNERS file


📚 Additional Resources
Documentation Links

Next.js: https://nextjs.org/docs
Supabase: https://supabase.com/docs
Tailwind CSS: https://tailwindcss.com/docs
shadcn/ui: https://ui.shadcn.com
TypeScript: https://www.typescriptlang.org/docs
Vercel: https://vercel.com/docs

Community

GitHub Discussions: Technical discussions
Discord/Slack: Real-time team communication
Stack Overflow: Technical Q&A


🎓 Learning Resources
For New Developers

Next.js 14 App Router tutorial
Supabase crash course
TypeScript fundamentals
React hooks deep dive
PWA development guide

Best Practices

Clean Code principles
SOLID principles
Security best practices (OWASP Top 10)
Accessibility guidelines (WCAG)
Performance optimization techniques


📄 License
[To be determined - suggest MIT or Apache 2.0 for open-source, or proprietary]

🙏 Acknowledgments

Next.js team for excellent framework
Supabase for backend infrastructure
Vercel for deployment platform
shadcn for UI component library
Open-source community


Version: 1.0.0
Last Updated: [Current Date]
Maintained By: Bonifatus Development Team
Contact: [support email]

END OF README

---

## Summary

This comprehensive guide provides a complete roadmap for building the Bonifatus bonus calculator as a production-grade Progressive Web Application. The implementation uses a modern, cost-effective tech stack (Next.js, Supabase, Vercel) that is entirely free for initial deployment while maintaining professional quality standards.

Key highlights:
- **Zero-cost deployment** using Vercel free tier and Supabase free tier
- **Production-ready architecture** with security, testing, and monitoring built-in
- **Modular codebase** with strict file size limits (300 lines) for maintainability
- **Comprehensive feature set** with thoughtful enhancements and flaw mitigations
- **International support** with multi-language and multi-grading system capabilities
- **Child safety and privacy** compliance with GDPR and COPPA
- **Clear milestones** with a 16-week development timeline

The project is ready for immediate development following this documentation, with all technical decisions made and no alternatives requiring selection.RetryClaude can make mistakes. Please double-check responses. Sonnet 4.5
```
