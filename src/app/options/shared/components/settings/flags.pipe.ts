import { Pipe, PipeTransform } from '@angular/core';
import { SettingsOption } from './settings.model';
import { EXT_OPTIONS } from './settings.const';
import { SettingsFormModel } from '../../models/forms.model';

@Pipe({
  name: 'flags',
  standalone: true,
})
export class FlagsPipe implements PipeTransform {
  readonly flags = EXT_OPTIONS;

  transform(value: keyof SettingsFormModel): SettingsOption {
    return this.flags?.find((flag: SettingsOption) => flag.value === value) as SettingsOption;
  }
}
