# Dependency Management Policy

## Overview

This document outlines the strict dependency management policy for Eve-Cortex to ensure security, maintainability, and reliability.

## 🚫 Prohibited Dependencies

### Deprecated Packages
The following packages are **BANNED** and must not be used:

- `request` - Use `fetch` or `axios` instead
- `node-sass` - Use `sass` instead  
- `gulp` - Use npm scripts or modern build tools
- `bower` - Use npm instead
- `grunt` - Use npm scripts or modern build tools
- `babel-core` - Use `@babel/core` instead
- `babel-preset-env` - Use `@babel/preset-env` instead
- `babel-preset-react` - Use `@babel/preset-react` instead
- `tslint` - Use `eslint` with TypeScript support
- `protractor` - Use modern testing frameworks
- `karma` - Use Jest or Vitest
- `phantomjs` - Use headless Chrome/Firefox
- `moment` - Use `date-fns` or native `Intl` API
- `lodash` - Use native ES6+ methods or specific lodash modules
- `jquery` - Use modern JavaScript/React patterns

### Security Risk Packages
- Any package with known high/critical vulnerabilities
- Packages that haven't been updated in 2+ years
- Packages with fewer than 1000 weekly downloads (exceptions for specialized tools)
- Packages without TypeScript support (for new additions)

## ✅ Approved Alternatives

| Deprecated Package | Approved Alternative | Reason |
|-------------------|---------------------|---------|
| `request` | `fetch` (native) or `axios` | Better security, modern API |
| `moment` | `date-fns` | Smaller bundle, tree-shakeable |
| `node-sass` | `sass` (Dart Sass) | Actively maintained |
| `lodash` | Native ES6+ or specific modules | Reduce bundle size |
| `jquery` | Native DOM API or React | Modern development practices |

## 📋 Dependency Requirements

### All Dependencies Must:
1. **Be actively maintained** (updated within last 6 months)
2. **Have no known security vulnerabilities** (moderate or higher)
3. **Support TypeScript** (either natively or via @types)
4. **Have good documentation** and community support
5. **Be compatible with our license policy** (MIT, Apache-2.0, BSD)
6. **Have reasonable bundle size impact**

### Version Pinning Strategy
- **Patch versions**: Allow automatic updates (`~1.2.3`)
- **Minor versions**: Allow with caution (`^1.2.0`)
- **Major versions**: Manual review required (`1.2.3`)

## 🔍 Automated Checks

### Pre-commit Hooks
- Security vulnerability scan
- Deprecated dependency check
- License compliance check
- Bundle size impact analysis

### CI/CD Pipeline
- Daily security scans
- Weekly dependency update checks
- Automated dependency review for PRs
- License compliance verification

### Tools Used
- `npm audit` - Security vulnerability scanning
- `better-npm-audit` - Enhanced security checking
- `depcheck` - Unused dependency detection
- `npm-check-updates` - Outdated dependency detection
- `audit-ci` - CI-friendly security auditing
- `license-checker` - License compliance checking

## 🚨 Security Thresholds

### Blocking Levels
- **Critical**: Immediate blocking, no exceptions
- **High**: Blocking, requires security team approval to override
- **Moderate**: Blocking in CI, can be temporarily overridden with justification
- **Low**: Warning only, should be addressed in next sprint

### Response Times
- **Critical vulnerabilities**: Fix within 24 hours
- **High vulnerabilities**: Fix within 1 week
- **Moderate vulnerabilities**: Fix within 1 month
- **Low vulnerabilities**: Fix within next major release

## 📦 Adding New Dependencies

### Process
1. **Evaluate necessity**: Can this be implemented without a new dependency?
2. **Research alternatives**: Compare at least 3 options
3. **Security review**: Check for known vulnerabilities
4. **License review**: Ensure license compatibility
5. **Bundle impact**: Analyze size and performance impact
6. **Team approval**: Get approval from tech lead
7. **Documentation**: Update this policy if needed

### Evaluation Criteria
- **Maintenance status**: Active development and regular releases
- **Community adoption**: Good GitHub stars, npm downloads
- **Documentation quality**: Comprehensive docs and examples
- **TypeScript support**: Native or high-quality type definitions
- **Bundle size**: Reasonable impact on application size
- **Dependencies**: Minimal transitive dependencies
- **License**: Compatible with our license policy

## 🔄 Dependency Updates

### Automated Updates
- **Patch updates**: Automatic via Dependabot
- **Minor updates**: Automatic with comprehensive testing
- **Major updates**: Manual review and testing required

### Update Schedule
- **Security patches**: Immediate
- **Patch versions**: Weekly
- **Minor versions**: Bi-weekly
- **Major versions**: Monthly review cycle

### Testing Requirements
- All automated tests must pass
- Manual testing for major updates
- Performance regression testing
- Security scan after updates

## 📊 Monitoring and Reporting

### Metrics Tracked
- Number of dependencies
- Average dependency age
- Security vulnerability count
- License compliance status
- Bundle size impact
- Update frequency

### Regular Reviews
- **Weekly**: Security vulnerability review
- **Monthly**: Dependency health check
- **Quarterly**: Full dependency audit
- **Annually**: Policy review and updates

## 🚫 Enforcement

### Automated Enforcement
- Pre-commit hooks block prohibited dependencies
- CI/CD pipeline fails on policy violations
- Dependabot configured with security thresholds
- Branch protection rules require passing checks

### Manual Review Process
- All dependency changes require code review
- Security team review for high-risk changes
- Architecture review for major dependency additions
- Documentation updates for policy changes

## 📞 Exceptions and Overrides

### Exception Process
1. **Document justification**: Clear business/technical need
2. **Risk assessment**: Detailed security and maintenance risks
3. **Mitigation plan**: How risks will be managed
4. **Approval chain**: Tech lead → Security team → CTO
5. **Time limit**: All exceptions have expiration dates
6. **Regular review**: Monthly exception review meetings

### Override Criteria
- Critical business functionality
- No viable alternatives available
- Temporary workaround with migration plan
- Legacy system integration requirements

## 📚 Resources

### Tools and Links
- [npm audit documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Snyk vulnerability database](https://snyk.io/vuln/)
- [Node Security Advisory](https://github.com/advisories)
- [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/)

### Internal Resources
- Security team contact: security@eve-cortex.com
- Dependency policy updates: tech-leads@eve-cortex.com
- Emergency security contact: security-emergency@eve-cortex.com

---

**Last Updated**: January 2025  
**Next Review**: April 2025  
**Policy Version**: 1.0