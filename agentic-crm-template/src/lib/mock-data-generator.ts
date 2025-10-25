/**
 * Mock Data Generator
 * Generates mock data based on industry configuration
 */

import { config, getEntityConfig, getStages } from './config-loader';
import type { PrimaryEntity, Lead, Transaction, Contact, Agent, Agency } from './types';

// Helper to generate random ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Helper to generate random date
function randomDate(start: Date, end: Date): string {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

// Helper to pick random item from array
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Generate mock agency
export function generateMockAgency(): Agency {
  return {
    id: 'agency-1',
    name: config.industry.displayName + ' Agency',
    slackTeamId: 'T12345678',
    slackTeamName: 'Mock Workspace',
    createdAt: new Date().toISOString(),
    settings: {
      timezone: 'America/New_York',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      industry: config.industry.name,
    },
  };
}

// Generate mock agents
export function generateMockAgents(count: number = 5): Agent[] {
  const names = ['John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'David Wilson'];

  return Array.from({ length: count }, (_, i) => ({
    id: `agent-${i + 1}`,
    name: names[i] || `Agent ${i + 1}`,
    email: `agent${i + 1}@example.com`,
    role: i === 0 ? 'admin' : 'agent',
    avatar: `https://i.pravatar.cc/150?img=${i + 1}`,
    isActive: true,
    agencyId: 'agency-1',
    createdAt: randomDate(new Date(2024, 0, 1), new Date()),
    updatedAt: randomDate(new Date(2024, 0, 1), new Date()),
  })) as Agent[];
}

// Generate mock primary entities (Properties, Policies, Jobs, etc.)
export function generateMockPrimaryEntities(count: number = 20): PrimaryEntity[] {
  const entityConfig = getEntityConfig('primary');
  const entities: PrimaryEntity[] = [];

  for (let i = 0; i < count; i++) {
    const entity: PrimaryEntity = {
      id: `primary-${i + 1}`,
      agencyId: 'agency-1',
      createdAt: randomDate(new Date(2024, 0, 1), new Date()),
      updatedAt: randomDate(new Date(2024, 0, 1), new Date()),
      createdBy: `agent-${Math.floor(Math.random() * 5) + 1}`,
    };

    // Generate fields based on config
    entityConfig.fields.forEach(field => {
      switch (field.type) {
        case 'text':
          entity[field.name] = `${field.label} ${i + 1}`;
          break;
        case 'number':
          entity[field.name] = Math.floor(Math.random() * 100) + 1;
          break;
        case 'currency':
          entity[field.name] = Math.floor(Math.random() * 1000000) + 50000;
          break;
        case 'date':
          entity[field.name] = randomDate(new Date(2024, 0, 1), new Date(2025, 0, 1));
          break;
        case 'select':
          entity[field.name] = field.options ? randomItem(field.options) : '';
          break;
        case 'boolean':
          entity[field.name] = Math.random() > 0.5;
          break;
        case 'email':
          entity[field.name] = `contact${i + 1}@example.com`;
          break;
        case 'phone':
          entity[field.name] = `(555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
          break;
        case 'textarea':
          entity[field.name] = `Description for ${field.label.toLowerCase()} ${i + 1}. This is sample content.`;
          break;
        default:
          entity[field.name] = '';
      }
    });

    entities.push(entity);
  }

  return entities;
}

// Generate mock leads
export function generateMockLeads(count: number = 30): Lead[] {
  const stages = getStages('lead');
  const sources = ['Website', 'Referral', 'Cold Call', 'Social Media', 'Event', 'Partner'];
  const names = ['Alice Cooper', 'Bob Martinez', 'Carol White', 'Dan Lee', 'Eva Green'];

  return Array.from({ length: count }, (_, i) => ({
    id: `lead-${i + 1}`,
    name: names[i % names.length] || `Lead ${i + 1}`,
    email: `lead${i + 1}@example.com`,
    phone: `(555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    stage: stages[Math.floor(Math.random() * stages.length)]?.name || 'new',
    assignedTo: `agent-${Math.floor(Math.random() * 5) + 1}`,
    source: randomItem(sources),
    tags: ['hot', 'qualified', 'follow-up'].filter(() => Math.random() > 0.7),
    lastContactDate: randomDate(new Date(2024, 9, 1), new Date()),
    nextFollowUpDate: randomDate(new Date(), new Date(2024, 11, 31)),
    notes: `Sample notes for ${names[i % names.length]}`,
    agencyId: 'agency-1',
    createdAt: randomDate(new Date(2024, 8, 1), new Date()),
    updatedAt: randomDate(new Date(2024, 8, 1), new Date()),
    customFields: {},
  })) as Lead[];
}

// Generate mock transactions
export function generateMockTransactions(count: number = 15): Transaction[] {
  const stages = getStages('transaction');

  return Array.from({ length: count }, (_, i) => ({
    id: `transaction-${i + 1}`,
    leadId: `lead-${Math.floor(Math.random() * 30) + 1}`,
    primaryEntityId: `primary-${Math.floor(Math.random() * 20) + 1}`,
    stage: stages[Math.floor(Math.random() * stages.length)]?.name || 'pending',
    value: Math.floor(Math.random() * 500000) + 100000,
    assignedTo: `agent-${Math.floor(Math.random() * 5) + 1}`,
    expectedCloseDate: randomDate(new Date(), new Date(2024, 11, 31)),
    probability: Math.floor(Math.random() * 40) + 60,
    agencyId: 'agency-1',
    createdAt: randomDate(new Date(2024, 8, 1), new Date()),
    updatedAt: randomDate(new Date(2024, 8, 1), new Date()),
    customFields: {},
  })) as Transaction[];
}

// Generate mock contacts
export function generateMockContacts(count: number = 40): Contact[] {
  const roles = ['Client', 'Vendor', 'Partner', 'Contractor', 'Attorney', 'Other'];
  const companies = ['ABC Corp', 'XYZ Inc', 'Smith & Co', 'Johnson Group', 'Williams LLC'];

  return Array.from({ length: count }, (_, i) => ({
    id: `contact-${i + 1}`,
    name: `Contact ${i + 1}`,
    email: `contact${i + 1}@example.com`,
    phone: `(555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    company: randomItem(companies),
    role: randomItem(roles),
    tags: ['important', 'vip', 'vendor'].filter(() => Math.random() > 0.8),
    notes: `Notes for contact ${i + 1}`,
    agencyId: 'agency-1',
    createdAt: randomDate(new Date(2024, 0, 1), new Date()),
    updatedAt: randomDate(new Date(2024, 0, 1), new Date()),
  })) as Contact[];
}

// Export all mock data
export function generateAllMockData() {
  return {
    agency: generateMockAgency(),
    agents: generateMockAgents(5),
    primaryEntities: generateMockPrimaryEntities(20),
    leads: generateMockLeads(30),
    transactions: generateMockTransactions(15),
    contacts: generateMockContacts(40),
  };
}

export default {
  generateMockAgency,
  generateMockAgents,
  generateMockPrimaryEntities,
  generateMockLeads,
  generateMockTransactions,
  generateMockContacts,
  generateAllMockData,
};
