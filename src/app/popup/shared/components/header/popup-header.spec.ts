import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideFakeStorage } from '../../../../../testing/fake-storage-area';
import { PopupHeader } from './popup-header';

// `ext` is read from the `chrome` global at import time, so mock it before the imports run.
const ext = vi.hoisted(() => {
  const mock = {
    tabs: { create: vi.fn() },
    runtime: { openOptionsPage: vi.fn() },
  };
  (globalThis as { chrome?: unknown }).chrome = mock;
  return mock;
});

describe('PopupHeader', () => {
  let component: PopupHeader;
  let fixture: ComponentFixture<PopupHeader>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupHeader],
      providers: [provideFakeStorage()],
    }).compileComponents();

    fixture = TestBed.createComponent(PopupHeader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => vi.clearAllMocks());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('opens the options page', () => {
    component.openOptions();
    expect(ext.runtime.openOptionsPage).toHaveBeenCalledOnce();
  });

  it('does not open the app without an app URL', () => {
    component.openApp();
    expect(ext.tabs.create).not.toHaveBeenCalled();
  });
});
