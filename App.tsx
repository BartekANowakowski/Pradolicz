
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';
import { Upload, Download, Calculator, BarChart3, Settings, TrendingDown, Info, Table, Calendar, Sun, Snowflake, Zap, Clock, PieChart } from 'lucide-react';
import { EnergyRecord, TariffPricing, ScheduleConfig, PriceComponent } from './types';
import { DEFAULT_PRICING, DEFAULT_G12_OFFPEAK, DEFAULT_G12W_OFFPEAK, DEFAULT_G13_PEAK, DEFAULT_G13_MID } from './constants';
import { parseCSV, calculateTariffCosts } from './services/tariffEngine';
import NumberInput from './components/NumberInput';
import HourSelector from './components/HourSelector';

const COLORS = {
  g11: '#2563eb',
  g12: '#059669',
  g12w: '#d97706',
  g13: '#7c3aed',
};

const MONTH_COLORS: Record<number, string> = {
  0: '#1e40af', 1: '#3b82f6', 2: '#60a5fa', 3: '#2dd4bf', 4: '#facc15', 5: '#f97316',
  6: '#ef4444', 7: '#dc2626', 8: '#ea580c', 9: '#b45309', 10: '#6366f1', 11: '#1e3a8a',
};

const MONTH_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

const formatCurrency = (value: number) => {
  return value.toLocaleString('pl-PL', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }) + ' zł';
};

