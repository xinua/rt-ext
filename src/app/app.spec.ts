import { TestBed } from '@angular/core/testing';
import { provideRouter, Route } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { Options } from './options/options';
import { Popup } from './popup/popup';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the routed page', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('router-outlet')).not.toBeNull();
  });
});

describe('routes', () => {
  const route = (path: string) => routes.find((r) => r.path === path) as Route;

  it('opens the popup by default', () => {
    expect(route('')).toMatchObject({ redirectTo: 'popup', pathMatch: 'full' });
  });

  it('lazy-loads each page', async () => {
    expect(await route('popup').loadComponent?.()).toBe(Popup);
    expect(await route('options').loadComponent?.()).toBe(Options);
  });
});
