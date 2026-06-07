# Environment and CI/CD Setup Guide

This guide explains how to configure a multi-environment pipeline (Dev, Stage, Prod) using GitHub, Vercel, and GitHub Actions, while keeping the existing Docker infrastructure intact for other applications.

## 1. Branching Strategy

We use three primary protected branches that map to our three environments:

*   **`dev`**: This is the main integration branch. All feature branches merge into here. It maps to the **Development Environment**.
*   **`stage`**: This branch contains code that has been tested in `dev` and is ready for final QA and UAT (User Acceptance Testing). It maps to the **Staging Environment**.
*   **`prod`**: This branch contains the code currently live for users. It maps to the **Production Environment**.

**Typical Workflow:**
1. Developer creates a feature branch (e.g., `feature/new-button`) from `dev`.
2. Developer opens a Pull Request (PR) from `feature/new-button` to `dev`.
3. Once approved and merged into `dev`, Vercel deploys to the Dev environment.
4. When Dev is stable, a PR is opened from `dev` to `stage`.
5. Once merged, Vercel deploys to Staging.
6. When Staging is approved, a PR is opened from `stage` to `prod`.
7. Once merged, Vercel deploys to Production.

## 2. GitHub Configuration (Branch Protection)

To enforce this workflow, you need to set up Branch Protection rules in GitHub.

1. Go to your GitHub repository -> **Settings** -> **Branches**.
2. Click **Add branch protection rule**.
3. **Rule for `dev`, `stage`, and `prod`:**
    *   **Branch name pattern**: Enter `dev` (and repeat for `stage` and `prod`).
    *   Check **Require a pull request before merging**.
    *   Check **Require approvals** (usually 1 or more).
    *   Check **Require status checks to pass before merging**.
        *   This is crucial! You will select the GitHub Actions tests (which we will create next) and the Vercel build checks here once they are running. This ensures no broken code can be merged.
    *   Check **Do not allow bypassing the above settings**.

## 3. Vercel Configuration

Vercel will handle the deployment automatically based on the branches.

1. Go to Vercel and import your GitHub repository.
2. The initial import will likely set `main` or `master` as your production branch.
3. **Configure the Production Branch:**
    *   Go to your Project in Vercel -> **Settings** -> **Git**.
    *   Under **Production Branch**, type `prod` and save. Now, any commits to `prod` will trigger a production deployment.
4. **Configure Staging and Dev Branches:**
    *   By default, Vercel deploys all other branches as "Preview" environments. This means `dev` and `stage` will get temporary URLs on every push.
    *   To give them static, predictable URLs (e.g., `stage.yourdomain.com` and `dev.yourdomain.com`), go to **Settings** -> **Domains**.
    *   Add your domain.
    *   Add subdomains like `stage.yourdomain.com` and assign the Git Branch to `stage`.
    *   Add subdomains like `dev.yourdomain.com` and assign the Git Branch to `dev`.
5. **Environment Variables:**
    *   Go to **Settings** -> **Environment Variables**.
    *   When adding an environment variable (like a database URL), Vercel lets you select the target environments: Production, Preview, and Development.
    *   For specific branch overrides, you can select the "Preview" environment, and then specify the exact branch (e.g., `stage` or `dev`) so they get the correct API keys or DB connections.

## 4. Docker Coexistence

Your existing `Dockerfile` and `docker-compose.yml` (if applicable) will remain exactly where they are.
*   **Other Apps:** If you have other services relying on the Docker setup, they will continue to deploy as usual.
*   **Vercel:** Vercel automatically detects your React framework (via `package.json` and Vite config) and builds the site using standard Node.js/Bun commands. It completely ignores the `Dockerfile`, meaning both workflows can live happily side-by-side in the same repository.

## 5. GitHub Actions (Continuous Integration)

While Vercel handles the deployment, it's best practice to use GitHub Actions to run your automated tests and linting as soon as a PR is opened. This prevents you from merging bad code into your protected branches.

We will set up a `.github/workflows/ci.yml` that will:
1. Run on Pull Requests targeting `dev`, `stage`, and `prod`.
2. Check out the code.
3. Install dependencies using Bun.
4. Run `bun run lint` to check code style.
5. Run `bun run test` to execute tests.
6. Run `bun run build` to ensure the project compiles successfully.

If this pipeline fails, GitHub Branch Protection will prevent the PR from being merged.
