import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NotifierService } from 'angular-notifier';
import { provideFakeStorage } from '../../../../../testing/fake-storage-area';
import { DownloadType } from '../../models/forms.model';
import { DownloadConfig } from '../download-config/download-config';
import { Settings } from '../settings/settings';
import { Stepper } from './stepper';

describe('Stepper', () => {
  let component: Stepper;
  let fixture: ComponentFixture<Stepper>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Stepper],
      providers: [provideFakeStorage(), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Stepper);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('has a step for the settings and each preset', () => {
    const labels = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll('.mat-step-label'),
    ].map((label) => label.textContent?.trim());
    expect(labels).toEqual(['Settings', 'Video preset', 'Audio preset']);
  });

  it('shows a success notification', () => {
    const notify = vi.spyOn(fixture.debugElement.injector.get(NotifierService), 'notify');
    component.showNotification('Saved');
    expect(notify).toHaveBeenCalledWith('success', 'Saved');
  });

  it('notifies what the steps report', () => {
    const show = vi.spyOn(component, 'showNotification');

    fixture.debugElement
      .query(By.directive(Settings))
      .componentInstance.notify.emit('Settings have been saved');
    expect(show).toHaveBeenLastCalledWith('Settings have been saved');

    fixture.debugElement
      .queryAll(By.directive(DownloadConfig))
      .forEach((preset) => preset.componentInstance.notify.emit('Preset has been updated'));
    expect(show).toHaveBeenCalledTimes(3);
    expect(show).toHaveBeenLastCalledWith('Preset has been updated');
  });

  it('gives each preset step its type', () => {
    const types = fixture.debugElement
      .queryAll(By.directive(DownloadConfig))
      .map((preset) => (preset.componentInstance as DownloadConfig).type());
    expect(types).toEqual([DownloadType.VIDEO, DownloadType.AUDIO]);
  });
});
