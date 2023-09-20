/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("s3k1ps4o2zogd9o")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "kf8ksl7b",
    "name": "deprecated",
    "type": "bool",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {}
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("s3k1ps4o2zogd9o")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "kf8ksl7b",
    "name": "deprecated",
    "type": "bool",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {}
  }))

  return dao.saveCollection(collection)
})
