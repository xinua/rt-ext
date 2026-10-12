import { TestBed } from '@angular/core/testing';
import { FormControl, ValidationErrors, Validators } from '@angular/forms';
import { Observable, of, throwError } from 'rxjs';
import { HttpService } from '../services';
import { ConnectValidatorDirective } from './connect-validator';

describe('ConnectValidatorDirective', () => {
  let connect: ReturnType<typeof vi.fn<HttpService['connect']>>;
  let directive: ConnectValidatorDirective;

  beforeEach(() => {
    vi.useFakeTimers();
    connect = vi.fn<HttpService['connect']>(() => of({ ok: true }));
    TestBed.configureTestingModule({
      providers: [{ provide: HttpService, useValue: { connect } }],
    });
    directive = TestBed.runInInjectionContext(() => new ConnectValidatorDirective());
  });

  afterEach(() => vi.useRealTimers());

  /** Subscribes to the validator and returns a getter for what it emitted so far. */
  function validate(control: FormControl<string | null>) {
    let result: ValidationErrors | null | undefined;
    (directive.validate(control) as Observable<ValidationErrors | null>).subscribe(
      (errors) => (result = errors),
    );
    return () => result;
  }

  it('passes sync errors through without calling the app', () => {
    const control = new FormControl('', Validators.required);
    expect(validate(control)()).toEqual({ required: true });
    expect(connect).not.toHaveBeenCalled();
  });

  it('waits a second before calling the app', () => {
    const result = validate(new FormControl('http://localhost:3000'));

    vi.advanceTimersByTime(999);
    expect(connect).not.toHaveBeenCalled();
    expect(result()).toBeUndefined();

    vi.advanceTimersByTime(1);
    expect(connect).toHaveBeenCalledOnce();
  });

  it('is valid when the app answers ok, calling it without the trailing slash', () => {
    const control = new FormControl('http://localhost:3000/');
    const result = validate(control);
    vi.advanceTimersByTime(1000);

    expect(connect).toHaveBeenCalledWith('http://localhost:3000');
    expect(result()).toBeNull();
    expect(control.touched).toBe(false);
  });

  it('only checks the last value typed within the second', () => {
    const control = new FormControl('http://local');
    const result = validate(control);

    vi.advanceTimersByTime(500);
    control.setValue('http://localhost:3000');
    vi.advanceTimersByTime(1000);

    expect(connect).toHaveBeenCalledExactlyOnceWith('http://localhost:3000');
    expect(result()).toBeNull();
  });

  it('flags the URL when the app answers not ok', () => {
    connect.mockReturnValue(of({ ok: false }));
    const control = new FormControl('http://localhost:3000');
    const result = validate(control);
    vi.advanceTimersByTime(1000);

    expect(result()).toEqual({ invalidUrl: true, message: 'Invalid URL' });
    expect(control.touched).toBe(true);
  });

  it('reports that the app cannot be reached when the request fails', () => {
    connect.mockReturnValue(throwError(() => new Error('offline')));
    const control = new FormControl('http://localhost:3000');
    const result = validate(control);
    vi.advanceTimersByTime(1000);

    expect(result()).toEqual({
      invalidUrl: true,
      message: 'Cannot connect to the Retriever app',
    });
    expect(control.touched).toBe(true);
  });
});
