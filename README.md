# Bonifatus - School Grades Bonus Calculator

## Project Vision

Bonifatus is a Progressive Web Application that helps parents motivate their children's academic performance through a transparent, gamified bonus points system. The app transforms grades into tangible rewards, creating clear goals and fostering positive learning habits while maintaining complete data privacy and child safety.

---

## What is Bonifatus?

**The Problem**: Parents struggle to effectively motivate children academically in a transparent, fair manner that adapts to different grading systems and family values.

**The Solution**: A secure, customizable platform where:

- Children enter their grades from school tests and exams
- The system automatically calculates bonus points based on performance
- Parents can customize how different factors (grade quality, class level, term type, subject importance) affect rewards
- Families track academic progress over time with visual analytics
- Parents define a reward catalog (toys, privileges, experiences) that children can "purchase" with earned points

**Key Differentiators**:

- Works with any international grading system (A-F, 1-6, percentages, etc.)
- Child-safe platform with COPPA and GDPR compliance
- Offline-capable Progressive Web App (works on all devices)
- Free forever with no hidden costs
- Privacy-first: your family data never leaves secure, encrypted storage

---

## Current Project State

### ✅ Completed

- Project initialization with Next.js 15 and TypeScript
- Supabase backend integration configured
- Professional landing page deployed to bonifatus.com
- Vercel deployment pipeline active
- Development environment fully operational

### 🚧 In Progress

- Documentation restructuring (current task)

### 📋 Next Steps (Immediate)

1. Security architecture planning
2. Authentication system implementation
3. Database schema design and migration
4. Core calculator logic development

---

## Core Objectives

### Phase 1: Foundation (Weeks 1-6)

**Goal**: Create a secure, functioning MVP where users can register, enter grades, and see calculated bonus points.

**Objectives**:

- Implement secure multi-method authentication (email/password, Google OAuth, Microsoft OAuth)
- Design and deploy database schema with proper security policies
- Build grade calculator engine supporting multiple international grading systems
- Create parent and child account management system
- Develop basic responsive UI with core navigation

### Phase 2: Enhanced Functionality (Weeks 7-10)

**Goal**: Add customization, historical tracking, and reward management.

**Objectives**:

- Implement customizable bonus factor configuration
- Build progress tracking dashboard with visual analytics
- Create reward catalog system for parents
- Add point redemption workflow
- Implement multi-language support (English, German, French)

### Phase 3: Polish & Security Hardening (Weeks 11-14)

**Goal**: Production-ready security, performance, and user experience.

**Objectives**:

- Comprehensive security audit and penetration testing
- Rate limiting and bot protection implementation
- Performance optimization (sub-2-second page loads)
- Accessibility compliance (WCAG 2.1 AA)
- Complete end-to-end testing coverage

### Phase 4: Launch & Scale (Weeks 15-16)

**Goal**: Public launch with monitoring and support infrastructure.

**Objectives**:

- Production deployment with zero-downtime strategy
- Error tracking and performance monitoring activation
- User documentation and help center
- Backup and disaster recovery verification
- Launch announcement and user onboarding

---

## Technology Stack

### Frontend

- **Next.js 15** - React framework with App Router for modern web development
- **TypeScript** - Type-safe development preventing runtime errors
- **Tailwind CSS** - Rapid UI development with utility-first styling
- **shadcn/ui** - Accessible, customizable component library
- **PWA** - Installable on devices with offline capability

### Backend

- **Supabase** - PostgreSQL database with built-in authentication and real-time features
- **Next.js API Routes** - Serverless backend functions
- **Row Level Security** - Database-level access control

### Security

- **Supabase Auth** - Industry-standard OAuth 2.0 and JWT authentication
- **Email Verification** - Prevent fake account creation
- **Password Hashing** - bcrypt with high iteration count
- **Rate Limiting** - Prevent brute force and DDoS attacks
- **reCAPTCHA v3** - Invisible bot protection on critical forms
- **HTTPS Only** - All traffic encrypted in transit
- **Database Encryption** - AES-256 encryption at rest

### Deployment

- **Vercel** - Automatic deployments with preview environments
- **GitHub** - Version control and collaboration
- **Vercel Analytics** - Performance monitoring
- **Sentry** - Error tracking and alerting

---

## Key Features

### User Management

- Secure registration with email verification
- Google and Microsoft OAuth integration (no Facebook due to complexity)
- Password strength enforcement and breach checking
- Separate parent and child account types with role-based permissions
- Parent can manage multiple children
- Child can be linked to multiple parents (divorced/separated family support)

### Bonus Calculator

