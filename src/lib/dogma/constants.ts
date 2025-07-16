/**
 * Dogma System Constants
 * Core constants and attribute IDs used in EVE Online's Dogma system
 */

// Core Ship Attributes
export const DOGMA_ATTRIBUTES = {
  // Hull Attributes
  HP: 9,
  ARMOR_HP: 265,
  SHIELD_HP: 263,

  // Resistances - Shield
  SHIELD_EM_RESIST: 271,
  SHIELD_THERMAL_RESIST: 274,
  SHIELD_KINETIC_RESIST: 273,
  SHIELD_EXPLOSIVE_RESIST: 272,

  // Resistances - Armor
  ARMOR_EM_RESIST: 267,
  ARMOR_THERMAL_RESIST: 270,
  ARMOR_KINETIC_RESIST: 269,
  ARMOR_EXPLOSIVE_RESIST: 268,

  // Resistances - Hull
  HULL_EM_RESIST: 113,
  HULL_THERMAL_RESIST: 110,
  HULL_KINETIC_RESIST: 109,
  HULL_EXPLOSIVE_RESIST: 111,

  // Capacitor
  CAPACITOR_CAPACITY: 482,
  CAPACITOR_RECHARGE: 55,

  // Fitting
  CPU: 48,
  POWERGRID: 11,
  UPGRADE_CAPACITY: 1132,

  // Speed and Navigation
  MAX_VELOCITY: 37,
  MASS: 4,
  AGILITY: 70,
  WARP_SPEED_MULTIPLIER: 600,

  // Targeting
  MAX_TARGETS: 192,
  MAX_TARGET_RANGE: 76,
  SCAN_RESOLUTION: 564,
  SIGNATURE_RADIUS: 552,

  // Slots
  HIGH_SLOTS: 14,
  MED_SLOTS: 13,
  LOW_SLOTS: 12,
  RIG_SLOTS: 1137,
  LAUNCHER_SLOTS: 101,
  TURRET_SLOTS: 102,

  // Damage
  EM_DAMAGE: 114,
  THERMAL_DAMAGE: 118,
  KINETIC_DAMAGE: 117,
  EXPLOSIVE_DAMAGE: 116,

  // Weapon Attributes
  DAMAGE_MULTIPLIER: 64,
  RATE_OF_FIRE: 51,
  OPTIMAL_RANGE: 54,
  FALLOFF_RANGE: 158,
  TRACKING_SPEED: 160,

  // Module Attributes
  CPU_USAGE: 50,
  POWERGRID_USAGE: 30,
  ACTIVATION_COST: 6,
  DURATION: 73,

  // Character Attributes
  INTELLIGENCE: 175,
  MEMORY: 176,
  PERCEPTION: 177,
  WILLPOWER: 178,
  CHARISMA: 179,
} as const

// Core Dogma Effects
export const DOGMA_EFFECTS = {
  // Ship Effects
  SHIP_MODULE_BONUS: 6059,

  // Module Effects
  ONLINE: 16,
  ACTIVATION: 11,
  TARGET: 2,

  // Weapon Effects
  PROJECTILE_FIRED: 6,
  ENERGY_WEAPON_FIRED: 10,
  MISSILE_LAUNCHING: 9,

  // Repair Effects
  STRUCTURE_REPAIR: 20,
  ARMOR_REPAIR: 27,
  SHIELD_BOOST: 4,

  // Electronic Warfare
  ECM_BURST: 38,
  REMOTE_ARMOR_REPAIR: 28,
  REMOTE_SHIELD_BOOST: 15,

  // Mining
  MINING: 17,
  STRIP_MINING: 67,

  // Propulsion
  AFTERBURNER: 23,
  MICROWARPDRIVE: 46,
} as const

// Stacking Penalty Formula Constants
export const STACKING_PENALTY = {
  MULTIPLIERS: [1.0, 0.8691, 0.5707, 0.283, 0.1059, 0.0299, 0.0071, 0.0015] as const,
  MAX_MODULES: 8,
} as const

