/**
 * Generic Types for Multi-Industry CRM
 * These types work across all industries by being configurable
 */

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  agencyId: string;
}

// Primary Entity (Property, Policy, Job, Product, etc.)
export interface PrimaryEntity extends BaseEntity {
  [key: string]: any; // Dynamic fields based on industry config
}

// Lead Entity
export interface Lead extends BaseEntity {
  name: string;
  email: string;
  phone?: string;
  stage: string;
  assignedTo?: string;
  source?: string;
  tags?: string[];
  lastContactDate?: string;
  nextFollowUpDate?: string;
  notes?: string;
  customFields?: Record<string, any>;
}

// Transaction Entity
export interface Transaction extends BaseEntity {
  leadId: string;
  primaryEntityId?: string;
  stage: string;
  value: number;
  assignedTo?: string;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  probability?: number;
  customFields?: Record<string, any>;
}

// Contact Entity
export interface Contact extends BaseEntity {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
  tags?: string[];
  notes?: string;
}

// Agent/User Entity
export interface Agent extends BaseEntity {
  name: string;
  email: string;
  role: 'admin' | 'agent' | 'manager';
  avatar?: string;
  isActive: boolean;
  slackUserId?: string;
}

// Agency/Organization Entity
export interface Agency {
  id: string;
  name: string;
  slackTeamId: string;
  slackTeamName: string;
  createdAt: string;
  settings?: {
    timezone?: string;
    currency?: string;
    dateFormat?: string;
    industry?: string;
  };
}

// Activity/Event
export interface Activity {
  id: string;
  type: 'note' | 'email' | 'call' | 'sms' | 'meeting' | 'task' | 'system';
  entityType: 'lead' | 'transaction' | 'contact' | 'primary';
  entityId: string;
  agencyId: string;
  userId: string;
  userName: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// Document
export interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  entityType: 'lead' | 'transaction' | 'contact' | 'primary';
  entityId: string;
  agencyId: string;
  uploadedBy: string;
  uploadedAt: string;
}

// Appointment
export interface Appointment {
  id: string;
  title: string;
  description?: string;
  type: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees: string[];
  entityType?: 'lead' | 'transaction' | 'contact' | 'primary';
  entityId?: string;
  agencyId: string;
  createdBy: string;
  createdAt: string;
}

// Communication
export interface Communication {
  id: string;
  channel: 'email' | 'sms' | 'slack' | 'phone';
  direction: 'inbound' | 'outbound';
  from: string;
  to: string;
  subject?: string;
  body: string;
  status: 'sent' | 'delivered' | 'failed' | 'read';
  entityType?: 'lead' | 'transaction' | 'contact';
  entityId?: string;
  agencyId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Analytics
export interface Metric {
  name: string;
  value: number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  format?: 'number' | 'currency' | 'percentage';
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  validation?: any;
}

// Filter Types
export interface Filter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
  value: any;
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

export interface QueryParams {
  page?: number;
  pageSize?: number;
  filters?: Filter[];
  sort?: SortOption;
  search?: string;
}
