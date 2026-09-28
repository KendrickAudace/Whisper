import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { seedDemo } from "@/lib/seed";

export async function POST() {
  await seedDemo(getStore());
  return NextResponse.json({ ok: true });
}
