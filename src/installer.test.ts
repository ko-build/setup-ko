import {
  getExecutableName,
  getKoAssetArch,
  getKoDownloadUrl,
  getKoPlatform,
  normalizeKoReleaseTag,
  tagToCacheVersion
} from './ko';

describe('installer helpers', () => {
  it('maps runner platforms to ko release platforms', () => {
    expect(getKoPlatform('darwin')).toBe('Darwin');
    expect(getKoPlatform('linux')).toBe('Linux');
    expect(getKoPlatform('win32')).toBe('Windows');
  });

  it('rejects unsupported platforms', () => {
    expect(() => getKoPlatform('freebsd')).toThrow('Unsupported platform');
  });

  it('maps runner architectures to ko release architectures', () => {
    expect(getKoAssetArch('x64')).toBe('x86_64');
    expect(getKoAssetArch('arm64')).toBe('arm64');
    expect(getKoAssetArch('ia32')).toBe('i386');
    expect(getKoAssetArch('x32')).toBe('i386');
    expect(getKoAssetArch('riscv64')).toBe('riscv64');
    expect(getKoAssetArch('s390x')).toBe('s390x');
    expect(getKoAssetArch('mips64el')).toBe('mips64le');
    expect(getKoAssetArch('ppc64')).toBe('ppc64le');
  });

  it('rejects unsupported architectures', () => {
    expect(() => getKoAssetArch('arm')).toThrow('Unsupported architecture');
  });

  it('normalizes release tags for the tool cache', () => {
    expect(tagToCacheVersion('v0.18.1')).toBe('0.18.1');
    expect(tagToCacheVersion('0.18.1')).toBe('0.18.1');
  });

  it('normalizes release tags for GitHub release downloads', () => {
    expect(normalizeKoReleaseTag('v0.18.1')).toBe('v0.18.1');
    expect(normalizeKoReleaseTag('0.18.1')).toBe('v0.18.1');
  });

  it('rejects versions that cannot be cached as semver', () => {
    expect(() => tagToCacheVersion('latest')).toThrow('Invalid ko version');
  });

  it('builds ko release download urls', () => {
    expect(getKoDownloadUrl('v0.18.1', '0.18.1', 'Linux', 'x86_64')).toBe(
      'https://github.com/ko-build/ko/releases/download/v0.18.1/ko_0.18.1_Linux_x86_64.tar.gz'
    );
  });

  it('uses the Windows executable suffix on Windows', () => {
    expect(getExecutableName('linux')).toBe('ko');
    expect(getExecutableName('win32')).toBe('ko.exe');
  });
});
