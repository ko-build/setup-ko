# GitHub Action to install and setup [`ko`](https://github.com/ko-build/ko)

[![Build](https://github.com/ko-build/setup-ko/actions/workflows/use-action.yaml/badge.svg)](https://github.com/ko-build/setup-ko/actions/workflows/use-action.yaml)

> :warning: Note: `ko` recently [moved to its own GitHub org](https://github.com/ko-build/ko/issues/791), which broke `setup-ko@v0.5` if the `ko` version wasn't specified.
>
> To fix this, either upgrade to >= [`setup-ko@v0.6`](https://github.com/ko-build/setup-ko/releases/tag/v0.6) or specify `version`

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
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.23.x'

      - uses: ko-build/setup-ko@v0.8
      - run: ko build
```

_That's it!_ This workflow will build and publish your code to [GitHub Container Regsitry](https://ghcr.io).

By default, the action sets `KO_DOCKER_REPO=ghcr.io/[owner]/[repo]` for all subsequent steps, and uses the `${{ github.token }}` to authorize pushes to GHCR.

See [documentation for `ko`](https://ko.build/configuration/) to learn more about configuring `ko`.

The action works on Linux and macOS [runners](https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners).
If you'd like support for Windows runners, [let us know](https://github.com/ko-build/setup-ko/issues/new)!

### Select `ko` version to install

By default, `ko-build/setup-ko` installs the [latest released version of `ko`](https://github.com/ko-build/ko/releases).

You can select a version with the `version` parameter:

```yaml
- uses: ko-build/setup-ko@v0.8
  with:
    version: v0.17.1
```

To build and install `ko` from source using `go install`, specify `version: tip`.

### Pushing to other registries

By default, `ko-build/setup-ko` configures `ko` to push images to [GitHub Container Registry](https://ghcr.io), but you can configure it to push to other registries as well.

If `KO_DOCKER_REPO` is already set when `setup-ko` runs, it will skip logging in to ghcr.io and will propagate `KO_DOCKER_REPO` for subsequent steps.

To do this, you should provide credentials to authorize the push.
You can use [encrypted secrets](https://docs.github.com/en/actions/reference/encrypted-secrets) to store the authorization token, and pass it to `ko login` before pushing:

```yaml
steps:
...
- uses: ko-build/setup-ko@v0.8
  env:
    KO_DOCKER_REPO: my.registry/my-repo
- env:
    auth_token: ${{ secrets.auth_token }}
  run: |
    echo "${auth_token}" | ko login https://my.registry --username my-username --password-stdin
    ko build
```

### Release Integration

In addition to publishing images, `ko` can produce YAML files containing references to built images, using [`ko resolve`](https://ko.build/features/k8s)

With this action, you can use `ko resolve` to produce output YAML that you then attach to a GitHub Release using the [GitHub CLI](https://cli.github.com).
For example:

```yaml
name: Publish Release YAML

on:
  release:
    types:
      - 'created'

jobs:
  publish-release-yaml:
    name: Publish Release YAML
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.23'

      - uses: ko-build/setup-ko@v0.8

      - name: Generate and upload release.yaml
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          tag=$(echo ${{ github.ref }} | cut -c11-)  # get tag name without tags/refs/ prefix.
          ko resolve -t ${tag} -f config/ > release.yaml
          gh release upload ${tag} release.yaml
```

### A note on versioning

The `@v0.X` in the `uses` statement refers to the version _of the action definition in this repo._

Regardless of what version of the action definition you use, `ko-build/setup-ko` will install the latest released version of `ko` unless otherwise specified with `version:`.
