# Design Document

## Overview

**Eve-Cortex** is a comprehensive web platform built with Next.js 15 that leverages the EVE Online ESI API to provide AI-powered optimization recommendations for players. The platform combines real-time game data with advanced algorithms to deliver personalized ship fitting recommendations, career guidance, and strategic optimization across all aspects of EVE Online gameplay.

The system architecture follows a modern full-stack approach with server-side rendering, API route handlers, and a PostgreSQL database for persistent data storage. Redis is used for caching frequently accessed data and rate limiting ESI API calls. The platform integrates with EVE's Dogma system for accurate attribute calculations and provides real-time recommendations based on character skills, assets, and market conditions.

## Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Browser]
        MOBILE[Mobile Browser]
    end

    subgraph "Next.js Application"
        PAGES[Pages/Components]
        API[API Routes]
        MIDDLEWARE[Middleware]
        AUTH[Authentication]
    end

    subgraph "Data Layer"
        POSTGRES[(PostgreSQL)]
        REDIS[(Redis Cache)]
    end

    subgraph "External APIs"
        ESI[EVE ESI API]
        SDE[Static Data Export]
    end

    subgraph "AI/ML Services"
        OPTIMIZER[Optimization Engine]
        RECOMMENDER[Recommendation System]
    end

    WEB --> PAGES
    MOBILE --> PAGES
    PAGES --> API
    API --> AUTH
    API --> POSTGRES
    API --> REDIS
    API --> ESI
    API --> SDE
    API --> OPTIMIZER
    OPTIMIZER --> RECOMMENDER
