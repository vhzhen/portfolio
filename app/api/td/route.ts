import { NextResponse } from "next/server";

// Daily TD.TO history, proxied from Yahoo Finance so the browser doesn't
// hit CORS. Cached for an hour.
export const revalidate = 3600;

type Point = { time: string; value: number };

export async function GET() {
  // Cover a few months before the internship through "now".
  const period1 = Math.floor(new Date("2025-09-01T00:00:00Z").getTime() / 1000);
  const period2 = Math.floor(Date.now() / 1000);
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/TD.TO` +
    `?period1=${period1}&period2=${period2}&interval=1d`;

  try {
    const res = await fetch(url, {
      headers: {
        // Yahoo rejects requests without a browser-ish UA.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "application/json",
      },
      next: { revalidate },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Yahoo responded ${res.status}` },
        { status: 502 },
      );
    }

    const json = await res.json();
    const result = json?.chart?.result?.[0];
    const timestamps: number[] | undefined = result?.timestamp;
    const closes: (number | null)[] | undefined =
      result?.indicators?.quote?.[0]?.close;

    if (!timestamps || !closes) {
      return NextResponse.json(
        { error: "Unexpected Yahoo payload" },
        { status: 502 },
      );
    }

    const data: Point[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const close = closes[i];
      if (close == null) continue;
      data.push({
        time: new Date(timestamps[i] * 1000).toISOString().slice(0, 10),
        value: Number(close.toFixed(2)),
      });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach Yahoo Finance" },
      { status: 502 },
    );
  }
}
