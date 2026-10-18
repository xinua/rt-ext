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
    value: 'showPage',
    label: 'Show page entry',
    shortLabel: 'Show page entry',
    enabled: true,
    icon: 'pageview',
    tooltip: 'Show page as download source if site is supported by yt-dlp. No guarantees.',
  },
  {
    value: 'showQuality',
    label: 'Show video quality',
    shortLabel: 'Show quality',
    enabled: true,
    icon: 'high_quality',
  },
  {
    value: 'hideIncognito',
    label: 'Hide Incognito downloads',
    shortLabel: 'Hide Incognito',
    tooltip: 'Downloads created from an incognito tab will not be listed in the Retriever app',
    enabled: true,
    icon: 'visibility_off',
  },
  {
    value: 'incognitoFolder',
    label: 'Use special folder for Incognito requests',
    shortLabel: 'Incognito folder',
    tooltip: 'Downloads created from an incognito tab will be stored in a special folder',
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
