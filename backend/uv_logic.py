import os
import requests


OPENWEATHER_API_URL = "https://api.openweathermap.org/data/3.0/onecall"


def fetch_uv(lat: float, lon: float) -> float:
    """
    Fetch the current UV index from OpenWeather One Call API 3.0.
    Returns the UV index as a float.
    Raises ValueError if the API returns an error.
    Raises RuntimeError if the request fails.
    """
    api_key = os.environ["OPENWEATHER_API_KEY"]

    try:
        resp = requests.get(
            OPENWEATHER_API_URL,
            params={
                "lat": lat,
                "lon": lon,
                "exclude": "minutely,hourly,daily,alerts",
                "appid": api_key,
            },
            timeout=10,
        )
    except requests.RequestException as exc:
        raise RuntimeError("Failed to contact weather service") from exc

    if resp.status_code == 401:
        raise ValueError("Invalid API key")
    if not resp.ok:
        raise RuntimeError(f"Weather API error: {resp.status_code}")

    data = resp.json()
    uv_index = data.get("current", {}).get("uvi")

    if uv_index is None:
        raise RuntimeError("UV index not present in API response")

    return float(uv_index)


def uv_category(uv: float) -> str:
    if uv <= 2:
        return "Low"
    if uv <= 5:
        return "Moderate"
    if uv <= 7:
        return "High"
    if uv <= 10:
        return "Very High"
    return "Extreme"
