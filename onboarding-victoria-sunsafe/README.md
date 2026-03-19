# onboarding-victoria-sunsafe

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

---

## Git Setup & Workflow

### 1. Initial Git Configuration (Terminal)

Set your identity before making any commits:

```sh
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

Verify:

```sh
git config --list
```

---

### 2. Clone the Repository

**Terminal:**

```sh
git clone https://github.com/slee0282-lab/fit5120-2026s1-ta24-onboarding.git
cd fit5120-2026s1-ta24-onboarding/onboarding-victoria-sunsafe
npm install
```

**GitHub Web:**

1. Go to [https://github.com/slee0282-lab/fit5120-2026s1-ta24-onboarding](https://github.com/slee0282-lab/fit5120-2026s1-ta24-onboarding)
2. Click the green **`<> Code`** button
3. Copy the HTTPS URL
4. Use it with `git clone` in terminal, or open with GitHub Desktop

---

### 3. Connect an Existing Local Folder to the Remote

If you already have the project locally and need to link it to the remote:

```sh
git init
git remote add origin https://github.com/slee0282-lab/fit5120-2026s1-ta24-onboarding.git
git remote -v          # verify the remote was added
git fetch origin
git branch --set-upstream-to=origin/main main
```

---

### 4. Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code. Direct pushes are discouraged. |
| `feature/<short-description>` | New feature development (e.g., `feature/uv-chart`) |
| `fix/<short-description>` | Bug fixes (e.g., `fix/location-error`) |

**Create and switch to a new feature branch (Terminal):**

```sh
git checkout -b feature/your-feature-name
# or (Git 2.23+)
git switch -c feature/your-feature-name
```

**Create a branch on GitHub Web:**

1. Go to the repository page
2. Click the branch dropdown (shows `main`)
3. Type the new branch name and click **Create branch**

**Push a new local branch to remote:**

```sh
git push -u origin feature/your-feature-name
```

---

### 5. Commit Strategy

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>: <short summary>
```

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Maintenance, dependency updates |
| `refactor` | Code change without new feature or fix |
| `docs` | Documentation only |
| `style` | Formatting, missing semicolons, etc. |
| `test` | Adding or fixing tests |

**Examples:**

```sh
git commit -m "feat: add UV index forecast component"
git commit -m "fix: resolve location permission error on mobile"
git commit -m "chore: update dependencies"
```

**Stage and commit (Terminal):**

```sh
git add <file>          # stage specific file
git add .               # stage all changes
git commit -m "feat: your message here"
git push
```

**Commit via GitHub Web (for quick edits):**

1. Navigate to the file on GitHub
2. Click the **pencil (edit) icon**
3. Make your change
4. Scroll down to **Commit changes**, write a message, and click **Commit changes**

---

### 6. Pull Request (PR) Workflow

**Terminal → GitHub Web:**

1. Push your feature branch: `git push -u origin feature/your-feature-name`
2. Go to the repository on GitHub
3. Click **Compare & pull request** (appears automatically after a push)
4. Set base branch to `main`, add a title and description
5. Request a reviewer, then click **Create pull request**
6. After approval, click **Merge pull request**

**After merging, clean up locally:**

```sh
git checkout main
git pull origin main
git branch -d feature/your-feature-name
```

---

### 7. Keeping Your Branch Up to Date

Before starting work, always sync with `main`:

```sh
git checkout main
git pull origin main
git checkout feature/your-feature-name
git merge main
# or rebase:
git rebase main
```
