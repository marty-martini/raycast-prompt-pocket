# Branch Protection Rules Guide

This guide outlines the recommended branch protection rules for the Prompt Pocket repository to maintain code quality and security.

## Table of Contents

- [Overview](#overview)
- [Protected Branches](#protected-branches)
- [Recommended Rules](#recommended-rules)
- [Setup Instructions](#setup-instructions)
- [Workflow](#workflow)

## Overview

Branch protection rules help ensure that all changes to important branches go through proper review and testing processes. This prevents accidental pushes, enforces code review, and maintains the integrity of the codebase.

## Protected Branches

### `main` branch
- **Purpose**: Production-ready code
- **Protection Level**: Highest
- **Deployment**: Stable releases only
- **Merge Strategy**: All changes must come through Pull Requests from feature branches

## Recommended Rules

### For `main` branch:

#### Required Status Checks
- ✅ **Require status checks to pass before merging**
  - `lint` - Code linting must pass
  - `test` - All tests must pass
  - `validation` - Overall validation check
- ✅ **Require branches to be up to date before merging**

#### Pull Request Reviews
- ✅ **Require a pull request before merging**
- ✅ **Require approvals**: 1 (or more for larger teams)
- ✅ **Dismiss stale pull request approvals when new commits are pushed**
- ✅ **Require review from Code Owners** (if team grows)

#### Additional Protections
- ✅ **Require conversation resolution before merging**
- ✅ **Require signed commits** (recommended for security)
- ✅ **Require linear history** (optional, keeps history clean)
- ✅ **Do not allow bypassing the above settings**
- ❌ **Allow force pushes**: Disabled
- ❌ **Allow deletions**: Disabled

#### Restrictions
- 🔒 **Restrict who can push to matching branches**
  - Only maintainers and repository administrators

## Setup Instructions

### Step 1: Navigate to Branch Protection Settings

1. Go to your repository on GitHub
2. Click on **Settings** (top right)
3. In the left sidebar, click **Branches**
4. Under "Branch protection rules", click **Add rule**

### Step 2: Configure `main` Branch Protection

1. **Branch name pattern**: `main`

2. **Protect matching branches** - Enable the following:

   ```
   ☑️ Require a pull request before merging
      ☑️ Require approvals (1)
      ☑️ Dismiss stale pull request approvals when new commits are pushed
      ☑️ Require review from Code Owners
      ☑️ Require approval of the most recent reviewable push
   
   ☑️ Require status checks to pass before merging
      ☑️ Require branches to be up to date before merging
      Status checks that are required:
        - lint
        - test
        - validation
   
   ☑️ Require conversation resolution before merging
   
   ☑️ Require signed commits (recommended)
   
   ☑️ Require linear history (optional)
   
   ☑️ Require deployments to succeed before merging (if applicable)
   
   ☐ Lock branch (only if you want to make it read-only)
   
   ☐ Do not allow bypassing the above settings
   
   ☐ Restrict who can push to matching branches
      - Add: marty-martini
   
   ☐ Allow force pushes (KEEP DISABLED)
   
   ☐ Allow deletions (KEEP DISABLED)
   ```

3. Click **Create** or **Save changes**

### Step 3: Verify Protection Rules

1. Go to **Settings** → **Branches**
2. You should see your protection rules listed
3. Test by trying to push directly to `main` (should be blocked)

## Workflow

### Standard Development Workflow with Protection Rules

```
┌─────────────────┐
│  feature/xyz    │  ← Developer creates feature branch from main
└────────┬────────┘
         │ Develop & commit changes
         ↓
┌─────────────────┐
│  Push to remote │  ← Push feature branch
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Create PR      │  ← Open PR to main
└────────┬────────┘
         │
         ├─→ ✓ CI/CD runs (lint, test)
         ├─→ ✓ Code review required
         ├─→ ✓ Conversations resolved
         ├─→ ✓ Branch up to date
         │
         ↓
┌─────────────────┐
│  Merge          │  ← All checks pass → Merge allowed
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│      main       │  ← Updated with new changes
└─────────────────┘
```

### When CI Checks Fail

1. Review the failed check in the PR
2. Make necessary fixes in your feature branch
3. Push the fixes
4. CI will automatically re-run
5. Once all checks pass, request review again

### Emergency Hotfixes

For critical production issues:

1. Create hotfix branch from `main`
2. Make minimal necessary changes
3. Create PR with `[HOTFIX]` prefix
4. Get expedited review
5. All checks still required (no bypassing)
6. Merge to `main`

## Additional Security Measures

### 1. Enable Required Reviews from Code Owners

- Ensure CODEOWNERS file is properly configured
- Code owners are automatically requested for review

### 2. Enable Signed Commits

```bash
# Configure GPG signing
git config --global commit.gpgsign true
git config --global user.signingkey YOUR_GPG_KEY_ID
```

### 3. Set Up Branch Naming Conventions

Use consistent branch naming for feature branches:
- `feature/*` - New features
- `feature/bugfix-*` - Bug fixes
- `feature/hotfix-*` - Emergency fixes
- `feature/refactor-*` - Code refactoring
- `feature/docs-*` - Documentation updates
- `feature/test-*` - Test additions/updates

### 4. Regular Security Audits

- Review access permissions quarterly
- Update protection rules as team grows
- Monitor Dependabot alerts
- Review and merge security updates promptly

## Troubleshooting

### "Required status check is missing"

**Problem**: PR cannot be merged because status check isn't found

**Solution**: 
1. Ensure CI workflow has run at least once on the branch
2. Check that job names in `.github/workflows/ci.yml` match the required checks
3. May need to remove and re-add the status check requirement

### "Branch is not up to date"

**Problem**: Cannot merge because base branch has new commits

**Solution**:
```bash
# Update your branch
git checkout your-feature-branch
git fetch origin
git rebase origin/main
git push --force-with-lease
```

### "Review required but no reviewers available"

**Problem**: No one can approve your PR

**Solution**:
1. Ensure at least one other team member has write access
2. Temporarily adjust approval requirements for solo projects
3. Consider using PR auto-merge once checks pass (after careful testing)

## Maintenance

### Regular Reviews

- **Monthly**: Review and update required status checks
- **Quarterly**: Audit access permissions and protection rules
- **After major changes**: Update this guide and protection rules

### Documentation Updates

Keep this guide synchronized with:
- CI/CD workflow changes
- Team structure changes
- Repository permission changes

## References

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Required Status Checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)
- [GitHub Code Owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)

---

**Last Updated**: 2025-11-29  
**Maintained by**: @marty-martini

