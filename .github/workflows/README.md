# Claude Bot - Automated Development Workflow

This repository uses Claude Bot for automated development workflows, including task completion, dependency management, and pull request automation.

## 🤖 How It Works

### 1. Task Completion Workflow

When you complete a task, Claude Bot automatically:
- ✅ Creates a feature branch
- 🔍 Analyzes code for deprecated dependencies and security issues
- 🔧 Auto-fixes common problems (linting, formatting, dependency updates)
- 🧪 Runs comprehensive quality checks
- 📝 Creates a pull request with detailed analysis
- 🚀 Enables auto-merge for successful PRs

### 2. Continuous Integration

For every pull request, Claude Bot:
- 🔒 Runs security and dependency audits
- 📦 Auto-fixes deprecated dependencies and vulnerabilities
- 🧹 Validates code quality (ESLint, Prettier, TypeScript)
- 🧪 Runs comprehensive test suite with coverage
- 🏗️ Builds the application
- 📄 Checks license compliance
- 💬 Comments on PR with detailed results

### 3. Auto-merge

PRs are automatically merged when:
- ✅ All quality gates pass
- 🏷️ Labeled with `claude-bot` or `auto-merge`
- 🤖 Created by Claude Bot workflow
- 🔒 No security vulnerabilities detected

## 🚀 Usage

### Trigger Task Completion Workflow

```bash
# Via GitHub Actions UI
# 1. Go to Actions tab
# 2. Select "Claude Bot - Automated Development Workflow"
# 3. Click "Run workflow"
# 4. Enter task description
# 5. Optionally specify branch name

# Or via GitHub CLI
gh workflow run claude-bot.yml -f task_description="Add user authentication" -f branch_name="feature/auth"
```

### Manual PR Creation

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make your changes
# ... code changes ...

# Commit and push
git add .
git commit -m "feat: implement new feature"
git push origin feature/my-feature

# Claude Bot will automatically run CI/CD pipeline
```

## 🔧 Configuration

### Environment Variables

The workflow requires these environment variables:

```env
# GitHub token (automatically provided)
GITHUB_TOKEN=${{ secrets.GITHUB_TOKEN }}

# Optional: Additional tokens for enhanced security scanning
SNYK_TOKEN=${{ secrets.SNYK_TOKEN }}
CODECOV_TOKEN=${{ secrets.CODECOV_TOKEN }}
```

### Branch Protection Rules

Recommended branch protection settings for `main`:

```yaml
# .github/settings.yml (if using probot-settings)
branches:
  main:
    protection:
      required_status_checks:
        strict: true
        contexts:
          - "CI/CD Pipeline"
      enforce_admins: false
      required_pull_request_reviews:
        required_approving_review_count: 0
        dismiss_stale_reviews: true
        require_code_owner_reviews: false
      restrictions: null
      allow_force_pushes: false
      allow_deletions: false
```

## 📊 Quality Gates

### Security & Dependencies
- 🔒 npm audit (moderate level)
- 📦 Deprecated dependency detection
- 🔄 Automatic dependency updates (minor/patch)
- 📄 License compliance checking

### Code Quality
- 🧹 ESLint validation
- 🎨 Prettier formatting
- 🔧 TypeScript type checking
- ✨ Auto-fixing of common issues

### Testing & Build
- 🧪 Jest unit tests with coverage
- 🏗️ Next.js build validation
- 🗃️ Database migration testing
- 🌱 Database seeding verification

## 🎯 Labels

The workflow uses these labels:

- `claude-bot` - PRs created by Claude Bot
- `auto-merge` - PRs eligible for automatic merging
- `dependencies` - Dependency-related changes
- `security` - Security-related fixes
- `automated` - Automated changes

## 📈 Monitoring

### Artifacts Generated
- 📊 Test coverage reports
- 🔍 Security audit results
- 📋 Dependency analysis reports
- 🏗️ Build artifacts

### Notifications
- 💬 PR comments with detailed results
- 🚨 Issue creation for security vulnerabilities
- ✅ Status checks on pull requests
- 📧 Email notifications for failures

## 🔄 Workflow Triggers

### Automatic Triggers
- `pull_request` to `main` branch
- `push` to feature branches
- `schedule` for periodic dependency checks

### Manual Triggers
- `workflow_dispatch` for task completion
- GitHub Actions UI workflow runs
- GitHub CLI workflow execution

## 🛡️ Security

### Dependency Management
- Automatic security vulnerability fixes
- Deprecated dependency updates
- License compliance validation
- Regular security audits

### Code Protection
- Branch protection rules
- Required status checks
- Automatic vulnerability detection
- Secure token management

## 🎨 Customization

### Extending the Workflow

To add custom checks:

```yaml
# Add to .github/workflows/claude-bot.yml
- name: Custom Check
  run: |
    echo "Running custom validation..."
    npm run custom-check
```

### Custom Labels

Add custom labels in repository settings:

```yaml
# Additional labels for workflow management
- name: "needs-review"
  color: "yellow"
- name: "breaking-change"
  color: "red"
- name: "enhancement"
  color: "green"
```

## 📝 Best Practices

### Task Descriptions
- Use clear, descriptive task names
- Include feature/fix/chore prefixes
- Reference issue numbers when applicable

### Branch Naming
- Use descriptive branch names
- Follow convention: `feature/`, `fix/`, `chore/`
- Keep names concise but meaningful

### Code Quality
- Write comprehensive tests
- Follow TypeScript best practices
- Use ESLint and Prettier configurations
- Document complex functionality

## 🔍 Troubleshooting

### Common Issues

1. **Auto-merge Failed**
   - Check branch protection rules
   - Verify required approvals
   - Ensure all status checks pass

2. **Dependency Fixes Failed**
   - Check for breaking changes
   - Review package.json conflicts
   - Verify npm registry access

3. **Security Scan Failures**
   - Review security audit results
   - Update vulnerable dependencies
   - Check for license conflicts

### Debug Information

Enable debug logging:

```bash
# Add to workflow environment
ACTIONS_STEP_DEBUG: true
ACTIONS_RUNNER_DEBUG: true
```

## 🔧 Required Scripts

Ensure your `package.json` includes these scripts:

```json
{
  "scripts": {
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
}
```

## 🚀 Getting Started

1. **Enable GitHub Actions** in your repository
2. **Set up branch protection** for the main branch
3. **Configure required environment variables**
4. **Add necessary labels** to your repository
5. **Test the workflow** by creating a sample PR

### Test Command

```bash
# Test the workflow locally
gh workflow run claude-bot.yml -f task_description="Test Claude Bot setup"
```

---

*This workflow is designed to streamline development while maintaining high code quality and security standards.*