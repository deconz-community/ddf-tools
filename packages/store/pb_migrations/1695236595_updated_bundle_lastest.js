/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("q97y8xw37o2blnu")

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

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "rq2hxbqy",
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
    "id": "bgvka9yr",
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
    "id": "yltyjj6x",
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
    "id": "53bbtegi",
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
    "id": "dyqpp4ud",
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
    "id": "ulw03ynr",
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
    "id": "h7dwl95b",
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
    "id": "yr5u50de",
    "name": "version_deconz",
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
    "id": "gaosgies",
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
    "id": "bj7eubeh",
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
    "id": "derbujxm",
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
    "id": "f6beej5y",
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
    "id": "1ivmv4nc",
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
    "id": "oqukhwgb",
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

  // remove
  collection.schema.removeField("rq2hxbqy")

  // remove
  collection.schema.removeField("bgvka9yr")

  // remove
  collection.schema.removeField("yltyjj6x")

  // remove
  collection.schema.removeField("53bbtegi")

  // remove
  collection.schema.removeField("dyqpp4ud")

  // remove
  collection.schema.removeField("ulw03ynr")

  // remove
  collection.schema.removeField("h7dwl95b")

  // remove
  collection.schema.removeField("yr5u50de")

  // remove
  collection.schema.removeField("gaosgies")

  // remove
  collection.schema.removeField("bj7eubeh")

  // remove
  collection.schema.removeField("derbujxm")

  // remove
  collection.schema.removeField("f6beej5y")

  // remove
  collection.schema.removeField("1ivmv4nc")

  // remove
  collection.schema.removeField("oqukhwgb")

  return dao.saveCollection(collection)
})
