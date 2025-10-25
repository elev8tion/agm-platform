import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/services/dataStore';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agencyId = searchParams.get('agencyId');

  if (!agencyId) {
    return NextResponse.json({ error: 'agencyId is required' }, { status: 400 });
  }

  try {
    const properties = await dataStore.listProperties(agencyId);
    return NextResponse.json({ properties });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const property = await dataStore.createProperty(body);
    return NextResponse.json({ property }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
