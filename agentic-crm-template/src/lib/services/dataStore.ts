// Mock in-memory data store for AgRM
// Production-ready interface - swap for Prisma when ready

// ===== CORE TYPES (matches Prisma schema) =====

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  maxUsers: number;
  maxProperties: number;
  createdAt: Date;
  updatedAt: Date;
};

export type User = {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'BROKER' | 'AGENT' | 'VIEWER';
  passwordHash: string;
  avatar?: string;
  phone?: string;
  twoFactorEnabled: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type Contact = {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  type: 'BUYER' | 'SELLER' | 'BOTH' | 'REFERRAL';
  source?: string;
  rating?: number;
  tags: string[];
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Lead = {
  id: string;
  tenantId: string;
  contactId: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';
  source: string;
  score?: number;
  temperature: 'HOT' | 'WARM' | 'COLD';
  budget?: number;
  timeline?: string;
  notes?: string;
  ownerId: string;
  pipelineStageId?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Property = {
  id: string;
  tenantId: string;
  mlsId?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  lotSize?: number;
  yearBuilt?: number;
  propertyType: 'RESIDENTIAL' | 'COMMERCIAL' | 'LAND' | 'RENTAL';
  status: 'AVAILABLE' | 'PENDING' | 'SOLD' | 'OFF_MARKET';
  description?: string;
  features?: string[];
  images?: string[];
  virtualTourUrl?: string;
  listingAgentId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Transaction = {
  id: string;
  tenantId: string;
  propertyId: string;
  buyerContactId?: string;
  sellerContactId?: string;
  status: 'PENDING' | 'UNDER_CONTRACT' | 'CLOSED' | 'CANCELLED';
  offerAmount: number;
  closingDate?: Date;
  commissionRate?: number;
  commissionAmount?: number;
  buyerAgentId?: string;
  listingAgentId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Task = {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: Date;
  assigneeId: string;
  creatorId: string;
  relatedType?: string;
  relatedId?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Appointment = {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  type: 'SHOWING' | 'MEETING' | 'CALL' | 'CLOSING' | 'OTHER';
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  hostId: string;
  attendees: string[];
  propertyId?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Email = {
  id: string;
  tenantId: string;
  to: string[];
  from: string;
  subject: string;
  body: string;
  status: 'DRAFT' | 'SENT' | 'FAILED' | 'BOUNCED';
  sentAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  senderId: string;
  templateId?: string;
  contactId?: string;
  createdAt: Date;
};

export type SMSMessage = {
  id: string;
  tenantId: string;
  to: string;
  from: string;
  body: string;
  status: 'SENT' | 'DELIVERED' | 'FAILED';
  sentAt?: Date;
  senderId: string;
  contactId?: string;
  createdAt: Date;
};

export type Campaign = {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: 'EMAIL' | 'SMS' | 'MIXED';
  status: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'PAUSED';
  startDate?: Date;
  endDate?: Date;
  targetAudience?: string;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Pipeline = {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: 'LEAD' | 'DEAL';
  isDefault: boolean;
  createdAt: Date;
};

export type PipelineStage = {
  id: string;
  pipelineId: string;
  name: string;
  description?: string;
  order: number;
  probability?: number;
  createdAt: Date;
};

export type Document = {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploaderId: string;
  relatedType?: string;
  relatedId?: string;
  createdAt: Date;
};

export type Note = {
  id: string;
  tenantId: string;
  content: string;
  authorId: string;
  relatedType?: string;
  relatedId?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Activity = {
  id: string;
  tenantId: string;
  type: string;
  description: string;
  userId: string;
  relatedType?: string;
  relatedId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
};

// ===== DATA STORE CLASS =====

class DataStore {
  // Core entities
  private tenants: Map<string, Tenant> = new Map();
  private users: Map<string, User> = new Map();

  // CRM entities
  private contacts: Map<string, Contact> = new Map();
  private leads: Map<string, Lead> = new Map();
  private properties: Map<string, Property> = new Map();
  private transactions: Map<string, Transaction> = new Map();

  // Activity & Tasks
  private tasks: Map<string, Task> = new Map();
  private appointments: Map<string, Appointment> = new Map();
  private activities: Map<string, Activity> = new Map();

  // Communication
  private emails: Map<string, Email> = new Map();
  private smsMessages: Map<string, SMSMessage> = new Map();
  private campaigns: Map<string, Campaign> = new Map();

  // Workflow
  private pipelines: Map<string, Pipeline> = new Map();
  private pipelineStages: Map<string, PipelineStage> = new Map();

  // Documents & Notes
  private documents: Map<string, Document> = new Map();
  private notes: Map<string, Note> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    const now = new Date();

    // Seed tenant
    const tenant: Tenant = {
      id: 'tenant-1',
      name: 'Sunset Realty Group',
      slug: 'sunset-realty',
      plan: 'professional',
      status: 'active',
      maxUsers: 50,
      maxProperties: 500,
      createdAt: now,
      updatedAt: now
    };
    this.tenants.set(tenant.id, tenant);

    // Seed users
    const users: User[] = [
      {
        id: 'user-1',
        tenantId: 'tenant-1',
        email: 'sarah@sunsetrealty.com',
        name: 'Sarah Agent',
        role: 'AGENT',
        passwordHash: '$2a$10$mock.hash.for.demo',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
        phone: '555-0100',
        twoFactorEnabled: false,
        isActive: true,
        lastLoginAt: now,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'user-2',
        tenantId: 'tenant-1',
        email: 'mike@sunsetrealty.com',
        name: 'Mike Broker',
        role: 'BROKER',
        passwordHash: '$2a$10$mock.hash.for.demo',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
        phone: '555-0200',
        twoFactorEnabled: false,
        isActive: true,
        lastLoginAt: now,
        createdAt: now,
        updatedAt: now
      }
    ];
    users.forEach(u => this.users.set(u.id, u));

    // Seed pipeline
    const pipeline: Pipeline = {
      id: 'pipeline-1',
      tenantId: 'tenant-1',
      name: 'Sales Pipeline',
      description: 'Standard lead to close pipeline',
      type: 'LEAD',
      isDefault: true,
      createdAt: now
    };
    this.pipelines.set(pipeline.id, pipeline);

    // Seed pipeline stages
    const stages: PipelineStage[] = [
      { id: 'stage-1', pipelineId: 'pipeline-1', name: 'New Lead', order: 1, probability: 10, createdAt: now },
      { id: 'stage-2', pipelineId: 'pipeline-1', name: 'Contacted', order: 2, probability: 25, createdAt: now },
      { id: 'stage-3', pipelineId: 'pipeline-1', name: 'Qualified', order: 3, probability: 50, createdAt: now },
      { id: 'stage-4', pipelineId: 'pipeline-1', name: 'Under Contract', order: 4, probability: 75, createdAt: now },
      { id: 'stage-5', pipelineId: 'pipeline-1', name: 'Closed', order: 5, probability: 100, createdAt: now }
    ];
    stages.forEach(s => this.pipelineStages.set(s.id, s));

    // Seed contacts
    const contacts: Contact[] = [
      {
        id: 'contact-1',
        tenantId: 'tenant-1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@example.com',
        phone: '555-1000',
        type: 'BUYER',
        source: 'Open House',
        rating: 5,
        tags: ['first-time-buyer', 'pre-approved'],
        ownerId: 'user-1',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'contact-2',
        tenantId: 'tenant-1',
        firstName: 'Emily',
        lastName: 'Johnson',
        email: 'emily@example.com',
        phone: '555-2000',
        type: 'SELLER',
        source: 'Referral',
        rating: 4,
        tags: ['motivated-seller'],
        ownerId: 'user-1',
        createdAt: now,
        updatedAt: now
      }
    ];
    contacts.forEach(c => this.contacts.set(c.id, c));

    // Seed properties
    const properties: Property[] = [
      {
        id: 'prop-1',
        tenantId: 'tenant-1',
        mlsId: 'MLS123456',
        address: '123 Sunset Blvd',
        city: 'Beverly Hills',
        state: 'CA',
        zipCode: '90210',
        price: 2500000,
        bedrooms: 4,
        bathrooms: 3,
        sqft: 3500,
        lotSize: 8000,
        yearBuilt: 2020,
        propertyType: 'RESIDENTIAL',
        status: 'AVAILABLE',
        description: 'Stunning luxury home with ocean views, modern finishes, and smart home technology throughout.',
        features: ['Pool', 'Smart Home', 'Ocean View', 'Gourmet Kitchen', 'Home Theater'],
        images: [
          'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'
        ],
        listingAgentId: 'user-1',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'prop-2',
        tenantId: 'tenant-1',
        address: '456 Pacific Coast Hwy',
        city: 'Malibu',
        state: 'CA',
        zipCode: '90265',
        price: 4750000,
        bedrooms: 5,
        bathrooms: 4,
        sqft: 5200,
        lotSize: 12000,
        yearBuilt: 2022,
        propertyType: 'RESIDENTIAL',
        status: 'AVAILABLE',
        description: 'Beachfront estate with panoramic ocean views, private beach access, and resort-style amenities.',
        features: ['Beach Front', 'Wine Cellar', 'Gym', 'Guest House', 'Infinity Pool'],
        images: [
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
        ],
        listingAgentId: 'user-2',
        createdAt: now,
        updatedAt: now
      }
    ];
    properties.forEach(p => this.properties.set(p.id, p));

    // Seed leads
    const leads: Lead[] = [
      {
        id: 'lead-1',
        tenantId: 'tenant-1',
        contactId: 'contact-1',
        status: 'QUALIFIED',
        source: 'Open House',
        score: 85,
        temperature: 'HOT',
        budget: 2500000,
        timeline: '3 months',
        notes: 'Very interested in Beverly Hills properties. Pre-approved for $3M.',
        ownerId: 'user-1',
        pipelineStageId: 'stage-3',
        createdAt: now,
        updatedAt: now
      }
    ];
    leads.forEach(l => this.leads.set(l.id, l));

    // Seed tasks
    const tasks: Task[] = [
      {
        id: 'task-1',
        tenantId: 'tenant-1',
        title: 'Follow up with John Smith',
        description: 'Schedule property showing for Beverly Hills listing',
        status: 'TODO',
        priority: 'HIGH',
        dueDate: new Date(now.getTime() + 86400000), // Tomorrow
        assigneeId: 'user-1',
        creatorId: 'user-1',
        relatedType: 'lead',
        relatedId: 'lead-1',
        createdAt: now,
        updatedAt: now
      }
    ];
    tasks.forEach(t => this.tasks.set(t.id, t));

    // Seed appointments
    const appointments: Appointment[] = [
      {
        id: 'apt-1',
        tenantId: 'tenant-1',
        title: 'Property Showing - 123 Sunset Blvd',
        description: 'First showing with John Smith',
        startTime: new Date(now.getTime() + 172800000), // 2 days from now
        endTime: new Date(now.getTime() + 176400000), // 2 days + 1 hour
        location: '123 Sunset Blvd, Beverly Hills, CA 90210',
        type: 'SHOWING',
        status: 'SCHEDULED',
        hostId: 'user-1',
        attendees: ['contact-1'],
        propertyId: 'prop-1',
        createdAt: now,
        updatedAt: now
      }
    ];
    appointments.forEach(a => this.appointments.set(a.id, a));
  }

  // ===== TENANT METHODS =====
  async getTenant(id: string): Promise<Tenant | null> {
    return this.tenants.get(id) || null;
  }

  async listTenants(): Promise<Tenant[]> {
    return Array.from(this.tenants.values());
  }

  // ===== USER METHODS =====
  async getUser(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return Array.from(this.users.values()).find(u => u.email === email) || null;
  }

  async listUsers(tenantId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(u => u.tenantId === tenantId);
  }

  async createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const now = new Date();
    const user: User = {
      ...data,
      id: `user-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(user.id, user);
    return user;
  }

  // ===== CONTACT METHODS =====
  async getContact(id: string): Promise<Contact | null> {
    return this.contacts.get(id) || null;
  }

  async listContacts(tenantId: string, filters?: { ownerId?: string; type?: string }): Promise<Contact[]> {
    let contacts = Array.from(this.contacts.values()).filter(c => c.tenantId === tenantId);
    if (filters?.ownerId) {
      contacts = contacts.filter(c => c.ownerId === filters.ownerId);
    }
    if (filters?.type) {
      contacts = contacts.filter(c => c.type === filters.type);
    }
    return contacts;
  }

  async createContact(data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
    const now = new Date();
    const contact: Contact = {
      ...data,
      id: `contact-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    };
    this.contacts.set(contact.id, contact);
    return contact;
  }

  async updateContact(id: string, data: Partial<Contact>): Promise<Contact | null> {
    const existing = this.contacts.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.contacts.set(id, updated);
    return updated;
  }

  async deleteContact(id: string): Promise<boolean> {
    return this.contacts.delete(id);
  }

  // ===== LEAD METHODS =====
  async getLead(id: string): Promise<Lead | null> {
    return this.leads.get(id) || null;
  }

  async listLeads(tenantId: string, filters?: { ownerId?: string; status?: string }): Promise<Lead[]> {
    let leads = Array.from(this.leads.values()).filter(l => l.tenantId === tenantId);
    if (filters?.ownerId) {
      leads = leads.filter(l => l.ownerId === filters.ownerId);
    }
    if (filters?.status) {
      leads = leads.filter(l => l.status === filters.status);
    }
    return leads;
  }

  async createLead(data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> {
    const now = new Date();
    const lead: Lead = {
      ...data,
      id: `lead-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    };
    this.leads.set(lead.id, lead);
    return lead;
  }

  async updateLead(id: string, data: Partial<Lead>): Promise<Lead | null> {
    const existing = this.leads.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.leads.set(id, updated);
    return updated;
  }

  async deleteLead(id: string): Promise<boolean> {
    return this.leads.delete(id);
  }

  // ===== PROPERTY METHODS =====
  async getProperty(id: string): Promise<Property | null> {
    return this.properties.get(id) || null;
  }

  async listProperties(tenantId: string, filters?: { listingAgentId?: string; status?: string }): Promise<Property[]> {
    let properties = Array.from(this.properties.values()).filter(p => p.tenantId === tenantId);
    if (filters?.listingAgentId) {
      properties = properties.filter(p => p.listingAgentId === filters.listingAgentId);
    }
    if (filters?.status) {
      properties = properties.filter(p => p.status === filters.status);
    }
    return properties;
  }

  async createProperty(data: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<Property> {
    const now = new Date();
    const property: Property = {
      ...data,
      id: `prop-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    };
    this.properties.set(property.id, property);
    return property;
  }

  async updateProperty(id: string, data: Partial<Property>): Promise<Property | null> {
    const existing = this.properties.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.properties.set(id, updated);
    return updated;
  }

  async deleteProperty(id: string): Promise<boolean> {
    return this.properties.delete(id);
  }

  // ===== TRANSACTION METHODS =====
  async getTransaction(id: string): Promise<Transaction | null> {
    return this.transactions.get(id) || null;
  }

  async listTransactions(tenantId: string, filters?: { listingAgentId?: string; status?: string }): Promise<Transaction[]> {
    let transactions = Array.from(this.transactions.values()).filter(t => t.tenantId === tenantId);
    if (filters?.listingAgentId) {
      transactions = transactions.filter(t => t.listingAgentId === filters.listingAgentId);
    }
    if (filters?.status) {
      transactions = transactions.filter(t => t.status === filters.status);
    }
    return transactions;
  }

  async createTransaction(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const now = new Date();
    const transaction: Transaction = {
      ...data,
      id: `txn-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    };
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  async updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction | null> {
    const existing = this.transactions.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.transactions.set(id, updated);
    return updated;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    return this.transactions.delete(id);
  }

  // ===== TASK METHODS =====
  async getTask(id: string): Promise<Task | null> {
    return this.tasks.get(id) || null;
  }

  async listTasks(tenantId: string, filters?: { assigneeId?: string; status?: string }): Promise<Task[]> {
    let tasks = Array.from(this.tasks.values()).filter(t => t.tenantId === tenantId);
    if (filters?.assigneeId) {
      tasks = tasks.filter(t => t.assigneeId === filters.assigneeId);
    }
    if (filters?.status) {
      tasks = tasks.filter(t => t.status === filters.status);
    }
    return tasks;
  }

  async createTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const now = new Date();
    const task: Task = {
      ...data,
      id: `task-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    };
    this.tasks.set(task.id, task);
    return task;
  }

  async updateTask(id: string, data: Partial<Task>): Promise<Task | null> {
    const existing = this.tasks.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.tasks.set(id, updated);
    return updated;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // ===== APPOINTMENT METHODS =====
  async getAppointment(id: string): Promise<Appointment | null> {
    return this.appointments.get(id) || null;
  }

  async listAppointments(tenantId: string, filters?: { hostId?: string; status?: string }): Promise<Appointment[]> {
    let appointments = Array.from(this.appointments.values()).filter(a => a.tenantId === tenantId);
    if (filters?.hostId) {
      appointments = appointments.filter(a => a.hostId === filters.hostId);
    }
    if (filters?.status) {
      appointments = appointments.filter(a => a.status === filters.status);
    }
    return appointments;
  }

  async createAppointment(data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment> {
    const now = new Date();
    const appointment: Appointment = {
      ...data,
      id: `apt-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    };
    this.appointments.set(appointment.id, appointment);
    return appointment;
  }

  async updateAppointment(id: string, data: Partial<Appointment>): Promise<Appointment | null> {
    const existing = this.appointments.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.appointments.set(id, updated);
    return updated;
  }

  async deleteAppointment(id: string): Promise<boolean> {
    return this.appointments.delete(id);
  }

  // ===== EMAIL METHODS =====
  async getEmail(id: string): Promise<Email | null> {
    return this.emails.get(id) || null;
  }

  async listEmails(tenantId: string, filters?: { senderId?: string; contactId?: string }): Promise<Email[]> {
    let emails = Array.from(this.emails.values()).filter(e => e.tenantId === tenantId);
    if (filters?.senderId) {
      emails = emails.filter(e => e.senderId === filters.senderId);
    }
    if (filters?.contactId) {
      emails = emails.filter(e => e.contactId === filters.contactId);
    }
    return emails.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createEmail(data: Omit<Email, 'id' | 'createdAt'>): Promise<Email> {
    const email: Email = {
      ...data,
      id: `email-${Date.now()}`,
      createdAt: new Date()
    };
    this.emails.set(email.id, email);
    return email;
  }

  // ===== SMS METHODS =====
  async getSMSMessage(id: string): Promise<SMSMessage | null> {
    return this.smsMessages.get(id) || null;
  }

  async listSMSMessages(tenantId: string, filters?: { senderId?: string; contactId?: string }): Promise<SMSMessage[]> {
    let messages = Array.from(this.smsMessages.values()).filter(m => m.tenantId === tenantId);
    if (filters?.senderId) {
      messages = messages.filter(m => m.senderId === filters.senderId);
    }
    if (filters?.contactId) {
      messages = messages.filter(m => m.contactId === filters.contactId);
    }
    return messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createSMSMessage(data: Omit<SMSMessage, 'id' | 'createdAt'>): Promise<SMSMessage> {
    const sms: SMSMessage = {
      ...data,
      id: `sms-${Date.now()}`,
      createdAt: new Date()
    };
    this.smsMessages.set(sms.id, sms);
    return sms;
  }

  // ===== PIPELINE METHODS =====
  async getPipeline(id: string): Promise<Pipeline | null> {
    return this.pipelines.get(id) || null;
  }

  async listPipelines(tenantId: string): Promise<Pipeline[]> {
    return Array.from(this.pipelines.values()).filter(p => p.tenantId === tenantId);
  }

  async listPipelineStages(pipelineId: string): Promise<PipelineStage[]> {
    return Array.from(this.pipelineStages.values())
      .filter(s => s.pipelineId === pipelineId)
      .sort((a, b) => a.order - b.order);
  }

  // ===== NOTE METHODS =====
  async listNotes(tenantId: string, filters?: { authorId?: string; relatedId?: string }): Promise<Note[]> {
    let notes = Array.from(this.notes.values()).filter(n => n.tenantId === tenantId);
    if (filters?.authorId) {
      notes = notes.filter(n => n.authorId === filters.authorId);
    }
    if (filters?.relatedId) {
      notes = notes.filter(n => n.relatedId === filters.relatedId);
    }
    return notes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createNote(data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    const now = new Date();
    const note: Note = {
      ...data,
      id: `note-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    };
    this.notes.set(note.id, note);
    return note;
  }

  // ===== ACTIVITY METHODS =====
  async listActivities(tenantId: string, filters?: { userId?: string; relatedId?: string }): Promise<Activity[]> {
    let activities = Array.from(this.activities.values()).filter(a => a.tenantId === tenantId);
    if (filters?.userId) {
      activities = activities.filter(a => a.userId === filters.userId);
    }
    if (filters?.relatedId) {
      activities = activities.filter(a => a.relatedId === filters.relatedId);
    }
    return activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createActivity(data: Omit<Activity, 'id' | 'createdAt'>): Promise<Activity> {
    const activity: Activity = {
      ...data,
      id: `act-${Date.now()}`,
      createdAt: new Date()
    };
    this.activities.set(activity.id, activity);
    return activity;
  }
}

export const dataStore = new DataStore();
