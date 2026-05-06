# Issue Tracker: GitHub

Issues live in this repo's GitHub Issues. Skills use the `gh` CLI to create, read, update, and label issues.

## Commands

| Action | Command |
|---|---|
| Create | `gh issue create --title "..." --body "..." --label "..."` |
| List | `gh issue list --label "..." --state open` |
| Read | `gh issue view <number>` |
| Add label | `gh issue edit <number> --add-label "<label>"` |
| Remove label | `gh issue edit <number> --remove-label "<label>"` |
| Close | `gh issue close <number>` |

## Notes

- Check `gh issue list` before creating to avoid duplicates.
- The repo's GitHub URL is inferred from `git remote get-url origin`.
