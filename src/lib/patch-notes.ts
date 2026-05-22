export const CURRENT_VERSION = '1.4.0';

export const PATCH_NOTES: { version: string; date: string; changes: string[] }[] = [
  {
    version: '1.4.0',
    date: 'May 2026',
    changes: [
      'Can\'t make this? — swap any meal if you don\'t have the ingredients, type what you have and AI builds a replacement',
      'Alt meal generator — AI uses your available ingredients to create a performance-optimised recipe',
      'Meal recipe steps — nutrition blocks now show numbered prep steps instead of raw text',
      'Game card stays visible after kickoff — no more disappearing on match day',
      'Water tracker — log water intake in quick amounts (200ml, 500ml, 1L, etc.)',
      'Food log now syncs cross-device via server',
    ],
  },
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
