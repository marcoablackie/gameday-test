export const CURRENT_VERSION = '1.3.0';

export const PATCH_NOTES: { version: string; date: string; changes: string[] }[] = [
  {
    version: '1.3.0',
    date: 'May 2026',
    changes: [
      'Team selection — pick your exact team within your club (e.g. U14 Div 3)',
      'Next game card now shows your specific team\'s fixture, not the whole club',
      'New users guided through team selection after sign-up',
      'Change Team option added to Settings',
    ],
  },
  {
    version: '1.2.0',
    date: 'May 2026',
    changes: [
      'Fixture scanner — upload a photo of your schedule to auto-import games',
      'Post-game debrief — log your performance after every match',
      'Next game countdown on your daily schedule',
      'Patch notes (you\'re reading them)',
      'Daily focus card simplified',
    ],
  },
  {
    version: '1.1.0',
    date: 'May 2026',
    changes: [
      'Drill videos now play in-app',
      'Personalized calorie targets based on your physical stats',
      'Settings sync across all devices',
      'Daily schedule no longer re-syncs on every tab switch',
      'Bonus missions redesigned with daily rotation',
    ],
  },
];
