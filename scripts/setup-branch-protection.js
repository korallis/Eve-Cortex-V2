#!/usr/bin/env node

/**
 * Script to configure GitHub branch protection rules for the main branch
 * This ensures all PRs go through proper quality gates before merging
 */

const { execSync } = require('child_process')

const BRANCH_PROTECTION_CONFIG = {
  required_status_checks: {
    strict: true,
    contexts: [
      'Security & Dependency Audit',
      'Code Quality',
      'Tests',
      'Build Test',
      'License Compliance',
    ],
  },
  enforce_admins: false, // Allow admins to bypass for emergency fixes
  required_pull_request_reviews: {
    required_approving_review_count: 1,
    dismiss_stale_reviews: true,
    require_code_owner_reviews: false,
    require_last_push_approval: true,
  },
  restrictions: null, // No push restrictions
  allow_force_pushes: false,
  allow_deletions: false,
  block_creations: false,
  required_conversation_resolution: true,
  lock_branch: false,
  allow_fork_syncing: true,
}

async function setupBranchProtection() {
  try {
    console.log('🔒 Setting up branch protection rules for main branch...')

    // Check if we have the GitHub CLI
    try {
      execSync('gh --version', { stdio: 'pipe' })
    } catch (error) {
      console.error('❌ GitHub CLI (gh) is not installed or not authenticated')
      console.error('Please install GitHub CLI and authenticate with: gh auth login')
      process.exit(1)
    }

    // Get repository information
    const repoInfo = execSync('gh repo view --json owner,name', { encoding: 'utf8' })
    const { owner, name } = JSON.parse(repoInfo)

    console.log(`📋 Repository: ${owner.login}/${name}`)

    // Configure branch protection using GitHub API
    console.log('⚙️ Applying branch protection rules...')

    const protectionData = {
      required_status_checks: {
        strict: true,
        contexts: [
          'Security & Dependency Audit',
          'Code Quality',
          'Tests',
          'Build Test',
          'License Compliance',
        ],
      },
      enforce_admins: false,
      required_pull_request_reviews: {
        required_approving_review_count: 1,
        dismiss_stale_reviews: true,
        require_code_owner_reviews: false,
        require_last_push_approval: true,
      },
      restrictions: null,
      allow_force_pushes: false,
      allow_deletions: false,
      block_creations: false,
      required_conversation_resolution: true,
      lock_branch: false,
      allow_fork_syncing: true,
    }

    // Write protection data to temp file
    const fs = require('fs')
    const tempFile = '/tmp/branch-protection.json'
    fs.writeFileSync(tempFile, JSON.stringify(protectionData, null, 2))

    const protectionCommand = `gh api repos/${owner.login}/${name}/branches/main/protection --method PUT --input ${tempFile}`
    execSync(protectionCommand, { stdio: 'inherit' })

    console.log('✅ Branch protection rules configured successfully!')
    console.log('')
    console.log('📋 Protection rules applied:')
    console.log('  • Required status checks: All CI jobs must pass')
    console.log('  • Required PR reviews: At least 1 approving review')
    console.log('  • Dismiss stale reviews: Yes')
    console.log('  • Require conversation resolution: Yes')
    console.log('  • Allow force pushes: No')
    console.log('  • Allow deletions: No')
    console.log('')
    console.log('🎯 Quality gates enforced:')
    BRANCH_PROTECTION_CONFIG.required_status_checks.contexts.forEach(check => {
      console.log(`  • ${check}`)
    })
  } catch (error) {
    console.error('❌ Failed to setup branch protection:', error.message)

    if (error.message.includes('404')) {
      console.error('')
      console.error('💡 Possible solutions:')
      console.error('  • Make sure you have admin access to the repository')
      console.error('  • Ensure the main branch exists')
      console.error('  • Check that GitHub CLI is authenticated with proper permissions')
    }

    process.exit(1)
  }
}

// Show current branch protection status
async function showBranchProtectionStatus() {
  try {
    console.log('📊 Current branch protection status:')
    const repoInfo = execSync('gh repo view --json owner,name', { encoding: 'utf8' })
    const { owner, name } = JSON.parse(repoInfo)

    const protection = execSync(`gh api repos/${owner.login}/${name}/branches/main/protection`, {
      encoding: 'utf8',
    })
    const protectionData = JSON.parse(protection)

    console.log('✅ Branch protection is enabled')
    console.log(
      `  • Required status checks: ${protectionData.required_status_checks?.contexts?.length || 0} checks`
    )
    console.log(
      `  • Required reviews: ${protectionData.required_pull_request_reviews?.required_approving_review_count || 0}`
    )
    console.log(`  • Enforce admins: ${protectionData.enforce_admins?.enabled ? 'Yes' : 'No'}`)
    console.log(
      `  • Allow force pushes: ${protectionData.allow_force_pushes?.enabled ? 'Yes' : 'No'}`
    )
  } catch (error) {
    if (error.message.includes('404')) {
      console.log('❌ No branch protection rules configured')
    } else {
      console.error('❌ Error checking branch protection:', error.message)
    }
  }
}

// Main execution
async function main() {
  const command = process.argv[2]

  switch (command) {
    case 'setup':
      await setupBranchProtection()
      break
    case 'status':
      await showBranchProtectionStatus()
      break
    default:
      console.log('🔒 GitHub Branch Protection Setup')
      console.log('')
      console.log('Usage:')
      console.log('  node scripts/setup-branch-protection.js setup   - Configure branch protection')
      console.log(
        '  node scripts/setup-branch-protection.js status  - Show current protection status'
      )
      console.log('')
      console.log('Prerequisites:')
      console.log('  • GitHub CLI installed and authenticated')
      console.log('  • Admin access to the repository')
      console.log('  • Main branch exists')
      break
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { setupBranchProtection, showBranchProtectionStatus }
