import { DEFAULT_STORAGE } from '../app/shared/constants/defaults.const';
import type { SettingsModel } from '../app/options/shared/models/forms.model';
import type { DownloadSource } from '../app/shared/models';
import { downloadFolder, requestFlags } from './download';

const settings = (patch: Partial<SettingsModel> = {}): SettingsModel => ({
  ...DEFAULT_STORAGE.settings,
  ...patch,
});
const source = (incognito: boolean): DownloadSource => ({
  url: 'https://example.com/v',
  prefix: 'example',
  folder: 'example',
  incognito,
});
const incognitoOn = { incognitoFolder: true, incognitoFolderName: ' private ' };

describe('downloadFolder', () => {
  it('uses the site subfolder only when it is on', () => {
    expect(downloadFolder(settings(), source(false))).toBeNull();
    expect(downloadFolder(settings({ useSubfolder: true }), source(false))).toBe('example');
  });

  it('puts incognito downloads in the incognito folder, over the site subfolder', () => {
    const value = settings({ useSubfolder: true, ...incognitoOn });
    expect(downloadFolder(value, source(true))).toBe('private');
    expect(downloadFolder(value, source(false))).toBe('example');
  });

  it('ignores the incognito folder while it is off or has no name', () => {
    const off = settings({ incognitoFolderName: 'private' });
    const blank = settings({ incognitoFolder: true, incognitoFolderName: '  ' });
    expect(downloadFolder(off, source(true))).toBeNull();
    expect(downloadFolder(blank, source(true))).toBeNull();
  });
});

describe('requestFlags', () => {
  const storage = (patch: Partial<SettingsModel>) => ({
    ...DEFAULT_STORAGE,
    settings: settings(patch),
  });

  it('always names the extension as the source', () => {
    expect(requestFlags(storage({}), source(false)).source).toBe('extension');
  });

  it('hides only incognito downloads, and only when asked to', () => {
    expect(requestFlags(storage({ hideIncognito: true }), source(true)).hidden).toBe(true);
    expect(requestFlags(storage({ hideIncognito: true }), source(false)).hidden).toBe(false);
    expect(requestFlags(storage({}), source(true)).hidden).toBe(false);
  });
});
