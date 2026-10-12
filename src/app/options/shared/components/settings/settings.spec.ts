import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSelectChange } from '@angular/material/select';
import { HttpService, StorageService } from '@shared';
import { of } from 'rxjs';
import { DEFAULT_SETTINGS } from '../../../../shared/constants';
import { provideFakeStorage } from '../../../../../testing/fake-storage-area';
import { SettingsFormModel, SettingsModel } from '../../models/forms.model';
import { Settings } from './settings';

// `ext` is read from the `chrome` global at import time, so mock it before the imports run.
const ext = vi.hoisted(() => {
  const mock = { permissions: { request: vi.fn() } };
  (globalThis as { chrome?: unknown }).chrome = mock;
  return mock;
});

const STORED: SettingsModel = {
  ...DEFAULT_SETTINGS,
  appUrl: 'http://localhost:3000',
  useSubfolder: true,
};

describe('Settings', () => {
  let component: Settings;
  let fixture: ComponentFixture<Settings>;
  let storage: StorageService;
  let http: HttpTestingController;

  beforeEach(async () => {
    ext.permissions.request.mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [Settings],
      providers: [
        provideFakeStorage({ settings: STORED }),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    // The URL check is the directive's job; keep it from reaching the network here.
    vi.spyOn(TestBed.inject(HttpService), 'connect').mockReturnValue(of({ ok: true }));
    storage = TestBed.inject(StorageService);
    http = TestBed.inject(HttpTestingController);
    // The form is filled from storage on creation, so let the first read land.
    await storage.ready;

    fixture = TestBed.createComponent(Settings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => vi.clearAllMocks());

  const select = (value: (keyof SettingsFormModel)[]) =>
    component.onOptionChange({ value } as MatSelectChange<(keyof SettingsFormModel)[]>);

  it('fills the form from the stored settings', () => {
    expect(component.form.getRawValue()).toEqual(STORED);
  });

  it('loads the app folders for the autocomplete', () => {
    http
      .expectOne('http://localhost:3000/api/folders')
      .flush({ root: '/downloads', folders: ['music', 'video'] });
    expect(component.folders()).toEqual(['music', 'video']);
  });

  it('cannot be saved until something changes', () => {
    expect(component.form.hasError('unchanged')).toBe(true);

    component.form.controls.openApp.setValue(true);
    expect(component.form.hasError('unchanged')).toBe(false);

    component.form.controls.openApp.setValue(false);
    expect(component.form.hasError('unchanged')).toBe(true);
  });

  describe('options', () => {
    it('lists the flags that are on', () => {
      expect(component.selectedOptions()).toEqual(['useSubfolder', 'showQuality']);
    });

    it('turns on exactly the selected flags', () => {
      select(['openApp', 'hideIncognito']);

      const { openApp, useSubfolder, hideIncognito, showQuality } = component.form.getRawValue();
      expect({ openApp, useSubfolder, hideIncognito, showQuality }).toEqual({
        openApp: true,
        useSubfolder: false,
        hideIncognito: true,
        showQuality: false,
      });
      expect(component.selectedOptions()).toEqual(['openApp', 'hideIncognito']);
    });
  });

  describe('incognito folder', () => {
    const name = () => component.form.controls.incognitoFolderName;
    const nameInput = () =>
      (fixture.nativeElement as HTMLElement).querySelector(
        'input[formcontrolname="incognitoFolderName"]',
      );

    it('needs no name while off', () => {
      expect(name().valid).toBe(true);
      expect(nameInput()).toBeNull();
    });

    it('asks for a name, not just spaces, while on', async () => {
      select(['incognitoFolder']);
      await fixture.whenStable();
      expect(nameInput()).not.toBeNull();
      expect(name().hasError('required')).toBe(true);

      name().setValue('   ');
      expect(name().hasError('pattern')).toBe(true);

      name().setValue('private');
      expect(name().valid).toBe(true);
    });

    it('drops the requirement when turned off again', () => {
      select(['incognitoFolder']);
      select([]);
      expect(name().valid).toBe(true);
    });
  });

  describe('save', () => {
    it('asks for access to the app, then stores the settings without a trailing slash', async () => {
      const notify = vi.fn();
      component.notify.subscribe(notify);
      component.form.patchValue({ appUrl: 'http://192.168.1.5:8080/', openApp: true });

      component.save();

      expect(ext.permissions.request).toHaveBeenCalledWith({ origins: ['http://192.168.1.5/*'] });
      await vi.waitFor(() => expect(notify).toHaveBeenCalledWith('Settings have been saved'));
      expect(storage.state().settings).toEqual({
        ...STORED,
        appUrl: 'http://192.168.1.5:8080',
        openApp: true,
      });
    });

    it('treats the saved values as the new baseline', async () => {
      const notify = vi.fn();
      component.notify.subscribe(notify);
      component.form.controls.openApp.setValue(true);

      component.save();
      await vi.waitFor(() => expect(notify).toHaveBeenCalled());

      expect(component.form.hasError('unchanged')).toBe(true);
    });

    it('stores nothing when access is denied', async () => {
      ext.permissions.request.mockResolvedValue(false);
      const notify = vi.fn();
      component.notify.subscribe(notify);
      component.form.controls.openApp.setValue(true);

      component.save();
      await Promise.resolve();
      await fixture.whenStable();

      expect(notify).not.toHaveBeenCalled();
      expect(storage.state().settings).toEqual(STORED);
    });
  });
});
