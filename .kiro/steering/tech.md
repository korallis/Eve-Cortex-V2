# Technology Stack

## Framework & Runtime

- **Next.js 15**: React framework with App Router
- **React 19**: UI library with latest features
- **TypeScript 5.7**: Strict type checking enabled
- **Node.js 20+**: Runtime environment

## Styling & UI

- **Tailwind CSS 3.4**: Utility-first CSS framework with custom Eve-Cortex theme
- **Framer Motion**: Animation library for smooth interactions
- **Headless UI**: Unstyled, accessible UI components
- **Heroicons & Lucide React**: Icon libraries
- **next-themes**: Dark/light theme management

## Data & Authentication

- **PostgreSQL 15+**: Primary database
- **Redis 7+**: Caching and session storage
- **NextAuth.js 5.0**: Authentication with EVE Online ESI OAuth
- **postgres.js**: PostgreSQL client
- **ioredis**: Redis client

## Forms & Validation

- **React Hook Form**: Form state management
- **Zod**: Schema validation
- **@hookform/resolvers**: Form validation integration

## Development Tools

- **ESLint**: Code linting with Next.js config
- **Prettier**: Code formatting with Tailwind plugin
- **Jest**: Testing framework with jsdom environment
- **Testing Library**: React component testing
- **Husky**: Git hooks for pre-commit checks

## Build & Deployment

- **Vercel**: Recommended deployment platform
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing

## Common Commands

### Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
```

### Code Quality

```bash
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
npm run type-check   # TypeScript type checking
```

### Testing

```bash
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

### Database

```bash
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with test data
```

### Security & Dependencies

```bash
npm run audit:security    # Security audit
npm run deps:check       # Check for outdated dependencies
npm run deps:update      # Update dependencies
```

## Environment Variables Required

- `NEXTAUTH_URL`: Application URL
- `NEXTAUTH_SECRET`: NextAuth.js secret
- `EVE_CLIENT_ID`: EVE Online ESI client ID
- `EVE_CLIENT_SECRET`: EVE Online ESI client secret
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
