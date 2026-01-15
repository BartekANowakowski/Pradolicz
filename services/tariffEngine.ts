
import { EnergyRecord, TariffPricing, ScheduleConfig, CalculationResult, PriceComponent } from '../types';

const getRate = (pc: PriceComponent) => pc.sales + pc.distribution;

/**
 * Checks if a given date is a public holiday in Poland.
 */
const isPolishHoliday = (date: Date): boolean => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const fixedHolidays = [
    '1-1', '1-6', '5-1', '5-3', '8-15', '11-1', '11-11', '12-25', '12-26',
  ];
  if (fixedHolidays.includes(`${month}-${day}`)) return true;

  // Easter and related moveable holidays
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const p = (h + l - 7 * m + 114) % 31;
  const easterDay = p + 1;
  const easterMonth = Math.floor((h + l - 7 * m + 114) / 31);

  const easter = new Date(year, easterMonth - 1, easterDay);
  const easterMonday = new Date(year, easterMonth - 1, easterDay + 1);
  const corpusChristi = new Date(year, easterMonth - 1, easterDay + 60);

  const check = (d1: Date) => d1.getMonth() === date.getMonth() && d1.getDate() === date.getDate();
  return check(easter) || check(easterMonday) || check(corpusChristi);
};

export const calculateTariffCosts = (
  records: EnergyRecord[],
  pricing: TariffPricing,
  config: ScheduleConfig
): CalculationResult[] => {
  const monthlyMap: Record<string, CalculationResult> = {};

  records.forEach((record) => {
    const date = record.timestamp;
    const hour = date.getHours();
    const day = date.getDay();
    const isWeekend = day === 0 || day === 6;
    const isHoliday = isPolishHoliday(date);
    const isFreeDay = isWeekend || isHoliday;
    
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = {
        month: monthKey, year: date.getFullYear(),
        g11_cost: 0, g12_cost: 0, g12w_cost: 0, g13_cost: 0, total_kwh: 0,
      };
    }

    const res = monthlyMap[monthKey];
    res.total_kwh += record.kwh;

    // G11 - Single rate 24/7
    res.g11_cost += record.kwh * getRate(pricing.g11.rate);

    // G12 - User configurable off-peak hours
    const isG12OffPeak = config.g12_offPeakHours.includes(hour);
    res.g12_cost += record.kwh * (isG12OffPeak ? getRate(pricing.g12.offPeak) : getRate(pricing.g12.peak));

    // G12w - Free days + user configurable off-peak hours on workdays
    const isG12wOffPeak = isFreeDay || config.g12w_offPeakHours.includes(hour);
    res.g12w_cost += record.kwh * (isG12wOffPeak ? getRate(pricing.g12w.offPeak) : getRate(pricing.g12w.peak));

    /**
     * G13 logic based on user's screenshots:
     * - Holidays/Weekends: always Strefa III (offPeak)
     * - Summer (Apr 1st - Sept 30th):
     *    - 13:00 - 19:00 AND 22:00 - 07:00 -> Strefa III (offPeak)
     *    - 07:00 - 13:00 -> Strefa I (mid)
     *    - 19:00 - 22:00 -> Strefa II (peak)
     * - Winter (Oct 1st - Mar 31st):
     *    - 13:00 - 16:00 AND 21:00 - 07:00 -> Strefa III (offPeak)
     *    - 07:00 - 13:00 -> Strefa I (mid)
     *    - 16:00 - 21:00 -> Strefa II (peak)
     */
    let g13PriceRate: number;
    if (isFreeDay) {
      g13PriceRate = getRate(pricing.g13.offPeak);
    } else {
      const month = date.getMonth() + 1;
      const isSummer = month >= 4 && month <= 9;
      if (isSummer) {
        if ((hour >= 13 && hour < 19) || (hour >= 22 || hour < 7)) {
          g13PriceRate = getRate(pricing.g13.offPeak);
        } else if (hour >= 7 && hour < 13) {
          g13PriceRate = getRate(pricing.g13.mid);
        } else {
          g13PriceRate = getRate(pricing.g13.peak);
        }
      } else {
        if ((hour >= 13 && hour < 16) || (hour >= 21 || hour < 7)) {
          g13PriceRate = getRate(pricing.g13.offPeak);
        } else if (hour >= 7 && hour < 13) {
          g13PriceRate = getRate(pricing.g13.mid);
        } else {
          g13PriceRate = getRate(pricing.g13.peak);
        }
      }
    }
    res.g13_cost += record.kwh * g13PriceRate;
  });

  return Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));
};

export const parseCSV = (csvText: string): EnergyRecord[] => {
  const cleanText = csvText.replace(/^\uFEFF/, '').trim();
  const lines = cleanText.split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
  const tsIdx = headers.indexOf('timestamp');
  const kwhIdx = headers.indexOf('kwh');
  if (tsIdx === -1 || kwhIdx === -1) throw new Error(`Błąd: Wymagane kolumny 'timestamp' i 'kwh'.`);
  const results: EnergyRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 2) continue;
    const timestamp = new Date(cols[tsIdx].trim().replace(' ', 'T'));
    const kwh = parseFloat(cols[kwhIdx].trim());
    if (!isNaN(timestamp.getTime()) && !isNaN(kwh)) results.push({ timestamp, kwh });
  }
  return results;
};
