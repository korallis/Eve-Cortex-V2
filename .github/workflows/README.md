# CI/CD Pipeline Documentation

This directory contains the GitHub Actions workflows for the Eve-Cortex project, implementing a comprehensive CI/CD pipeline with automated quality gates, security scanning, and dependency management.

## Workflows Overview

### 🔄 Main CI/CD Pipeline (`ci.yml`)

The primary workflow that runs on every pull request and push to main branch.

**Triggers:**

- Pull requests to `main` branch
- Pushes to `main` branch
- Weekly schedule (Mondays at 9 AM UTC)

**Quality Gates:**

1. **Security & Dependency Audit**
   - npm security audit
   - Deprecated dependency detection
   - Unused dependency check
   - Package validation

2. **Code Quality**
   - ESLint linting
   - Prettier formatting check
   - TypeScript compilation

3. **Testing**
   - Database migration testing
   - Database seeding testing
   - Unit tests with coverage
   - PostgreSQL and Redis services

4. **Build Verification**
   - Next.js build test
   - Build output validation

5. **License Compliance**
   - License compatibility check
   - GPL/AGPL detection

6. **Auto-merge**
   - Automatic PR merging for approved changes
   - Smart approval detection
   - Comprehensive status reporting

### 🔒 Security Scanning (`security.yml`)

Dedicated security workflow for vulnerability detection.

**Features:**

- Daily security scans
- Snyk integration
- Dependency review for PRs
- Automated issue creation for vulnerabilities

### 📦 Dependency Management (`dependency-updates.yml`)

Automated dependency update system.

**Features:**

- Weekly dependency updates
- Security vulnerability fixes
- Major version update notifications
- Comprehensive dependency reporting

## Auto-merge Strategy

The pipeline implements intelligent auto-merge with the following rules:

### ✅ Auto-merge Enabled For:

- **Dependabot PRs**: Automatic approval after all checks pass
- **Owner PRs**: Auto-merge for repository owner (@korallis)
- **Labeled PRs**: PRs with `auto-merge` label

### 🔍 Quality Gates Required:

All PRs must pass these checks before auto-merge:

- Security audit (no moderate+ vulnerabilities)
- Code quality (ESLint, Prettier, TypeScript)
- Database operations (migrations, seeding)
- Unit tests (80%+ coverage required)
- Build verification
- License compliance

### 👥 Approval Requirements:

- **Dependabot**: No manual approval required
- **Owner**: No manual approval required
- **Others**: Requires 1 approving review

## Branch Protection

The pipeline enforces branch protection rules:

```bash
# Setup branch protection
npm run github:setup-protection

# Check protection status
npm run github:protection-status
```

### Protection Rules:

- All status checks must pass
- Require PR reviews (1 approving review)
- Dismiss stale reviews
- Require conversation resolution
- No force pushes allowed
- No branch deletions allowed

## Database Testing

The CI pipeline includes comprehensive database testing:

### Services:

- **PostgreSQL 15**: Primary database
- **Redis 7**: Caching and sessions

### Database Tests:

1. **Migration Testing**: Validates all database migrations
2. **Seeding Testing**: Tests data seeding functionality
3. **Integration Testing**: Tests with live database connections

### Environment Variables:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/eve_cortex_test
REDIS_URL=redis://localhost:6379
NODE_ENV=test
```

## Dependency Management

### Automated Updates:

- **Weekly Schedule**: Every Monday at 9 AM UTC
- **Security Updates**: Immediate fixes for vulnerabilities
- **Minor/Patch**: Automatic updates with testing
- **Major Updates**: Manual review required

### Update Process:

1. Security vulnerability scan
2. Minor/patch version updates
3. Automated testing
4. PR creation with detailed changelog
5. Auto-merge if all tests pass

### Manual Commands:

```bash
# Check for updates
npm run deps:check

# Update dependencies
npm run deps:update

# Security audit
npm run security:check
```

## Monitoring and Reporting

### Artifacts Generated:

- **Test Coverage Reports**: Uploaded to Codecov
- **Security Audit Results**: 90-day retention
- **Dependency Reports**: 30-day retention
- **Build Artifacts**: For debugging failed builds

### Notifications:

- **Security Issues**: Automatic GitHub issues created
- **Failed Builds**: PR comments with failure details
- **Successful Merges**: Comprehensive status reports

## Local Development

### Required Scripts:

```json
{
  "lint": "next lint",
  "lint:fix": "next lint --fix",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "type-check": "tsc --noEmit",
  "test": "jest",
  "test:coverage": "jest --coverage",
  "build": "next build",
  "db:migrate": "node scripts/migrate.js",
  "db:seed": "node scripts/seed.js"
}
```

### Pre-commit Hooks:

The project uses Husky for pre-commit quality checks:

- ESLint with auto-fix
- Prettier formatting
- TypeScript compilation check

## Troubleshooting

### Common Issues:

#### 🔴 Security Audit Failures

```bash
# Fix security vulnerabilities
npm audit fix
npm audit fix --force  # If automatic fix fails
```

#### 🔴 Code Quality Failures

```bash
# Fix linting issues
npm run lint:fix

# Fix formatting
npm run format

# Check TypeScript errors
npm run type-check
```

#### 🔴 Test Failures

```bash
# Run tests locally
npm test

# Run with coverage
npm run test:coverage

# Test database operations
npm run db:migrate
npm run db:seed
```

#### 🔴 Build Failures

```bash
# Test build locally
npm run build

# Check environment variables
cp .env.example .env.local
# Edit .env.local with proper values
```

### Getting Help:

1. **Check Workflow Logs**: Review the detailed logs in GitHub Actions
2. **Review PR Comments**: Auto-generated comments explain failures
3. **Run Locally**: Reproduce issues in local development
4. **Check Dependencies**: Ensure all dependencies are up to date

## Configuration Files

### Workflow Configuration:

- `.github/workflows/ci.yml` - Main CI/CD pipeline
- `.github/workflows/security.yml` - Security scanning
- `.github/workflows/dependency-updates.yml` - Dependency management
- `.github/dependabot.yml` - Dependabot configuration

### Scripts:

- `scripts/migrate.js` - Database migration runner
- `scripts/seed.js` - Database seeding
- `scripts/setup-branch-protection.js` - Branch protection setup

### Quality Tools:

- `.eslintrc.json` - ESLint configuration
- `.prettierrc` - Prettier configuration
- `jest.config.js` - Jest testing configuration
- `tsconfig.json` - TypeScript configuration

## Best Practices

### For Contributors:

1. **Create Feature Branches**: Never commit directly to main
2. **Write Tests**: Maintain 80%+ test coverage
3. **Follow Code Style**: Use ESLint and Prettier
4. **Update Dependencies**: Keep dependencies current
5. **Security First**: Address security issues immediately

### For Maintainers:

1. **Review PRs Promptly**: Enable auto-merge for trusted changes
2. **Monitor Security**: Address security alerts immediately
3. **Update Documentation**: Keep CI/CD docs current
4. **Performance Monitoring**: Watch for CI/CD performance issues

## Metrics and KPIs

The CI/CD pipeline tracks:

- **Build Success Rate**: Target 95%+
- **Test Coverage**: Minimum 80%
- **Security Vulnerabilities**: Zero tolerance for high/critical
- **Dependency Freshness**: Weekly updates
- **PR Merge Time**: Automated for passing PRs
- **Pipeline Duration**: Target <10 minutes

---

_This documentation is automatically updated with pipeline changes._
