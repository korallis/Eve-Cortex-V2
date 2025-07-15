# Project Structure & Organization

## Directory Layout

```
eve-cortex/
├── .github/workflows/     # CI/CD pipeline configurations
├── .husky/               # Git hooks (pre-commit)
├── .kiro/                # Kiro IDE configurations
│   ├── settings/         # IDE settings
│   ├── specs/           # Feature specifications
│   └── steering/        # AI assistant guidance rules
├── src/                 # Source code
│   ├── app/             # Next.js App Router pages
│   ├── components/      # React components
│   ├── lib/             # Utility functions and configurations
│   ├── types/           # TypeScript type definitions
│   ├── hooks/           # Custom React hooks
│   └── styles/          # Global styles and themes
├── public/              # Static assets
└── scripts/             # Database and utility scripts
```

## Source Code Organization

### `/src/app/` - Next.js App Router

- **Purpose**: Page routes and layouts using App Router
- **Conventions**:
  - `layout.tsx` for shared layouts
  - `page.tsx` for route pages
  - `loading.tsx` for loading states
  - `error.tsx` for error boundaries

### `/src/components/` - React Components

- **`/ui/`**: Reusable UI components (Button, Container, etc.)
- **`/sections/`**: Landing page sections (Hero, Features, CTA, Stats)
- **Naming**: PascalCase for component files and exports
- **Structure**: One component per file, co-located styles if needed

### `/src/lib/` - Utilities & Configuration

- **`utils.ts`**: Common utility functions (cn, formatters, etc.)
- **Purpose**: Shared logic, API clients, configurations
- **Exports**: Named exports preferred over default

### `/src/types/` - TypeScript Definitions

- **Purpose**: Shared type definitions and interfaces
- **Naming**: PascalCase for types, camelCase for interfaces
- **Organization**: Group related types in single files

### `/src/hooks/` - Custom React Hooks

- **Naming**: Start with `use` prefix
- **Purpose**: Reusable stateful logic
- **Testing**: Each hook should have corresponding tests

## File Naming Conventions

### Components

- **Files**: `kebab-case.tsx` (e.g., `hero-section.tsx`)
- **Exports**: `PascalCase` (e.g., `HeroSection`)
- **Props**: `ComponentNameProps` interface

### Utilities & Hooks

- **Files**: `kebab-case.ts` (e.g., `api-client.ts`)
- **Functions**: `camelCase` (e.g., `formatCurrency`)
- **Hooks**: `camelCase` starting with `use` (e.g., `useLocalStorage`)

### Types & Interfaces

- **Files**: `kebab-case.ts` (e.g., `user-types.ts`)
- **Types**: `PascalCase` (e.g., `UserProfile`)
- **Interfaces**: `PascalCase` with `I` prefix optional

## Import/Export Patterns

### Path Aliases (tsconfig.json)

```typescript
"@/*": ["./src/*"]
"@/components/*": ["./src/components/*"]
"@/lib/*": ["./src/lib/*"]
"@/types/*": ["./src/types/*"]
"@/hooks/*": ["./src/hooks/*"]
```

### Import Order

1. React and Next.js imports
2. Third-party libraries
3. Internal components and utilities (using @ aliases)
4. Relative imports
5. Type-only imports (with `type` keyword)

### Export Patterns

- **Components**: Default export for main component, named exports for sub-components
- **Utilities**: Named exports only
- **Types**: Named exports only

## Styling Conventions

### Tailwind CSS

- **Custom Theme**: Extended with Eve-Cortex brand colors
- **Responsive**: Mobile-first approach with `sm:`, `md:`, `lg:` prefixes
- **Dark Mode**: `class` strategy with `dark:` prefix
- **Component Variants**: Use `class-variance-authority` for complex components

### CSS Organization

- **Global Styles**: `src/app/globals.css`
- **Component Styles**: Inline Tailwind classes preferred
- **Custom CSS**: Only when Tailwind is insufficient

## Testing Structure

### Test Files

- **Location**: Co-located with source files or in `__tests__` directories
- **Naming**: `component-name.test.tsx` or `utility-name.test.ts`
- **Coverage**: Minimum 80% coverage required

### Test Categories

- **Unit Tests**: Individual functions and components
- **Integration Tests**: Component interactions
- **E2E Tests**: Full user workflows (future)

## Configuration Files

### Root Level

- **`package.json`**: Dependencies and scripts
- **`next.config.js`**: Next.js configuration
- **`tailwind.config.js`**: Tailwind CSS customization
- **`tsconfig.json`**: TypeScript configuration
- **`jest.config.js`**: Testing configuration
- **`.eslintrc.json`**: Linting rules
- **`.prettierrc`**: Code formatting rules

### Environment

- **`.env.example`**: Template for environment variables
- **`.env.local`**: Local development environment (gitignored)

## Code Organization Principles

### Component Structure

```typescript
// Imports
import React from 'react'
import { ComponentProps } from './types'

// Types/Interfaces
interface HeroSectionProps {
  title: string
  subtitle?: string
}

// Component
export function HeroSection({ title, subtitle }: HeroSectionProps) {
  // Hooks and state
  // Event handlers
  // Render logic
  return (
    <section className="...">
      {/* JSX */}
    </section>
  )
}
```

### Utility Structure

```typescript
// Types
type FormatOptions = {
  currency?: string
  decimals?: number
}

// Main functions
export function formatCurrency(amount: number, options?: FormatOptions): string {
  // Implementation
}

// Helper functions (not exported)
function helperFunction() {
  // Implementation
}
```

## Development Workflow

### Branch Strategy

- **main**: Production-ready code
- **feature/\***: New features
- **fix/\***: Bug fixes
- **chore/\***: Maintenance tasks

### Commit Conventions

- **feat**: New features
- **fix**: Bug fixes
- **docs**: Documentation updates
- **style**: Code formatting
- **refactor**: Code restructuring
- **test**: Test additions/updates
- **chore**: Maintenance tasks
