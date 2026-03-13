import os
import psycopg2
import psycopg2.extras


def get_connection():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def lookup_location(query: str) -> dict | None:
    """
    Look up a location by postcode or suburb name.
    Returns a dict with keys: suburb, state, postcode, lat, lon
    or None if not found.
    """
    query = query.strip()

    with get_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            if query.isdigit():
                cur.execute(
                    "SELECT suburb, state, postcode, lat, lon "
                    "FROM locations WHERE postcode = %s LIMIT 1",
                    (query,),
                )
            else:
                cur.execute(
                    "SELECT suburb, state, postcode, lat, lon "
                    "FROM locations WHERE LOWER(suburb) = LOWER(%s) LIMIT 1",
                    (query,),
                )
            row = cur.fetchone()

    return dict(row) if row else None
