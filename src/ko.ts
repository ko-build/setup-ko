import {platform as nodePlatform} from 'node:process';
import * as semver from 'semver';

const KO_REPO_OWNER = 'ko-build';
const KO_REPO_NAME = 'ko';

export type KoPlatform = 'Darwin' | 'Linux' | 'Windows';

export function getKoDownloadUrl(
  tag: string,
  cacheVersion: string,
  platform: KoPlatform,
  assetArch: string
): string {
  return `https://github.com/${KO_REPO_OWNER}/${KO_REPO_NAME}/releases/download/${tag}/ko_${cacheVersion}_${platform}_${assetArch}.tar.gz`;
}

export function getKoPlatform(platform?: string): KoPlatform {
  const currentPlatform = platform ?? nodePlatform;

  switch (currentPlatform) {
    case 'darwin':
      return 'Darwin';
    case 'linux':
      return 'Linux';
    case 'win32':
      return 'Windows';
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

export function getKoAssetArch(arch: string): string {
  switch (arch) {
    case 'x64':
      return 'x86_64';
    case 'ia32':
    case 'x32':
      return 'i386';
    case 'arm64':
    case 'riscv64':
    case 's390x':
      return arch;
    case 'mips64el':
      return 'mips64le';
    case 'ppc64':
      return 'ppc64le';
    default:
      throw new Error(`Unsupported architecture: ${arch}`);
  }
}

export function tagToCacheVersion(tag: string): string {
  const version = semver.clean(tag);
  if (!version || !semver.valid(version)) {
    throw new Error(`Invalid ko version: ${tag}`);
  }

  return version;
}

export function normalizeKoReleaseTag(version: string): string {
  return `v${tagToCacheVersion(version)}`;
}

export function getExecutableName(platform?: string): string {
  const currentPlatform = platform ?? nodePlatform;

  return currentPlatform === 'win32' ? 'ko.exe' : 'ko';
}
