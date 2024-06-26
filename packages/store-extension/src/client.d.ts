/**
 * This file is automatically generated by the `@indirectus/cli` package.
 * Follow the package's instruction to update this file with the latest schema.
 */

import type * as Directus from "@directus/sdk";
import type { Query as Query$ } from "@directus/sdk";
import {
  readSingleton as readSingleton$,
  readItems as readItems$,
  readItem as readItem$,
} from "@directus/sdk";

export namespace Types {
  // Internal
  export type Nullable<T> = T | null;
  export type Optional<T> = Nullable<T>;
  export type UnknownType<T> = T | unknown;

  // Numbers
  export type BigInteger = number;
  export type Decimal = number;
  export type Float = number;
  export type Integer = number;
  export type Number = number;

  // Buffers
  export type Binary = string;
  export type String = string;
  export type Text = string;

  // Date & Time
  export type Date = string | globalThis.Date;
  export type DateTime = string | globalThis.Date;

  // Geometry
  export namespace Geometry {
    export type LineString = any;
    export type MultiLineString = any;
    export type MultiPoint = any;
    export type MultiPolygon = any;
    export type Point = any;
    export type Polygon = any;
  }

  // Complex
  export type JSON = any;
  export type JSONSchema = any;

  // Others
  export type UUID = string;
  export type Boolean = boolean;
  export type Enum = string;
}

/**
 * All collection types.
 */
export namespace Collections {
  /**
   * The resolved directus activity collection type.
   *
   */
  export type DirectusActivity = Directus.DirectusActivity<System>;

  /**
   * The resolved directus collections collection type.
   *
   */
  export type DirectusCollection = Directus.DirectusCollection<System>;

  /**
   * The resolved directus fields collection type.
   *
   */
  export type DirectusField = Directus.DirectusField<System>;

  /**
   * The resolved directus files collection type.
   *
   */
  export type DirectusFile = Directus.DirectusFile<System>;

  /**
   * The resolved directus folders collection type.
   *
   */
  export type DirectusFolder = Directus.DirectusFolder<System>;

  /**
   * The resolved directus permissions collection type.
   *
   */
  export type DirectusPermission = Directus.DirectusPermission<System>;

  /**
   * The resolved directus presets collection type.
   *
   */
  export type DirectusPreset = Directus.DirectusPreset<System>;

  /**
   * The resolved directus relations collection type.
   *
   */
  export type DirectusRelation = Directus.DirectusRelation<System>;

  /**
   * The resolved directus revisions collection type.
   *
   */
  export type DirectusRevision = Directus.DirectusRevision<System>;

  /**
   * The resolved directus roles collection type.
   *
   */
  export type DirectusRole = Directus.DirectusRole<System>;

  /**
   * The resolved directus settings collection type.
   *
   */
  export type DirectusSettings = Directus.DirectusSettings<System>;

  /**
   * The resolved directus users collection type.
   *
   */
  export type DirectusUser = Directus.DirectusUser<System>;

  /**
   * The resolved directus webhooks collection type.
   *
   */
  export type DirectusWebhook = Directus.DirectusWebhook<System>;

  /**
   * The resolved directus dashboards collection type.
   *
   */
  export type DirectusDashboard = Directus.DirectusDashboard<System>;

  /**
   * The resolved directus panels collection type.
   *
   */
  export type DirectusPanel = Directus.DirectusPanel<System>;

  /**
   * The resolved directus notifications collection type.
   *
   */
  export type DirectusNotification = Directus.DirectusNotification<System>;

  /**
   * The resolved directus shares collection type.
   *
   */
  export type DirectusShare = Directus.DirectusShare<System>;

  /**
   * The resolved directus flows collection type.
   *
   */
  export type DirectusFlow = Directus.DirectusFlow<System>;

  /**
   * The resolved directus operations collection type.
   *
   */
  export type DirectusOperation = Directus.DirectusOperation<System>;

  /**
   * The resolved directus translations collection type.
   *
   */
  export type DirectusTranslation = Directus.DirectusTranslation<System>;

  /**
   * The resolved directus versions collection type.
   *
   */
  export type DirectusVersion = Directus.DirectusVersion<System>;

  /**
   * The resolved directus extensions collection type.
   *
   */
  export type DirectusExtension = Directus.DirectusExtension<System>;

  /**
   * The bundles collection.
   */
  export interface Bundles {
    id: Types.String;
    ddf_uuid: Types.String | Collections.DdfUuids;
    vendor: Types.String;
    product: Types.String;
    version_deconz: Types.String;
    info: Types.Optional<Types.String>;
    user_created: Types.Optional<Types.String | Collections.DirectusUser>;
    date_created: Types.Optional<Types.DateTime>;
    user_updated: Types.Optional<Types.String | Collections.DirectusUser>;
    date_updated: Types.Optional<Types.DateTime>;
    source_last_modified: Types.DateTime;
    file_count: Types.Optional<Types.Integer>;
    content_size: Types.Optional<Types.Integer>;
    content_hash: Types.Optional<Types.String>;
    device_identifiers: Collections.BundlesDeviceIdentifiers[];
    sub_devices: Collections.BundlesSubDevices[];
    signatures: Collections.Signatures[];
    content: Types.Optional<Types.String>;
    deprecation_message: Types.Optional<Types.String>;
  }

