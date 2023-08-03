/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "edu73sq7td7c8cv",
    "created": "2023-08-03 16:04:34.988Z",
    "updated": "2023-08-03 16:04:34.988Z",
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
        "id": "vinylcuq",
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
