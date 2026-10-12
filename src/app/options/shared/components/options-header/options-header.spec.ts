import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OptionsHeader } from './options-header';

describe('OptionsHeader', () => {
  let fixture: ComponentFixture<OptionsHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OptionsHeader],
    }).compileComponents();

    fixture = TestBed.createComponent(OptionsHeader);
    await fixture.whenStable();
  });

  it('shows the page title', () => {
    const heading = (fixture.nativeElement as HTMLElement).querySelector('h1');
    expect(heading?.textContent?.trim()).toBe('Retriever options');
  });
});
