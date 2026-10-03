import { NextResponse } from 'next/server';
import { getAdminContext } from '@/lib/auth/admin';

export async function GET() {
  const context = await getAdminContext();

  if (!context.ok) {
    return NextResponse.json({ isAdmin: false }, { status: context.status });
  }

  return NextResponse.json({ isAdmin: true }, { headers: { 'Cache-Control': 'no-store' } });
}