// Character Attribute Multipliers for Skills
export const SKILL_ATTRIBUTES = {
  // Primary/Secondary attribute mappings for common skills
  SPACESHIP_COMMAND: {
    primary: DOGMA_ATTRIBUTES.WILLPOWER,
    secondary: DOGMA_ATTRIBUTES.PERCEPTION,
  },
  GUNNERY: { primary: DOGMA_ATTRIBUTES.PERCEPTION, secondary: DOGMA_ATTRIBUTES.WILLPOWER },
  MISSILE_LAUNCHER_OPERATION: {
    primary: DOGMA_ATTRIBUTES.PERCEPTION,
    secondary: DOGMA_ATTRIBUTES.WILLPOWER,
  },
  ENGINEERING: { primary: DOGMA_ATTRIBUTES.INTELLIGENCE, secondary: DOGMA_ATTRIBUTES.MEMORY },
  ELECTRONICS: { primary: DOGMA_ATTRIBUTES.INTELLIGENCE, secondary: DOGMA_ATTRIBUTES.MEMORY },
  ARMOR: { primary: DOGMA_ATTRIBUTES.INTELLIGENCE, secondary: DOGMA_ATTRIBUTES.MEMORY },
  SHIELDS: { primary: DOGMA_ATTRIBUTES.INTELLIGENCE, secondary: DOGMA_ATTRIBUTES.MEMORY },
  NAVIGATION: { primary: DOGMA_ATTRIBUTES.INTELLIGENCE, secondary: DOGMA_ATTRIBUTES.PERCEPTION },
  TARGETING: { primary: DOGMA_ATTRIBUTES.INTELLIGENCE, secondary: DOGMA_ATTRIBUTES.MEMORY },
  SCIENCE: { primary: DOGMA_ATTRIBUTES.INTELLIGENCE, secondary: DOGMA_ATTRIBUTES.MEMORY },
  TRADE: { primary: DOGMA_ATTRIBUTES.CHARISMA, secondary: DOGMA_ATTRIBUTES.MEMORY },
  INDUSTRY: { primary: DOGMA_ATTRIBUTES.MEMORY, secondary: DOGMA_ATTRIBUTES.INTELLIGENCE },
  RESOURCE_PROCESSING: {
    primary: DOGMA_ATTRIBUTES.MEMORY,
    secondary: DOGMA_ATTRIBUTES.INTELLIGENCE,
  },
} as const

// Module State Calculations
export const MODULE_STATES = {
  OFFLINE: 0,
  ONLINE: 1,
  ACTIVE: 2,
  OVERLOAD: 3,
} as const

// Ship Group IDs for special handling
export const SHIP_GROUPS = {
  CAPSULE: 29,
  SHUTTLE: 31,
  FRIGATE: 25,
  DESTROYER: 420,
  CRUISER: 26,
  BATTLECRUISER: 419,
  BATTLESHIP: 27,
  CARRIER: 547,
  DREADNOUGHT: 485,
  SUPERCARRIER: 659,
  TITAN: 30,
  FREIGHTER: 513,
  JUMP_FREIGHTER: 902,
  INDUSTRIAL: 28,
  MINING_BARGE: 463,
  EXHUMER: 543,
  INTERCEPTOR: 831,
  ASSAULT_FRIGATE: 324,
  HEAVY_ASSAULT_CRUISER: 358,
  LOGISTICS: 832,
  RECON_SHIP: 833,
  STEALTH_BOMBER: 834,
  INTERDICTOR: 541,
  HEAVY_INTERDICTOR: 894,
  COMMAND_SHIP: 540,
  STRATEGIC_CRUISER: 963,
  ELECTRONIC_ATTACK_SHIP: 893,
  MARAUDER: 900,
  BLACK_OPS: 898,
  FORCE_RECON: 906,
} as const

