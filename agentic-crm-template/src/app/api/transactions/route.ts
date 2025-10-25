import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/services/dataStore';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agencyId = searchParams.get('agencyId');

  if (!agencyId) {
    return NextResponse.json({ error: 'agencyId is required' }, { status: 400 });
  }

  try {
    const transactions = await dataStore.listTransactions(agencyId);
    return NextResponse.json({ transactions });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const transaction = await dataStore.createTransaction(body);
    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
