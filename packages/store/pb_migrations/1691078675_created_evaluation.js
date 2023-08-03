/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "0m3xpiprxh27iys",
    "created": "2023-08-03 16:04:34.988Z",
    "updated": "2023-08-03 16:04:34.988Z",
    "name": "evaluation",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "9rdvagky",
        "name": "bundle",
        "type": "relation",
        "required": false,
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
        "id": "ckwqc0rk",
        "name": "contributor",
        "type": "relation",
        "required": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": []
        }
      },
      {
        "system": false,
        "id": "b0lyqv7s",
        "name": "rating",
        "type": "number",
        "required": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 5
        }
      },
      {
        "system": false,
        "id": "mj1p9brm",
        "name": "comment",
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
    "createRule": "contributor = @request.auth.id",
    "updateRule": "contributor = @request.auth.id",
    "deleteRule": "contributor = @request.auth.id",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("0m3xpiprxh27iys");

  return dao.deleteCollection(collection);
})
