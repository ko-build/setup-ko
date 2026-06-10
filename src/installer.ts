import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';
import * as tc from '@actions/tool-cache';
import * as semver from 'semver';

const KO_REPO_OWNER = 'ko-build';
const KO_REPO_NAME = 'ko';
const KO_MODULE = 'github.com/google/ko';

export type KoPlatform = 'Darwin' | 'Linux' | 'Windows';

export async function run(): Promise<void> {
  const token = core.getInput('token');
  const versionInput = core.getInput('version', {required: true});

  if (token) {
    core.setSecret(token);
  }

  await installKo(versionInput, token);
  await configureDockerRepo(token);
}

export async function installKo(
  versionInput: string,
  token: string
): Promise<void> {
  const version = versionInput.trim();

  if (version === 'tip') {
    await installTip();
    return;
  }

  const tag =
    version === 'latest-release'
      ? await getLatestReleaseTag(token)
      : normalizeKoReleaseTag(version);
  const cacheVersion = tagToCacheVersion(tag);
  const cacheArch = os.arch();

  let toolPath = tc.find('ko', cacheVersion, cacheArch);
  if (toolPath) {
    core.info(`Found ko ${tag} in cache @ ${toolPath}`);
  } else {
    toolPath = await downloadAndCacheKo(tag, cacheVersion, cacheArch);
  }

  core.addPath(toolPath);
  core.info(`Added ko ${tag} to PATH`);
}

export async function installTip(): Promise<void> {
  core.info('Installing ko from the tip of main using go install');
  await exec.exec('go', ['install', `${KO_MODULE}@main`]);
  const goPath = await getGoPath();
  const goBin = path.join(goPath, 'bin');
  core.addPath(goBin);
  core.info(`Added ${goBin} to PATH`);
}

export async function getGoPath(): Promise<string> {
  const output = await exec.getExecOutput('go', ['env', 'GOPATH'], {
    silent: true,
    ignoreReturnCode: false
  });

  return output.stdout.trim();
}

export async function getLatestReleaseTag(token: string): Promise<string> {
  core.info('Resolving latest ko release');

  const octokit = github.getOctokit(token, {userAgent: 'setup-ko'});
  const response = await octokit.rest.repos.getLatestRelease({
    owner: KO_REPO_OWNER,
    repo: KO_REPO_NAME
  });

  return response.data.tag_name;
}

export async function downloadAndCacheKo(
  tag: string,
  version: string,
  arch: string
): Promise<string> {
  const platform = getKoPlatform();
  const assetArch = getKoAssetArch(arch);
  const downloadUrl = getKoDownloadUrl(tag, version, platform, assetArch);

  core.info(`Downloading ko ${tag} for ${platform} ${assetArch}`);
  const archivePath = await tc.downloadTool(downloadUrl);
  const extractedPath = await tc.extractTar(archivePath);
  const executablePath = path.join(extractedPath, getExecutableName());

  if (!fs.existsSync(executablePath)) {
    throw new Error(
      `ko executable was not found in the extracted archive at ${executablePath}`
    );
  }

  core.info('Adding ko to the hosted tool cache');
  return tc.cacheDir(extractedPath, 'ko', version, arch);
}

export function getKoDownloadUrl(
  tag: string,
  cacheVersion: string,
  platform: KoPlatform,
  assetArch: string
): string {
  return `https://github.com/${KO_REPO_OWNER}/${KO_REPO_NAME}/releases/download/${tag}/ko_${cacheVersion}_${platform}_${assetArch}.tar.gz`;
}

export function getKoPlatform(
  platform: NodeJS.Platform = os.platform()
): KoPlatform {
  switch (platform) {
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

export async function configureDockerRepo(token: string): Promise<void> {
  const existingRepo = process.env.KO_DOCKER_REPO;
  if (existingRepo) {
    core.info('KO_DOCKER_REPO is already set');
    core.exportVariable('KO_DOCKER_REPO', existingRepo);
    return;
  }

  await loginToGhcr(token);

  const repo = github.context.repo;
  const dockerRepo = `ghcr.io/${repo.owner}/${repo.repo}`.toLowerCase();
  core.info(`KO_DOCKER_REPO=${dockerRepo}`);
  core.exportVariable('KO_DOCKER_REPO', dockerRepo);
}

export async function loginToGhcr(token: string): Promise<void> {
  if (!token) {
    throw new Error('A GitHub token is required to log in to ghcr.io');
  }

  await exec.exec(
    'ko',
    ['login', 'ghcr.io', '--username', 'dummy', '--password-stdin'],
    {
      input: Buffer.from(token)
    }
  );
}

export function getExecutableName(
  platform: NodeJS.Platform = os.platform()
): string {
  return platform === 'win32' ? 'ko.exe' : 'ko';
}
