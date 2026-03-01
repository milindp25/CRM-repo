/**
 * Region-based landing page data
 * Detects user region from headers and returns localized content
 */

export type Region = 'IN' | 'US' | 'EU' | 'UK' | 'SEA' | 'GLOBAL';

interface RegionData {
  trustedCompanies: string[];
  currency: {
    symbol: string;
    code: string;
    freePlan: string;
    proPlan: string;
    proUnit: string;
  };
}

// Fictional but realistic-sounding startup names per region
const REGION_DATA: Record<Region, RegionData> = {
  IN: {
    trustedCompanies: [
      'Kiratech',
      'NovaByte',
      'UrbanGrid',
      'PeakHR',
      'Zentrix',
      'CloudNine',
    ],
    currency: {
      symbol: '₹',
      code: 'INR',
      freePlan: '₹0',
      proPlan: '₹299',
      proUnit: '/employee/mo',
    },
  },
  US: {
    trustedCompanies: [
      'Luminary',
      'Arcwise',
      'TrueNorth',
      'Covalent',
      'Gridwork',
      'Uplevel',
    ],
    currency: {
      symbol: '$',
      code: 'USD',
      freePlan: '$0',
      proPlan: '$4',
      proUnit: '/employee/mo',
    },
  },
  EU: {
    trustedCompanies: [
      'Nuvolo',
      'Velora',
      'BrightPath',
      'Quantica',
      'Helix.io',
      'TeamForge',
    ],
    currency: {
      symbol: '€',
      code: 'EUR',
      freePlan: '€0',
      proPlan: '€4',
      proUnit: '/employee/mo',
    },
  },
  UK: {
    trustedCompanies: [
      'Clearwave',
      'PulseHQ',
      'StackBridge',
      'Onward',
      'Propel',
      'MintOps',
    ],
    currency: {
      symbol: '£',
      code: 'GBP',
      freePlan: '£0',
      proPlan: '£3',
      proUnit: '/employee/mo',
    },
  },
  SEA: {
    trustedCompanies: [
      'OceanBase',
      'Workably',
      'Skyrise',
      'Nexova',
      'Corepath',
      'FlowDesk',
    ],
    currency: {
      symbol: '$',
      code: 'USD',
      freePlan: '$0',
      proPlan: '$4',
      proUnit: '/employee/mo',
    },
  },
  GLOBAL: {
    trustedCompanies: [
      'Luminary',
      'Arcwise',
      'TrueNorth',
      'Covalent',
      'Gridwork',
      'Uplevel',
    ],
    currency: {
      symbol: '$',
      code: 'USD',
      freePlan: '$0',
      proPlan: '$4',
      proUnit: '/employee/mo',
    },
  },
};

/**
 * Detect region from request headers.
 * Priority: x-vercel-ip-country (Vercel) > Accept-Language > fallback
 */
export function detectRegion(headersList: {
  get: (name: string) => string | null;
}): Region {
  // 1. Try Vercel's geo header (works in production on Vercel)
  const country = headersList.get('x-vercel-ip-country');
  if (country) {
    if (country === 'IN') return 'IN';
    if (country === 'US') return 'US';
    if (country === 'GB') return 'UK';
    if (['SG', 'MY', 'TH', 'ID', 'PH', 'VN'].includes(country)) return 'SEA';
    if (
      [
        'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK',
        'FI', 'PT', 'IE', 'PL', 'CZ', 'RO', 'HU', 'GR', 'BG', 'HR',
      ].includes(country)
    )
      return 'EU';
    return 'GLOBAL';
  }

  // 2. Fall back to Accept-Language header
  const acceptLang = headersList.get('accept-language') || '';
  const primaryLang = acceptLang.split(',')[0]?.toLowerCase() || '';

  if (primaryLang.includes('hi') || primaryLang.includes('en-in'))
    return 'IN';
  if (primaryLang.includes('en-us') || primaryLang === 'en')
    return 'US';
  if (primaryLang.includes('en-gb'))
    return 'UK';
  if (
    primaryLang.includes('de') ||
    primaryLang.includes('fr') ||
    primaryLang.includes('es') ||
    primaryLang.includes('it') ||
    primaryLang.includes('nl') ||
    primaryLang.includes('pt')
  )
    return 'EU';
  if (
    primaryLang.includes('ms') ||
    primaryLang.includes('th') ||
    primaryLang.includes('id') ||
    primaryLang.includes('vi')
  )
    return 'SEA';

  return 'GLOBAL';
}

export function getRegionData(region: Region): RegionData {
  return REGION_DATA[region];
}
