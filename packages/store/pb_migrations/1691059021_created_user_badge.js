/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "1solqx16hmcqayg",
    "created": "2023-08-03 10:37:01.507Z",
    "updated": "2023-08-03 10:37:01.507Z",
    "name": "user_badge",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "2jhqxk5v",
        "name": "title",
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
  const collection = dao.findCollectionByNameOrId("1solqx16hmcqayg");

  return dao.deleteCollection(collection);
})
