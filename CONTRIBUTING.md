# Contributing to Opti Advisr

Thanks for contributing! This guide helps the team work together smoothly.

---

## Branch Workflow

We use a **feature-branch** workflow:

```
main  ← always deployable
  └─ feature/<name>     ← your work
  └─ fix/<name>         ← bug fixes
  └─ infra/<name>       ← Terraform / deployment changes
```

### Steps

1. **Create a branch** from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and commit often:
   ```bash
   git add .
   git commit -m "feat: add cost breakdown chart"
   ```

3. **Push and open a Pull Request**:
   ```bash
   git push origin feature/your-feature-name
   ```
   Then open a PR on GitHub targeting `main`.

4. **Get a review** — at least one team member should approve.

5. **Merge** — use "Squash and merge" for clean history.

---

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Use for |
|--------|---------|
| `feat:` | New features |
| `fix:` | Bug fixes |
| `docs:` | Documentation only |
| `style:` | Formatting, no logic change |
| `refactor:` | Code restructure, no feature change |
| `infra:` | Terraform / deployment changes |
| `chore:` | Dependencies, tooling, CI |

Examples:
```
feat: add cost breakdown by service chart
fix: handle empty cost explorer response
infra: add CORS OPTIONS to API Gateway
docs: update README setup instructions
```

---

## Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev          # Starts Vite dev server on :5173
```

### Backend (Lambdas)

Lambda handlers are plain Python files in `backend/lambdas/<name>/handler.py`. Test locally:

```bash
cd backend/lambdas/cost_retriever
python -c "from handler import lambda_handler; print(lambda_handler({}, None))"
```

### Infrastructure

```bash
cd infra
terraform init
terraform plan       # Preview changes
terraform apply      # Deploy (requires AWS credentials)
```

---

## Environment Setup

1. Copy `.env.example` to `.env.local` in the `frontend/` directory
2. Fill in your API Gateway URL and API key
3. **Never commit** `.env.local` or `.env.production` (they're in `.gitignore`)

---

## What NOT to Commit

These are excluded via `.gitignore`:

- `.env.local`, `.env.production` (secrets)
- `*.tfvars` (Terraform variables with secrets)
- `terraform.tfstate*` (state files)
- `*.zip` (Lambda packages — rebuild from source)
- `node_modules/`, `dist/` (build artifacts)
- `.terraform/` (provider cache)

---

## Deploying

### Backend
```bash
# Re-zip lambdas after changes
cd backend/lambdas
zip cost_retriever.zip -j cost_retriever/handler.py
zip resource_manager.zip -j resource_manager/handler.py
zip ai_agent.zip -j ai_agent/handler.py

# Apply Terraform
cd ../../infra
terraform apply
```

### Frontend
```bash
cd frontend
npm run build
npx wrangler pages deploy dist --project-name=opti-advisr
```

---

## Questions?

Open an issue or reach out to the team lead.
