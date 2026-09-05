<!-- managed:start -->

## Workspace Tools

- **Package Manager:** pnpm
- **Linter:** oxlint
- **Formatter:** prettier

### After Editing

✅ After editing files, check the types for errors and then format and lint only the files changed for the current task.

```sh
# Example
pnpm typecheck
# Run format and lint for only files modified
pnpm exec prettier --config .config/prettier.json --ignore-path .config/prettierignore --write src/App.tsx src/core/systems/move-entity.ts
pnpm lint -- src/App.tsx src/core/systems/move-entity.ts
```

❌ Avoid unless explicitly approved:

```sh
pnpm format
pnpm lint
```

<!-- managed:end -->

## Architecture

This project uses data-oriented design with Koota as the core engine. React is a view domain that projects from the core data domain. The entire game should be able to be simulated headless. It is important to stick to strict domain boundaries. Read the Koota source for example.

## Testing Principles

Tests are documentation. You can create tests for iteration but they should always be removed when you are done and replaced by minimal tests that document the feature.

- Cover the common paths that represent the 80% of real usage. Add edge-case tests only when the edge case is important or guards against a meaningful regression.
- Test observable features and user stories, not implementation details. Test internals only when an exceptionally difficult case cannot be covered reliably through public behavior.

## Comments

Comments are documentation. Keep them concise and explain the algorithm or feature, not the change or its history. Use simple punctuation with no semicolons or em dashes.

# Const Policy

We want reduce top level const and inline anything that is an explicit hook we need tweak often. Always ask yourself if a const needs to exist before making it. Prefer to inline.
