"""Aggregate the dataset's Meter_Daily table to one row per meter per month.

Usage:
    python scripts/build_meter_monthly.py path/to/Rural_Solar_MiniGrid_Operations_Dataset_10-24-2026_Meter_Daily.csv

Writes data/meter_monthly.json as {"rows": [...]} with, for each meter and month:
kwh (sum of daily kWh), days (days with a reading) and zero_days (days reading exactly 0).
Requires pandas.
"""
import json
import sys
from pathlib import Path

import pandas as pd

src = Path(sys.argv[1])
out = Path(__file__).resolve().parent.parent / "data" / "meter_monthly.json"

md = pd.read_csv(src, parse_dates=["date"])
md["month"] = md.date.dt.strftime("%Y-%m")
g = (
    md.groupby(["meter_code", "customer_class", "month"])
    .kwh.agg(kwh="sum", days="count", zero_days=lambda s: int((s == 0).sum()))
    .reset_index()
)
g["kwh"] = g.kwh.round(3)
rows = g.rename(columns={"meter_code": "meter"}).to_dict("records")
out.write_text(json.dumps({"rows": rows}, separators=(",", ":")))
print(f"Wrote {len(rows)} rows to {out}")
