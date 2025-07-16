/**
 * EVE Online ESI API Type Definitions
 * Comprehensive types for ESI API responses and requests
 */

// ESI API Configuration
export interface ESIConfig {
  baseUrl: string
  userAgent: string
  datasource: 'tranquility' | 'singularity'
  timeout: number
  maxRetries: number
  rateLimitWindow: number
  rateLimitMax: number
}

// ESI Error Response
export interface ESIError {
  error: string
  error_description?: string
  sso_status?: number
  timeout?: number
}

// ESI Response Headers
export interface ESIHeaders {
  'x-esi-error-limit-remain'?: string
  'x-esi-error-limit-reset'?: string
  'x-pages'?: string
  etag?: string
  expires?: string
  'last-modified'?: string
  'cache-control'?: string
}

// Character Information
export interface ESICharacter {
  alliance_id?: number
  birthday: string
  bloodline_id: number
  corporation_id: number
  description?: string
  faction_id?: number
  gender: 'male' | 'female'
  name: string
  race_id: number
  security_status?: number
  title?: string
}

// Character Skills
export interface ESICharacterSkills {
  skills: ESISkill[]
  total_sp: number
  unallocated_sp?: number
}

export interface ESISkill {
  active_skill_level: number
  skill_id: number
  skillpoints_in_skill: number
  trained_skill_level: number
}

// Skill Queue
export interface ESISkillQueueItem {
  finish_date?: string
  finished_level: number
  level_end_sp?: number
  level_start_sp?: number
  queue_position: number
  skill_id: number
  start_date?: string
  training_start_sp?: number
}

// Character Assets
export interface ESIAsset {
  is_blueprint_copy?: boolean
  is_singleton: boolean
  item_id: number
  location_flag: string
  location_id: number
  location_type: 'station' | 'solar_system' | 'item' | 'other'
  quantity: number
  type_id: number
}

// Character Location
export interface ESILocation {
  solar_system_id: number
  station_id?: number
  structure_id?: number
}

// Character Ship
export interface ESIShip {
  ship_item_id: number
  ship_name: string
  ship_type_id: number
}

// Character Online Status
export interface ESIOnline {
  last_login?: string
  last_logout?: string
  logins?: number
  online: boolean
}

// Character Wallet
export interface ESIWallet {
  balance: number
}

// Character Wallet Journal
export interface ESIWalletJournalEntry {
  amount?: number
  balance?: number
  context_id?: number
  context_id_type?:
    | 'structure_id'
    | 'station_id'
    | 'market_transaction_id'
    | 'character_id'
    | 'corporation_id'
    | 'alliance_id'
    | 'eve_system'
    | 'industry_job_id'
    | 'contract_id'
    | 'planet_id'
    | 'system_id'
    | 'type_id'
  date: string
  description: string
  first_party_id?: number
  id: number
  reason?: string
  ref_type: string
  second_party_id?: number
  tax?: number
  tax_receiver_id?: number
}

// Character Wallet Transactions
export interface ESIWalletTransaction {
  client_id: number
  date: string
  is_buy: boolean
  is_personal: boolean
  journal_ref_id: number
  location_id: number
  quantity: number
  transaction_id: number
  type_id: number
  unit_price: number
}

// Character Clones
export interface ESIClones {
  home_location?: {
    location_id?: number
    location_type?: 'station' | 'structure'
  }
  jump_clones: ESIJumpClone[]
  last_clone_jump_date?: string
  last_station_change_date?: string
}

export interface ESIJumpClone {
  implants: number[]
  jump_clone_id: number
  location_id: number
  location_type: 'station' | 'structure'
  name?: string
}

// Character Implants
export interface ESIImplants {
  implants: number[]
}

// Market Orders
export interface ESIMarketOrder {
  duration: number
  escrow?: number
  is_buy_order?: boolean
  is_corporation: boolean
  issued: string
  location_id: number
  min_volume?: number
  order_id: number
  price: number
  range: string
  region_id?: number
  type_id: number
  volume_remain: number
  volume_total: number
}

// Market History
export interface ESIMarketHistory {
  average: number
  date: string
  highest: number
  lowest: number
  order_count: number
  volume: number
}

// Market Prices
export interface ESIMarketPrice {
  adjusted_price?: number
  average_price?: number
  type_id: number
}

// Universe Types
export interface ESIType {
  capacity?: number
  description: string
  dogma_attributes?: Array<{
    attribute_id: number
    value: number
  }>
  dogma_effects?: Array<{
    effect_id: number
    is_default: boolean
  }>
  graphic_id?: number
  group_id: number
  icon_id?: number
  market_group_id?: number
  mass?: number
  name: string
  packaged_volume?: number
  portion_size?: number
  published: boolean
  radius?: number
  type_id: number
  volume?: number
}

// Universe Groups
export interface ESIGroup {
  category_id: number
  group_id: number
  name: string
  published: boolean
  types: number[]
}

// Universe Categories
export interface ESICategory {
  category_id: number
  groups: number[]
  name: string
  published: boolean
}

// Station Information
export interface ESIStation {
  max_dockable_ship_volume: number
  name: string
  office_rental_cost: number
  owner?: number
  position: {
    x: number
    y: number
    z: number
  }
  race_id?: number
  reprocessing_efficiency: number
  reprocessing_stations_take: number
  services: string[]
  station_id: number
  system_id: number
  type_id: number
}

