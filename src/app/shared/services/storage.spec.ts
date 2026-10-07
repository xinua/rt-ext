import { TestBed } from '@angular/core/testing';
import { DEFAULT_STORAGE } from '../constants';
import { StorageModel } from '../models';
import { STORAGE_AREA } from '../tokens';
import { createFakeArea } from '../../../testing/fake-storage-area';
import { StorageService } from './storage';

describe('Storage', () => {
  let fake: ReturnType<typeof createFakeArea>;

  function setup(initial?: Record<keyof Pick<StorageModel, 'settings'>, { appUrl: string }>) {
    fake = createFakeArea(initial);
    TestBed.configureTestingModule({ providers: [{ provide: STORAGE_AREA, useValue: fake.area }] });
    return TestBed.inject(StorageService);
  }

  it('should be created', () => {
    expect(setup()).toBeTruthy();
  });

  it('starts from the defaults before hydration finishes', () => {
    expect(setup({ settings: { appUrl: 'http://localhost:3000' } }).state()).toEqual(DEFAULT_STORAGE);
  });

  it('hydrates from the storage area', async () => {
    const service = setup({ settings: { appUrl: 'http://localhost:3000' } });

    await service.ready;

    expect(service.get('settings').appUrl).toBe('http://localhost:3000');
  });

  it('writes through and updates the signal', async () => {
    const service = setup();

    await service.set('settings', { ...DEFAULT_STORAGE.settings, appUrl: 'http://localhost:3000' });

    expect(service.state().settings.appUrl).toBe('http://localhost:3000');
    expect((fake.items['settings'] as StorageModel['settings']).appUrl).toBe('http://localhost:3000');
  });

  it('picks up external changes', async () => {
    const service = setup();
    await service.ready;

    fake.emit({ settings: { newValue: { ...DEFAULT_STORAGE.settings, appUrl: 'http://elsewhere' } } });

    expect(service.get('settings').appUrl).toBe('http://elsewhere');
  });

  it('keeps the same state reference when a change echoes back', async () => {
    const service = setup();
    await service.set('settings', { ...DEFAULT_STORAGE.settings, appUrl: 'http://localhost:3000' });
    const state = service.state();

    fake.emit({ settings: { newValue: state.settings } });

    expect(service.state()).toBe(state);
  });

  it('ignores keys that are not part of the model', async () => {
    const service = setup();
    await service.ready;

    fake.emit({ somethingElse: { newValue: 'nope' } });

    expect(service.state()).toEqual(DEFAULT_STORAGE);
  });

  it('falls back to the default when a key is removed', async () => {
    const service = setup({ settings: { appUrl: 'http://localhost:3000' } });
    await service.ready;

    await service.remove('settings');

    expect(service.get('settings')).toEqual(DEFAULT_STORAGE.settings);
  });

  it('detaches its listener when the injector is destroyed', () => {
    setup();
    expect(fake.listenerCount()).toBe(1);

    TestBed.resetTestingModule();

    expect(fake.listenerCount()).toBe(0);
  });
});
