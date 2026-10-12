import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideFakeActiveTab, provideFakeStorage } from '../../../../../testing/fake-storage-area';
import { DownloadType } from '../../../../options/shared/models/forms.model';
import { TabMediaService } from '../../../../shared/services/tab-media';
import { DownloadBtn } from './download-btn';

const both = <T>(value: T): Record<DownloadType, T> => ({
  [DownloadType.VIDEO]: value,
  [DownloadType.AUDIO]: value,
});

describe('DownloadBtn', () => {
  let component: DownloadBtn;
  let fixture: ComponentFixture<DownloadBtn>;

  async function setup(tab?: Partial<chrome.tabs.Tab>) {
    await TestBed.configureTestingModule({
      imports: [DownloadBtn],
      providers: [provideFakeStorage(), provideFakeActiveTab(tab)],
    }).compileComponents();

    fixture = TestBed.createComponent(DownloadBtn);
    fixture.componentRef.setInput('type', DownloadType.VIDEO);
    fixture.componentRef.setInput('isDisabled', false);
    fixture.componentRef.setInput('ariaLabels', {
      [DownloadType.VIDEO]: 'Send video',
      [DownloadType.AUDIO]: 'Send audio',
    });
    fixture.componentRef.setInput('tooltips', both(''));
    fixture.componentRef.setInput('icons', both('play_circle'));
    fixture.componentRef.setInput('indicators', both(''));
    fixture.componentRef.setInput('states', both(null));
    fixture.componentRef.setInput('progress', both(null));
    fixture.componentRef.setInput('errors', both(''));
    component = fixture.componentInstance;
    // The tab's media loads after the button is created.
    await TestBed.inject(TabMediaService).ready;
    await fixture.whenStable();
  }

  beforeEach(() => setup());

  const button = () => fixture.nativeElement.querySelector('button') as HTMLButtonElement;

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('labels the button for its type', () => {
    expect(button().getAttribute('aria-label')).toBe('Send video');
  });

  it('shows the percent only while there is one', async () => {
    expect(button().textContent).not.toContain('%');

    fixture.componentRef.setInput('states', both('processing'));
    fixture.componentRef.setInput('progress', both(42));
    await fixture.whenStable();
    expect(button().textContent).toContain('42%');
  });

  it('emits when clicked', () => {
    const emitted = vi.fn();
    component.download.subscribe(emitted);
    button().click();
    expect(emitted).toHaveBeenCalledOnce();
  });

  describe('incognito', () => {
    beforeEach(() => TestBed.resetTestingModule());

    it('marks the button on an incognito tab', async () => {
      await setup({ id: 1, url: 'https://www.youtube.com/watch?v=abc', incognito: true });
      expect(button().classList).toContain('cursor-incognito');
    });

    it('leaves it unmarked otherwise', async () => {
      await setup({ id: 1, url: 'https://www.youtube.com/watch?v=abc' });
      expect(button().classList).not.toContain('cursor-incognito');
    });
  });
});
