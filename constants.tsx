
import { TariffPricing } from './types';

// Ceny na podstawie dostarczonych obrazków (Cennik Nowa Energia e-faktura + Opłaty dystrybucyjne)
export const DEFAULT_PRICING: TariffPricing = {
  g11: { 
    rate: { sales: 0.6149, distribution: 0.3565 } 
  },
  g12: { 
    peak: { sales: 0.6712, distribution: 0.4028 }, 
    offPeak: { sales: 0.5120, distribution: 0.1220 } 
  },
  g12w: { 
    peak: { sales: 0.7680, distribution: 0.4590 }, 
    offPeak: { sales: 0.5120, distribution: 0.1164 } 
  },
  g13: { 
    peak: { sales: 0.9590, distribution: 0.5328 }, 
    mid: { sales: 0.5779, distribution: 0.3244 }, 
    offPeak: { sales: 0.5218, distribution: 0.1016 } 
  },
};

// G12: 22-07 (8h) + 13-16 (2h - np. 13-15 lub 14-16)
export const DEFAULT_G12_OFFPEAK = [22, 23, 0, 1, 2, 3, 4, 5, 6, 13, 14];

// G12w: 22-06 (8h) + 13-15 (2h)
export const DEFAULT_G12W_OFFPEAK = [22, 23, 0, 1, 2, 3, 4, 5, 13, 14];

export const DEFAULT_G13_PEAK = []; 
export const DEFAULT_G13_MID = [];