```

### Technology Stack

- **Frontend**: Next.js 15 with App Router, React 18, TypeScript
- **Backend**: Next.js API Routes, Node.js runtime
- **Database**: PostgreSQL with postgres.js client
- **Cache**: Redis with ioredis client
- **Authentication**: NextAuth.js with ESI OAuth
- **Styling**: Tailwind CSS with responsive design
- **Deployment**: Vercel or similar platform
- **Monitoring**: Built-in Next.js analytics and custom metrics

## Components and Interfaces

### Core Components

#### 1. Authentication System

- **ESI OAuth Integration**: Handles EVE Online SSO authentication
- **Session Management**: Secure session handling with JWT tokens
- **Scope Management**: Manages ESI API scopes and permissions
- **Token Refresh**: Automatic token refresh for long-lived sessions

#### 2. Data Synchronization Engine

- **Character Data Sync**: Fetches and updates character information
- **Asset Management**: Tracks character assets and locations
- **Skill Monitoring**: Real-time skill queue and training progress
- **Market Data Integration**: Current market prices and trends

#### 3. Optimization Engine

- **Dogma Calculator**: Accurate attribute calculations using EVE's Dogma system
- **Fit Optimizer**: Generates optimal ship fittings based on constraints
- **Skill Planner**: Creates efficient skill training plans
- **Performance Analyzer**: Calculates ship performance metrics

#### 4. Recommendation System

- **Career Path Analysis**: Analyzes player goals and recommends paths
- **Mission Optimizer**: Suggests optimal missions and fittings
- **Market Opportunities**: Identifies profitable trading opportunities
- **Planetary Interaction**: Optimizes PI setups and chains

#### 5. User Interface Components

- **Dashboard**: Overview of character status and recommendations
- **Ship Fitting Tool**: Interactive fitting interface with real-time stats
- **Skill Planner**: Visual skill training timeline and priorities
- **Market Browser**: Market analysis and opportunity viewer

### API Interfaces

#### ESI Integration Layer

```typescript
interface ESIClient {
  authenticate(scopes: string[]): Promise<AuthResult>
  getCharacterInfo(characterId: number): Promise<Character>
  getCharacterSkills(characterId: number): Promise<Skills>
  getCharacterAssets(characterId: number): Promise<Asset[]>
  getMarketData(regionId: number, typeId: number): Promise<MarketData>
}
```

#### Optimization Service Interface

```typescript
interface OptimizationService {
  calculateShipStats(fitting: Fitting, character: Character): Promise<ShipStats>
  optimizeFitting(constraints: FittingConstraints): Promise<Fitting[]>
  generateSkillPlan(goals: SkillGoals, character: Character): Promise<SkillPlan>
  recommendCareerPath(preferences: CareerPreferences): Promise<CareerRecommendation[]>
}
```

#### Data Access Layer

```typescript
interface DataRepository {
  saveCharacter(character: Character): Promise<void>
  getCharacterByEveId(eveId: number): Promise<Character | null>
  saveFitting(fitting: Fitting): Promise<number>
  getFittingsByCharacter(characterId: number): Promise<Fitting[]>
  cacheMarketData(data: MarketData, ttl: number): Promise<void>
  getCachedMarketData(key: string): Promise<MarketData | null>
}
```

## Data Models

### Core Data Models

#### Character Model

```typescript
interface Character {
  id: number
  eveCharacterId: number
  name: string
  corporationId: number
  allianceId?: number
  skills: Skill[]
  implants: Implant[]
  attributes: CharacterAttributes
  walletBalance: number
  location: Location
  createdAt: Date
  updatedAt: Date
}
```

#### Ship Fitting Model

```typescript
interface Fitting {
  id: number
  characterId: number
  shipTypeId: number
  name: string
  description?: string
  modules: FittingModule[]
  careerPath: CareerPath
  tags: string[]
  isPublic: boolean
  performance: ShipPerformance
  createdAt: Date
  updatedAt: Date
}
```

#### Skill Plan Model

```typescript
interface SkillPlan {
  id: number
  characterId: number
  name: string
  goals: SkillGoal[]
  trainingQueue: SkillQueueItem[]
  estimatedCompletionTime: number
  priority: number
  careerPath: CareerPath
  createdAt: Date
  updatedAt: Date
}
```

#### Market Data Model

```typescript
interface MarketData {
  typeId: number
  regionId: number
  buyPrice: number
  sellPrice: number
  volume: number
  orders: MarketOrder[]
  lastUpdated: Date
  trend: PriceTrend
}
```

### Database Schema

#### PostgreSQL Tables

```sql
-- Characters table
CREATE TABLE characters (
  id SERIAL PRIMARY KEY,
  eve_character_id BIGINT UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  corporation_id BIGINT,
  alliance_id BIGINT,
  wallet_balance DECIMAL(15,2),
  location_id BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Character skills table
CREATE TABLE character_skills (
  id SERIAL PRIMARY KEY,
  character_id INTEGER REFERENCES characters(id),
  skill_type_id INTEGER NOT NULL,
  trained_skill_level INTEGER NOT NULL,
  skillpoints_in_skill BIGINT NOT NULL,
  active_skill_level INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ship fittings table
CREATE TABLE fittings (
  id SERIAL PRIMARY KEY,
  character_id INTEGER REFERENCES characters(id),
  ship_type_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  fitting_data JSONB NOT NULL,
  career_path VARCHAR(50) NOT NULL,
  tags TEXT[],
  is_public BOOLEAN DEFAULT FALSE,
  performance_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Skill plans table
CREATE TABLE skill_plans (
  id SERIAL PRIMARY KEY,
  character_id INTEGER REFERENCES characters(id),
  name VARCHAR(255) NOT NULL,
  goals JSONB NOT NULL,
  training_queue JSONB NOT NULL,
  estimated_completion_time BIGINT,
  priority INTEGER DEFAULT 0,
  career_path VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Redis Cache Structure

```
# Character data cache (TTL: 1 hour)
character:{eve_character_id} -> Character JSON

# Market data cache (TTL: 15 minutes)
market:{region_id}:{type_id} -> MarketData JSON

# ESI rate limiting (TTL: 1 second)
esi_rate_limit:{endpoint} -> request_count

# Optimization results cache (TTL: 30 minutes)
optimization:{hash} -> OptimizationResult JSON

# Static data cache (TTL: 24 hours)
sde:{data_type}:{id} -> StaticData JSON
```

## Error Handling

### Error Categories and Handling Strategy

#### 1. ESI API Errors

- **Rate Limiting**: Implement exponential backoff and queue management
- **Authentication Errors**: Automatic token refresh with fallback to re-authentication
- **Service Unavailable**: Graceful degradation with cached data
- **Invalid Scopes**: Clear user messaging and scope re-authorization

#### 2. Database Errors

- **Connection Issues**: Connection pooling with retry logic
- **Query Failures**: Transaction rollback and error logging
- **Data Integrity**: Validation at application and database levels
- **Migration Errors**: Automated rollback and notification systems

#### 3. Optimization Engine Errors

- **Invalid Constraints**: User-friendly error messages with suggestions
- **Calculation Failures**: Fallback to simplified calculations
- **Timeout Errors**: Progressive optimization with partial results
- **Memory Issues**: Chunked processing for large datasets

#### 4. User Interface Errors

- **Network Failures**: Offline mode with cached data
- **Validation Errors**: Real-time validation with clear feedback
- **Loading States**: Progressive loading with skeleton screens
- **Browser Compatibility**: Graceful degradation for older browsers

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: any
    timestamp: string
    requestId: string
  }
  success: false
}
```

## Testing Strategy

### Testing Pyramid

#### 1. Unit Tests

- **Optimization Algorithms**: Test calculation accuracy and edge cases
- **Data Models**: Validate serialization and business logic
- **Utility Functions**: Test helper functions and transformations
- **API Clients**: Mock external dependencies and test error handling

#### 2. Integration Tests

- **Database Operations**: Test CRUD operations and transactions
- **ESI API Integration**: Test authentication and data fetching
- **Cache Operations**: Test Redis operations and TTL behavior
- **End-to-End Workflows**: Test complete user journeys

#### 3. Performance Tests

- **Load Testing**: Simulate concurrent users and API calls
- **Database Performance**: Test query performance with large datasets
- **Cache Efficiency**: Measure cache hit rates and performance impact
- **Memory Usage**: Monitor memory consumption during optimization

#### 4. Security Tests

- **Authentication**: Test OAuth flow and session management
- **Authorization**: Verify access controls and data isolation
- **Input Validation**: Test against injection attacks and malformed data
- **Rate Limiting**: Verify protection against abuse

### Testing Tools and Framework

- **Unit Testing**: Jest with TypeScript support
- **Integration Testing**: Supertest for API testing
- **Database Testing**: Test containers with PostgreSQL
- **Performance Testing**: Artillery or k6 for load testing
- **Security Testing**: OWASP ZAP for vulnerability scanning

## Development Workflow and CI/CD

### GitHub Workflow Strategy

#### Branch Protection and PR Process

- **Main Branch Protection**: All changes must go through pull requests
- **Automated Testing**: PRs trigger comprehensive test suites
- **Code Quality Checks**: ESLint, TypeScript compilation, and formatting checks
- **Auto-merge**: PRs automatically merge when all checks pass
- **Feature Branches**: Each task creates a feature branch with descriptive naming

#### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run build

      - name: Auto-merge PR
        if: github.event_name == 'pull_request' && github.actor == 'korallis'
        uses: pascalgn/merge-action@v0.15.6
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          merge_method: squash
```

#### Quality Gates

- **TypeScript Compilation**: Zero TypeScript errors
- **Linting**: ESLint passes with zero errors
- **Unit Tests**: 90%+ code coverage
- **Integration Tests**: All API endpoints tested
- **Build Success**: Next.js builds without errors
- **Security Scan**: No high-severity vulnerabilities

### Task Implementation Workflow

Each implementation task will follow this pattern:

1. **Create Feature Branch**: `git checkout -b feature/task-name`
2. **Implement Changes**: Code the specific task requirements
3. **Add Tests**: Unit and integration tests for new functionality
4. **Update Documentation**: Update relevant docs and comments
5. **Create Pull Request**: PR with descriptive title and task reference
6. **Automated Checks**: CI pipeline runs all quality gates
7. **Auto-merge**: PR merges automatically if all checks pass
8. **Cleanup**: Feature branch is automatically deleted

## Performance Optimization

### Caching Strategy

#### 1. Application-Level Caching

- **Static Data**: Cache EVE SDE data with long TTL (24 hours)
- **Character Data**: Cache character information with medium TTL (1 hour)
- **Market Data**: Cache market prices with short TTL (15 minutes)
- **Optimization Results**: Cache complex calculations with medium TTL (30 minutes)

#### 2. Database Optimization

- **Indexing Strategy**: Optimize queries with appropriate indexes
- **Connection Pooling**: Use postgres.js connection pooling
- **Query Optimization**: Use prepared statements and efficient queries
- **Partitioning**: Partition large tables by character or date

#### 3. API Optimization

- **Rate Limiting**: Implement intelligent rate limiting for ESI calls
- **Batch Operations**: Group multiple ESI requests where possible
- **Compression**: Enable gzip compression for API responses
- **CDN Integration**: Use CDN for static assets and images

#### 4. Frontend Optimization

- **Code Splitting**: Lazy load components and routes
- **Image Optimization**: Use Next.js Image component with optimization
- **Bundle Analysis**: Monitor and optimize bundle sizes
- **Service Workers**: Implement offline functionality where appropriate

### Monitoring and Observability

#### 1. Application Metrics

- **Response Times**: Track API response times and database queries
- **Error Rates**: Monitor error rates by endpoint and error type
- **User Engagement**: Track feature usage and user flows
- **Cache Performance**: Monitor cache hit rates and efficiency

#### 2. Infrastructure Metrics

- **Database Performance**: Monitor connection pool usage and query performance
- **Redis Performance**: Track memory usage and operation latency
- **Server Resources**: Monitor CPU, memory, and disk usage
- **Network Performance**: Track bandwidth usage and latency

#### 3. Business Metrics

- **User Retention**: Track user engagement and return rates
- **Feature Adoption**: Monitor usage of optimization features
- **Data Freshness**: Track ESI data synchronization success rates
- **Recommendation Accuracy**: Measure user satisfaction with recommendations

## Brand Guidelines and Visual Identity

### Brand Overview

**Eve-Cortex** represents the fusion of advanced AI intelligence with EVE Online's complex universe. The brand embodies precision, intelligence, and technological superiority - core values that resonate with EVE Online's strategic gameplay.

#### Brand Positioning

- **Primary**: AI-powered optimization platform for EVE Online
- **Secondary**: Strategic advantage through intelligent analysis
- **Tertiary**: Community-driven excellence in spaceship mastery

#### Brand Personality

- **Intelligent**: Advanced algorithms and data-driven insights
- **Precise**: Accurate calculations and reliable recommendations
- **Strategic**: Long-term planning and tactical advantage
- **Professional**: Clean, modern, and trustworthy interface
- **Innovative**: Cutting-edge technology meets gaming expertise

### Visual Identity

#### Logo Design Concept

The Eve-Cortex logo combines neural network imagery with space-age aesthetics:

```
Primary Logo (SVG):
- Central hexagonal core representing the "Cortex"
- Interconnected nodes suggesting neural pathways
- Subtle circuit board patterns
- Clean, geometric typography
- Scalable from 16px to large format
```

#### Logo Variations

1. **Primary Logo**: Full logo with text and icon
2. **Icon Only**: Hexagonal cortex symbol for favicons/small spaces
3. **Horizontal**: Logo and text arranged horizontally
4. **Stacked**: Logo above text for square formats
5. **Monochrome**: Single color versions for various backgrounds

#### Color Palette

**Primary Colors:**

```css
/* Cortex Blue - Primary brand color */
--cortex-blue: #0066ff;
--cortex-blue-dark: #0052cc;
--cortex-blue-light: #3385ff;

/* Neural Purple - Secondary accent */
--neural-purple: #6b46c1;
--neural-purple-dark: #553c9a;
--neural-purple-light: #8b5cf6;

/* EVE Gold - Accent color inspired by EVE Online */
--eve-gold: #ffb800;
--eve-gold-dark: #e6a600;
--eve-gold-light: #ffcc33;
```

**Neutral Colors:**

```css
/* Dark Theme (Primary) */
--bg-primary: #0a0a0b;
--bg-secondary: #1a1a1c;
--bg-tertiary: #2a2a2e;
--text-primary: #ffffff;
--text-secondary: #b3b3b3;
--text-muted: #666666;

/* Light Theme (Alternative) */
--bg-light-primary: #ffffff;
--bg-light-secondary: #f8f9fa;
--bg-light-tertiary: #e9ecef;
--text-light-primary: #212529;
--text-light-secondary: #495057;
--text-light-muted: #6c757d;
```

**Status Colors:**

```css
/* Success/Positive */
--success: #10b981;
--success-light: #34d399;
--success-dark: #059669;

/* Warning/Caution */
--warning: #f59e0b;
--warning-light: #fbbf24;
--warning-dark: #d97706;

/* Error/Danger */
--error: #ef4444;
--error-light: #f87171;
--error-dark: #dc2626;

/* Info/Neutral */
--info: #3b82f6;
--info-light: #60a5fa;
--info-dark: #2563eb;
```

#### Typography

**Primary Font Stack:**

```css
/* Headings - Modern, tech-inspired */
font-family:
  'Inter',
  'SF Pro Display',
  -apple-system,
  BlinkMacSystemFont,
  sans-serif;

/* Body Text - Highly readable */
font-family:
  'Inter',
  'SF Pro Text',
  -apple-system,
  BlinkMacSystemFont,
  sans-serif;

/* Monospace - Code and data */
font-family: 'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', monospace;
```

**Typography Scale:**

```css
/* Headings */
--text-6xl: 3.75rem; /* 60px - Hero titles */
--text-5xl: 3rem; /* 48px - Page titles */
--text-4xl: 2.25rem; /* 36px - Section headers */
--text-3xl: 1.875rem; /* 30px - Subsection headers */
--text-2xl: 1.5rem; /* 24px - Card titles */
--text-xl: 1.25rem; /* 20px - Large text */

/* Body Text */
--text-lg: 1.125rem; /* 18px - Large body */
--text-base: 1rem; /* 16px - Default body */
--text-sm: 0.875rem; /* 14px - Small text */
--text-xs: 0.75rem; /* 12px - Captions */
```

#### Iconography

**Icon Style Guidelines:**

- **Style**: Outline icons with 2px stroke weight
- **Corner Radius**: 2px for consistency
- **Grid**: 24x24px base grid system
- **Variants**: 16px, 20px, 24px, 32px, 48px sizes
- **Theme**: Tech/space inspired with neural network elements

**Custom Icon Set:**

```
Core Icons:
- cortex-brain: Neural network brain
- ship-optimizer: Spaceship with optimization arrows
- skill-tree: Branching skill progression
- market-analysis: Chart with trend lines
- fitting-tool: Wrench with circuit pattern
- character-profile: Pilot helmet silhouette
- recommendation-ai: Robot head with lightbulb
- performance-metrics: Dashboard with gauges
```

#### UI Components Style Guide

**Buttons:**

```css
/* Primary Button */
.btn-primary {
  background: var(--cortex-blue);
  color: white;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: var(--cortex-blue-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--cortex-blue);
  border: 2px solid var(--cortex-blue);
  border-radius: 8px;
  padding: 10px 22px;
  font-weight: 600;
}
```

**Cards:**

```css
.card {
  background: var(--bg-secondary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  border-color: var(--cortex-blue);
}
```

**Data Visualization:**

```css
/* Chart colors for consistent data representation */
--chart-primary: var(--cortex-blue);
--chart-secondary: var(--neural-purple);
--chart-accent: var(--eve-gold);
--chart-success: var(--success);
--chart-warning: var(--warning);
--chart-error: var(--error);

/* Gradient overlays for depth */
--gradient-primary: linear-gradient(135deg, var(--cortex-blue), var(--neural-purple));
--gradient-secondary: linear-gradient(135deg, var(--neural-purple), var(--eve-gold));
```

### Brand Assets Structure

```
/public/brand/
├── logos/
│   ├── eve-cortex-logo.svg          # Primary logo
│   ├── eve-cortex-icon.svg          # Icon only
│   ├── eve-cortex-horizontal.svg    # Horizontal layout
│   ├── eve-cortex-stacked.svg       # Stacked layout
│   ├── eve-cortex-mono-white.svg    # White monochrome
│   ├── eve-cortex-mono-black.svg    # Black monochrome
│   └── favicon/
│       ├── favicon.ico
│       ├── favicon-16x16.png
│       ├── favicon-32x32.png
│       ├── apple-touch-icon.png
│       └── android-chrome-192x192.png
├── icons/
│   ├── cortex-brain.svg
│   ├── ship-optimizer.svg
│   ├── skill-tree.svg
│   ├── market-analysis.svg
│   ├── fitting-tool.svg
│   ├── character-profile.svg
│   ├── recommendation-ai.svg
│   └── performance-metrics.svg
├── backgrounds/
│   ├── hero-gradient.svg
│   ├── neural-pattern.svg
│   └── space-texture.jpg
└── social/
    ├── og-image.png                 # 1200x630 Open Graph
    ├── twitter-card.png             # 1200x600 Twitter Card
    └── linkedin-banner.png          # 1584x396 LinkedIn
```

### Brand Voice and Messaging

#### Tone of Voice

- **Authoritative**: Confident in technical expertise
- **Approachable**: Complex concepts explained simply
- **Precise**: Accurate and specific language
- **Forward-thinking**: Emphasis on optimization and improvement

#### Key Messaging

- **Primary**: "Optimize your EVE Online experience with AI-powered intelligence"
- **Secondary**: "Strategic advantage through data-driven insights"
- **Call-to-Action**: "Unlock your potential" / "Optimize now" / "Gain the edge"

#### Content Guidelines

- Use active voice and present tense
- Emphasize benefits over features
- Include specific metrics and improvements
- Maintain professional yet accessible tone
- Reference EVE Online terminology appropriately

### Implementation Guidelines

#### Logo Usage

- **Minimum Size**: 24px height for digital, 0.5 inches for print
- **Clear Space**: Minimum 1x logo height on all sides
- **Backgrounds**: Ensure sufficient contrast (4.5:1 minimum)
- **Prohibited**: No stretching, rotating, or color modifications

#### Color Usage

- **Primary**: Cortex Blue for main actions and branding
- **Secondary**: Neural Purple for accents and highlights
- **Accent**: EVE Gold sparingly for special emphasis
- **Backgrounds**: Dark theme preferred, light theme for accessibility

#### Accessibility Standards

- **WCAG 2.1 AA Compliance**: All color combinations meet contrast requirements
- **Color Blindness**: Icons and UI don't rely solely on color
- **Screen Readers**: Proper alt text and ARIA labels
- **Keyboard Navigation**: Full keyboard accessibility

This comprehensive brand system ensures Eve-Cortex maintains a consistent, professional, and recognizable identity across all touchpoints while reflecting the sophisticated nature of EVE Online optimization.
