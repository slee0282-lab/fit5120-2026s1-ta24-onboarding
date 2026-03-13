"""
Import Australian location data (suburb, state, postcode, lat, lon) into PostgreSQL.

Source: https://gist.github.com/randomecho/5020859 (GNU GPL v3.0)
Format: MySQL SQL dump — parses INSERT statements

Usage:
    export DATABASE_URL=postgresql://localhost/sunsafe
    python scripts/import_locations.py [path_to_sql_file]

If no file path is given, the script downloads directly from the gist.
"""
import os
import re
import sys
import urllib.request
import psycopg2
from typing import List, Optional, Tuple

SQL_URL = (
    "https://gist.githubusercontent.com/randomecho/5020859/raw/"
    "843209f5bfa91a2881810e1ed0e9d52f67a30497/australian-postcodes.sql"
)

# Matches: ('postcode', 'suburb', 'STATE', lat, lon)
ROW_RE = re.compile(
    r"\('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*(-?\d+\.?\d*),\s*(-?\d+\.?\d*)\)"
)

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


def load_sql(path: Optional[str]) -> List[Tuple]:
    if path:
        with open(path, encoding="utf-8") as f:
            content = f.read()
    else:
        print("Downloading SQL from gist...")
        with urllib.request.urlopen(SQL_URL) as resp:
            content = resp.read().decode("utf-8")

    records = []
    for match in ROW_RE.finditer(content):
        postcode, suburb, state, lat, lon = match.groups()
        records.append((suburb.strip(), state.strip(), postcode.strip(), float(lat), float(lon)))
    return records


def main():
    sql_path = sys.argv[1] if len(sys.argv) > 1 else None
    records = load_sql(sql_path)
    print(f"Parsed {len(records)} records")

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
