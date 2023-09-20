/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("q97y8xw37o2blnu")

  // remove
  collection.schema.removeField("hndymwqm")

  // remove
  collection.schema.removeField("6lz7aum1")

  // remove
  collection.schema.removeField("2kzxvid0")

  // remove
  collection.schema.removeField("i3k7tmj9")

  // remove
  collection.schema.removeField("le4tvdbh")

  // remove
  collection.schema.removeField("jh1h7q8d")

  // remove
  collection.schema.removeField("ahqeln60")

  // remove
  collection.schema.removeField("iuoeuqm3")

  // remove
  collection.schema.removeField("buqur7bp")

  // remove
  collection.schema.removeField("nrbaltlz")

  // remove
  collection.schema.removeField("rh5hc3ga")

  // remove
  collection.schema.removeField("vpj12b7p")

  // remove
  collection.schema.removeField("osnxceo1")

  // remove
  collection.schema.removeField("onjjg2qy")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "3gp1vmof",
    "name": "bundle_id",
    "type": "relation",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "collectionId": "s3k1ps4o2zogd9o",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": null
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "bfebz8iu",
    "name": "uuid",
    "type": "text",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "min": 36,
      "max": 36,
      "pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "yklvvvfc",
    "name": "name",
    "type": "text",
    "required": true,
    "presentable": true,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "eyxljkt9",
    "name": "contributors",
    "type": "relation",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "collectionId": "_pb_users_auth_",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": null,
      "displayFields": []
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "q79t9mut",
    "name": "version",
    "type": "text",
    "required": true,
    "presentable": true,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "dl5zscgo",
    "name": "version_numeric",
    "type": "number",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "noDecimal": false
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "cptvxgd3",
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

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "qnelx8be",
    "name": "version_deconz",
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

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "2c5wc2lg",
    "name": "source",
    "type": "select",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSelect": 1,
      "values": [
        "github",
        "upload"
      ]
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "0vqf7jbg",
    "name": "pre_release",
    "type": "bool",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {}
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "pbiciqpc",
    "name": "deprecated",
    "type": "bool",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {}
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "p5gv15f0",
    "name": "deprecated_description",
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

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "y4plwpzu",
    "name": "file",
    "type": "file",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSelect": 1,
      "maxSize": 512000,
      "mimeTypes": [],
      "thumbs": [],
      "protected": false
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "u57gw0mb",
    "name": "hash",
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
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("q97y8xw37o2blnu")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "hndymwqm",
    "name": "bundle_id",
    "type": "relation",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "collectionId": "s3k1ps4o2zogd9o",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": null
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "6lz7aum1",
    "name": "uuid",
    "type": "text",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "min": 36,
      "max": 36,
      "pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "2kzxvid0",
    "name": "name",
    "type": "text",
    "required": true,
    "presentable": true,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "i3k7tmj9",
    "name": "contributors",
    "type": "relation",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "collectionId": "_pb_users_auth_",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": null,
      "displayFields": []
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "le4tvdbh",
    "name": "version",
    "type": "text",
    "required": true,
    "presentable": true,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "jh1h7q8d",
    "name": "version_numeric",
    "type": "number",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "noDecimal": false
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "ahqeln60",
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

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "iuoeuqm3",
    "name": "version_deconz",
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

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "buqur7bp",
    "name": "source",
    "type": "select",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSelect": 1,
      "values": [
        "github",
        "upload"
      ]
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "nrbaltlz",
    "name": "pre_release",
    "type": "bool",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {}
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "rh5hc3ga",
    "name": "deprecated",
    "type": "bool",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {}
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "vpj12b7p",
    "name": "deprecated_description",
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

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "osnxceo1",
    "name": "file",
    "type": "file",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSelect": 1,
      "maxSize": 512000,
      "mimeTypes": [],
      "thumbs": [],
      "protected": false
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "onjjg2qy",
    "name": "hash",
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

  // remove
  collection.schema.removeField("3gp1vmof")

  // remove
  collection.schema.removeField("bfebz8iu")

  // remove
  collection.schema.removeField("yklvvvfc")

  // remove
  collection.schema.removeField("eyxljkt9")

  // remove
  collection.schema.removeField("q79t9mut")

  // remove
  collection.schema.removeField("dl5zscgo")

  // remove
  collection.schema.removeField("cptvxgd3")

  // remove
  collection.schema.removeField("qnelx8be")

  // remove
  collection.schema.removeField("2c5wc2lg")

  // remove
  collection.schema.removeField("0vqf7jbg")

  // remove
  collection.schema.removeField("pbiciqpc")

  // remove
  collection.schema.removeField("p5gv15f0")

  // remove
  collection.schema.removeField("y4plwpzu")

  // remove
  collection.schema.removeField("u57gw0mb")

  return dao.saveCollection(collection)
})
