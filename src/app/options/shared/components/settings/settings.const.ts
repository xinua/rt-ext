import { SettingsOption } from "./settings.model";

export const EXT_OPTIONS: SettingsOption[] = [
  {
    value: 'openApp',
    label: 'Open Retriever app in new tab on download start',
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
    label: 'Show quality based on the URL (for videos only)',
    shortLabel: 'Show quality',
    enabled: true,
    icon: 'video_library',
  },
];
