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

      - uses: imjasonh/setup-ko@v0.3
      - run: ko publish ./
```

_That's it!_ This workflow will build and publish your code to [GitHub Container Regsitry](https://ghcr.io).

By default, the action sets `KO_DOCKER_REPO=ghcr.io/[owner]/[repo]`.
See [documentation for `ko`](https://github.com/google/ko#configuration) to learn more about configuring `ko`.

:warning: **Note:** The action _sets_ `KO_DOCKER_REPO` for all subsequent steps.
If you define `KO_DOCKER_REPO` as a workflow-wide environment variable, its value will be modified after the action runs.

The action works on Linux and macOS [runners](https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners), and _should_ work for Windows runners when `ko` releases include Windows binaries (next `ko` release🤞! see [google/ko#339](https://github.com/google/ko/pull/339))

### Select `ko` version to install

By default, `imjasonh/setup-ko` installs the latest released version of `ko`.

You can select a version with the `version` parameter:

```yaml
- uses: imjasonh/setup-ko@v0.3
  with:
    version: v0.8.0
```

To build and install `ko` from source using `go get`, specify `version: tip`.

### Pushing to other registries

By default, `imjasonh/setup-ko` configures `ko` to push images to [GitHub Container Registry](https://ghcr.io), but you can configure it to push to other registries.

To do this, you need to provide credentials to authorize the push.
You can use [encrypted secrets](https://docs.github.com/en/actions/reference/encrypted-secrets) to store the authorization token, and pass it to `ko login` before pushing:

```
- uses: imjasonh/setup-ko@v0.3
- env:
    auth_token: ${{ secrets.auth_token }}
  run: |
    echo "${auth_token}" | ko login https://my.registry --username my-username --password-stdin
    export KO_DOCKER_REPO=my.registry/my-repo
    ko publish ./
```

### Release Integration

In addition to publishing images, `ko` can produce YAML files containing references to built images, using [`ko resolve`](https://github.com/google/ko#kubernetes-integration)

With this action, you can use `ko resolve` to produce output YAML that you then attach to a GitHub Release using the [GitHub CLI](https://cli.github.com).
For example:

```yaml
name: Publish Release YAML

on:
  release:
    types: ['created']

jobs:
  publish-release-yaml:
    name: Publish Release YAML
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-go@v2
        with:
          go-version: 1.15
      - uses: actions/checkout@v2
      - uses: imjasonh/setup-ko@v0.3

      - name: Generate and upload release.yaml
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          tag=$(echo ${{ github.ref }} | cut -c11-)  # get tag name without tags/refs/ prefix.
          ko resolve -t ${tag} -f config/ > release.yaml
          gh release upload ${tag} release.yaml
```

### A note on versioning

The `@v0.3` in the `uses` statement refers to the version _of the action definition in this repo._

Regardless of what version of the action definition you use, `imjasonh/setup-ko` will install the latest released version of `ko` unless otherwise specified with `version:`.
