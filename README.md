# Oil Shock Simulator

Interactive Monte Carlo simulation modeling the economic impact of the 2026 US-Israel/Iran war on oil prices, European gas, flight costs, food inflation, and Danish household budgets.

Originally built March 9-12, 2026 (week two of the war) in a conversation between a human CTO and Claude AI. Recalibrated May 2026 against IEA, OPEC, IMF, and World Bank data after three months of war.

**Live:** [oilshock.alesandro.dk](https://oilshock.alesandro.dk)

## What it does

- **800-run Monte Carlo simulation** with 8 adjustable parameters (oil price, conflict duration, Hormuz reopening, EU gas storage, demand destruction, reserve release, Russia gas cut, infrastructure shock probability)
- **5 linked price models**: oil → gas → flights / food / services, each with structurally different lag and transmission characteristics
- **Random infrastructure shocks** that fatten the distribution tails
- **DKK household impact calculator** showing monthly cost increases for Danish households (shared state with simulator)
- **2022 backtest** comparing model predictions against actual Russia/Ukraine shock outcomes
- **Sensitivity analysis** ranking which parameters matter most
- **1970s comparison** analyzing structural differences in price transmission speed
- **Live Brent crude price** from the US Energy Information Administration (EIA) API

## Calibration sources

IEA Oil Market Report, OPEC MOMR, IMF World Economic Outlook, World Bank Commodity Markets Outlook, Goldman Sachs, Rystad Energy, Capital Economics, Deutsche Bank, Bruegel, Chatham House. Historical calibration against 1973, 1979, 1990, and 2022 energy shocks.

## Quick start

```bash
git clone https://github.com/malesandro/oil-shock-simulator.git
cd oil-shock-simulator
npm install
npm run dev
```

Open http://localhost:5173

## Live oil price

The app works without an API key (falls back to a recent hardcoded price). For live Brent crude spot prices from the EIA:

1. Register for a free API key at [eia.gov/opendata/register.php](https://www.eia.gov/opendata/register.php) (no credit card, instant)
2. Copy `.env.example` to `.env.local`
3. Add your key: `VITE_EIA_API_KEY=your_key_here`

Data is daily (previous day's spot price), public domain, no rate limits. Cached for 1 hour client-side.

### Deploying with the live price

Vite inlines `VITE_*` env vars at **build time**, not runtime. So `VITE_EIA_API_KEY` must be set in the environment that runs `npm run build`:

- **Building locally then uploading `dist/`**: keep the key in `.env.local` (gitignored) and run `npm run build` from your machine.
- **CI/host builds**: set `VITE_EIA_API_KEY` as a build-time environment variable on the host (Netlify, Vercel, GitHub Actions, etc.).

Note: because Vite inlines the value into the static JS bundle, the key will be visible to anyone who inspects the built site. The EIA key is free and rate-limit-free, so this is acceptable; if you want to hide the key, proxy the request through a server endpoint instead.

## Project structure

```
src/
  engine/
    simulation.js    # Monte Carlo core
  data/
    oilPrice.js      # EIA live price fetcher with fallback
  components/
    ui.jsx           # Shared: Slider, Toggle, Badge, charts
  tabs/
    SimulatorTab.jsx  # Main interactive simulator
    HouseholdTab.jsx  # DKK cost calculator (shares simulator state)
    BacktestTab.jsx   # 2022 validation
    SituationTab.jsx  # Current crisis state
    ComparisonTab.jsx # 1970s structural comparison
    MethodTab.jsx     # Model documentation
  App.jsx            # Main app with shared state
  theme.js           # Color constants
  main.jsx           # Entry point
```

## Limitations

Parameters derived from analyst and institutional reports, not regression on tick-level data. No speculative overshooting, geopolitical feedback loops, or cascading financial effects. Random shocks approximate but don't model specific scenarios. Reality has fatter tails than this model generates.

Read outputs as "given these structural assumptions, here's the range of plausible outcomes" — not as predictions.

## Author

[Mariano Andrés Alesandro Díaz](https://github.com/malesandro) · Engine: Claude AI · Updated May 2026

## License

MIT
