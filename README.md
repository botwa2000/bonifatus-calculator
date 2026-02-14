# Bonifatus - Turn Grades Into Rewards

Bonifatus is a Progressive Web App that transforms academic achievement into a transparent, motivating reward system. Parents and children collaborate through a smart bonus calculator that converts school grades into bonus points, trackable savings, and real-world payouts.

**Live at [bonifatus.com](https://bonifatus.com)**

---

## Vision & Mission

Every family wants to encourage academic success, but most reward systems are arbitrary and inconsistent. Bonifatus gives families a data-driven, transparent framework: children see exactly how effort translates into rewards, and parents get clear insights into academic progress with flexible payout options from pocket money to long-term investments.

---

## The Problem

- Parents lack a **fair, consistent** way to reward academic performance
- Existing approaches are **arbitrary** ("Good grades = pocket money") with no clear formula
- Families across different countries use **different grading systems** (A-F, 1-6, percentages)
- No existing tool bridges the gap between **academic tracking** and **financial education**
- Children don't understand the **connection between effort and reward**

---

## The Solution

Bonifatus turns grades into bonus points through a **configurable, transparent formula**. Parents set the rules, children understand the incentive. The platform supports 7+ international grading systems, 6 languages, and multiple payout methods including savings accounts and investment platforms.

---

## How the Calculator Works

The bonus formula is simple and transparent:

```
Bonus = class_level x term_factor x grade_factor x weight
```

**Grade factors** (per subject):
| Tier | Factor | Description |
|------|--------|-------------|
| Best | 2 | Top grade band (A, 1, 90-100%) |
| Second | 1 | Good grades (B, 2, 75-89%) |
| Third | 0 | Average grades (C, 3, 50-74%) |
| Below | -1 | Below average |

**Configurable factors:**

- **Class level** (1-13): Higher classes earn more per point
- **Term type**: Final exams worth more than midterms (midterm=0.5, final=1.0, semester=0.75, quarter=0.25)
- **Subject weight**: Core subjects can be weighted higher
- **Minimum floor**: Total bonus never goes below zero

**Supported grading systems**: A-F (US/UK), 1-6 (Germany/Switzerland), 1-10 (Netherlands), percentages, and more.

---

## Key Features

### For Students

- **Dashboard** with stats, bonus overview, and quick grade entry
- **Bonus Calculator** supporting 7+ grading systems with real-time calculation
- **Saved Results** with filtering by year and term type, edit and delete
- **Visual Insights** with charts: bonus trends, subject performance, grade distribution, term comparison, year-over-year changes
- **Quick Grade** form for fast single-subject logging
- **Profile** with parent connection management (6-digit codes + QR scanning)
- **My Rewards** view showing earned points and settlement status

### For Parents

- **Dashboard** with children overview, activity feed, and market widget
- **Children Management** with invite system (6-digit codes + QR), connection tracking
- **Academic Insights** across all children: comparative charts, score trends, subject comparison tables
- **Rewards & Payouts** system with 5 settlement methods:
  - Cash / Offline (pocket money, treats)
  - Bank Transfer (to child's account)
  - Gift Vouchers (Amazon, Apple, Steam, PlayStation, Nintendo, Spotify, Netflix, and more)
  - Savings Accounts (ING, DKB, Greenlight, GoHenry, NatWest, and more)
  - Investment / ETF (Trade Republic, Scalable Capital, Fidelity Youth, and more)
- **Split Payouts** (e.g., 50% pocket money, 30% savings, 20% investment)
- **Financial Literacy** education with tips on compound interest, early investing, and teaching kids about money
- **Real-time Stock Market Widget** for educational context

### For Families

- **6 Languages**: English, German, French, Italian, Spanish, Russian
- **7+ Grading Systems** covering major international standards
- **Dark Mode** with system/light/dark toggle
- **Progressive Web App** installable on any device with offline capability
- **Privacy-first**: no ads, no third-party data sharing

---

## Rewards & Payout System

The payout system is Bonifatus's key differentiator:

1. **Parents define point value** (e.g., 1 point = EUR 1, EUR 5, or custom)
2. **Choose settlement method** for each child from 5 options
3. **Split payouts** across methods (e.g., 50% cash, 30% savings, 20% ETF)
4. **Track settlements** with full history and notes
5. **Financial literacy** built in with educational content about compound interest, early investing, and money management

This bridges academic achievement with real-world financial education, teaching children the value of both earning and saving.

---

## Security & Compliance

- **COPPA and GDPR compliant** with parental consent mechanisms
- **bcrypt password hashing** with 12+ character requirements and complexity rules (uppercase, lowercase, number, special character)
- **Cloudflare Turnstile** bot protection on authentication forms
- **Session management** with automatic logout after inactivity (configurable warning)
- **Encrypted data** at rest and in transit
- **No advertising**, no third-party data sharing
- **Age verification** during registration (minimum age 5)
- **Email verification** required before account activation
- **Role-based access control**: separate student, parent, and admin roles

---

## Technology

- **Next.js 15** (React 19) with TypeScript and App Router
- **PostgreSQL** database with **Drizzle ORM**
- **NextAuth.js** authentication with session management
- **Docker Swarm** deployment on **Hetzner VPS**
- **Caddy** reverse proxy with automatic TLS
- **6-language internationalization** via next-intl
- **Recharts** for data visualization (area, bar, pie, line charts)
- **Progressive Web App** with offline support and installability
- **Tailwind CSS** with custom design system (theme tokens, gradients, shadows)

---

## Business Model

- **Free tier**: Full access to calculator, saving, insights, parent connections, and rewards
- **Pro tier** (planned): Advanced analytics, multi-child management, integration APIs, priority support
- **No ads**: Revenue from premium features only
- **No data selling**: Privacy is a core product value

---

## Market Opportunity

- **Target**: Families with school-age children (ages 5-18)
- **TAM**: 200M+ households globally with school-age children
- **Differentiator**: Only platform combining grade tracking, bonus calculation, and financial education/payout in one tool
- **International reach**: Multi-language and multi-grading-system support from day one
- **Growing markets**: EdTech ($340B by 2025), FinTech for families, financial literacy education
- **Retention driver**: Recurring academic cycle (terms, years) creates natural engagement loops

---

## Current Status

- **Live** at [bonifatus.com](https://bonifatus.com) with both development and production environments
- **Core features complete**: Authentication, calculator, grade saving, insights, parent-child connections, rewards system
- **Deployed** via Docker Swarm on Hetzner VPS with Caddy TLS
- **6 languages** active: English, German, French, Italian, Spanish, Russian
- **Preparing** for investment round

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Git

### Quick Start

```bash
git clone https://github.com/your-org/bonifatus-calculator.git
cd bonifatus-calculator
npm install
cp .env.example .env.local  # Fill in environment variables
npm run dev                  # Access at http://localhost:3000
```

### Environment Variables

Required variables are documented in `.env.example`. Key ones include:

- Database connection (PostgreSQL)
- NextAuth secret and configuration
- Cloudflare Turnstile keys
- Email service credentials (SMTP)

---

## Contact

- **Website**: [bonifatus.com](https://bonifatus.com)
- **Issues**: GitHub Issues for bug reports and feature requests

---

**Version**: 1.0.0
**Last Updated**: February 2026
**Status**: Live / Active Development
