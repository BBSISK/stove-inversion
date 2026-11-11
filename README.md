# The 7:00 PM "Stove Inversion" (EPA Ireland Real-Time Air Quality)

An interactive, high-resolution environmental data dashboard analyzing telemetry from all **113 active Environmental Protection Agency (EPA) Ireland** ambient air quality monitoring stations.

The project demonstrates why quiet regional Irish towns (Ennis, Tralee, Longford, Cavan, Macroom, Enniscorthy) experience catastrophic **20× winter PM2.5 spikes** compared to Dublin, driven by domestic solid fuel burning (turf, peat briquettes, wood) combined with atmospheric thermal inversions.

---

## 🔬 Key Empirical Telemetry Findings

1. **The Inversion Multiplier:**
   - **Ennis, Co. Clare (`EPA-25`)**: Recorded **198.1 µg/m³** during the November 2nd peak event.
   - **Dublin Phoenix Park (`EPA-48`)**: Recorded **9.1 µg/m³** at the identical hour.
   - **Multiplier**: Ennis was **21.7× dirtier** than Dublin, and **13.2× above** the World Health Organization (WHO) 24-hour safety threshold of **15.0 µg/m³**.

2. **The Diurnal Hearth Window:**
   - **100%** of peak annual spikes occur strictly between **19:00 and 21:00 UTC**.
   - Spikes do not coincide with morning or evening vehicular commuter traffic, isolating domestic space heating as the primary emission source.

3. **The Policy & Infrastructure Divide:**
   - **Dublin**: Benefited from the 1990 Smoky Coal Ban and extensive natural gas grid coverage; winter evening PM2.5 remains remarkably stable (<12 µg/m³).
   - **Regional Towns**: Rely heavily on solid fuels (peat, sod turf, briquettes, wood) burned in open grates and stoves. When cold, still anticyclonic weather sets in, nocturnal radiational ground cooling forms a thermal inversion lid that traps emissions near breathing level.

---

## 🛠️ Architecture & Tech Stack

- **Data Pipeline:** Python telemetry scraper querying `airquality.ie` / Sonitus Systems JSON API and Highcharts time-series arrays.
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons.
- **Geospatial Mapping:** Custom Mercator projection SVG of Ireland plotting all 113 EPA monitoring stations with dynamic animated risk halos.
- **Data Visualizations:** Custom SVG time-series charts with WHO threshold guidelines, 24-hour diurnal averages, and extreme inversion night modes.
- **Deployment:** GitHub Pages CI/CD workflow (`.github/workflows/deploy.yml`) and Render blueprint (`render.yaml`).

---

## 🚀 Running Locally

```bash
# Clone the repository
git clone https://github.com/BBSISK/stove-inversion.git
cd stove-inversion

# Install dependencies
npm install

# Run the development server
npm run dev

# Re-run data scraper (optional)
python3 data_pipeline/fetch_data.py
```

---

## 📜 Provenance & Open Data Attribution

- **Data Source:** [Environmental Protection Agency (EPA) Ireland](https://airquality.ie) & Sonitus Systems.
- **Monitoring Network:** National Ambient Air Quality Monitoring Network (AURN).
- **Instrumentation:** Palas Fidas 200 (EN 16450 certified) & Turnkey Osiris Nephelometers.
- **License:** [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).
- **Author:** Barry Sisk (Portfolio Project).
