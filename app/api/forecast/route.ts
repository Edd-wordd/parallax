import { NextResponse, type NextRequest } from "next/server";
import {
  assembleSiteSessionForecast,
  serializeSiteSessionForecast,
} from "@/lib/forecast/assemble";

/**
 * GET /api/forecast?lat=&lon=&sessionStart=&sessionEnd=&includeAstroWx=1
 * Proxies Open-Meteo (+ optional 7Timer) for the session interval.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));
  const sessionStartRaw = searchParams.get("sessionStart");
  const sessionEndRaw = searchParams.get("sessionEnd");
  const includeAstroWx = searchParams.get("includeAstroWx") !== "0";
  const moonInterference = searchParams.get("moonInterference");

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return NextResponse.json(
      { error: "Invalid lat/lon" },
      { status: 400 },
    );
  }
  if (!sessionStartRaw || !sessionEndRaw) {
    return NextResponse.json(
      { error: "sessionStart and sessionEnd are required (ISO)" },
      { status: 400 },
    );
  }
  const sessionStart = new Date(sessionStartRaw);
  const sessionEnd = new Date(sessionEndRaw);
  if (
    Number.isNaN(sessionStart.getTime()) ||
    Number.isNaN(sessionEnd.getTime()) ||
    sessionEnd.getTime() <= sessionStart.getTime()
  ) {
    return NextResponse.json(
      { error: "Invalid session interval" },
      { status: 400 },
    );
  }

  const forecast = await assembleSiteSessionForecast({
    latDeg: lat,
    lonDeg: lon,
    sessionStart,
    sessionEnd,
    includeAstroWx,
    moonInterference: moonInterference || null,
  });

  return NextResponse.json(serializeSiteSessionForecast(forecast), {
    headers: {
      "Cache-Control": "private, max-age=1800",
    },
  });
}
