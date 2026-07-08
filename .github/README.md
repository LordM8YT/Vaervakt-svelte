# GitHub Actions for Værvakt

`sync-react-build.yml` keeps the two-repo setup tidy:

- `LordM8YT/Vaervakt-react` owns React source code and UI development.
- `LordM8YT/Vaervakt.no` owns production files, PHP/API/admin and Webhuset deploy.
- Only `Vaervakt.no` deploys to Webhuset.
- When React source changes on `main`, this workflow builds the app and pushes the finished build into `Vaervakt.no`.

Required secret in `Vaervakt-react`:

- `VAERVAKT_SYNC_TOKEN`: a GitHub token with write access to `LordM8YT/Vaervakt.no`.
