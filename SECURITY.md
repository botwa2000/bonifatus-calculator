# Bonifatus Security Architecture

## Document Purpose

This document outlines the comprehensive security strategy for Bonifatus, including threat modeling, security controls, attack prevention mechanisms, and compliance requirements. Security is a top priority given the application handles data about children.

---

## Security Principles

### Defense in Depth

Multiple layers of security controls ensure that if one layer fails, others prevent compromise.

### Principle of Least Privilege

Users and systems only have the minimum permissions needed to perform their functions.

### Security by Default

All features secure by default, requiring explicit action to reduce security.

### Privacy by Design

Privacy considerations integrated from the start, not added afterward.

### Zero Trust Architecture

Never trust, always verify - all requests authenticated and authorized.

---

## Threat Model

### Assets to Protect

**Critical Assets**:

- Children's personal information (names, ages, grades)
- Parent-child relationship data
- Academic performance records
- User authentication credentials
- Session tokens and API keys

**High-Value Assets**:

- Bonus calculation algorithms
- Reward catalog data
- User preferences and settings
- Communication history

**Lower-Value Assets**:

- Anonymized usage statistics
- General application metadata
- Public content (landing pages)

### Threat Actors

**External Attackers**:

- **Motivation**: Data theft, account takeover, disruption
- **Capabilities**: Automated tools, common exploits, social engineering
- **Likelihood**: High
- **Impact**: Critical

**Malicious Insiders**:

- **Motivation**: Data exfiltration, sabotage
- **Capabilities**: Direct system access, insider knowledge
- **Likelihood**: Low
- **Impact**: Critical

**Curious Children**:

- **Motivation**: Grade manipulation, access to parent accounts
- **Capabilities**: Basic technical knowledge, access to family devices
- **Likelihood**: Medium
- **Impact**: Medium

**Automated Bots**:

- **Motivation**: Account creation for spam, credential stuffing
- **Capabilities**: High-volume automated requests
- **Likelihood**: High
- **Impact**: Medium

### Attack Vectors

**Authentication Attacks**:

- Credential stuffing with leaked passwords
- Brute force password guessing
- Session hijacking
- OAuth token theft
- Password reset exploitation

**Injection Attacks**:

- SQL injection via input fields
- Cross-site scripting (XSS) via user content
- Command injection in file uploads
- LDAP injection in authentication

**Authorization Attacks**:

