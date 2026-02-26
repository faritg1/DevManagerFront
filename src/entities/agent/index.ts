/**
 * Entity: Agent
 * Re-export domain types from shared/types to introduce the `entities` layer
 * Keep original types in `src/shared/types` as the canonical source during migration.
 */

export type {
  Agent,
  AgentType,
  AgentStatus,
  AgentConfiguration,
  AgentMetrics,
} from '../../shared/types';
