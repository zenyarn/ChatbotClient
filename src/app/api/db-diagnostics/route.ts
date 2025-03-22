import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    usePostgres: process.env.USE_POSTGRES,
    databaseType: "PostgreSQL", // 强制为PostgreSQL
    serverTime: new Date().toISOString()
  });
}