// Module Group IDs
export const MODULE_GROUPS = {
  // Weapons
  ENERGY_WEAPON: 53,
  PROJECTILE_WEAPON: 55,
  HYBRID_WEAPON: 74,
  MISSILE_LAUNCHER: 507,
  MISSILE_LAUNCHER_CRUISE: 506,
  MISSILE_LAUNCHER_ROCKET: 507,
  MISSILE_LAUNCHER_HEAVY: 510,

  // Defense
  SHIELD_BOOSTER: 40,
  ARMOR_REPAIRER: 62,
  HULL_REPAIRER: 63,
  SHIELD_HARDENER: 77,
  ARMOR_HARDENER: 328,
  DAMAGE_CONTROL: 60,

  // Electronic Warfare
  ECM: 56,
  REMOTE_SENSOR_DAMPENER: 65,
  WEAPON_DISRUPTOR: 67,
  TARGET_PAINTER: 379,
  STASIS_WEB: 65,
  WARP_SCRAMBLER: 52,
  ENERGY_NEUTRALIZER: 71,
  ENERGY_NOSFERATU: 72,

  // Propulsion
  AFTERBURNER: 46,
  MICROWARPDRIVE: 46,

  // Utility
  CAPACITOR_BOOSTER: 76,
  SENSOR_BOOSTER: 212,
  TRACKING_COMPUTER: 213,
  BALLISTIC_CONTROL: 213,

  // Rigs
  SHIELD_RIG: 774,
  ARMOR_RIG: 772,
  HULL_RIG: 775,
  WEAPON_RIG: 776,
  ENGINEERING_RIG: 773,
  ASTRONAUTIC_RIG: 771,
  ELECTRONIC_RIG: 777,
} as const

// Calculation Precision
export const CALCULATION_PRECISION = {
  DAMAGE: 2,
  HP: 0,
  CAPACITOR: 2,
  SPEED: 2,
  TIME: 3,
  PERCENTAGE: 4,
  RESISTANCE: 4,
} as const

// Default Values
export const DEFAULTS = {
  SHIELD_RECHARGE_TIME: 1250, // seconds
  CAPACITOR_RECHARGE_TIME: 333, // seconds
  MODULE_CYCLE_TIME: 5, // seconds
  WARP_SPEED: 3, // AU/s
  BASE_WARP_STRENGTH: 1,
} as const

// Implant Slot Mapping
export const IMPLANT_SLOTS = {
  INTELLIGENCE: 1,
  MEMORY: 2,
  PERCEPTION: 3,
  WILLPOWER: 4,
  CHARISMA: 5,
  SLOT_6: 6,
  SLOT_7: 7,
  SLOT_8: 8,
  SLOT_9: 9,
  SLOT_10: 10,
} as const

// Common Type IDs for validation
export const COMMON_TYPES = {
  // Skill Books
  SPACESHIP_COMMAND: 3327,
  GUNNERY: 3300,
  MISSILE_LAUNCHER_OPERATION: 3319,

  // Common Modules
  DAMAGE_CONTROL_II: 2046,
  ADAPTIVE_NANO_PLATING_II: 11269,
  MEDIUM_ARMOR_REPAIRER_II: 2281,

  // Common Ships
  RIFTER: 587,
  PUNISHER: 588,
  MERLIN: 589,
  INCURSUS: 590,
} as const

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_SHIP_TYPE: 'Invalid ship type ID',
  INVALID_MODULE_TYPE: 'Invalid module type ID',
  INSUFFICIENT_CPU: 'Insufficient CPU to fit module',
  INSUFFICIENT_POWERGRID: 'Insufficient powergrid to fit module',
  INVALID_SLOT_TYPE: 'Module cannot be fitted to this slot type',
  SKILL_REQUIRED: 'Required skill not trained to sufficient level',
  CALCULATION_FAILED: 'Dogma calculation failed',
  MISSING_ATTRIBUTE: 'Required attribute not found',
  STACK_OVERFLOW: 'Too many modules of the same type (stacking penalty)',
} as const

// Damage Type Order (for resistance calculations)
export const DAMAGE_TYPES = ['em', 'thermal', 'kinetic', 'explosive'] as const

// Resistance calculation multipliers
export const RESISTANCE_MULTIPLIERS = {
  SHIELD: {
    EM: 0.0, // 0% base shield EM resistance
    THERMAL: 0.2, // 20% base shield thermal resistance
    KINETIC: 0.4, // 40% base shield kinetic resistance
    EXPLOSIVE: 0.5, // 50% base shield explosive resistance
  },
  ARMOR: {
    EM: 0.5, // 50% base armor EM resistance
    THERMAL: 0.35, // 35% base armor thermal resistance
    KINETIC: 0.25, // 25% base armor kinetic resistance
    EXPLOSIVE: 0.1, // 10% base armor explosive resistance
  },
  HULL: {
    EM: 0.0, // 0% base hull resistances
    THERMAL: 0.0,
    KINETIC: 0.0,
    EXPLOSIVE: 0.0,
  },
} as const
