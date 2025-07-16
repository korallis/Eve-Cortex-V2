# CLAUDE.md - Eve-Cortex Project Context

This file provides comprehensive context for AI assistants working on the Eve-Cortex project, replicating the Kiro Spec workflow by including both specifications and steering guidance.

## PROJECT SPECIFICATIONS

### Requirements Document

#### Introduction

The EVE Online Optimizer is a comprehensive web platform that leverages the EVE Online ESI API to collect all available data (public and private scopes) and provides AI-powered optimization recommendations to give players a competitive edge. The platform focuses on ship fitting optimization, career path guidance, and strategic recommendations across all aspects of EVE Online gameplay including missions, exploration, mining, PvP, planetary interaction, and ISK generation strategies.

#### Core Requirements

**Requirement 1: ESI API Integration**
- User Story: As an EVE Online player, I want to connect my character data through ESI API authentication, so that I can receive personalized recommendations based on my actual skills, assets, and game state.
- Acceptance Criteria: ESI OAuth authentication, all scopes requested, token storage and refresh, comprehensive character data fetching

**Requirement 2: AI-Powered Ship Fitting**
- User Story: As a player, I want the system to automatically analyze my character and proactively recommend the most optimal ship fittings based on my specific skills, implants, and career goals.
- Acceptance Criteria: Character-specific calculations, Dogma system integration, performance metrics, skill-based recommendations

**Requirement 3: Career Path Optimization**
- User Story: As a player, I want to specify my career focus (missions, exploration, mining, PvP, etc.), so that I receive tailored ship recommendations and strategic advice.
- Acceptance Criteria: Career-specific filtering, specialized recommendations, hybrid path support

**Requirement 4: Mission Optimization**
- User Story: As a mission runner, I want detailed information about mission factions, corporations, enemy types, and damage profiles.
- Acceptance Criteria: Faction/corporation data, enemy analysis, resistance profiling, ISK/hour calculations

**Requirement 5: Multiple Fitting Options**
- User Story: As a competitive player, I want multiple fitting options for each scenario rather than just one recommendation.
- Acceptance Criteria: At least 3 fitting approaches, categorized by focus (DPS, Tank, Speed, Cost), trade-off explanations

**Requirement 6: Comprehensive Optimization**
- User Story: As a player seeking comprehensive optimization, I want AI-powered recommendations for planetary interaction, market opportunities, and ISK generation strategies.
- Acceptance Criteria: Market analysis, planetary interaction optimization, industrial activity calculations

**Requirement 7: Current Data & Best Practices**
- User Story: As a user, I want the platform to maintain up-to-date EVE Online data and use current best practices in web development.
- Acceptance Criteria: SDE integration, ESI rate limiting, 24-hour data freshness, modern frameworks

**Requirement 8: Skill Training Plans**
- User Story: As a player, I want the system to generate optimal skill training plans based on my career selection and target ships.
- Acceptance Criteria: Career-optimized plans, prerequisite handling, time estimates, priority explanations

**Requirement 9: Responsive Interface**
- User Story: As a player, I want an intuitive and responsive web interface that works across devices.
- Acceptance Criteria: Cross-device compatibility, clear visualizations, intuitive navigation, loading states

### Technical Design

#### Architecture Overview
- Next.js 15 with App Router
- React 19 with TypeScript 5.7
- PostgreSQL + Redis for data storage
- NextAuth.js with EVE Online ESI OAuth
- Tailwind CSS with custom Eve-Cortex theme

#### Core Components
- Authentication System (ESI OAuth, session management)
- Data Synchronization Engine (character data, assets, skills, market data)
- Optimization Engine (Dogma calculator, fit optimizer, skill planner)
- Recommendation System (career analysis, mission optimization, market opportunities)
- User Interface Components (dashboard, fitting tool, skill planner, market browser)

#### Data Models
- Character: EVE character with skills, implants, attributes
- Fitting: Ship configuration with modules and performance data
- Skill Plan: Training queue with goals and timelines
- Market Data: Price data with trends and volume

### Brand Guidelines

