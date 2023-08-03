/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "edu73sq7td7c8cv",
    "created": "2023-08-03 10:37:01.507Z",
    "updated": "2023-08-03 10:37:01.507Z",
    "name": "collection",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "9lfsmcz0",
        "name": "name",
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
        "id": "p67vgtft",
        "name": "description",
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
        "id": "i9axejbc",
        "name": "bundle_lastest",
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
        "id": "pezzx5zf",
        "name": "contributors",
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
    "indexes": [],
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
  const collection = dao.findCollectionByNameOrId("edu73sq7td7c8cv");

  return dao.deleteCollection(collection);
})