const App: React.FC = () => {
  const [records, setRecords] = useState<EnergyRecord[]>([]);
  const [pricing, setPricing] = useState<TariffPricing>(DEFAULT_PRICING);
  const [config, setConfig] = useState<ScheduleConfig>({
    g12_offPeakHours: DEFAULT_G12_OFFPEAK,
    g12w_offPeakHours: DEFAULT_G12W_OFFPEAK,
    g13_peakHours: DEFAULT_G13_PEAK,
    g13_midHours: DEFAULT_G13_MID
  });
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = parseCSV(event.target?.result as string);
        if (data.length > 0) {
          setRecords(data);
          const sorted = [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          setDateRange({
            start: sorted[0].timestamp.toISOString().split('T')[0],
            end: sorted[sorted.length - 1].timestamp.toISOString().split('T')[0]
          });
        }
      } catch (err: any) { alert(err.message); }
    };
    reader.readAsText(file);
  };

  const filteredRecords = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return records;
    const s = new Date(dateRange.start).getTime();
    const e = new Date(dateRange.end).getTime() + 86400000;
    return records.filter(r => r.timestamp.getTime() >= s && r.timestamp.getTime() < e);
  }, [records, dateRange]);

  const analysisResults = useMemo(() => calculateTariffCosts(filteredRecords, pricing, config), [filteredRecords, pricing, config]);

  const totals = useMemo(() => analysisResults.reduce((acc, curr) => ({
    g11: acc.g11 + curr.g11_cost, g12: acc.g12 + curr.g12_cost, g12w: acc.g12w + curr.g12w_cost, g13: acc.g13 + curr.g13_cost, kwh: acc.kwh + curr.total_kwh
  }), { g11: 0, g12: 0, g12w: 0, g13: 0, kwh: 0 }), [analysisResults]);

  const sortedTariffs = useMemo(() => {
    const list = [
      { id: 'g11', name: 'G11', cost: totals.g11, color: COLORS.g11 },
      { id: 'g12', name: 'G12', cost: totals.g12, color: COLORS.g12 },
      { id: 'g12w', name: 'G12w', cost: totals.g12w, color: COLORS.g12w },
      { id: 'g13', name: 'G13', cost: totals.g13, color: COLORS.g13 },
    ];
    return list.sort((a, b) => a.cost - b.cost);
  }, [totals]);

  const bestTariff = sortedTariffs[0];

  const dailyProfileData = useMemo(() => {
    const hours: Record<number, Record<string, number>> = {};
    for (let h = 0; h < 24; h++) hours[h] = {};
    filteredRecords.forEach(r => {
      const h = r.timestamp.getHours();
      const m = r.timestamp.getMonth();
      const monthLabel = MONTH_NAMES[m];
      hours[h][monthLabel] = (hours[h][monthLabel] || 0) + r.kwh;
    });
    return Array.from({ length: 24 }).map((_, hNum) => {
      return { hour: `${hNum.toString().padStart(2, '0')}:00`, ...hours[hNum] };
    });
  }, [filteredRecords]);

  const activeMonthNames = useMemo(() => {
    const months = new Set<string>();
    filteredRecords.forEach(r => months.add(MONTH_NAMES[r.timestamp.getMonth()]));
    return Array.from(months).sort((a, b) => MONTH_NAMES.indexOf(a) - MONTH_NAMES.indexOf(b));
  }, [filteredRecords]);

  const distributionChartData = useMemo(() => {
    const totalKwh = totals.kwh || 1;
    const sums = analysisResults.reduce((acc, curr) => ({
        g12p: acc.g12p + curr.g12_kwh_peak,
        g12o: acc.g12o + curr.g12_kwh_offpeak,
        g12wp: acc.g12wp + curr.g12w_kwh_peak,
        g12wo: acc.g12wo + curr.g12w_kwh_offpeak,
        g13p: acc.g13p + curr.g13_kwh_peak,
        g13m: acc.g13m + curr.g13_kwh_mid,
        g13o: acc.g13o + curr.g13_kwh_offpeak,
    }), { g12p: 0, g12o: 0, g12wp: 0, g12wo: 0, g13p: 0, g13m: 0, g13o: 0 });

    return [
        {
            name: 'G11',
            'Całodobowa': 100,
        },
        {
            name: 'G12',
            'Szczyt': (sums.g12p / totalKwh) * 100,
            'Dolina': (sums.g12o / totalKwh) * 100,
        },
        {
            name: 'G12w',
            'Szczyt': (sums.g12wp / totalKwh) * 100,
            'Dolina / Weekend': (sums.g12wo / totalKwh) * 100,
        },
        {
            name: 'G13',
            'Szczyt popołudniowy (II)': (sums.g13p / totalKwh) * 100,
            'Szczyt przedpołudniowy (I)': (sums.g13m / totalKwh) * 100,
            'Pozostałe (III)': (sums.g13o / totalKwh) * 100,
        }
    ];
  }, [analysisResults, totals.kwh]);

  const PricingSection = ({ title, colorClass, children }: any) => (
    <div className={`${colorClass} p-4 rounded-xl border`}>
      <p className="text-[11px] font-black mb-3 uppercase flex items-center gap-2">{title}</p>
      <div className="space-y-4">{children}</div>
    </div>
  );

  const ComponentInputs = ({ label, component, onChange }: { label: string, component: PriceComponent, onChange: (c: PriceComponent) => void }) => (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{label}:</p>
      <div className="grid grid-cols-2 gap-2">
        <NumberInput label="Sprzedaż" value={component.sales} onChange={v => onChange({...component, sales: v})} />
        <NumberInput label="Dystrybucja" value={component.distribution} onChange={v => onChange({...component, distribution: v})} />
      </div>
      <p className="text-[10px] text-right font-black text-slate-800">Łącznie: {(component.sales + component.distribution).toFixed(4)} zł/kWh</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg"><Calculator size={22} /></div>
            <h1 className="text-xl font-bold text-slate-800">Prądolicz <span className="text-blue-600">Pro</span></h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-4 space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="font-bold text-sm uppercase tracking-wide flex items-center gap-2 mb-4"><Upload size={18} className="text-blue-600" /> Dane CSV</h2>
            <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 hover:bg-blue-50 transition-all cursor-pointer">
              <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              <div className="text-center text-sm text-slate-500 font-medium">Wgraj historię zużycia</div>
            </div>
            {records.length > 0 && <p className="mt-3 text-emerald-700 text-xs font-bold text-center">Wgrano: {records.length.toLocaleString()} rekordów</p>}
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="font-bold text-sm uppercase tracking-wide flex items-center gap-2 mb-6"><Settings size={18} className="text-blue-600" /> Konfiguracja taryf</h2>
            <div className="space-y-6">
              <PricingSection title="G11 - Wygodna" colorClass="bg-blue-50/50 border-blue-100">
                <ComponentInputs label="Całodobowa" component={pricing.g11.rate} onChange={v => setPricing({...pricing, g11: {rate: v}})} />
              </PricingSection>

              <PricingSection title="G12 - Oszczędna Noc" colorClass="bg-emerald-50/50 border-emerald-100">
                <ComponentInputs label="Szczyt" component={pricing.g12.peak} onChange={v => setPricing({...pricing, g12: {...pricing.g12, peak: v}})} />
                <ComponentInputs label="Dolina" component={pricing.g12.offPeak} onChange={v => setPricing({...pricing, g12: {...pricing.g12, offPeak: v}})} />
                <HourSelector label="Godziny doliny (G12):" selectedHours={config.g12_offPeakHours} onChange={h => setConfig({...config, g12_offPeakHours: h})} colorClass="bg-emerald-600" />
              </PricingSection>

              <PricingSection title="G12w - Oszczędny Weekend" colorClass="bg-orange-50/50 border-orange-100">
                <ComponentInputs label="Szczyt" component={pricing.g12w.peak} onChange={v => setPricing({...pricing, g12w: {...pricing.g12w, peak: v}})} />
                <ComponentInputs label="Dolina / Weekend" component={pricing.g12w.offPeak} onChange={v => setPricing({...pricing, g12w: {...pricing.g12w, offPeak: v}})} />
                <HourSelector label="Godziny doliny w dni robocze (G12w):" selectedHours={config.g12w_offPeakHours} onChange={h => setConfig({...config, g12w_offPeakHours: h})} colorClass="bg-orange-600" />
              </PricingSection>

              <PricingSection title="G13 - Oszczędny Plus" colorClass="bg-violet-50/50 border-violet-100">
                <ComponentInputs label="Szczyt popołudniowy (Strefa II)" component={pricing.g13.peak} onChange={v => setPricing({...pricing, g13: {...pricing.g13, peak: v}})} />
                <ComponentInputs label="Szczyt przedpołudniowy (Strefa I)" component={pricing.g13.mid} onChange={v => setPricing({...pricing, g13: {...pricing.g13, mid: v}})} />
                <ComponentInputs label="Pozostałe (Strefa III)" component={pricing.g13.offPeak} onChange={v => setPricing({...pricing, g13: {...pricing.g13, offPeak: v}})} />
                
                <div className="mt-2 p-3 bg-white/80 rounded-lg border border-violet-200 text-[10px] space-y-2 text-slate-600 leading-tight">
                  <p className="font-bold flex items-center gap-1.5"><Sun size={12} className="text-orange-500" /> Lato (IV - IX) - Dni robocze:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li><span className="font-bold">Strefa III (Cheap):</span> 13:00-19:00, 22:00-07:00</li>
                    <li><span className="font-bold">Strefa I (Mid):</span> 07:00-13:00</li>
                    <li><span className="font-bold">Strefa II (Peak):</span> 19:00-22:00</li>
                  </ul>
                  <p className="font-bold flex items-center gap-1.5 pt-1 border-t border-slate-100"><Snowflake size={12} className="text-blue-500" /> Zima (X - III) - Dni robocze:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li><span className="font-bold">Strefa III (Cheap):</span> 13:00-16:00, 21:00-07:00</li>
                    <li><span className="font-bold">Strefa I (Mid):</span> 07:00-13:00</li>
                    <li><span className="font-bold">Strefa II (Peak):</span> 16:00-21:00</li>
                  </ul>
                  <p className="font-black text-violet-700 bg-violet-100 px-1.5 py-0.5 rounded-md inline-block mt-1">Weekendy i święta: Cała doba tanio (Strefa III)</p>
                </div>
              </PricingSection>
            </div>
          </section>
        </aside>

        <div className="lg:col-span-8 space-y-6">
          {records.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-16 text-center border border-slate-200 shadow-sm flex flex-col items-center">
              <div className="bg-blue-50 text-blue-600 p-6 rounded-full mb-6"><BarChart3 size={54} /></div>
              <h3 className="text-2xl font-black text-slate-800">Wgraj dane, aby rozpocząć analizę</h3>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-600 p-6 rounded-2xl shadow-xl text-white">
                  <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">Zużycie w okresie</p>
                  <p className="text-3xl font-black mt-2 leading-none">{totals.kwh.toLocaleString('pl-PL', { maximumFractionDigits: 1 })} kWh</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Rekomendacja</p>
                  <p className="text-3xl font-black text-slate-800">{bestTariff.name}</p>
                  <p className="text-sm text-emerald-600 font-bold mt-1">Oszczędność: {formatCurrency(Math.max(totals.g11, totals.g12, totals.g12w, totals.g13) - bestTariff.cost)}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2"><Calendar size={14} className="text-slate-700" /> Filtruj daty</p>
                  <div className="grid grid-cols-1 gap-2">
                    <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="text-xs font-bold border rounded-lg p-2 bg-slate-50 focus:bg-white" />
                    <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="text-xs font-bold border rounded-lg p-2 bg-slate-50 focus:bg-white" />
                  </div>
                </div>
              </div>

              <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2"><TrendingDown size={20} className="text-blue-600" /> Porównanie kosztów</h3>
                <div className="space-y-4">
                  {sortedTariffs.map((t, idx) => (
                    <div key={t.id} className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-7">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black text-slate-800">{t.name}</span>
                          {idx === 0 && <span className="text-[8px] font-black bg-emerald-100 text-emerald-600 px-1 py-0.5 rounded uppercase leading-none">Lider</span>}
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full transition-all duration-1000" style={{ width: `${(t.cost / sortedTariffs[sortedTariffs.length - 1].cost) * 100}%`, backgroundColor: t.color }} />
                        </div>
                      </div>
                      <div className="col-span-3 text-right text-sm font-black text-slate-900">{formatCurrency(t.cost)}</div>
                      <div className="col-span-2 text-right">
                        {idx !== 0 ? (
                          <>
                            <p className="text-xs font-bold text-red-500">+{((t.cost - bestTariff.cost)).toFixed(2)} zł</p>
                            <p className="text-[10px] font-black text-red-400">+{(((t.cost - bestTariff.cost) / bestTariff.cost) * 100).toFixed(1)}%</p>
                          </>
                        ) : <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">Najtaniej</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2"><Zap size={20} className="text-yellow-500" /> Miesięczne zużycie energii</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analysisResults}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} formatter={(v: number) => v.toLocaleString('pl-PL') + ' kWh'} />
                      <Line type="monotone" dataKey="total_kwh" name="Zużycie" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2"><Clock size={20} className="text-indigo-500" /> Dobowy profil zużycia (Zegar 24h)</h3>
                <div className="flex flex-col md:flex-row items-center gap-8 h-[500px]">
                  {/* Custom Legend Panel */}
                  <div className="w-full md:w-32 flex flex-col gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 shrink-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center border-b pb-1">Miesiące</p>
                    {activeMonthNames.map((month) => (
                      <div key={month} className="flex items-center gap-2 px-1">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: MONTH_COLORS[MONTH_NAMES.indexOf(month)] }} />
                        <span className="text-[10px] font-bold text-slate-600 truncate">{month}</span>
                      </div>
                    ))}
                  </div>

                  <div className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={dailyProfileData} startAngle={90} endAngle={-270}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="hour" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                        <PolarRadiusAxis angle={90} domain={[0, 'auto']} tick={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} formatter={(v: number) => v.toFixed(2) + ' kWh'} />
                        {activeMonthNames.map((month) => (
                          <Radar
                            key={month}
                            name={month}
                            dataKey={month}
                            stroke={MONTH_COLORS[MONTH_NAMES.indexOf(month)]}
                            fill="none"
                            strokeWidth={2}
                            animationDuration={500}
                          />
                        ))}
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>

              <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2"><PieChart size={20} className="text-emerald-500" /> Podział zużycia w strefach (%)</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={distributionChartData} margin={{ left: 10, right: 30, top: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fontWeight: 800, fill: '#1e293b' }} axisLine={false} tickLine={false} width={60} />
                      <Tooltip 
                        formatter={(value: number) => value.toFixed(1) + '%'} 
                        cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      <Legend verticalAlign="top" align="center" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '11px', fontWeight: 700 }} />
                      <Bar dataKey="Całodobowa" stackId="a" fill="#2563eb" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Szczyt" stackId="a" fill="#ef4444" />
                      <Bar dataKey="Dolina" stackId="a" fill="#10b981" />
                      <Bar dataKey="Dolina / Weekend" stackId="a" fill="#059669" />
                      <Bar dataKey="Szczyt popołudniowy (II)" stackId="a" fill="#b91c1c" />
                      <Bar dataKey="Szczyt przedpołudniowy (I)" stackId="a" fill="#f59e0b" />
                      <Bar dataKey="Pozostałe (III)" stackId="a" fill="#047857" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;