import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Better Tele-Task',
    description: 'Adds useful features like subtitles to HPI Tele-Task.',
    homepage_url: 'https://github.com/C0NZZ/better-teletask',
    icons: {
      32: 'icons/32.png',
      48: 'icons/48.png',
      64: 'icons/64.png',
    },
    permissions: ['activeTab', 'storage'],
    host_permissions: ['https://btt.makeruniverse.de/*'],
    action: {
      default_icon: 'icons/32.png',
      default_title: 'Better Tele-Task',
    },
    web_accessible_resources: [
      {
        resources: ['fonts/*'],
        matches: ['https://www.tele-task.de/*'],
      },
    ],
    browser_specific_settings: {
      gecko: {
        id: '{dc4e1e72-761b-420d-ba9b-d6e69fb18d86}',
        strict_min_version: '140.0',
        data_collection_permissions: { required: ['authenticationInfo'] },
      },
      gecko_android: {
        strict_min_version: '142.0',
      },
    },
  },
});
