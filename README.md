# Mini-Grid RMG01 Explorer

An interactive explorer for the open dataset
[*A Multi-Year Daily Operations Dataset from a Rural Solar Mini-Grid in Southern Nigeria*](https://doi.org/10.5281/zenodo.24098636)
(Kemabonta & Geoffrey, 2026, CC BY 4.0). It shows per-connection CAPEX, OPEX, ARPU and ACPU,
connections over time, monthly and daily use, payments, seasonality and costs, with a USD / NGN switch.

**The analysis and assumptions here are ours, not the dataset authors'.** The main ones:

- **Connections** are customers who have bought credit at least once. They count as active from their
  first payment to the end of the data, because the dataset has no removal records.
- **Meters without readings** are assumed to have been running offline on keypad tokens, not missing.
  On this basis most meters were installed early, and the slow rise in reporting meters reflects
  meters being brought online over 2020–24.
- **USD figures** convert naira at approximate yearly rates in `data/fx_rates.csv`. These are rounded
  estimates, not part of the dataset. CAPEX uses the operator's 2019 rate of 350 NGN/USD.

The page's "Data and method" section lists every data file and shows the code of every calculation.

## Viewing it

Once published with GitHub Pages (below), anyone can open it in a browser at
`https://<your-username>.github.io/<repo-name>/`. No GitHub account or download is needed.

To share it as one file, run `python3 scripts/build_single_file.py` and send
`dist/rmg01-explorer.html` (about 2 MB). It opens from disk, an email attachment or a shared drive.

## Publishing with GitHub Pages

1. Create a **public** repository on GitHub and push this folder to it:
   ```sh
   git init
   git add .
   git commit -m "Add RMG01 explorer"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
2. On GitHub, open **Settings → Pages**. Under **Build and deployment**, set **Source** to
   *Deploy from a branch*, pick `main` and `/ (root)`, and save.
3. After a minute or so the page shows the site's URL. Every push to `main` updates it.

The empty `.nojekyll` file tells GitHub Pages to serve the files as they are.

To preview locally, open `index.html` in a browser. The data loads from `data/data.js`, which
browsers allow from disk.

## Updating the data

The page reads its data from `data/data.js`, a bundle of the files in `data/`. After changing any
of those files (for example replacing `fx_rates.csv` with official rates), rebuild it:

```sh
python3 scripts/build_data_js.py
```

## What's in the folder

| Path | Contents |
| --- | --- |
| `index.html` | The explorer: layout, calculations (`dash.calc`) and charts (`dash.draw`). |
| `js/runtime.js` | Loads the data files, runs the calculations and draws the charts. |
| `vendor/d3.min.js` | d3 v7.8.5, kept in the repo so the page has no script dependency on a CDN. |
| `data/*.csv` | Unchanged copies of tables from the dataset (file names shortened). |
| `data/meter_monthly.json` | `Meter_Daily` aggregated per meter per month. |
| `data/fx_rates.csv` | Approximate NGN/USD rates (not part of the dataset). |
| `data/data.js` | All of the above bundled for the page. Generated; do not edit by hand. |
| `scripts/build_data_js.py` | Rebuilds `data/data.js` from the files in `data/`. |
| `scripts/build_meter_monthly.py` | Rebuilds `meter_monthly.json` from the dataset's `Meter_Daily.csv` (needs pandas). |
| `scripts/build_single_file.py` | Builds the offline single-file copy in `dist/`. |

To rebuild the per-meter file from the original dataset:

```sh
python scripts/build_meter_monthly.py path/to/Rural_Solar_MiniGrid_Operations_Dataset_10-24-2026_Meter_Daily.csv
```

## Credit and licence

Data: Kemabonta, T., & Geoffrey, A. (2026). *A Multi-Year Daily Operations Dataset from a Rural Solar
Mini-Grid in Southern Nigeria* [Data set]. https://doi.org/10.5281/zenodo.24098636. Licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The files in `data/` are copies of that
dataset, except `meter_monthly.json` (derived from it) and `fx_rates.csv` (added here).

d3 is © Mike Bostock, ISC licence.