// Solar System Information
export interface ESISolarSystem {
  constellation_id: number
  name: string
  planets?: Array<{
    asteroid_belts?: number[]
    moons?: number[]
    planet_id: number
  }>
  position: {
    x: number
    y: number
    z: number
  }
  security_class?: string
  security_status: number
  star_id?: number
  stargates?: number[]
  stations?: number[]
  system_id: number
}

// Corporation Information
export interface ESICorporation {
  alliance_id?: number
  ceo_id: number
  creator_id: number
  date_founded?: string
  description?: string
  faction_id?: number
  home_station_id?: number
  member_count: number
  name: string
  shares?: number
  tax_rate: number
  ticker: string
  url?: string
  war_eligible?: boolean
}

// Alliance Information
export interface ESIAlliance {
  creator_corporation_id: number
  creator_id: number
  date_founded: string
  executor_corporation_id?: number
  faction_id?: number
  name: string
  ticker: string
}

// Industry Jobs
export interface ESIIndustryJob {
  activity_id: number
  blueprint_id: number
  blueprint_location_id: number
  blueprint_type_id: number
  completed_character_id?: number
  completed_date?: string
  cost?: number
  duration: number
  end_date: string
  facility_id: number
  installer_id: number
  job_id: number
  licensed_runs?: number
  output_location_id: number
  pause_date?: string
  probability?: number
  product_type_id?: number
  runs: number
  start_date: string
  station_id: number
  status: 'active' | 'cancelled' | 'delivered' | 'paused' | 'ready' | 'reverted'
  successful_runs?: number
}

// Planetary Interaction
export interface ESIPlanet {
  last_update: string
  num_pins: number
  owner_id: number
  planet_id: number
  planet_type: string
  solar_system_id: number
  upgrade_level: number
}

// Fitting
export interface ESIFitting {
  description: string
  fitting_id: number
  items: Array<{
    flag: string
    quantity: number
    type_id: number
  }>
  name: string
  ship_type_id: number
}

// Contracts
export interface ESIContract {
  acceptor_id?: number
  assignee_id?: number
  availability: 'public' | 'personal' | 'corporation' | 'alliance'
  buyout?: number
  collateral?: number
  contract_id: number
  date_accepted?: string
  date_completed?: string
  date_expired: string
  date_issued: string
  days_to_complete?: number
  end_location_id?: number
  for_corporation: boolean
  issuer_corporation_id: number
  issuer_id: number
  price?: number
  reward?: number
  start_location_id?: number
  status:
    | 'outstanding'
    | 'in_progress'
    | 'finished_issuer'
    | 'finished_contractor'
    | 'finished'
    | 'cancelled'
    | 'rejected'
    | 'failed'
    | 'deleted'
    | 'reversed'
  title?: string
  type: 'unknown' | 'item_exchange' | 'auction' | 'courier' | 'loan'
  volume?: number
}

// ESI Client Request Options
export interface ESIRequestOptions {
  headers?: Record<string, string>
  params?: Record<string, string | number | boolean>
  etag?: string
  retries?: number
}

// ESI Client Response
export interface ESIResponse<T> {
  data: T
  headers: ESIHeaders
  status: number
  cached: boolean
}

// Rate Limit Info
export interface ESIRateLimitInfo {
  errorLimitRemain: number
  errorLimitReset: Date
  requestCount: number
  windowStart: Date
}

// Pagination Options
export interface ESIPaginationOptions {
  page?: number
  datasource?: 'tranquility' | 'singularity'
}

// ESI Route Mapping
export interface ESIRoutes {
  // Character routes
  '/characters/{character_id}/': ESICharacter
  '/characters/{character_id}/skills/': ESICharacterSkills
  '/characters/{character_id}/skillqueue/': ESISkillQueueItem[]
  '/characters/{character_id}/assets/': ESIAsset[]
  '/characters/{character_id}/location/': ESILocation
  '/characters/{character_id}/ship/': ESIShip
  '/characters/{character_id}/online/': ESIOnline
  '/characters/{character_id}/wallet/': ESIWallet
  '/characters/{character_id}/wallet/journal/': ESIWalletJournalEntry[]
  '/characters/{character_id}/wallet/transactions/': ESIWalletTransaction[]
  '/characters/{character_id}/clones/': ESIClones
  '/characters/{character_id}/implants/': ESIImplants
  '/characters/{character_id}/orders/': ESIMarketOrder[]
  '/characters/{character_id}/industry/jobs/': ESIIndustryJob[]
  '/characters/{character_id}/planets/': ESIPlanet[]
  '/characters/{character_id}/fittings/': ESIFitting[]
  '/characters/{character_id}/contracts/': ESIContract[]

  // Universe routes
  '/universe/types/{type_id}/': ESIType
  '/universe/groups/{group_id}/': ESIGroup
  '/universe/categories/{category_id}/': ESICategory
  '/universe/stations/{station_id}/': ESIStation
  '/universe/systems/{system_id}/': ESISolarSystem

  // Corporation routes
  '/corporations/{corporation_id}/': ESICorporation

  // Alliance routes
  '/alliances/{alliance_id}/': ESIAlliance

  // Market routes
  '/markets/{region_id}/history/': ESIMarketHistory[]
  '/markets/{region_id}/orders/': ESIMarketOrder[]
  '/markets/prices/': ESIMarketPrice[]
}

// Type guard for ESI errors
export function isESIError(error: unknown): error is ESIError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof (error as ESIError).error === 'string'
  )
}