  /**
   * The bundles device identifiers collection.
   */
  export interface BundlesDeviceIdentifiers {
    id: Types.Integer;
    bundles_id: Types.Optional<Types.String | Collections.Bundles>;
    device_identifiers_id: Types.Optional<
      Types.String | Collections.DeviceIdentifiers
    >;
  }

  /**
   * The bundles sub devices collection.
   */
  export interface BundlesSubDevices {
    id: Types.Integer;
    bundles_id: Types.Optional<Types.String | Collections.Bundles>;
    sub_devices_type: Types.Optional<Types.String | Collections.SubDevices>;
  }

  /**
   * The ddf uuids collection.
   */
  export interface DdfUuids {
    id: Types.String;
    user_created: Types.Optional<Types.String | Collections.DirectusUser>;
    date_created: Types.Optional<Types.DateTime>;
    user_updated: Types.Optional<Types.String | Collections.DirectusUser>;
    date_updated: Types.Optional<Types.DateTime>;
    expire_at: Types.Optional<Types.DateTime>;
    bundles: Collections.Bundles[];
  }

  /**
   * The device identifiers collection.
   */
  export interface DeviceIdentifiers {
    id: Types.String;
    manufacturer: Types.Optional<Types.String>;
    model: Types.Optional<Types.String>;
    bundles: Collections.BundlesDeviceIdentifiers[];
  }

  /**
   * The signatures collection.
   */
  export interface Signatures {
    id: Types.String;
    bundle: Types.String | Collections.Bundles;
    key: Types.String;
    type: "System" | "User" | Types.String;
  }

  /**
   * The sub devices collection.
   */
  export interface SubDevices {
    type: Types.String;
    name: Types.String;
    endpoint: Types.Optional<"/lights" | "/sensors" | Types.String>;
    bundles: Collections.BundlesSubDevices[];
  }
}

/**
 * System schema extensions.
 */

export interface System {
  /**
   * The definition for the directus activity system collection.
   *
   */
  directus_activity: {}[];

  /**
   * The definition for the directus collections system collection.
   *
   */
  directus_collections: {}[];

  /**
   * The definition for the directus fields system collection.
   *
   */
  directus_fields: {}[];

  /**
   * The definition for the directus files system collection.
   *
   */
  directus_files: {}[];

  /**
   * The definition for the directus folders system collection.
   *
   */
  directus_folders: {}[];

  /**
   * The definition for the directus permissions system collection.
   *
   */
  directus_permissions: {}[];

  /**
   * The definition for the directus presets system collection.
   *
   */
  directus_presets: {}[];

  /**
   * The definition for the directus relations system collection.
   *
   */
  directus_relations: {}[];

  /**
   * The definition for the directus revisions system collection.
   *
   */
  directus_revisions: {}[];

  /**
   * The definition for the directus roles system collection.
   *
   */
  directus_roles: {}[];

  /**
   * The definition for the directus settings system collection.
   *
   */
  directus_settings: {
    private_key_stable: Types.Optional<Types.String>;
    public_key_stable: Types.Optional<Types.String>;
    private_key_beta: Types.Optional<Types.String>;
    public_key_beta: Types.Optional<Types.String>;
    private_key_deprecated: Types.Optional<Types.String>;
    public_key_deprecated: Types.Optional<Types.String>;
  };

  /**
   * The definition for the directus users system collection.
   *
   */
  directus_users: {
    is_contributor: Types.Boolean;
    date_created: Types.Optional<Types.DateTime>;
    public_key: Types.Optional<Types.String>;
    private_key: Types.Optional<Types.String>;
  }[];

  /**
   * The definition for the directus webhooks system collection.
   *
   */
  directus_webhooks: {}[];

  /**
   * The definition for the directus dashboards system collection.
   *
   */
  directus_dashboards: {}[];

  /**
   * The definition for the directus panels system collection.
   *
   */
  directus_panels: {}[];

  /**
   * The definition for the directus notifications system collection.
   *
   */
  directus_notifications: {}[];

  /**
   * The definition for the directus shares system collection.
   *
   */
  directus_shares: {}[];

  /**
   * The definition for the directus flows system collection.
   *
   */
  directus_flows: {}[];

  /**
   * The definition for the directus operations system collection.
   *
   */
  directus_operations: {}[];

  /**
   * The definition for the directus translations system collection.
   *
   */
  directus_translations: {}[];

  /**
   * The definition for the directus versions system collection.
   *
   */
  directus_versions: {}[];

  /**
   * The definition for the directus extensions system collection.
   *
   */
  directus_extensions: {}[];
}

