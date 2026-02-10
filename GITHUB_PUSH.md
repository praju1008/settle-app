# GitHub Setup & Push Guide

## Step 1: Create Repository on GitHub

1. Go to https://github.com/new
2. Fill in the details:
   - **Repository name**: `settle-app` (or your preferred name)
   - **Description**: "Full-stack bill splitting and expense management application"
   - **Visibility**: Choose Public or Private
   - **Initialize**: Do NOT check any boxes (repo is ready to push)
3. Click **Create repository**

You'll see instructions like:
```
https://github.com/YOUR_USERNAME/settle-app.git
```

## Step 2: Add Remote and Push Code

### Option A: Using GitHub CLI (Easiest)

```powershell
# Install GitHub CLI if you don't have it
winget install GitHub.cli

# Authenticate with GitHub
gh auth login

# Navigate to project
cd "D:\PJ Projects\Python\Settle App"

# Create repository on GitHub and push
gh repo create settle-app --source=. --remote=origin --push
```

### Option B: Using Git Commands

Replace `YOUR_USERNAME` with your actual GitHub username:

```powershell
cd "D:\PJ Projects\Python\Settle App"

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/settle-app.git

# Rename branch to main (optional but recommended)
git branch -M main

# Push code to GitHub
git push -u origin main
```

### Option C: Using SSH (For registered SSH keys)

```powershell
cd "D:\PJ Projects\Python\Settle App"

# Add remote using SSH
git remote add origin git@github.com:YOUR_USERNAME/settle-app.git

# Push to GitHub
git push -u origin main
```

## Step 3: Verify Push

Once pushed, verify your repository:

1. Go to https://github.com/YOUR_USERNAME/settle-app
2. Check that all files are there
3. Check that the README.md is displayed

## Subsequent Commits

After making changes:

```powershell
# Navigate to project
cd "D:\PJ Projects\Python\Settle App"

# Stage changes
git add .

# Commit changes
git commit -m "Description of changes"

# Push to GitHub
git push origin main
```

## Useful Git Commands

```powershell
# Check commit history
git log --oneline

# View changes
git diff

# Check status
git status

# Create a new branch for features
git checkout -b feature/your-feature-name

# Push branch to GitHub
git push -u origin feature/your-feature-name

# View all branches
git branch -a

# Delete local branch
git branch -d branch-name

# Delete remote branch
git push origin --delete branch-name
```

## Adding Collaborators

1. Go to your repository on GitHub
2. Click **Settings** → **Collaborators**
3. Click **Add people**
4. Enter GitHub username and select permission level

## Protecting Main Branch

1. Go to **Settings** → **Branches**
2. Click **Add rule**
3. Branch name pattern: `main`
4. Enable:
   - ✓ Require pull requests
   - ✓ Require status checks to pass
   - ✓ Require reviews

## Generating Token (If Needed)

If prompted for authentication:

1. Go to https://github.com/settings/tokens
2. Click **Generate new token** (Classic)
3. Select scopes: `repo`, `admin:repo_hook`
4. Click **Generate token**
5. Copy and use as password when pushing

## Troubleshooting

### Authentication Failed
```powershell
# Clear cached credentials
git credential reject

# Try again (will prompt for credentials)
git push
```

### Remote Rejected Push
```powershell
# Fetch latest changes
git fetch origin

# Rebase local changes
git rebase origin/main

# Push again
git push origin main
```

### Large Files / Timeout
```powershell
# Try with different timeout
git config http.postBuffer 524288000

# Push again
git push origin main
```

## GitHub Pages (Optional)

To share a live demo of the frontend:

1. Push code to GitHub
2. Go to **Settings** → **Pages**
3. Select **main** branch and **/root** folder
4. Click **Save**
5. Site will be available at: `https://YOUR_USERNAME.github.io/settle-app`

## CI/CD with GitHub Actions (Optional)

Create `.github/workflows/tests.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          pip install -r backend/requirements.txt
      - name: Run tests
        run: |
          cd backend
          python manage.py test
```

Then push:
```powershell
git add .github/
git commit -m "Add GitHub Actions CI/CD"
git push origin main
```

---

**Your repository is now ready for GitHub!** 🚀

For more info: https://docs.github.com/en/get-started/using-git
