import { SettingsFormModel } from "../../models/forms.model";

export interface SettingsOption {
  value: keyof SettingsFormModel;
  label: string;
  shortLabel: string;
  tooltip?: string;
  enabled: boolean;
  icon: string;
}