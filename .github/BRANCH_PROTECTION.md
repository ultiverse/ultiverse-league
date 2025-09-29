# Branch Protection Configuration

To ensure CI failures are properly shown in PRs and prevent merging of failing code, configure the following branch protection rules in GitHub:

## Main Branch Protection

Go to **Settings > Branches** in your GitHub repository and add a branch protection rule for `main` with these settings:

### Required Status Checks
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- **Required status checks:**
  - `CI` (this is the ci-success job from ci.yml workflow)

### Additional Protections (Recommended)
- ✅ Require pull request reviews before merging
  - Required number of reviewers: 1
  - ✅ Dismiss stale reviews when new commits are pushed
- ✅ Require conversation resolution before merging
- ✅ Restrict pushes that create files that do not have a path prefix (optional)

### Admin Settings
- ✅ Include administrators (recommended for consistency)

## How It Works

1. When a PR is created, the CI workflow runs all checks (build, lint, test, e2e)
2. The `CI` job aggregates all results and provides a single status check
3. If any individual check fails, the `CI` status check fails
4. GitHub will show the failure status on the PR and prevent merging
5. PR authors can see which specific checks failed in the workflow logs

## Status Check Names

The CI workflow creates these individual jobs:
- **Build Check** - Builds both API and web applications
- **Lint Check** - Runs ESLint on both applications
- **Test Suite** - Runs unit tests with coverage
- **E2E Tests** - Runs end-to-end tests (depends on build)
- **CI** - Summary status check (this is what branch protection should use)

Only require the `CI` status check in branch protection, as it aggregates all others.