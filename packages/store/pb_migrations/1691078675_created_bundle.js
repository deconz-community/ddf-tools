/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "s3k1ps4o2zogd9o",
    "created": "2023-08-03 16:04:34.987Z",
    "updated": "2023-08-03 16:04:34.987Z",
    "name": "bundle",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "ex7bkkxo",
        "name": "uuid",
        "type": "text",
        "required": true,
        "unique": false,
        "options": {
          "min": 36,
          "max": 36,
          "pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
        }
      },
      {
        "system": false,
        "id": "lngandb5",
        "name": "name",
        "type": "text",
        "required": true,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "usuz5ch3",
        "name": "version",
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
        "id": "0gz6gpbr",
        "name": "version_numeric",
        "type": "number",
        "required": true,
        "unique": false,
        "options": {
          "min": null,
          "max": null
        }
      },
      {
        "system": false,
        "id": "onuhoxln",
        "name": "version_tag",
        "type": "select",
        "required": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "lastest"
          ]
        }
      },
      {
        "system": false,
        "id": "onddevsk",
        "name": "version_deconz",
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
        "id": "df2jneej",
        "name": "source",
        "type": "select",
        "required": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "github",
            "upload"
          ]
        }
      },
      {
        "system": false,
        "id": "cse2fccx",
        "name": "contributors",
        "type": "relation",
        "required": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": null,
          "displayFields": []
        }
      },
      {
        "system": false,
        "id": "o0unjkaw",
        "name": "pre_release",
        "type": "bool",
        "required": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "kf8ksl7b",
        "name": "deprecated",
        "type": "bool",
        "required": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "eeyahqqv",
        "name": "deprecated_description",
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
        "id": "j01pahcy",
        "name": "file",
        "type": "file",
        "required": true,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "maxSize": 512000,
          "mimeTypes": [],
          "thumbs": [],
          "protected": false
        }
      },
      {
        "system": false,
        "id": "huc9iovt",
        "name": "hash",
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
      "CREATE UNIQUE INDEX `idx_d1H4hsI` ON `bundle` (`hash`)",
      "CREATE INDEX `idx_fRczihl` ON `bundle` (`version_tag`) WHERE `version_tag` != ''"
    ],
    "listRule": "",
    "viewRule": "",
    "createRule": "contributors ~ @request.auth.id",
    "updateRule": "contributors ~ @request.auth.id",
    "deleteRule": "contributors ~ @request.auth.id",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("s3k1ps4o2zogd9o");

  return dao.deleteCollection(collection);
})