#### Visual Identity
- **Colors**: Cortex Blue (#0066FF), Neural Purple (#6B46C1), EVE Gold (#FFB800)
- **Typography**: Inter font family with tech-inspired aesthetics
- **Theme**: Dark theme with sci-fi aesthetics and gradient accents
- **Tone**: Professional, strategic, data-driven

#### Logo and Assets
- Hexagonal cortex symbol with neural network patterns
- Scalable SVG format with multiple variants
- Custom icon set for space/tech themes
- Consistent component styling with hover effects

## STEERING GUIDANCE

### Product Context

**Purpose**: AI-powered EVE Online optimization platform providing strategic advantages through data-driven insights.

**Core Features**:
- AI-Powered Ship Fitting with character-specific optimization
- Intelligent Skill Planning with career focus
- Real-time Market Analysis and profit identification
- Mission Optimization with enemy-specific recommendations
- Seamless ESI Integration with live synchronization

**Target Audience**: EVE Online players seeking competitive advantages through optimized ship configurations, strategic skill development, and market opportunities.

### Project Structure

#### Directory Organization
```
eve-cortex/
├── src/
│   ├── app/             # Next.js App Router pages
│   ├── components/      # React components
│   │   ├── ui/         # Reusable UI components
│   │   └── sections/   # Landing page sections
│   ├── lib/            # Utility functions and configurations
│   ├── types/          # TypeScript type definitions
│   ├── hooks/          # Custom React hooks
│   └── styles/         # Global styles and themes
├── public/             # Static assets
└── scripts/           # Database and utility scripts
```

#### Naming Conventions
- **Components**: `kebab-case.tsx` files, `PascalCase` exports
- **Utilities**: `kebab-case.ts` files, `camelCase` functions
- **Types**: `PascalCase` with descriptive names
- **Hooks**: `camelCase` starting with `use` prefix

#### Import/Export Patterns
- Path aliases: `@/*` for src, `@/components/*`, `@/lib/*`
- Import order: React/Next.js → Third-party → Internal → Relative → Types
- Named exports preferred for utilities and types

### Technology Stack

#### Core Technologies
- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19 with TypeScript 5.7
- **Styling**: Tailwind CSS 3.4 with custom Eve-Cortex theme
- **Database**: PostgreSQL 15+ with postgres.js client
- **Cache**: Redis 7+ with ioredis client
- **Authentication**: NextAuth.js 5.0 with EVE Online ESI OAuth

#### Development Tools
- **Code Quality**: ESLint, Prettier, Husky for pre-commit hooks
- **Testing**: Jest with Testing Library and jsdom
- **Animation**: Framer Motion for smooth interactions
- **Icons**: Heroicons and Lucide React

#### Common Commands
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # TypeScript checking
npm test             # Run tests

# Code Quality
npm run lint:fix     # Fix ESLint issues
npm run format       # Format with Prettier
npm run test:coverage # Test coverage
```

#### Required Environment Variables
- `NEXTAUTH_URL`: Application URL
- `NEXTAUTH_SECRET`: NextAuth.js secret
- `EVE_CLIENT_ID`: EVE Online ESI client ID
- `EVE_CLIENT_SECRET`: EVE Online ESI client secret
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string

### Terminal Guidelines for macOS

#### File Path Handling
- Use single quotes for paths with spaces
- Prefer relative paths within project directory
- Use tab completion to avoid typing errors
- Escape special characters with backslash

#### Command Best Practices
- Use `&&` for conditional chaining
- Use `||` for fallback commands
- Use `;` for sequential execution
- Check `package.json` scripts before manual commands

#### Development Workflow
- Use `npm run` commands when available
- Check `git status` frequently
- Use `pwd` before destructive operations
- Create backups before major file operations

#### macOS Specific
- Use `open .` to open directory in Finder
- Use `pbcopy` and `pbpaste` for clipboard operations
- Use `say "message"` for audio feedback on long operations

## DEVELOPMENT GUIDELINES

### Code Organization Principles

#### Component Structure
```typescript
// Imports (React/Next.js → Third-party → Internal → Types)
import React from 'react'
import { ComponentProps } from './types'

// Types/Interfaces
interface ComponentNameProps {
  title: string
  subtitle?: string
}

// Component with hooks, handlers, and render logic
export function ComponentName({ title, subtitle }: ComponentNameProps) {
  // Implementation
}
```

#### Utility Structure
```typescript
// Types first
type FormatOptions = {
  currency?: string
  decimals?: number
}

// Main exported functions
export function formatCurrency(amount: number, options?: FormatOptions): string {
  // Implementation
}
```

### Styling Conventions

#### Tailwind CSS Usage
- **Custom Theme**: Extended with Eve-Cortex brand colors
- **Responsive**: Mobile-first with `sm:`, `md:`, `lg:` prefixes
- **Dark Mode**: `class` strategy with `dark:` prefix
- **Component Variants**: Use `class-variance-authority` for complex components

#### CSS Organization
- **Global Styles**: `src/app/globals.css`
- **Component Styles**: Inline Tailwind classes preferred
- **Custom CSS**: Only when Tailwind is insufficient

### Testing Requirements

#### Test Structure
- **Location**: Co-located with source files or `__tests__` directories
- **Naming**: `component-name.test.tsx` or `utility-name.test.ts`
- **Coverage**: Minimum 80% coverage required

#### Test Categories
- **Unit Tests**: Individual functions and components
- **Integration Tests**: Component interactions
- **E2E Tests**: Full user workflows (future implementation)

### Git Workflow

#### Branch Strategy
- **main**: Production-ready code
- **feature/***: New features
- **fix/***: Bug fixes
- **chore/***: Maintenance tasks

#### Commit Conventions
- **feat**: New features
- **fix**: Bug fixes
- **docs**: Documentation updates
- **style**: Code formatting
- **refactor**: Code restructuring
- **test**: Test additions/updates
- **chore**: Maintenance tasks

---

## MANDATORY TASK EXECUTION WORKFLOW

**CRITICAL: This workflow MUST be followed for EVERY task execution without exception.**

### Pre-Task Context Loading (REQUIRED)
Before executing ANY task, you MUST read ALL of these files to have complete context:

1. **Read ALL Steering Files** (in this exact order):
   - `/Users/lee/Documents/Eve-Cortex V2/.kiro/steering/product.md`
   - `/Users/lee/Documents/Eve-Cortex V2/.kiro/steering/structure.md`
   - `/Users/lee/Documents/Eve-Cortex V2/.kiro/steering/tech.md`
   - `/Users/lee/Documents/Eve-Cortex V2/.kiro/steering/terminal.md`

2. **Read ALL Spec Files** (in this exact order):
   - `/Users/lee/Documents/Eve-Cortex V2/.kiro/specs/eve-online-optimizer/requirements.md`
   - `/Users/lee/Documents/Eve-Cortex V2/.kiro/specs/eve-online-optimizer/design.md`
   - `/Users/lee/Documents/Eve-Cortex V2/.kiro/specs/eve-online-optimizer/tasks.md`

### Task Execution Protocol (MANDATORY)
1. **Check Dev Server Status**
   - Run `ps aux | grep "next dev"` to check if dev server is running
   - If running, kill it: `pkill -f "next dev"`
   - Only then proceed with task execution

2. **Execute Task with Full Context**
   - Work directly from the tasks.md file
   - NEVER create local task lists or use TodoWrite tool
   - NEVER work from memory or assumptions
   - Use the complete context from all files read above

3. **Update Progress in tasks.md**
   - Mark task as `[x]` completed directly in tasks.md
   - NEVER use local task tracking systems
   - tasks.md is the SINGLE SOURCE OF TRUTH for progress

4. **Run Tests Before PR Creation (MANDATORY)**
   - Run `npm test` to execute all tests
   - Tests must PASS before creating PR
   - Fix any test failures or configuration issues
   - If Jest configuration errors exist, fix them immediately
   - Only proceed to PR creation after all tests pass

5. **Create Pull Request**
   - Once task is marked complete in tasks.md AND tests pass, create a PR
   - Use the automated workflow: `npm run task:complete`
   - PR title should match the completed task

### VIOLATIONS THAT ARE FORBIDDEN
- ❌ Using TodoWrite tool for task tracking
- ❌ Creating local task lists
- ❌ Working without reading all context files first
- ❌ Not checking dev server status
- ❌ Creating PR without running tests first
- ❌ Creating PR when tests are failing
- ❌ Not fixing Jest configuration errors
- ❌ Not creating PR after task completion
- ❌ Working from memory instead of tasks.md

### USAGE INSTRUCTIONS

When working on any task for the Eve-Cortex project:

1. **ALWAYS follow the Mandatory Task Execution Workflow above**
2. **Reference this context** for project understanding, technical constraints, and brand guidelines
3. **Follow the established patterns** for code organization, naming, and styling
4. **Adhere to the technology stack** specified in the steering guidance
5. **Maintain brand consistency** using the defined colors, typography, and visual style
6. **Use the common commands** for development, testing, and quality checks
7. **Follow the Git workflow** for branching, commits, and pull requests

This comprehensive context and mandatory workflow ensures consistent, high-quality development that aligns with the Eve-Cortex project's goals, technical requirements, and brand identity.