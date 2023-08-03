/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "57iemnebw1fd4wt",
    "created": "2023-08-03 16:04:34.988Z",
    "updated": "2023-08-03 16:04:34.988Z",
    "name": "user_profile",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "riv0ykk2",
        "name": "user",
        "type": "relation",
        "required": true,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": [
            "username"
          ]
        }
      },
      {
        "system": false,
        "id": "wuq887uq",
        "name": "private_key",
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
      "CREATE UNIQUE INDEX `idx_myHb2Oz` ON `user_profile` (`user`)"
    ],
    "listRule": null,
    "viewRule": "user = @request.auth.id",
    "createRule": null,
    "updateRule": "user = @request.auth.id",
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("57iemnebw1fd4wt");

  return dao.deleteCollection(collection);
})
