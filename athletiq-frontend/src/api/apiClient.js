// DEPRECATED: Use '@/utils/apiClient' instead for consolidated API client.
// This file re-exports the unified configured instance to avoid breaking existing imports.
// All API calls should use the consolidated client with Django-specific configuration.
export { default, guardianAPI } from '../utils/apiClient';