- Support for 7+ international grading systems
- Customizable calculation factors (class level, term type, grade quality, subject importance)
- Real-time calculation as grades are entered
- Automatic grade averaging
- Minimum bonus floor prevents negative totals
- Historical grade comparison and trend analysis

### Progress Tracking

- Visual charts showing grade trends over time
- Subject performance breakdown
- Bonus points accumulation timeline
- Term-over-term comparison
- Weak subject identification for targeted improvement

### Reward System

- Parents create custom reward catalog with point costs
- Children browse available rewards
- Point redemption request workflow with parent approval
- Transaction history tracking
- Pre-defined reward templates for quick setup

### Security & Privacy

- COPPA compliance for children under 13
- GDPR compliance for EU users
- End-to-end encryption for sensitive data
- No advertising or third-party data sharing
- Parental consent mechanism
- Account and data deletion on request
- Audit logging of all critical actions

### International Support

- Multi-language interface (English, German, French at launch)
- Multiple grading system support
- Number and date formatting per locale
- Currency support for monetary rewards

---

## Security Priorities

### Authentication Security

- Strong password requirements (minimum 12 characters, complexity rules)
- Email verification mandatory before account activation
- OAuth with trusted providers only (Google, Microsoft)
- Session management with secure tokens
- Automatic logout after 15 minutes of inactivity (with warning prompt)
- Two-factor authentication for parent accounts

### Data Protection

- All data encrypted at rest (AES-256)
- All traffic encrypted in transit (TLS 1.3)
- Row-level security preventing unauthorized data access
- API request validation and sanitization
- SQL injection prevention through parameterized queries
- XSS protection with Content Security Policy headers

### Attack Prevention

- Rate limiting on all API endpoints
- reCAPTCHA on registration and login forms
- CSRF token validation
- Brute force protection with account lockout
- DDoS protection via Vercel infrastructure
- Input validation on client and server sides

### Child Safety

- Age verification during registration
- Parental consent required for under-13 users
- Private-by-default profiles (no social features)
- No external links without parental approval
- Content moderation on user-generated data
- Abuse reporting mechanism

---

## Development Principles

### Code Quality

- TypeScript strict mode enabled
- Comprehensive test coverage (unit, integration, E2E)
- Code review required for all changes
- Automated linting and formatting
- Maximum 300 lines per file for maintainability

### Performance

- Server-side rendering for fast initial loads
- Code splitting and lazy loading
- Image optimization
- Database query optimization
- CDN for static assets

### Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode
- Adjustable font sizes

### Privacy by Design

- Minimal data collection
- Purpose limitation for all data
- Regular data audits
- Transparent privacy policy
- User control over their data

---

## Documentation Structure

- **README.md** (this file) - Project overview, vision, and current state
- **DEPLOYMENT.md** - Step-by-step implementation guide with milestones and current progress
- **SECURITY.md** - Comprehensive security architecture, threat model, and implementation details
- **docs/DATABASE.md** - Database schema design and relationship documentation
- **docs/API.md** - API endpoint specifications and usage examples
- **docs/TESTING.md** - Testing strategy and coverage requirements
- **docs/USER-GUIDE.md** - End-user documentation for parents and children

---

## Getting Started

### Prerequisites

- Node.js 20+ installed
- Git installed
- Supabase account
- Vercel account
- GitHub account

### Quick Start

1. Clone the repository
2. Install dependencies with npm install
3. Copy .env.example to .env.local and fill in environment variables
4. Run development server with npm run dev
5. Access the application at http://localhost:3000

### Development Workflow

1. Create feature branch from main
2. Implement feature with tests
3. Run linting and type checking
4. Submit pull request for review
5. Address feedback and merge
6. Automatic deployment to staging
7. Manual promotion to production after testing

---

## Contributing

We welcome contributions that align with our mission of helping families celebrate academic achievement. Please read our contribution guidelines before submitting pull requests.

### Priority Areas

- Security enhancements and vulnerability reports
- Accessibility improvements
- Performance optimizations
- Additional grading system support
- Translation contributions

---

## License

To be determined (considering MIT or Apache 2.0 for open-source)

---

## Contact

- **Website**: https://bonifatus.com
- **Issues**: GitHub Issues for bug reports and feature requests
- **Security**: security@bonifatus.com for vulnerability reports (to be set up)

---

## Acknowledgments

Built with modern web technologies:

- Next.js team for an excellent framework
- Supabase for backend infrastructure
- Vercel for deployment platform
- Open-source community for tools and libraries

---

**Version**: 0.1.0 (Alpha)
**Last Updated**: January 2025
**Status**: Active Development