/**
 * Schema definition.
 */
export interface Schema extends System {
  /**
   * The bundles collection.
   */
  bundles: Collections.Bundles[];

  /**
   * The bundles device identifiers collection.
   */
  bundles_device_identifiers: Collections.BundlesDeviceIdentifiers[];

  /**
   * The bundles sub devices collection.
   */
  bundles_sub_devices: Collections.BundlesSubDevices[];

  /**
   * The ddf uuids collection.
   */
  ddf_uuids: Collections.DdfUuids[];

  /**
   * The device identifiers collection.
   */
  device_identifiers: Collections.DeviceIdentifiers[];

  /**
   * The signatures collection.
   */
  signatures: Collections.Signatures[];

  /**
   * The sub devices collection.
   */
  sub_devices: Collections.SubDevices[];
}

/**
 * Helper functions
 */

/**
 * List bundles items.
 */
export function listBundles<
  const Query extends Query$<Schema, Collections.Bundles>,
>(query?: Query) {
  return readItems$<Schema, "bundles", Query>("bundles", query);
}

/**
 * Gets a single known bundles item by id.
 */
export function readBundles<
  const Query extends Query$<Schema, Collections.Bundles>,
>(key: string | number, query?: Query) {
  return readItem$<Schema, "bundles", Query>("bundles", key, query);
}

/**
 * List bundles device identifiers items.
 */
export function listBundlesDeviceIdentifiers<
  const Query extends Query$<Schema, Collections.BundlesDeviceIdentifiers>,
>(query?: Query) {
  return readItems$<Schema, "bundles_device_identifiers", Query>(
    "bundles_device_identifiers",
    query,
  );
}

/**
 * Gets a single known bundles device identifiers item by id.
 */
export function readBundlesDeviceIdentifiers<
  const Query extends Query$<Schema, Collections.BundlesDeviceIdentifiers>,
>(key: string | number, query?: Query) {
  return readItem$<Schema, "bundles_device_identifiers", Query>(
    "bundles_device_identifiers",
    key,
    query,
  );
}

/**
 * List bundles sub devices items.
 */
export function listBundlesSubDevices<
  const Query extends Query$<Schema, Collections.BundlesSubDevices>,
>(query?: Query) {
  return readItems$<Schema, "bundles_sub_devices", Query>(
    "bundles_sub_devices",
    query,
  );
}

/**
 * Gets a single known bundles sub devices item by id.
 */
export function readBundlesSubDevices<
  const Query extends Query$<Schema, Collections.BundlesSubDevices>,
>(key: string | number, query?: Query) {
  return readItem$<Schema, "bundles_sub_devices", Query>(
    "bundles_sub_devices",
    key,
    query,
  );
}

/**
 * List ddf uuids items.
 */
export function listDdfUuids<
  const Query extends Query$<Schema, Collections.DdfUuids>,
>(query?: Query) {
  return readItems$<Schema, "ddf_uuids", Query>("ddf_uuids", query);
}

/**
 * Gets a single known ddf uuids item by id.
 */
export function readDdfUuids<
  const Query extends Query$<Schema, Collections.DdfUuids>,
>(key: string | number, query?: Query) {
  return readItem$<Schema, "ddf_uuids", Query>("ddf_uuids", key, query);
}

/**
 * List device identifiers items.
 */
export function listDeviceIdentifiers<
  const Query extends Query$<Schema, Collections.DeviceIdentifiers>,
>(query?: Query) {
  return readItems$<Schema, "device_identifiers", Query>(
    "device_identifiers",
    query,
  );
}

/**
 * Gets a single known device identifiers item by id.
 */
export function readDeviceIdentifiers<
  const Query extends Query$<Schema, Collections.DeviceIdentifiers>,
>(key: string | number, query?: Query) {
  return readItem$<Schema, "device_identifiers", Query>(
    "device_identifiers",
    key,
    query,
  );
}

/**
 * List signatures items.
 */
export function listSignatures<
  const Query extends Query$<Schema, Collections.Signatures>,
>(query?: Query) {
  return readItems$<Schema, "signatures", Query>("signatures", query);
}

/**
 * Gets a single known signatures item by id.
 */
export function readSignatures<
  const Query extends Query$<Schema, Collections.Signatures>,
>(key: string | number, query?: Query) {
  return readItem$<Schema, "signatures", Query>("signatures", key, query);
}

/**
 * List sub devices items.
 */
export function listSubDevices<
  const Query extends Query$<Schema, Collections.SubDevices>,
>(query?: Query) {
  return readItems$<Schema, "sub_devices", Query>("sub_devices", query);
}

/**
 * Gets a single known sub devices item by id.
 */
export function readSubDevices<
  const Query extends Query$<Schema, Collections.SubDevices>,
>(key: string | number, query?: Query) {
  return readItem$<Schema, "sub_devices", Query>("sub_devices", key, query);
}
