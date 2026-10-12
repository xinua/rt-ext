// Providers every spec gets, wired in through `providersFile` in angular.json.

import { EnvironmentProviders, importProvidersFrom, Provider } from '@angular/core';
import { MatIconTestingModule } from '@angular/material/icon/testing';

const testProviders: (Provider | EnvironmentProviders)[] = [
  // The app registers its SVG icons at startup, which specs skip; render them empty instead.
  importProvidersFrom(MatIconTestingModule),
];

export default testProviders;
