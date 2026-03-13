"""
Import Australian location data (suburb, state, postcode, lat, lon) into PostgreSQL.

Source: https://gist.github.com/randomecho/5020859 (GNU GPL v3.0)

Usage:
    export DATABASE_URL=postgresql://localhost/sunsafe
    python scripts/import_locations.py <path_to_csv>

If no CSV path is given, it downloads the file from the gist.
"""
import csv
import os
import sys
import io
import urllib.request
import psycopg2

CSV_URL = "https://gist.githubusercontent.com/randomecho/5020859/raw/australian_postcodes.csv"

CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS locations (
    id        SERIAL PRIMARY KEY,
    suburb    VARCHAR(100) NOT NULL,
    state     VARCHAR(10)  NOT NULL,
    postcode  VARCHAR(4)   NOT NULL,
    lat       NUMERIC(9,6) NOT NULL,
    lon       NUMERIC(9,6) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_locations_postcode ON locations(postcode);
CREATE INDEX IF NOT EXISTS idx_locations_suburb   ON locations(LOWER(suburb));
"""

INSERT_ROW = """
INSERT INTO locations (suburb, state, postcode, lat, lon)
VALUES (%s, %s, %s, %s, %s)
"""


def load_csv(path: str | None) -> list[tuple]:
    if path:
        with open(path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = list(reader)
    else:
        print("Downloading CSV from gist...")
        with urllib.request.urlopen(CSV_URL) as resp:
            content = resp.read().decode("utf-8")
        reader = csv.DictReader(io.StringIO(content))
        rows = list(reader)

    records = []
    for row in rows:
        try:
            lat = float(row["lat"])
            lon = float(row["lon"] if "lon" in row else row["long"])
        except (ValueError, KeyError):
            continue
        records.append((
            row.get("suburb", row.get("place_name", "")).strip(),
            row.get("state", "").strip(),
            row.get("postcode", "").strip(),
            lat,
            lon,
        ))
    return records


def main():
    csv_path = sys.argv[1] if len(sys.argv) > 1 else None
    records = load_csv(csv_path)
    print(f"Loaded {len(records)} records")

    db_url = os.environ["DATABASE_URL"]
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    cur.execute(CREATE_TABLE)
    cur.execute("TRUNCATE TABLE locations RESTART IDENTITY")
    cur.executemany(INSERT_ROW, records)
    conn.commit()

    cur.close()
    conn.close()
    print(f"Imported {len(records)} locations into PostgreSQL.")


if __name__ == "__main__":
    main()
