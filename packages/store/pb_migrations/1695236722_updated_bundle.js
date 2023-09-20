/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("s3k1ps4o2zogd9o")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "onuhoxln",
    "name": "version_tag",
    "type": "select",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSelect": 1,
      "values": [
        "lastest"
      ]
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("s3k1ps4o2zogd9o")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "onuhoxln",
    "name": "version_tag",
    "type": "select",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSelect": 1,
      "values": [
        "lastest"
      ]
    }
  }))

  return dao.saveCollection(collection)
})
