import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));

if (__DEV__) {
  void import('./dev/page-reload').then(({ connectPageReload }) => connectPageReload());
}
