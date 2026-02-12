# Security Railcard System

This repository implements a multi-layer defense against API key exposure in automated workflows and commits.

## Components

### 1. Pre-commit Hook
- Scans staged files for patterns matching real secrets
- Blocks commit if any secrets detected
- Allows placeholders (`your_`, `example`, `test_`, etc.)
- Located at: `.git/hooks/pre-commit` → `tools/security-check.js`

### 2. Pre-push Hook (Optional)
- Full repository scan before push
- Prevents accidental secret leakage in any pushed files
- Located at: `.git/hooks/pre-push` → `tools/pre-push-security`
- To enable: `chmod +x tools/pre-push-security` (already set) and symlink exists

### 3. Runtime Scan
- Scripts like `update_colosseum.js` call security scan before deployment
- Integrated into CI/CD pipelines to catch issues early

### 4. Configuration Discipline
- All secrets live in `.env` (gitignored)
- Code uses `process.env.VAR_NAME` (never hardcoded)
- `.env.example` contains only placeholders
- `.gitignore` covers sensitive files

## Patterns Detected

- OpenRouter keys (`sk-or-v1-...`)
- GitHub tokens (`ghp_`, `gho_`, `ghu_`, `ghs_`, `ghr_`)
- Generic API keys/tokens
- Private keys (hex format)
- Bearer tokens
- Basic auth credentials
- JWT-like strings
- Moltbook keys
- Privy app secrets

## Exclusions

Scans exclude:
- `node_modules/`
- `.git/`
- `dist/`, `build/`, `coverage/`
- `.env.example` (only placeholders)
- Documentation files (README, CHANGELOG, SECURITY_RAILCARD.md, docs/, examples/)
- Image files (`.png`, `.jpg`, etc.)

## Usage

### Manual Scan
```bash
# Scan entire workspace
node tools/security_railcard.js .

# Scan specific files
node tools/security_railcard.js file1.js file2.json
```

### Pre-commit (Automatic)
Automatically runs on `git commit`. If secrets are detected, commit is blocked.

### Pre-push (Optional)
Automatically runs on `git push`. To enable/disable:
```bash
# Enable
ln -sf tools/pre-push-security .git/hooks/pre-push

# Disable
rm .git/hooks/pre-push
```

## If Blocked

1. Identify the file and line number from the error message
2. Replace any hardcoded secret with an environment variable reference
3. Ensure the secret is stored only in `.env` (gitignored)
4. Re-stage and try again

## Emergency Override

In rare cases where a false positive occurs, you can:
- Use `git commit --no-verify` to bypass pre-commit (use with extreme caution)
- Update the exclusion patterns in `tools/security_railcard.js` if the pattern is too broad

## Maintenance

- Review and update `SECRET_PATTERNS` regularly as new credential formats emerge
- Add project-specific exclusions to `EXCLUDED_PATHS` as needed
- Keep `dotenv` dependency updated: `npm update dotenv`

## Incident Response

If a secret is accidentally committed:
1. **Rotate the compromised credential immediately**
2. Purge it from git history with `git filter-branch` or BFG
3. Document the incident in `MEMORY.md`
4. Review and improve security railcard patterns if needed

## References

- [GitHub Secret Scanning](https://docs.github.com/code-security/secret-scanning)
- [OpenRouter API Security](https://openrouter.ai/docs/security)
- [OWASP Credential Management](https://cheatsheetseries.owasp.org/cheatsheets/Credentials_Storage_Cheat_Sheet.html)