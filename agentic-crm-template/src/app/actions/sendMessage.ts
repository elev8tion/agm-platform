"use server";

import { revalidatePath } from 'next/cache';
import { dataStore } from '@/lib/services/dataStore';

type SendMessageInput = {
  channelId: string;
  authorId: string;
  body: string;
  isAi?: boolean;
  propertyId?: string;
  leadId?: string;
};

export const sendMessage = async (input: SendMessageInput) => {
  if (!input.body.trim()) {
    throw new Error('Message body is required.');
  }

  await dataStore.createMessage({
    channelId: input.channelId,
    authorId: input.authorId,
    body: input.body,
    isAi: input.isAi,
    propertyId: input.propertyId,
    leadId: input.leadId
  });

  revalidatePath('/');
};
