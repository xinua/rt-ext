import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StorageService } from '@shared';
import { DEFAULT_AUDIO_PRESET } from '../../../../shared/constants';
import { provideFakeStorage } from '../../../../../testing/fake-storage-area';
import {
  AudioFormats,
  Codecs,
  DownloadModel,
  DownloadType,
  VideoFormats,
  VideoQuality,
} from '../../models/forms.model';
import { DownloadConfig } from './download-config';

const VIDEO_PRESET: DownloadModel = {
  type: DownloadType.VIDEO,
  quality: VideoQuality.FHD,
  format: VideoFormats.MKV,
  codec: Codecs.AV1,
};

describe('DownloadConfig', () => {
  let component: DownloadConfig;
  let fixture: ComponentFixture<DownloadConfig>;
  let storage: StorageService;

  async function setup(type: DownloadType) {
    await TestBed.configureTestingModule({
      imports: [DownloadConfig],
      providers: [provideFakeStorage({ videoPreset: VIDEO_PRESET })],
    }).compileComponents();

    storage = TestBed.inject(StorageService);
    // The forms are filled from storage on creation, so let the first read land.
    await storage.ready;

    fixture = TestBed.createComponent(DownloadConfig);
    fixture.componentRef.setInput('type', type);
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

  const heading = () => (fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent;
  const codecField = () =>
    (fixture.nativeElement as HTMLElement).querySelector('mat-select[formcontrolname="codec"]');

  describe('video', () => {
    beforeEach(() => setup(DownloadType.VIDEO));

    it('starts from the stored video preset', () => {
      expect(component.form().getRawValue()).toEqual(VIDEO_PRESET);
      expect(heading()).toContain('Video settings');
      expect(codecField()).not.toBeNull();
    });

    it('does not let the type be changed', () => {
      expect(component.form().controls.type.disabled).toBe(true);
    });

    it('cannot be saved until something changes', () => {
      const form = component.form();
      expect(form.hasError('unchanged')).toBe(true);

      form.controls.quality.setValue(VideoQuality.HD);
      expect(form.hasError('unchanged')).toBe(false);

      form.controls.quality.setValue(VideoQuality.FHD);
      expect(form.hasError('unchanged')).toBe(true);
    });

    it('stores the video preset, then treats it as the new baseline', async () => {
      const notify = vi.fn();
      component.notify.subscribe(notify);
      component.form().controls.format.setValue(VideoFormats.MP4);

      component.save();

      await vi.waitFor(() => expect(notify).toHaveBeenCalledWith('Video preset has been updated'));
      expect(storage.state().videoPreset).toEqual({ ...VIDEO_PRESET, format: VideoFormats.MP4 });
      expect(storage.state().audioPreset).toEqual(DEFAULT_AUDIO_PRESET);
      expect(component.form().hasError('unchanged')).toBe(true);
    });
  });

  describe('audio', () => {
    beforeEach(() => setup(DownloadType.AUDIO));

    it('starts from the stored audio preset, without a codec', () => {
      expect(component.form().getRawValue()).toEqual(DEFAULT_AUDIO_PRESET);
      expect(heading()).toContain('Audio settings');
      expect(codecField()).toBeNull();
    });

    it('stores the audio preset', async () => {
      const notify = vi.fn();
      component.notify.subscribe(notify);
      component.form().controls.format.setValue(AudioFormats.OPUS);

      component.save();

      await vi.waitFor(() => expect(notify).toHaveBeenCalledWith('Audio preset has been updated'));
      expect(storage.state().audioPreset).toEqual({
        ...DEFAULT_AUDIO_PRESET,
        format: AudioFormats.OPUS,
      });
      expect(storage.state().videoPreset).toEqual(VIDEO_PRESET);
    });
  });
});
