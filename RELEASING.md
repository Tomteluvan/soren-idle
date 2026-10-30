# Releasing

Soren Idle ships through the Raycast Store. The store has no version field of its own: what players
see is the changelog, and each release is a pull request to
[raycast/extensions](https://github.com/raycast/extensions). We still keep a semver in
`package.json` and a git tag per release so history stays readable.

## Choosing the bump

- **patch** (0.1.0 → 0.1.1): bug fixes and small balance tweaks.
- **minor** (0.1.0 → 0.2.0): new content or features: skills, areas, screens, items.
- **major** (0.1.0 → 1.0.0): a save-breaking change or a large rework.

## Steps

1. Make sure `main` is clean and green: `npm test`, `npm run lint`, `npm run build`.
2. In `CHANGELOG.md`, add a section at the top: `## [<title>] - {PR_MERGE_DATE}`, with a short,
   player-facing list of what changed. Keep the `{PR_MERGE_DATE}` placeholder literally: Raycast fills
   in the date when the PR merges.
3. Bump the version: `npm version <patch|minor|major> --no-git-tag-version`.
4. Commit the changelog, `package.json` and `package-lock.json`: `Release vX.Y.Z`.
5. Tag and push: `git tag vX.Y.Z && git push && git push --tags`.
6. Publish: `npm run publish`. It forks `raycast/extensions`, copies the extension in and opens a
   pull request. The first run asks you to sign in to GitHub.
7. Wait for review. Raycast's team may ask for changes. Fix them on the PR branch it created, then
   run `npm run publish` again to update the PR.

Before the **first** release, `metadata/` needs 3 to 6 screenshots (PNG, 2000×1250), taken with
Raycast's Window Capture.

Because progress lives in LocalStorage, a release that changes the save format must migrate old saves.
