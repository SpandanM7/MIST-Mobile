// Brand accent colors kept local to the online-orders feature.
// These deliberately sit outside the app's main theme.ts since
// they represent third-party platform branding, not app theming.

export const PlatformColors = {
  zomato: {
    label: 'Zomato',
    icon: '🍅',
    accent: '#E23744',
    accentGlow: 'rgba(226, 55, 68, 0.14)',
    accentBorder: 'rgba(226, 55, 68, 0.45)',
  },
  swiggy: {
    label: 'Swiggy',
    icon: '🛵',
    accent: '#FC8019',
    accentGlow: 'rgba(252, 128, 25, 0.14)',
    accentBorder: 'rgba(252, 128, 25, 0.45)',
  },
} as const;