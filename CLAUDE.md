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

## USAGE INSTRUCTIONS

When working on any task for the Eve-Cortex project:

1. **Reference this context** for project understanding, technical constraints, and brand guidelines
2. **Follow the established patterns** for code organization, naming, and styling
3. **Adhere to the technology stack** specified in the steering guidance
4. **Maintain brand consistency** using the defined colors, typography, and visual style
5. **Use the common commands** for development, testing, and quality checks
6. **Follow the Git workflow** for branching, commits, and pull requests

---

## MANDATORY TASK EXECUTION WORKFLOW

**CRITICAL: This workflow MUST be followed for EVERY task execution without exception.**

**⚠️ ABSOLUTE COMPLIANCE REQUIRED ⚠️**
- This workflow is MANDATORY and CANNOT be skipped or modified
- ANY deviation from this workflow is a CRITICAL VIOLATION
- ALL steps must be completed in the exact order specified
- NO exceptions, shortcuts, or alternative approaches are permitted
- Failure to follow this workflow will result in immediate task failure

### Task Execution Protocol (MANDATORY)

**🔒 EACH STEP IS MANDATORY AND MUST BE COMPLETED IN ORDER 🔒**

**Step 1: Check Dev Server Status** ✅ REQUIRED
   - Run `ps aux | grep "next dev"` to check if dev server is running
   - If running, kill it: `pkill -f "next dev"`
   - Only then proceed with task execution
   - ⚠️ VIOLATION: Proceeding without checking dev server status

**Step 2: Create Clean Task Branch** ✅ REQUIRED
   - ALWAYS start from main branch: `git checkout main`
   - Pull latest changes: `git pull origin main`
   - Create task-specific branch: `git checkout -b task/descriptive-name`
   - NEVER work on existing branches for new tasks
   - ⚠️ VIOLATION: Working on existing branches or not starting from main

**Step 3: Pre-Implementation Code Analysis** ✅ REQUIRED
   - Run `npm run lint` to check current code quality
   - Run `npm run type-check` to verify TypeScript status
   - Check existing patterns in similar files before implementing new features
   - Review imports and dependencies in related files
   - ⚠️ VIOLATION: Skipping lint/type-check before implementation

**Step 4: Execute Task with Full Context** ✅ REQUIRED
   - Work directly from `/Users/lee/Documents/Eve-Cortex V2/.kiro/specs/eve-online-optimizer/tasks.md`
   - NEVER create local task lists or use TodoWrite tool
   - NEVER work from memory or assumptions
   - Follow existing code patterns and naming conventions
   - ⚠️ VIOLATION: Using TodoWrite tool or working from memory

**Step 5: Implementation Best Practices** ✅ REQUIRED
   - Always read existing similar files first to understand patterns
   - Use consistent TypeScript types and interfaces
   - Follow the established import/export patterns
   - Ensure proper error handling and logging
   - Add comprehensive JSDoc comments for public APIs
   - ⚠️ VIOLATION: Not following existing patterns or missing TypeScript types

**Step 6: Comprehensive Code Quality Validation** ✅ REQUIRED
   - Run `npm run lint` after implementation - MUST show only warnings or pass
   - Run `npm run type-check` to verify TypeScript compliance - MUST pass with no errors
   - Run `npm test` to ensure all tests pass - MUST pass completely (NO FAILURES ALLOWED)
   - If tests fail, you MUST either fix them or exclude them from the test run
   - Run `npm run build` to verify production build works - MUST complete successfully
   - Check for postgres.js type compatibility issues in database files
   - Verify all TypeScript types are properly defined (no `any` or `unknown` without casting)
   - Ensure all new files follow project naming conventions
   - ⚠️ VIOLATION: Proceeding with lint/type errors, test failures, or build failures unfixed

**Step 7: Update Progress in tasks.md** ✅ REQUIRED
   - Mark task as `[x]` completed directly in `/Users/lee/Documents/Eve-Cortex V2/.kiro/specs/eve-online-optimizer/tasks.md`
   - NEVER use local task tracking systems
   - tasks.md is the SINGLE SOURCE OF TRUTH for progress
   - ⚠️ VIOLATION: Using any tracking system other than tasks.md

**Step 8: Final Quality Gate Validation** ✅ MANDATORY
   - Run complete quality gate sequence: `npm run lint && npm run type-check && npm test && npm run build`
   - ALL commands must pass completely before proceeding
   - Fix any Jest configuration issues immediately (no `test:coverage` if it fails)
   - If tests fail, you MUST fix them or exclude them - NO EXCEPTIONS
   - Verify branch protection rules are configured: `npm run github:protection-status`
   - Ensure CI/CD pipeline will succeed by checking all quality gates locally
   - Only proceed to PR creation after ALL quality gates pass
   - ⚠️ VIOLATION: Creating PR without all quality gates passing or CI/CD validation

**Step 8.1: Test Failure Resolution** ✅ MANDATORY
   - If `npm test` fails, you MUST either:
     1. Fix the failing tests immediately
     2. Exclude failing tests from the test run using Jest configuration
     3. Skip specific test files using Jest CLI options
   - You CANNOT create a PR with any test failures
   - Pre-existing test failures are NOT an excuse - they must be resolved
   - ⚠️ VIOLATION: Creating PR with any test failures for any reason

