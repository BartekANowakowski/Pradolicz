# Prądolicz Pro ⚡

Zaawansowane narzędzie webowe do precyzyjnej analizy kosztów energii elektrycznej w gospodarstwach domowych i firmach. Aplikacja pozwala na porównanie opłacalności najpopularniejszych taryf (G11, G12, G12w, G13) na podstawie rzeczywistych danych z licznika.

## 🚀 Główne Funkcjonalności

- **Import danych CSV**: Obsługa standardowych plików z historią zużycia (kolumny `timestamp`, `kwh`).
- **Pełna konfiguracja cen**: Rozbicie na składnik sprzedaży i dystrybucji dla każdego progu cenowego.
- **Interaktywne harmonogramy**: Możliwość ręcznego zdefiniowania godzin "doliny" dla taryf G12 i G12w.
- **Zaawansowana logika G13**: Automatyczne uwzględnianie sezonowości (Lato/Zima) oraz dni wolnych od pracy zgodnie z polskim kalendarzem.
- **Wizualizacje**:
  - Porównanie całkowitych kosztów (Ranking).
  - Wykres radarowy (zegarowy) dobowego profilu zużycia.
  - Wykresy liniowe miesięcznej konsumpcji.

## 📸 Konfiguracja Taryf

Poniżej przedstawiono standardowe ustawienia taryf zaimplementowane w aplikacji:

### 1. Taryfa G11 - Wygodna
Stała stawka przez całą dobę. Idealna dla osób o równomiernym zużyciu.
![G11 Configuration](https://placeholder.com/g11_config) *Stawka całodobowa: ~0.97 zł/kWh*

### 2. Taryfa G12 - Oszczędna Noc
Podział na strefę szczytową i dolinę (tanią).
![G12 Configuration](https://placeholder.com/g12_config) *Dolina: 22:00-06:00 oraz 13:00-15:00*

### 3. Taryfa G12w - Oszczędny Weekend
Rozszerzenie G12 o całe weekendy i święta w niższej stawce.
![G12w Configuration](https://placeholder.com/g12w_config) *Dolina: Weekendy + wybrane godziny w dni robocze.*

### 4. Taryfa G13 - Oszczędny Plus
Najbardziej zaawansowana taryfa trójstrefowa z logiką sezonową.
![G13 Configuration](https://placeholder.com/g13_config) *Strefy zależne od miesiąca (Lato/Zima).*

## 📊 Format danych wejściowych (CSV)

Plik powinien posiadać nagłówki i być oddzielony przecinkami:
```csv
timestamp,kwh
2023-01-14 21:56,0.09702
2023-01-14 22:06,0.14722
```

## 🛠️ Technologie

- **React 19** + **TypeScript**
- **Recharts** (Wykresy radarowe i liniowe)
- **Lucide React** (Ikony)
- **Tailwind CSS** (Interfejs użytkownika)

---
*Autor: Senior Frontend Engineer*
