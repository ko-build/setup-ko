# GitHub Action to install and setup [`ko`](https://github.com/google/ko)

[![Build](https://github.com/imjasonh/setup-ko/actions/workflows/use-action.yaml/badge.svg)](https://github.com/imjasonh/setup-ko/actions/workflows/use-action.yaml)

## Example usage

```yaml
name: Publish

on:
  push:
    branches: ['main']

jobs:
  publish:
    name: Publish
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-go@v2
        with:
          go-version: 1.15
      - uses: actions/checkout@v2

      - uses: imjasonh/setup-ko@main
      - run: ko publish ./
```

_That's it!_ This workflow will build and publish your code to [GitHub Container Regsitry](https://ghcr.io).

By default, the action sets `KO_DOCKER_REPO=ghcr.io/[owner]/[repo]`.
See [documentation for `ko`](https://github.com/google/ko#configuration) to learn more about configuring `ko`.

### Select `ko` version to install

By default, `imjasonh/setup-ko` installs the latest released version of `ko`.

You can select a version with the `version` parameter:

```yaml
- uses: imjasonh/setup-ko@main
  with:
    version: v0.8.0
```

To build and install `ko` from source using `go get`, specify `version: tip`.

### Pushing to other registries

By default, `imjasonh/setup-ko` configures `ko` to push images to [GitHub Container Registry](https://ghcr.io), but you can configure it to push to other registries.

To do this, you need to provide credentials to authorize the push.
You can use [encrypted secrets](https://docs.github.com/en/actions/reference/encrypted-secrets) to store the authorization token, and pass it to `ko login` before pushing:

```
- uses: imjasonh/setup-ko@main
- env:
    auth_token: ${{ secrets.auth_token }}
  run: |
    echo "${auth_token}" | ko login https://my.registry --username my-username --password-stdin
    export KO_DOCKER_REPO=my.registry/my-repo
    ko publish ./
```

### A note on versioning

In general it's probably a bad idea to reference the version of the action definition from `main`.
Doing so means I can push changes to the action that will immediately start running as part of your CI workflows. 😱

To guard against this, you can reference a specific version of the action definition, for example:

```
- uses: imjasonh/setup-ko@v0.1
```

Regardless what version of the action you reference, it will _still install the latest version of `ko`_ unless you specify `version:`.

