# Desktop release notes

Add a Changeset for every user-visible Desktop change with `pnpm changeset`. Use
`@lapismd/lapis-desktop` as the package. Changesets aggregates notes into a
reviewable version PR. During preview, all changes advance the existing CalVer
release-candidate number; a major/minor/patch intent does not approve a stable
cutover. Merging that PR starts full exact-source CI, candidate qualification,
publication and the verified Homebrew update automatically.

Desktop stays private; no npm package is published. Release tooling uses its own
pinned public dependency graph, independently of private application exports.
