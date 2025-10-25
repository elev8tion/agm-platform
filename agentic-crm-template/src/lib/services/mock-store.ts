/**
 * Mock Data Store
 * In-memory data store for development/demo mode
 * Uses industry configuration to generate appropriate data
 */

import { generateAllMockData } from '../mock-data-generator';
import type {
  Agency,
  Agent,
  PrimaryEntity,
  Lead,
  Transaction,
  Contact,
  Activity
} from '../types';

class MockDataStore {
  private data: {
    agency: Agency | null;
    agents: Agent[];
    primaryEntities: PrimaryEntity[];
    leads: Lead[];
    transactions: Transaction[];
    contacts: Contact[];
    activities: Activity[];
  };

  constructor() {
    // Generate initial mock data based on industry config
    const mockData = generateAllMockData();

    this.data = {
      agency: mockData.agency,
      agents: mockData.agents,
      primaryEntities: mockData.primaryEntities,
      leads: mockData.leads,
      transactions: mockData.transactions,
      contacts: mockData.contacts,
      activities: [],
    };
  }

  // Agency methods
  getAgency(): Agency | null {
    return this.data.agency;
  }

  updateAgency(updates: Partial<Agency>): Agency | null {
    if (this.data.agency) {
      this.data.agency = { ...this.data.agency, ...updates };
    }
    return this.data.agency;
  }

  // Agent methods
  getAgents(): Agent[] {
    return this.data.agents;
  }

  getAgent(id: string): Agent | undefined {
    return this.data.agents.find(a => a.id === id);
  }

  createAgent(agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Agent {
    const newAgent: Agent = {
      ...agent,
      id: `agent-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.agents.push(newAgent);
    return newAgent;
  }

  updateAgent(id: string, updates: Partial<Agent>): Agent | null {
    const index = this.data.agents.findIndex(a => a.id === id);
    if (index !== -1) {
      this.data.agents[index] = {
        ...this.data.agents[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return this.data.agents[index];
    }
    return null;
  }

  deleteAgent(id: string): boolean {
    const index = this.data.agents.findIndex(a => a.id === id);
    if (index !== -1) {
      this.data.agents.splice(index, 1);
      return true;
    }
    return false;
  }

  // Primary Entity methods
  getPrimaryEntities(): PrimaryEntity[] {
    return this.data.primaryEntities;
  }

  getPrimaryEntity(id: string): PrimaryEntity | undefined {
    return this.data.primaryEntities.find(p => p.id === id);
  }

  createPrimaryEntity(entity: Omit<PrimaryEntity, 'id' | 'createdAt' | 'updatedAt'>): PrimaryEntity {
    const newEntity: PrimaryEntity = {
      ...entity,
      id: `primary-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.primaryEntities.push(newEntity);
    return newEntity;
  }

  updatePrimaryEntity(id: string, updates: Partial<PrimaryEntity>): PrimaryEntity | null {
    const index = this.data.primaryEntities.findIndex(p => p.id === id);
    if (index !== -1) {
      this.data.primaryEntities[index] = {
        ...this.data.primaryEntities[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return this.data.primaryEntities[index];
    }
    return null;
  }

  deletePrimaryEntity(id: string): boolean {
    const index = this.data.primaryEntities.findIndex(p => p.id === id);
    if (index !== -1) {
      this.data.primaryEntities.splice(index, 1);
      return true;
    }
    return false;
  }

  // Lead methods
  getLeads(): Lead[] {
    return this.data.leads;
  }

  getLead(id: string): Lead | undefined {
    return this.data.leads.find(l => l.id === id);
  }

  getLeadsByStage(stage: string): Lead[] {
    return this.data.leads.filter(l => l.stage === stage);
  }

  createLead(lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Lead {
    const newLead: Lead = {
      ...lead,
      id: `lead-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.leads.push(newLead);
    return newLead;
  }

  updateLead(id: string, updates: Partial<Lead>): Lead | null {
    const index = this.data.leads.findIndex(l => l.id === id);
    if (index !== -1) {
      this.data.leads[index] = {
        ...this.data.leads[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return this.data.leads[index];
    }
    return null;
  }

  deleteLead(id: string): boolean {
    const index = this.data.leads.findIndex(l => l.id === id);
    if (index !== -1) {
      this.data.leads.splice(index, 1);
      return true;
    }
    return false;
  }

  // Transaction methods
  getTransactions(): Transaction[] {
    return this.data.transactions;
  }

  getTransaction(id: string): Transaction | undefined {
    return this.data.transactions.find(t => t.id === id);
  }

  getTransactionsByStage(stage: string): Transaction[] {
    return this.data.transactions.filter(t => t.stage === stage);
  }

  createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Transaction {
    const newTransaction: Transaction = {
      ...transaction,
      id: `transaction-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.transactions.push(newTransaction);
    return newTransaction;
  }

  updateTransaction(id: string, updates: Partial<Transaction>): Transaction | null {
    const index = this.data.transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      this.data.transactions[index] = {
        ...this.data.transactions[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return this.data.transactions[index];
    }
    return null;
  }

  deleteTransaction(id: string): boolean {
    const index = this.data.transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      this.data.transactions.splice(index, 1);
      return true;
    }
    return false;
  }

  // Contact methods
  getContacts(): Contact[] {
    return this.data.contacts;
  }

  getContact(id: string): Contact | undefined {
    return this.data.contacts.find(c => c.id === id);
  }

  createContact(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Contact {
    const newContact: Contact = {
      ...contact,
      id: `contact-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.contacts.push(newContact);
    return newContact;
  }

  updateContact(id: string, updates: Partial<Contact>): Contact | null {
    const index = this.data.contacts.findIndex(c => c.id === id);
    if (index !== -1) {
      this.data.contacts[index] = {
        ...this.data.contacts[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return this.data.contacts[index];
    }
    return null;
  }

  deleteContact(id: string): boolean {
    const index = this.data.contacts.findIndex(c => c.id === id);
    if (index !== -1) {
      this.data.contacts.splice(index, 1);
      return true;
    }
    return false;
  }

  // Activity methods
  getActivities(entityType?: string, entityId?: string): Activity[] {
    if (entityType && entityId) {
      return this.data.activities.filter(
        a => a.entityType === entityType && a.entityId === entityId
      );
    }
    return this.data.activities;
  }

  createActivity(activity: Omit<Activity, 'id' | 'createdAt'>): Activity {
    const newActivity: Activity = {
      ...activity,
      id: `activity-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.data.activities.push(newActivity);
    return newActivity;
  }

  // Utility methods
  reset(): void {
    const mockData = generateAllMockData();
    this.data = {
      agency: mockData.agency,
      agents: mockData.agents,
      primaryEntities: mockData.primaryEntities,
      leads: mockData.leads,
      transactions: mockData.transactions,
      contacts: mockData.contacts,
      activities: [],
    };
  }

  clearAll(): void {
    this.data = {
      agency: null,
      agents: [],
      primaryEntities: [],
      leads: [],
      transactions: [],
      contacts: [],
      activities: [],
    };
  }
}

// Export singleton instance
export const mockStore = new MockDataStore();
export default mockStore;
