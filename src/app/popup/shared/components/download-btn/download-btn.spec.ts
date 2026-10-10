import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DownloadType } from '../../../../options/shared/models/forms.model';
import { DownloadBtn } from './download-btn';

const both = <T>(value: T): Record<DownloadType, T> => ({
  [DownloadType.VIDEO]: value,
  [DownloadType.AUDIO]: value,
});

describe('DownloadBtn', () => {
  let component: DownloadBtn;
  let fixture: ComponentFixture<DownloadBtn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DownloadBtn],
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
    fixture.componentRef.setInput('errors', both(''));
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  const button = () => fixture.nativeElement.querySelector('button') as HTMLButtonElement;

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('labels the button for its type', () => {
    expect(button().getAttribute('aria-label')).toBe('Send video');
  });

  it('emits when clicked', () => {
    const emitted = vi.fn();
    component.download.subscribe(emitted);
    button().click();
    expect(emitted).toHaveBeenCalledOnce();
  });
});
