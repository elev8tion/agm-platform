import { dataStore, type Agency, type Channel, type Message, type Member } from './dataStore';

export type WorkspaceSnapshot = {
  workspace: Agency;
  channels: Channel[];
  messagesByChannel: Record<string, Message[]>;
  members: Member[];
};

export async function fetchWorkspaceSnapshot(agencyId?: string): Promise<WorkspaceSnapshot> {
  // Default to first agency if none specified
  const agencies = await dataStore.listWorkspaces();
  const workspace = agencyId
    ? await dataStore.getAgency(agencyId) || agencies[0]
    : agencies[0];

  if (!workspace) {
    throw new Error('No agency found');
  }

  const channels = await dataStore.listChannels(workspace.id);
  const members = await dataStore.getMembers(workspace.id);

  const messagesByChannel: Record<string, Message[]> = {};
  for (const channel of channels) {
    const messages = await dataStore.getMessages(channel.id);
    messagesByChannel[channel.id] = messages;
  }

  return {
    workspace,
    channels,
    messagesByChannel,
    members
  };
}
