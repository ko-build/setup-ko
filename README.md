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

      - uses: imjasonh/setup-ko@v0.1
      - run: ko publish ./
```

_That's it!_ This workflow will build and publish your code to [GitHub Container Regsitry](https://ghcr.io).

By default, the action sets `KO_DOCKER_REPO=ghcr.io/[owner]/[repo]`.
See [documentation for `ko`](https://github.com/google/ko#configuration) to learn more about configuring `ko`.

### Select `ko` version to install

By default, `imjasonh/setup-ko` installs the latest released version of `ko`.

You can select a version with the `version` parameter:

```yaml
- uses: imjasonh/setup-ko@v0.1
  with:
    version: v0.8.0
```

To build and install `ko` from source using `go get`, specify `version: tip`.

### Pushing to other registries

By default, `imjasonh/setup-ko` configures `ko` to push images to [GitHub Container Registry](https://ghcr.io), but you can configure it to push to other registries.

To do this, you need to provide credentials to authorize the push.
You can use [encrypted secrets](https://docs.github.com/en/actions/reference/encrypted-secrets) to store the authorization token, and pass it to `ko login` before pushing:

```
- uses: imjasonh/setup-ko@v0.1
- env:
    auth_token: ${{ secrets.auth_token }}
  run: |
    echo "${auth_token}" | ko login https://my.registry --username my-username --password-stdin
    export KO_DOCKER_REPO=my.registry/my-repo
    ko publish ./
```

### Release Integration

In addition to publishing images, `ko` can produce YAML files containing references to built images, using [`ko resolve`](https://github.com/google/ko#kubernetes-integration)

With this action, you can use `ko resolve` to produce output YAML that you then attach to a GitHub Release using [actions/create-release](https://github.com/actions/create-release) and [actions/upload-release-asset](https://github.com/actions/upload-release-asset).
For example:

```yaml
name: Publish Release

on:
  push:
    tags: ['v*']

jobs:
  publish-release:
    name: Publish Release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-go@v2
        with:
          go-version: 1.15
      - uses: actions/checkout@v2

      - uses: imjasonh/setup-ko@v0.1
      - run: ko resolve -f config/ > release-${{ github.sha }}.yaml

      - name: Create Release
        id: create_release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}

      - name: Upload Release Asset
        uses: actions/upload-release-asset@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          upload_url: ${{ steps.create_release.outputs.upload_url }}
          asset_path: ./release-${{ github.sha }}.yaml
          asset_name: release-${{ github.sha }}.yaml
          asset_content_type: application/x-yaml
```

### A note on versioning

The `@v0.1` in the `uses` statement refers to the version _of the action definition in this repo._

Regardless of what version of the action definition you use, `imjasonh/setup-ko` will install the latest released version of `ko` unless otherwise specified with `version:`.
