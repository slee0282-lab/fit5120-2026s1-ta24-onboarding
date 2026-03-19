// Cloudflare Pages Function: handles GET /api/uv
// This file runs server-side on Cloudflare's edge infrastructure — NOT in the browser.
// Flow: Frontend → Cloudflare (this function) → OpenWeatherMap API → response back to frontend
// The API key is injected at runtime from Cloudflare Secrets (never exposed to the client).

interface Env {
  OPENWEATHER_API_KEY: string
  DB?: D1Database
}

interface GeoResult {
  name: string
  state?: string
  country?: string
  lat: number
  lon: number
}

interface ZipResult {
  name: string
  lat: number
  lon: number
}

interface UVResponse {
  current?: { uvi?: number }
  hourly?: Array<{ dt: number; uvi?: number }>
}

interface PostcodeGeoRow {
  postcode: string
  suburb: string
  state: string
  latitude: number
  longitude: number
}

function formatVicLocation(row: Pick<PostcodeGeoRow, 'suburb' | 'postcode' | 'state'>): string {
  return `${row.suburb} ${row.postcode}, ${row.state}`
}

async function lookupByPostcode(db: D1Database | undefined, postcode: string): Promise<PostcodeGeoRow | null> {
  if (!db) return null

  return await db
    .prepare(
      `
      SELECT postcode, suburb, state, latitude, longitude
      FROM postcodes_geo
      WHERE postcode = ?
        AND state = 'VIC'
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND latitude != 0
        AND longitude != 0
      ORDER BY suburb ASC
      LIMIT 1
      `,
    )
    .bind(postcode)
    .first<PostcodeGeoRow>()
}

async function lookupNearestVicSuburb(
  db: D1Database | undefined,
  lat: number,
  lon: number,
): Promise<PostcodeGeoRow | null> {
  if (!db) return null

  return await db
    .prepare(
      `
      SELECT postcode, suburb, state, latitude, longitude
      FROM postcodes_geo
      WHERE state = 'VIC'
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND latitude != 0
        AND longitude != 0
      ORDER BY ((latitude - ?) * (latitude - ?)) + ((longitude - ?) * (longitude - ?)) ASC
      LIMIT 1
      `,
    )
    .bind(lat, lat, lon, lon)
    .first<PostcodeGeoRow>()
}

function uvCategory(uv: number): string {
  if (uv < 3) return 'Low'
  if (uv < 6) return 'Moderate'
  if (uv < 8) return 'High'
  if (uv < 11) return 'Very High'
  return 'Extreme'
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const q = url.searchParams.get('q')?.trim() ?? ''
  const latParam = url.searchParams.get('lat')
  const lonParam = url.searchParams.get('lon')

  if (!q && (!latParam || !lonParam)) {
    return Response.json({ error: 'Please provide a suburb, postcode, or coordinates.' }, { status: 400 })
  }

  if (q.length > 100) {
    return Response.json({ error: 'Query too long.' }, { status: 400 })
  }

  const apiKey = env.OPENWEATHER_API_KEY
  const db = env.DB
  let lat: number
  let lon: number
  let locationName: string

  if (latParam && lonParam) {
    // Direct coordinates — reverse geocode to a readable suburb/city name
    lat = parseFloat(latParam)
    lon = parseFloat(lonParam)
    locationName = 'Your location'

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return Response.json({ error: 'Invalid coordinates provided.' }, { status: 400 })
    }

    const nearestVicSuburb = await lookupNearestVicSuburb(db, lat, lon)
    if (nearestVicSuburb) {
      locationName = formatVicLocation(nearestVicSuburb)
    }

    if (!nearestVicSuburb) {
      const reverseParams = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        limit: '5',
        appid: apiKey,
      })
      const reverseRes = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?${reverseParams}`)

      if (reverseRes.ok) {
        const places = (await reverseRes.json()) as GeoResult[]
        const place = places.find((p) => p.state === 'Victoria') ?? places[0]

        if (place?.name) {
          locationName = `${place.name}, ${place.state ?? place.country ?? 'VIC'}`
        }
      }
    }
  } else if (/^\d+$/.test(q)) {
    // Postcode — prefer local AU postcode dataset, then fall back to OpenWeather zip geocoding
    const localMatch = await lookupByPostcode(db, q)

    if (localMatch) {
      lat = localMatch.latitude
      lon = localMatch.longitude
      locationName = formatVicLocation(localMatch)
    } else {
      const params = new URLSearchParams({ zip: `${q},AU`, appid: apiKey })
      const res = await fetch(`https://api.openweathermap.org/geo/1.0/zip?${params}`)

      if (res.status === 404) {
        return Response.json(
          { error: 'Location not found. Please try a different suburb or postcode.' },
          { status: 404 },
        )
      }
      if (!res.ok) {
        return Response.json(
          { error: 'UV data is currently unavailable. Please try again later.' },
          { status: 503 },
        )
      }

      const data = (await res.json()) as ZipResult
      lat = data.lat
      lon = data.lon
      locationName = `${data.name}, VIC`
    }
  } else {
    // Suburb name — use direct geocoding endpoint
    const params = new URLSearchParams({ q: `${q},VIC,AU`, limit: '5', appid: apiKey })
    const res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?${params}`)

    if (!res.ok) {
      return Response.json(
        { error: 'UV data is currently unavailable. Please try again later.' },
        { status: 503 },
      )
    }

    const data = (await res.json()) as GeoResult[]
    const location = data.find((l) => l.state === 'Victoria') ?? data[0]

    if (!location) {
      return Response.json(
        { error: 'Location not found. Please try a different suburb or postcode.' },
        { status: 404 },
      )
    }

    lat = location.lat
    lon = location.lon
    locationName = `${location.name}, ${location.state ?? 'VIC'}`
  }

  // Fetch UV index
  const uvParams = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    exclude: 'minutely,daily,alerts',
    appid: apiKey,
  })
  const uvRes = await fetch(`https://api.openweathermap.org/data/3.0/onecall?${uvParams}`)

  if (!uvRes.ok) {
    return Response.json(
      { error: 'UV data is currently unavailable. Please try again later.' },
      { status: 503 },
    )
  }

  const uvData = (await uvRes.json()) as UVResponse
  const uvRaw = uvData?.current?.uvi

  if (uvRaw == null) {
    return Response.json(
      { error: 'UV data is currently unavailable. Please try again later.' },
      { status: 503 },
    )
  }

  const uv = Number(uvRaw)
  const hourlyForecast = (uvData.hourly ?? [])
    .filter((entry) => typeof entry.dt === 'number' && entry.uvi != null)
    .slice(0, 24)
    .map((entry) => ({
      dt: entry.dt,
      uvi: Math.round(Number(entry.uvi) * 10) / 10,
    }))

  return Response.json({
    uv_index: Math.round(uv * 10) / 10,
    uv_category: uvCategory(uv),
    location: locationName,
    hourly_forecast: hourlyForecast,
  })
}
