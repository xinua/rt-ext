import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideFakeStorage } from '../../../testing/fake-storage-area';
import { ConnectValidatorDirective } from './connect-validator';

describe('ConnectValidatorDirective', () => {
  it('should create an instance', () => {
    TestBed.configureTestingModule({
      providers: [provideFakeStorage(), provideHttpClient(), provideHttpClientTesting()],
    });
    const directive = TestBed.runInInjectionContext(() => new ConnectValidatorDirective());
    expect(directive).toBeTruthy();
  });
});
