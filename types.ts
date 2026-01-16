
export interface EnergyRecord {
  timestamp: Date;
  kwh: number;
}

export interface PriceComponent {
  sales: number;
  distribution: number;
}

export interface TariffPricing {
  g11: { rate: PriceComponent };
  g12: { peak: PriceComponent; offPeak: PriceComponent };
  g12w: { peak: PriceComponent; offPeak: PriceComponent };
  g13: { peak: PriceComponent; mid: PriceComponent; offPeak: PriceComponent };
}

export interface ScheduleConfig {
  g12_offPeakHours: number[];
  g12w_offPeakHours: number[];
  g13_peakHours: number[];
  g13_midHours: number[];
}

export interface CalculationResult {
  month: string;
  year: number;
  g11_cost: number;
  g12_cost: number;
  g12w_cost: number;
  g13_cost: number;
  total_kwh: number;
  // Statystyki zużycia w strefach
  g12_kwh_peak: number;
  g12_kwh_offpeak: number;
  g12w_kwh_peak: number;
  g12w_kwh_offpeak: number;
  g13_kwh_peak: number;
  g13_kwh_mid: number;
  g13_kwh_offpeak: number;
}