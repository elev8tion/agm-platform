/**
 * Configuration Loader
 * Dynamically loads industry configuration and makes it available throughout the app
 */

import industryConfig from '../../config/industry.json';
import themeConfig from '../../config/theme.json';

export interface FieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'currency' | 'date' | 'datetime' | 'select' | 'multiselect' | 'boolean' | 'email' | 'phone' | 'url' | 'reference';
  required: boolean;
  options?: string[];
  reference?: string;
}

export interface EntityStage {
  name: string;
  label: string;
  color: string;
  order: number;
}

export interface EntityConfig {
  singular: string;
  plural: string;
  icon: string;
  description?: string;
  stages?: EntityStage[];
  fields: FieldDefinition[];
}

export interface IndustryConfig {
  industry: {
    name: string;
    displayName: string;
    description: string;
    icon: string;
  };
  entities: {
    primary: EntityConfig;
    lead: EntityConfig;
    transaction: EntityConfig;
    contact: EntityConfig;
    agent: EntityConfig;
  };
  terminology: {
    agent: string;
    client: string;
    deal: string;
    pipeline: string;
    commission: string;
    appointment: string;
  };
  features: {
    appointments: {
      enabled: boolean;
      types: string[];
    };
    documents: {
      enabled: boolean;
      types: string[];
    };
    communications: {
      enabled: boolean;
      channels: string[];
    };
    analytics: {
      enabled: boolean;
      metrics: string[];
    };
  };
  integrations: Record<string, {
    enabled: boolean;
    description: string;
  }>;
}

export interface ThemeConfig {
  brand: {
    name: string;
    tagline: string;
    logo: string;
    logoLight?: string;
    logoDark?: string;
    favicon: string;
    appleTouchIcon?: string;
  };
  colors: {
    primary: any;
    secondary: any;
    accent: any;
    success: any;
    warning: any;
    error: any;
    info: any;
    background: any;
    surface: any;
    text: any;
    border: any;
  };
  typography: any;
  spacing: any;
  borderRadius: any;
  shadows: any;
  breakpoints: any;
  darkMode?: any;
  components?: any;
}

// Load configurations
export const config: IndustryConfig = industryConfig as IndustryConfig;
export const theme: ThemeConfig = themeConfig as ThemeConfig;

// Helper functions
export function getEntityConfig(entityType: keyof IndustryConfig['entities']): EntityConfig {
  return config.entities[entityType];
}

export function getEntityLabel(entityType: keyof IndustryConfig['entities'], plural: boolean = false): string {
  const entity = config.entities[entityType];
  return plural ? entity.plural : entity.singular;
}

export function getStages(entityType: 'lead' | 'transaction'): EntityStage[] {
  return config.entities[entityType].stages || [];
}

export function getTerminology(term: keyof IndustryConfig['terminology']): string {
  return config.terminology[term];
}

export function isFeatureEnabled(feature: keyof IndustryConfig['features']): boolean {
  return config.features[feature]?.enabled || false;
}

export function getIntegrationStatus(integration: string): boolean {
  return config.integrations[integration]?.enabled || false;
}

// Theme helpers
export function getColor(colorPath: string): string {
  const parts = colorPath.split('.');
  let value: any = theme.colors;

  for (const part of parts) {
    value = value?.[part];
  }

  return typeof value === 'string' ? value : value?.DEFAULT || '#000000';
}

export function getBrandAsset(asset: keyof ThemeConfig['brand']): string {
  return theme.brand[asset] || '';
}

// Export for use in components
export default {
  config,
  theme,
  getEntityConfig,
  getEntityLabel,
  getStages,
  getTerminology,
  isFeatureEnabled,
  getIntegrationStatus,
  getColor,
  getBrandAsset,
};
