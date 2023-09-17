/**
 * This file was @generated using pocketbase-typegen
 */

export enum Collections {
  Bundle = 'bundle',
  BundleIdentifiers = 'bundle_identifiers',
  BundleLastest = 'bundle_lastest',
  Collection = 'collection',
  Evaluation = 'evaluation',
  User = 'user',
  UserBadge = 'user_badge',
  UserProfile = 'user_profile',
}

// Alias types for improved usability
export type IsoDateString = string
export type RecordIdString = string
export type HTMLString = string

// System fields
export interface BaseSystemFields<T = never> {
  id: RecordIdString
  created: IsoDateString
  updated: IsoDateString
  collectionId: string
  collectionName: Collections
  expand?: T
}

export type AuthSystemFields<T = never> = {
  email: string
  emailVisibility: boolean
  username: string
  verified: boolean
} & BaseSystemFields<T>

// Record types for each collection

export enum BundleVersionTagOptions {
  'lastest' = 'lastest',
}

export enum BundleSourceOptions {
  'github' = 'github',
  'upload' = 'upload',
}
export interface BundleRecord {
  contributors?: RecordIdString[]
  deprecated?: boolean
  deprecated_description?: string
  file: string
  hash?: string
  name: string
  pre_release?: boolean
  source?: BundleSourceOptions
  uuid: string
  version?: string
  version_deconz?: string
  version_numeric: number
  version_tag?: BundleVersionTagOptions
}

export interface BundleIdentifiersRecord {
  bundle: RecordIdString
  manufacturer?: string
  model?: string
}

export enum BundleLastestVersionTagOptions {
  'lastest' = 'lastest',
}

export enum BundleLastestSourceOptions {
  'github' = 'github',
  'upload' = 'upload',
}
export interface BundleLastestRecord {
  bundle_id?: RecordIdString
  contributors?: RecordIdString[]
  deprecated?: boolean
  deprecated_description?: string
  file: string
  hash?: string
  name: string
  pre_release?: boolean
  source?: BundleLastestSourceOptions
  uuid: string
  version?: string
  version_deconz?: string
  version_numeric: number
  version_tag?: BundleLastestVersionTagOptions
}

export interface CollectionRecord {
  bundle_lastest?: string
  contributors?: RecordIdString[]
  description?: string
  name?: string
}

export interface EvaluationRecord {
  bundle?: RecordIdString
  comment?: string
  contributor?: RecordIdString
  rating?: number
}

export interface UserRecord {
  github_id: string
  is_admin?: boolean
  name: string
  profile?: RecordIdString
  public_key?: string
}

export interface UserBadgeRecord {
  owner?: RecordIdString
  title?: string
}

export interface UserProfileRecord {
  private_key?: string
  user: RecordIdString
}

// Response types include system fields and match responses from the PocketBase API
export type BundleResponse<Texpand = unknown> = Required<BundleRecord> & BaseSystemFields<Texpand>
export type BundleIdentifiersResponse<Texpand = unknown> = Required<BundleIdentifiersRecord> & BaseSystemFields<Texpand>
export type BundleLastestResponse<Texpand = unknown> = Required<BundleLastestRecord> & BaseSystemFields<Texpand>
export type CollectionResponse<Texpand = unknown> = Required<CollectionRecord> & BaseSystemFields<Texpand>
export type EvaluationResponse<Texpand = unknown> = Required<EvaluationRecord> & BaseSystemFields<Texpand>
export type UserResponse<Texpand = unknown> = Required<UserRecord> & AuthSystemFields<Texpand>
export type UserBadgeResponse<Texpand = unknown> = Required<UserBadgeRecord> & BaseSystemFields<Texpand>
export type UserProfileResponse<Texpand = unknown> = Required<UserProfileRecord> & BaseSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export interface CollectionRecords {
  bundle: BundleRecord
  bundle_identifiers: BundleIdentifiersRecord
  bundle_lastest: BundleLastestRecord
  collection: CollectionRecord
  evaluation: EvaluationRecord
  user: UserRecord
  user_badge: UserBadgeRecord
  user_profile: UserProfileRecord
}

export interface CollectionResponses {
  bundle: BundleResponse
  bundle_identifiers: BundleIdentifiersResponse
  bundle_lastest: BundleLastestResponse
  collection: CollectionResponse
  evaluation: EvaluationResponse
  user: UserResponse
  user_badge: UserBadgeResponse
  user_profile: UserProfileResponse
}
