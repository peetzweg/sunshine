# Changesets

This directory is managed by [@changesets/cli](https://github.com/changesets/changesets). It drives automated GitHub releases — see `.github/workflows/release.yml`.

## Adding a changeset

When you make a user-visible change, record it:

```sh
pnpm changeset
```

You will be prompted to:

1. Choose the bump type — **patch** (bug fix), **minor** (new feature), or **major** (breaking change).
2. Write a short summary. One sentence, written for end-users, is ideal — this becomes the GitHub Release body.

Commit the generated `.changeset/<name>.md` file alongside your code changes.

## Releasing

Releases run automatically. On every push to `main`, the Release workflow:

1. Opens (or updates) a "chore: version packages" PR that bumps `package.json` and rewrites `CHANGELOG.md` from pending changesets.
2. When that PR is merged, tags the commit, creates a GitHub Release with the changelog entry as the body, and uploads the Chrome, Firefox, and sources zips as release assets.

For a release without a user-visible code change, run `pnpm changeset --empty`.
