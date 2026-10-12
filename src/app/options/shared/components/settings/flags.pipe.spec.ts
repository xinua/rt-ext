import { SettingsFormModel } from '../../models/forms.model';
import { FlagsPipe } from './flags.pipe';
import { EXT_OPTIONS } from './settings.const';

describe('FlagsPipe', () => {
  const pipe = new FlagsPipe();

  it('finds the option for every flag', () => {
    EXT_OPTIONS.forEach((option) => expect(pipe.transform(option.value)).toBe(option));
  });

  it('gives the short label shown in the select trigger', () => {
    expect(pipe.transform('incognitoFolder').shortLabel).toBe('Incognito folder');
  });

  it('is undefined for a field that is not a flag', () => {
    expect(pipe.transform('appUrl')).toBeUndefined();
    expect(pipe.transform('nope' as keyof SettingsFormModel)).toBeUndefined();
  });
});
