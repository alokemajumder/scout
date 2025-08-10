import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const payload = await req.json();
  const card = {
    type: "travel_scout_card",
    submittedAt: new Date().toISOString(),
    timeZone: process.env.TIME_ZONE || "UTC",
    data: payload,
  };
  return NextResponse.json(card);
}
