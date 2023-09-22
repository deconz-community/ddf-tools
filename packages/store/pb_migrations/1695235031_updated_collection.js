/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("edu73sq7td7c8cv")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "i9axejbc",
    "name": "bundle_lastest",
    "type": "text",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("edu73sq7td7c8cv")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "i9axejbc",
    "name": "bundle_lastest",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  return dao.saveCollection(collection)
})