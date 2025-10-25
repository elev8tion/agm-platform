import { NextResponse } from 'next/server';
import { fetchWorkspaceSnapshot } from '@/lib/services/snapshot';

export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId') ?? undefined;
  const channelId = searchParams.get('channelId') ?? undefined;

  const snapshot = await fetchWorkspaceSnapshot(workspaceId);
  const selectedChannel = channelId ?? snapshot.channels[0]?.id;

  return NextResponse.json({
    ...snapshot,
    selectedChannel
  });
}
