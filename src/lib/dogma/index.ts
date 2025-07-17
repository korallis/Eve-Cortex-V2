/**
 * Dogma System - Main Export
 * EVE Online's Dogma calculation system for ship fitting and performance analysis
 */

// Main engine
export { DogmaEngine, dogmaEngine } from './dogma-engine'

// Core calculators
export { AttributeCalculator } from './attribute-calculator'
export { PerformanceCalculator } from './performance-calculator'
export { FittingValidator } from './fitting-validator'

// SDE integration
export { SDEIntegration, sdeIntegration } from './sde-integration'

// Constants
export * from './constants'

// Types
export type * from '@/types/dogma'

// Utility functions
export {
  createBasicFittingContext,
  validateModuleSlot,
  calculateStackingPenalty,
  formatPerformanceMetrics,
} from './utils'
