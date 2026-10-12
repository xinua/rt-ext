import { SettingsOption } from './settings.model';

export const EXT_OPTIONS: SettingsOption[] = [
  {
    value: 'openApp',
    label: 'Open Retriever app in a new tab after sending',
    shortLabel: 'Open app',
    enabled: true,
    icon: 'open_in_new',
  },
  {
    value: 'useSubfolder',
    label: 'Use subfolder based on the Hostname of the Tab URL',
    shortLabel: 'Use subfolder',
    enabled: true,
    icon: 'folder',
  },
  {
    value: 'useNamePrefix',
    label: 'Add name-prefix based on the Hostname of the Source',
    shortLabel: 'Add name-prefix',
    enabled: true,
    icon: 'text_snippet',
  },
  {
    value: 'showQuality',
    label: 'Show quality for videos',
    shortLabel: 'Show quality',
    enabled: true,
    icon: 'high_quality',
  },
  {
    value: 'hideIncognito',
    label: 'Hide records from Incognito',
    shortLabel: 'Hide Incognito',
    tooltip: 'Records received from an incognito tab are not listed in the Retriever app',
    enabled: true,
    icon: 'visibility_off',
  },
  {
    value: 'incognitoFolder',
    label: 'Use special folder for Incognito requests',
    shortLabel: 'Incognito folder',
    tooltip: 'Records received from an incognito tab are stored in a special folder',
    enabled: true,
    icon: 'folder',
  },
  {
    value: 'mostRecent',
    label: 'Show most recently played label (experimental)',
    shortLabel: 'Most recent',
    tooltip: 'Helps you identify the most recently played media when many cards are present',
    enabled: true,
    icon: 'history',
  },
];
