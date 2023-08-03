/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "a8avpfp4q0a21k2",
    "created": "2023-08-03 10:37:01.507Z",
    "updated": "2023-08-03 10:37:01.507Z",
    "name": "bundle_identifiers",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "wvjjuzuh",
        "name": "bundle",
        "type": "relation",
        "required": true,
        "unique": false,
        "options": {
          "collectionId": "s3k1ps4o2zogd9o",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": [
            "name",
            "version"
          ]
        }
      },
      {
        "system": false,
        "id": "pqk6l24h",
        "name": "manufacturer",
        "type": "text",
        "required": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "dv4z7biy",
        "name": "model",
        "type": "text",
        "required": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      }
    ],
    "indexes": [
      "CREATE INDEX `idx_3oDICG5` ON `bundle_identifiers` (`bundle`)",
      "CREATE INDEX `idx_v7szwcV` ON `bundle_identifiers` (\n  `manufacturer`,\n  `model`\n)",
      "CREATE INDEX `idx_b1tR9K6` ON `bundle_identifiers` (`manufacturer`)",
      "CREATE INDEX `idx_TsFTRZV` ON `bundle_identifiers` (`model`)"
    ],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("a8avpfp4q0a21k2");

  return dao.deleteCollection(collection);
})
