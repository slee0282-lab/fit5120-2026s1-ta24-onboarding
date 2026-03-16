interface Env {
  OPENWEATHER_API_KEY: string
}

interface GeoResult {
  name: string
  state?: string
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
  let lat: number
  let lon: number
  let locationName: string

  if (latParam && lonParam) {
    // Direct coordinates — skip geocoding
    lat = parseFloat(latParam)
    lon = parseFloat(lonParam)
    locationName = 'Your location'

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return Response.json({ error: 'Invalid coordinates provided.' }, { status: 400 })
    }
  } else if (/^\d+$/.test(q)) {
    // Postcode — use zip geocoding endpoint
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
    exclude: 'minutely,hourly,daily,alerts',
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

  return Response.json({
    uv_index: Math.round(uv * 10) / 10,
    uv_category: uvCategory(uv),
    location: locationName,
  })
}