**Step 9: Create Pull Request with Auto-merge** ✅ REQUIRED
   - Once task is marked complete in tasks.md AND ALL quality gates pass, create a PR
   - Commit changes with descriptive commit message following format
   - Push to remote branch: `git push origin task/branch-name`
   - Create PR with auto-merge label: `gh pr create --title "feat: Task Name" --body "Description" --label "auto-merge"`
   - Each task gets its own separate PR for clean Git history
   - PR will auto-merge when CI/CD pipeline passes (since local validation ensures this)
   - ⚠️ VIOLATION: Not creating PR after task completion, reusing branches, or missing auto-merge label

### 🚨 CRITICAL VIOLATIONS - IMMEDIATE TASK FAILURE 🚨

**ANY OF THESE VIOLATIONS WILL RESULT IN IMMEDIATE TASK FAILURE:**

🔴 **BRANCHING VIOLATIONS:**
- ❌ Not starting from main branch
- ❌ Working on existing branches for new tasks
- ❌ Not creating task-specific branches
- ❌ Reusing branches across different tasks

🔴 **WORKFLOW VIOLATIONS:**
- ❌ Using TodoWrite tool for task tracking
- ❌ Creating local task lists
- ❌ Working without reading all context files first
- ❌ Not checking dev server status
- ❌ Skipping any step in the mandatory workflow
- ❌ Completing steps out of order

🔴 **TESTING AND QUALITY GATE VIOLATIONS:**
- ❌ Creating PR without running complete quality gate sequence
- ❌ Creating PR when tests are failing
- ❌ Creating PR when TypeScript compilation fails
- ❌ Creating PR when build fails
- ❌ Not fixing Jest configuration errors
- ❌ Skipping `npm test` before PR creation
- ❌ Not verifying branch protection rules are configured
- ❌ Using `test:coverage` when it fails instead of `test`
- ❌ Ignoring test failures and calling them "pre-existing"
- ❌ Not fixing or excluding failing tests before PR creation
- ❌ Allowing ANY test failures to reach CI/CD pipeline

🔴 **CODE QUALITY VIOLATIONS:**
- ❌ Skipping lint/type-check before and after implementation
- ❌ Not following existing code patterns
- ❌ Creating files without proper TypeScript types
- ❌ Not reading similar existing files first
- ❌ Missing error handling or logging
- ❌ Inconsistent naming conventions
- ❌ Using `any` or `unknown` types without proper casting
- ❌ Not checking for postgres.js type compatibility issues
- ❌ Not verifying production build works before PR creation

🔴 **TASK MANAGEMENT VIOLATIONS:**
- ❌ Not creating separate PR for each task
- ❌ Working from memory instead of tasks.md
- ❌ Using any tracking system other than tasks.md
- ❌ Not marking tasks as complete in tasks.md
- ❌ Not adding auto-merge label to PRs
- ❌ Not ensuring CI/CD pipeline compatibility before PR creation

### ✅ MANDATORY DEVELOPMENT PRACTICES - NO EXCEPTIONS

**🔒 BRANCH MANAGEMENT (MANDATORY):**
- Start every task from main branch - REQUIRED
- Create task-specific branches: `task/descriptive-name` - REQUIRED
- Never reuse branches across different tasks - REQUIRED
- Each task gets its own separate PR - REQUIRED

**🔒 COMMAND EXECUTION SEQUENCE (MANDATORY):**
1. `git checkout main && git pull origin main` - REQUIRED
2. `git checkout -b task/name` - REQUIRED
3. `npm run lint` (before starting) - REQUIRED
4. `npm run type-check` (before starting) - REQUIRED
5. Implement features following existing patterns - REQUIRED
6. `npm run lint` (after implementation) - REQUIRED
7. `npm run type-check` (after implementation) - REQUIRED
8. `npm test` (mandatory before PR) - REQUIRED
9. `npm run build` (verify production build works) - REQUIRED
10. `npm run github:protection-status` (verify branch protection) - REQUIRED
11. Create PR with auto-merge label on separate branch - REQUIRED

**🔒 QUALITY GATE VALIDATION (MANDATORY):**
- Complete quality gate sequence: `npm run lint && npm run type-check && npm test && npm run build`
- ALL commands must pass with no errors (lint warnings acceptable)
- Fix any TypeScript compilation errors immediately
- Resolve any Jest configuration issues (use `test` not `test:coverage` if coverage fails)
- Verify postgres.js type compatibility in database files
- Ensure all types are properly defined with no unsafe `any` or `unknown` usage

**🔒 CI/CD PIPELINE COMPATIBILITY (MANDATORY):**
- Verify branch protection rules are configured: `npm run github:protection-status`
- Ensure CI/CD workflow uses `npm test` not `npm run test:coverage`
- Confirm all environment variables are properly set in CI/CD
- Test that build works without coverage collection conflicts
- Verify auto-merge labels are applied to PRs: `--label "auto-merge"`
- Check that all status checks are configured in branch protection
- Ensure PR will auto-merge when CI/CD passes (validated by local quality gates)

**🔒 POSTGRESQL.JS TYPE SAFETY (MANDATORY):**
- Cast `unknown` types to specific types: `value as string | number | boolean`
- Use proper type assertions for SQL query parameters
- Avoid raw `unknown` types in postgres.js template literals
- Test all database operations with TypeScript strict mode
- Ensure repository methods have proper return type annotations

This comprehensive workflow ensures consistent, high-quality development that aligns with the Eve-Cortex project's goals, technical requirements, and brand identity while maintaining proper Git practices, code quality standards, and CI/CD pipeline compatibility.