- Horizontal privilege escalation (access other users' data)
- Vertical privilege escalation (child to parent)
- Insecure direct object references
- Missing function level access control

**Data Attacks**:

- Man-in-the-middle interception
- Data exfiltration via API
- Unauthorized data modification
- Data deletion or corruption

**Availability Attacks**:

- Distributed Denial of Service (DDoS)
- Resource exhaustion
- Application crashes
- Database overload

**Social Engineering**:

- Phishing for credentials
- Account recovery fraud
- Support impersonation
- Third-party app scams

---

## Security Controls by Layer

### Layer 1: Network Security

#### HTTPS Enforcement

**Control**: All traffic encrypted with TLS 1.3

**Implementation**:

- Automatic HTTPS via Vercel platform
- HTTP requests redirected to HTTPS
- Strict-Transport-Security headers enabled
- Certificate auto-renewal
- TLS 1.0 and 1.1 disabled

**Rationale**: Prevents man-in-the-middle attacks and eavesdropping

#### DDoS Protection

**Control**: Traffic filtering and rate limiting at CDN level

**Implementation**:

- Vercel Edge Network absorbs DDoS attacks
- Geographic traffic distribution
- Automatic scaling under load
- Suspicious pattern detection

**Rationale**: Ensures application availability during attacks

#### API Gateway

**Control**: Centralized API request handling

**Implementation**:

- All API requests through Next.js API routes
- Request logging and monitoring
- Automatic request validation
- Error handling without information leakage

**Rationale**: Single point for enforcing security policies

---

### Layer 2: Authentication Security

#### Email/Password Authentication

**Password Requirements**:

- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Not in common password lists
- Not matching user's email or name

**Implementation**:

- Password strength meter displayed during registration
- Real-time validation feedback
- Have I Been Pwned API integration for breach checking
- Passwords hashed with bcrypt (12+ rounds)
- Never logged or stored in plaintext

**Rationale**: Strong passwords prevent credential compromise

#### Email Verification

**Process**:

1. User registers with email and password
2. Account created but marked unverified
3. Verification email sent with unique token
4. User clicks link to verify email
5. Token validated and account activated
6. Unverified accounts deleted after 7 days

**Implementation**:

- Verification tokens cryptographically random
- Tokens expire after 24 hours
- One-time use tokens
- Rate limiting on resend requests
- Clear verification status in user profile

**Rationale**: Prevents fake accounts and ensures contact ability

#### OAuth Authentication

**Supported Providers**:

1. **Google OAuth 2.0**
   - Most widely used
   - High security standards
   - Easy user onboarding

2. **Microsoft OAuth 2.0**
   - Work and personal accounts
   - Common in educational settings
   - Good security track record

**Not Supported**:

- Facebook Login (requires business verification)
- Twitter/X OAuth (platform instability)
- Other providers (maintenance burden)

**Implementation**:

- OAuth 2.0 with PKCE flow
- Redirect URIs validated strictly
- State parameter prevents CSRF
- Tokens stored securely (httpOnly cookies)
- Account linking for existing emails
- Permissions minimal (email, name only)

**Rationale**: Reduces password fatigue, leverages providers' security

#### Session Management

**Session Properties**:

- **Idle timeout**: 15 minutes of inactivity (forced logout after idle warning)
- **Absolute timeout**: 30 days from login
- **Storage**: Secure httpOnly cookies
- **Refresh**: Automatic silent refresh before expiration

**Implementation**:

- JWT tokens with short expiration
- Refresh tokens for silent renewal
- Session invalidation on logout
- Concurrent session detection
- "Log out all devices" functionality
- Session activity logging

**Rationale**: Balances security and user convenience

#### Account Lockout

**Lockout Policy**:

- 5 failed login attempts
- 15-minute lockout duration
- Counter resets on successful login
- Lockout notification email

**Implementation**:

- Failed attempt counter per account
- IP address tracking for patterns
- Automatic unlock after timeout
- Manual unlock via email link
- Admin override capability

**Rationale**: Prevents brute force attacks

#### Password Reset

**Reset Process**:

1. User requests password reset
2. Reset email sent with unique token
3. Token valid for 1 hour
4. User sets new password
5. All sessions invalidated
6. Confirmation email sent

**Implementation**:

- Reset tokens cryptographically random
- Rate limiting: 3 requests per hour
- Token single-use only
- Old password cannot be reused immediately
- Account activity notification

**Rationale**: Secure account recovery without compromising security

---

### Layer 3: Authorization & Access Control

#### Role-Based Access Control (RBAC)

**Roles Defined**:

**Parent Role**:

- View all linked children's data
- Edit own profile
- Configure calculation factors
- Create reward catalog
- Approve redemption requests
- View audit logs
- Manage child accounts
- Cannot: Impersonate children, access unlinked children

**Child Role**:

- View own data only
- Edit own profile (limited)
- Enter own grades
- Request reward redemptions
- View own history
- Cannot: View other children, access parent functions, modify factors

**Administrator Role** (Future):

- System configuration
- User support
- Anonymized analytics
- Cannot: Access user personal data without consent

**Implementation**:

- Role stored in user profile
- Middleware checks role on every request
- UI elements hidden based on role
- API endpoints validate role
- Database RLS enforces roles

**Rationale**: Ensures users only access authorized functions

#### Row Level Security (RLS)

**Database Policies**:

**Users Table**:

- Users can read their own record
- Parents can read linked children's records
- Users can update their own record
- No user can delete their record (soft delete only)

**Grades Table**:

- Children can create their own grades
- Children can read their own grades
- Parents can read linked children's grades
- Parents can update grades if approval mode enabled
- Deletion restricted (soft delete only)

**Relationships Table**:

- Both parties can read relationship
- Parent can create relationship
- Child must accept relationship
- Either party can delete relationship

**Rewards Table**:

- Parent can create, read, update, delete
- Child can read rewards from linked parents
- Child can create redemption requests

**Audit Logs Table**:

- System creates logs automatically
- Parent can read logs for linked children
- Children cannot read audit logs
- Admin can read all logs

**Implementation**:

- Supabase RLS policies on all tables
- Policies use authenticated user context
- Policies deny by default
- Policies tested thoroughly
- Policy violations logged

**Rationale**: Database-level security prevents unauthorized data access

#### API Authorization

**Authorization Flow**:

1. Request includes session token
2. Token validated and decoded
3. User identity extracted
4. Resource ownership checked
5. Role permissions verified
6. Request allowed or denied

**Implementation**:

- Middleware on all API routes
- Generic authorization utilities
- Consistent error responses
- Authorization failures logged
- Rate limiting per user

**Rationale**: Ensures all API access properly authorized

---

### Layer 4: Input Validation & Sanitization

#### Client-Side Validation

**Purpose**: Immediate user feedback and reduce server load

**Validation Rules**:

- Required fields marked clearly
- Field format validation (email, phone, etc.)
- Length limits enforced
- Character restrictions applied
- Helpful error messages

**Implementation**:

- React Hook Form for form handling
- Zod schemas for validation rules
- Real-time validation feedback
- Error messages near fields
- Visual indicators (red borders, icons)

**Limitations**: Client-side validation can be bypassed - never trusted alone

#### Server-Side Validation

**Purpose**: Authoritative validation, security enforcement

**Validation Rules**:

- All client-side rules re-applied
- Business logic validation
- Data type enforcement
- Range and boundary checks
- Referential integrity checks

**Implementation**:

- Zod schemas reused on server
- Validation before database operations
- Detailed error logging
- Generic error messages to user
- Validation failures audited

**Rationale**: Prevents malicious input bypassing client validation

#### Input Sanitization

**Sanitization Targets**:

- HTML tags removed from text inputs
- SQL special characters escaped
- JavaScript execution prevented
- File upload content checked
- URL validation for external links

**Implementation**:

- DOMPurify library for HTML sanitization
- Supabase parameterized queries prevent SQL injection
- Content Security Policy prevents XSS
- File type and size validation
- URL allowlist for external links

**Rationale**: Prevents injection attacks

#### Output Encoding

**Encoding Rules**:

- HTML entities encoded in display
- JSON responses properly structured
- URL parameters encoded
- Database values escaped
- Error messages sanitized

**Implementation**:

- React automatic XSS prevention
- JSON serialization libraries
- URL encoding utilities
- Database layer handles escaping
- Generic error messages

**Rationale**: Prevents stored XSS attacks

---

### Layer 5: Data Protection

#### Encryption at Rest

**Database Encryption**:

- Supabase AES-256 encryption
- Automatic for all data
- Encryption keys managed by Supabase
- Regular key rotation

**Field-Level Encryption** (Future):

- Highly sensitive fields encrypted separately
- Application-level encryption
- Encryption keys in environment variables
- Key rotation procedures

**Implementation**:

- Supabase default encryption active
- No plaintext sensitive data
- Encryption transparent to application
- Performance impact minimal

**Rationale**: Protects data if database compromised

#### Encryption in Transit

**All Communications**:

- TLS 1.3 for all connections
- HTTPS only (no HTTP)
- Secure WebSocket connections
- Encrypted email transmission

**Implementation**:

- Vercel automatic HTTPS
- Strict-Transport-Security headers
- Certificate management automated
- Legacy protocols disabled

**Rationale**: Prevents interception and tampering

#### Data Minimization

**Principle**: Only collect data necessary for functionality

**Data Collection**:

- **Collected**: Name, email, age, grades, preferences
- **Not Collected**: Address, phone, SSN, payment info, precise location
- **Optional**: Profile photo, reward preferences

**Implementation**:

- Database schema limits fields
- Form fields only for required data
- No tracking scripts
- No third-party data sharing
- Clear purpose for each data point

**Rationale**: Reduces risk exposure and complies with privacy laws

#### Data Retention

**Retention Policies**:

- **Active Accounts**: Data retained indefinitely
- **Deleted Accounts**: Hard delete after 30 days
- **Audit Logs**: 90 days retention
- **Backups**: 7 days retention
- **Session Logs**: 30 days retention

**Implementation**:

- Soft delete with grace period
- Automated hard delete after grace period
- Log rotation and archival
- Backup cleanup automation
- Data export available before deletion

**Rationale**: Complies with GDPR right to deletion

#### Sensitive Data Handling

**Sensitive Data Types**:

- Authentication credentials
- Children's personal information
- Academic records
- Parent-child relationships

**Special Handling**:

- Never logged in plaintext
- Masked in UI where appropriate
- Restricted access in database
- Audit trail for access
- Encrypted backups

**Rationale**: Extra protection for most sensitive data

---

### Layer 6: Attack Prevention

#### reCAPTCHA Integration

**Implementation Strategy**:

- **reCAPTCHA v3**: Invisible, score-based
- **Placement**: Registration, login, password reset, contact forms
- **Score Threshold**: 0.5 (adjustable based on monitoring)
- **Fallback**: Challenge for scores below threshold

**Verification Process**:

1. reCAPTCHA invisible to user
2. Token generated on form submit
3. Token sent to Google for scoring
4. Score evaluated server-side
5. Request allowed or challenged
6. Failed challenges logged

**Rationale**: Prevents automated bot attacks

#### Rate Limiting

**Rate Limit Rules**:

**Authentication Endpoints**:

- Login: 5 attempts per 15 minutes per IP
- Registration: 3 per hour per IP
- Password Reset: 3 per hour per account
- Email Verification: 5 resends per hour

**API Endpoints**:

- General: 100 requests per 15 minutes per user
- Grade Entry: 20 per hour per user
- Reward Requests: 10 per hour per child

**Database Operations**:

- Supabase built-in limits apply
- Connection pooling prevents exhaustion

**Implementation**:

- Redis for distributed rate limiting
- IP-based limits for anonymous requests
- User-based limits for authenticated requests
- Exponential backoff for repeated violations
- Clear error messages with retry timing

**Rationale**: Prevents brute force and resource exhaustion

#### CSRF Protection

**Protection Mechanism**:

- CSRF tokens on all state-changing requests
- Token validation before processing
- Token rotation after sensitive operations
- SameSite cookie attribute set

**Implementation**:

- Next.js built-in CSRF protection
- Tokens in hidden form fields
- Token verification middleware
- Failed validations logged

**Rationale**: Prevents cross-site request forgery

#### Content Security Policy (CSP)

**CSP Headers**:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://*.supabase.co;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

**Rationale**: Prevents XSS by controlling resource loading

#### SQL Injection Prevention

**Prevention Methods**:

- Parameterized queries only (via Supabase client)
- No raw SQL from user input
- Input validation before queries
- Stored procedures where appropriate
- Least privilege database accounts

**Implementation**:

- Supabase client handles parameterization
- TypeScript types prevent query mistakes
- Code review for database operations
- Automated SQL injection testing

**Rationale**: Prevents SQL injection attacks

#### XSS Prevention

**Prevention Methods**:

- React automatic escaping
- Content Security Policy headers
- Input sanitization (DOMPurify)
- Output encoding
- HTTP-only cookies

**Implementation**:

- React used for all rendering
- CSP headers configured
- User content sanitized before storage
- Cookie flags set correctly
- Regular XSS testing

**Rationale**: Prevents cross-site scripting attacks

---

### Layer 7: Application Security

#### Secure Session Storage

**Session Properties**:

- Stored in httpOnly cookies (not accessible to JavaScript)
- Secure flag set (HTTPS only)
- SameSite=Strict (CSRF prevention)
- Domain restricted to bonifatus.com
- Path restricted appropriately

**Rationale**: Prevents session token theft via XSS

#### Error Handling

**Error Response Strategy**:

- **To Users**: Generic, helpful messages
- **To Logs**: Detailed error information
- **Never**: Stack traces, internal paths, database errors

**Implementation**:

- Try-catch blocks around critical code
- Error boundary components in React
- Centralized error logging
- Sentry for error tracking
- User-friendly error pages

**Rationale**: Prevents information leakage through errors

#### Dependency Management

**Dependency Security**:

- Regular dependency updates
- Automated vulnerability scanning (GitHub Dependabot)
- No dependencies with known critical vulnerabilities
- Minimal dependency tree
- Trusted sources only

**Implementation**:

- Weekly dependency checks
- Automated pull requests for updates
- Manual review of dependency changes
- Lock files committed
- Security advisories monitored

**Rationale**: Prevents supply chain attacks

#### Secrets Management

**Secret Types**:

- Database credentials
- API keys
- OAuth client secrets
- Encryption keys
- Third-party service tokens

**Storage**:

- Environment variables only
- Never in code repository
- Never in client-side code
- Vercel environment variable encryption
- Separate secrets per environment

**Implementation**:

- .env.local for local development
- Vercel dashboard for production
- No secrets in version control
- Secrets rotation capability
- Access logging for secrets

**Rationale**: Prevents credential exposure

---

### Layer 8: Monitoring & Detection

#### Security Logging

**Events Logged**:

- Authentication attempts (success and failure)
- Authorization failures
- Sensitive data access
- Account modifications
- Configuration changes
- Security-relevant errors
- Suspicious patterns

**Log Contents**:

- Timestamp (UTC)
- User identifier (if authenticated)
- IP address
- User agent
- Action attempted
- Result (success/failure)
- Relevant details (sanitized)

**Implementation**:

- Structured logging (JSON format)
- Centralized log aggregation
- Automated log analysis
- Long-term log retention (90 days)
- Compliance with data protection laws

**Rationale**: Enables incident detection and investigation

#### Intrusion Detection

**Detection Methods**:

- Failed login patterns
- Unusual access patterns
- Geographic anomalies
- Rapid API requests
- Privilege escalation attempts
- Data exfiltration patterns

**Alerting**:

- Critical events: Immediate alert
- Suspicious patterns: Aggregated alerts
- Alert fatigue prevention
- Escalation procedures

**Implementation**:

- Automated pattern detection
- Sentry for error alerts
- Custom alerting rules
- On-call rotation (future)
- Incident response playbook

**Rationale**: Early detection enables rapid response

#### Performance Monitoring

**Metrics Tracked**:

- Response times
- Error rates
- Database query performance
- Resource utilization
- Third-party service availability

**Monitoring Tools**:

- Vercel Analytics for frontend
- Supabase monitoring for database
- Sentry for errors
- Custom dashboards for business metrics

**Rationale**: Performance degradation can indicate attacks

---

## Compliance & Privacy

### GDPR Compliance (EU Users)

**Key Requirements**:

**Lawful Basis**: Consent for data processing

**User Rights**:

- Right to access (data export)
- Right to rectification (profile editing)
- Right to erasure (account deletion)
- Right to data portability (JSON export)
- Right to object (opt-outs available)
- Right to restrict processing

**Implementation**:

- Clear consent during registration
- Privacy policy in plain language
- Data export functionality
- Account deletion with data purge
- Opt-out for analytics
- Data processing records maintained

**Data Protection Officer**: To be appointed if required by scale

**Rationale**: Legal compliance for EU users

### COPPA Compliance (US Children Under 13)

**Key Requirements**:

**Age Verification**: Ask age during registration

**Parental Consent**: Required before collecting child data

**Limited Data Collection**: Only necessary data

**No Behavioral Advertising**: None for children

**Parental Control**: Parents can review and delete child data

**Implementation**:

- Age gate on child registration
- Parental email verification for under-13
- Consent email sent to parent
- Parent must approve before child account active
- Parent dashboard shows all child data
- One-click child data deletion

**Rationale**: Legal compliance for young users

### Security Certifications

**Current**: None (startup phase)

**Future Considerations**:

- SOC 2 Type II (security controls)
- ISO 27001 (information security)
- GDPR certification seal
- Age-appropriate app certification

---

## Incident Response

### Incident Classification

**Critical Incidents**:

- Data breach
- Authentication bypass
- Privilege escalation
- Database compromise

**High Severity**:

- DDoS attack
- Account takeover
- API abuse
- Security vulnerability discovery

**Medium Severity**:

- Suspicious access patterns
- Rate limit violations
- Error rate spikes

**Low Severity**:

- Individual account lockouts
- Failed login attempts
- Configuration issues

### Response Procedures

**Detection Phase**:

1. Automated alerts or manual discovery
2. Initial assessment of severity
3. Incident team notification

**Containment Phase**:

1. Isolate affected systems
2. Preserve evidence
3. Prevent further damage
4. Document actions taken

**Eradication Phase**:

1. Identify root cause
2. Remove threat
3. Patch vulnerabilities
4. Verify threat eliminated

**Recovery Phase**:

1. Restore normal operations
2. Monitor for recurrence
3. Verify system integrity
4. Document lessons learned

**Post-Incident Phase**:

1. Detailed incident report
2. Root cause analysis
3. Implement preventive measures
4. Update procedures
5. User notification if required

### Breach Notification

**Criteria for Notification**:

- Personal data compromised
- Risk to users' rights and freedoms
- Legal requirements triggered

**Notification Timeline**:

- GDPR: Within 72 hours of discovery
- COPPA: Immediate for children's data
- Users: As soon as reasonable

**Notification Contents**:

- Nature of breach
- Data affected
- Likely consequences
- Measures taken
- Contact for questions
- Steps users should take

---

## Security Testing

### Automated Testing

**Tools and Frequency**:

- **Dependabot**: Daily dependency checks
- **GitHub CodeQL**: On every commit
- **OWASP ZAP**: Weekly automated scans
- **npm audit**: On every dependency change
- **TypeScript strict mode**: On every build

### Manual Testing

**Penetration Testing**:

- Professional pentest before launch
- Annual pentests thereafter
- Test report and remediation tracking

**Security Code Review**:

- All authentication code
- All authorization code
- All data handling code
- High-risk features

**Vulnerability Disclosure**:

- Security email address (security@bonifatus.com)
- Responsible disclosure policy
- Bug bounty program (future)

---

## Security Roadmap

### Phase 1 (Launch)

- ✅ HTTPS enforcement
- ✅ Password requirements
- ⏳ Email verification
- ⏳ reCAPTCHA integration
- ⏳ Rate limiting
- ⏳ RLS policies

### Phase 2 (Post-Launch)

- Two-factor authentication (TOTP)
- Advanced anomaly detection
- Security audit logging dashboard
- Automated security scanning in CI/CD

### Phase 3 (Scale)

- SOC 2 certification
- Professional pentesting
- Bug bounty program
- Dedicated security team

---

## Conclusion

Security is an ongoing process, not a one-time implementation. This document will be updated as new threats emerge, requirements change, and the application evolves. Regular security audits and continuous improvement are essential.

**Security Contact**: security@bonifatus.com (to be set up)

**Last Updated**: January 2025
**Next Review**: March 2025
