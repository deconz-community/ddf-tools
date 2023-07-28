package migrations

import (
	"encoding/json"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/daos"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/models/schema"
)

func init() {
	m.Register(func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("q97y8xw37o2blnu")
		if err != nil {
			return err
		}

		options := map[string]any{}
		json.Unmarshal([]byte(`{
			"query": "SELECT bt.id, bt.name, bt.description as description_bundle, bv.version, bv.device_identifiers, bv.file, bv.hash, bv.description as description_version, bv.updated, bv.contributors\nFROM bundle_tree bt\nJOIN bundle_version bv ON bt.id = bv.bundle_tree\nWHERE bv.version_numeric = (\n  SELECT MAX(version_numeric)\n  FROM bundle_version bv2\n  WHERE bv.bundle_tree = bv2.bundle_tree\n    AND bv2.deprecated = 0\n    AND bv2.pre_release = 0\n)\nAND bv.updated = (\n  SELECT MAX(updated)\n  FROM bundle_version bv3\n  WHERE bv.bundle_tree = bv3.bundle_tree\n    AND bv.version_numeric = bv3.version_numeric\n    AND bv3.deprecated = 0\n    AND bv3.pre_release = 0\n)\nAND bv.deprecated = 0\nAND bv.pre_release = 0;"
		}`), &options)
		collection.SetOptions(options)

		// remove
		collection.Schema.RemoveField("m5p1wgdx")

		// remove
		collection.Schema.RemoveField("0lngzf5d")

		// remove
		collection.Schema.RemoveField("2xukgiu3")

		// remove
		collection.Schema.RemoveField("iywoeaix")

		// remove
		collection.Schema.RemoveField("6ndudtf1")

		// remove
		collection.Schema.RemoveField("zy28eo5r")

		// remove
		collection.Schema.RemoveField("st2oyckq")

		// remove
		collection.Schema.RemoveField("xkdxlwmt")

		// add
		new_name := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "ygfz7n8x",
			"name": "name",
			"type": "text",
			"required": false,
			"unique": false,
			"options": {
				"min": null,
				"max": null,
				"pattern": ""
			}
		}`), new_name)
		collection.Schema.AddField(new_name)

		// add
		new_description_bundle := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "eppdq1hf",
			"name": "description_bundle",
			"type": "text",
			"required": false,
			"unique": false,
			"options": {
				"min": null,
				"max": null,
				"pattern": ""
			}
		}`), new_description_bundle)
		collection.Schema.AddField(new_description_bundle)

		// add
		new_version := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "xj6mhh4x",
			"name": "version",
			"type": "text",
			"required": false,
			"unique": false,
			"options": {
				"min": null,
				"max": null,
				"pattern": ""
			}
		}`), new_version)
		collection.Schema.AddField(new_version)

		// add
		new_device_identifiers := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "rorcxf8i",
			"name": "device_identifiers",
			"type": "relation",
			"required": true,
			"unique": false,
			"options": {
				"collectionId": "2hgtp75dkzhuee4",
				"cascadeDelete": true,
				"minSelect": null,
				"maxSelect": null,
				"displayFields": [
					"modelid"
				]
			}
		}`), new_device_identifiers)
		collection.Schema.AddField(new_device_identifiers)

		// add
		new_file := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "ypfcclun",
			"name": "file",
			"type": "file",
			"required": true,
			"unique": false,
			"options": {
				"maxSelect": 1,
				"maxSize": 512000,
				"mimeTypes": [],
				"thumbs": [],
				"protected": false
			}
		}`), new_file)
		collection.Schema.AddField(new_file)

		// add
		new_hash := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "lqcqiqmi",
			"name": "hash",
			"type": "text",
			"required": false,
			"unique": false,
			"options": {
				"min": null,
				"max": null,
				"pattern": ""
			}
		}`), new_hash)
		collection.Schema.AddField(new_hash)

		// add
		new_description_version := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "i03lyym2",
			"name": "description_version",
			"type": "json",
			"required": false,
			"unique": false,
			"options": {}
		}`), new_description_version)
		collection.Schema.AddField(new_description_version)

		// add
		new_contributors := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "qox0ikjm",
			"name": "contributors",
			"type": "relation",
			"required": false,
			"unique": false,
			"options": {
				"collectionId": "s3l41jpo7oosnpd",
				"cascadeDelete": false,
				"minSelect": null,
				"maxSelect": null,
				"displayFields": []
			}
		}`), new_contributors)
		collection.Schema.AddField(new_contributors)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("q97y8xw37o2blnu")
		if err != nil {
			return err
		}

		options := map[string]any{}
		json.Unmarshal([]byte(`{
			"query": "SELECT bt.id, bt.name, bt.description as description_bundle, bv.version, bv.device_identifiers, bv.file, bv.hash, bv.description as description_version, bv.updated, bv.contributors\nFROM bundle_tree bt\nJOIN bundle_version bv ON bt.id = bv.bundle_tree\nWHERE bv.version_numeric = (\n  SELECT MAX(version_numeric)\n  FROM bundle_version bv2\n  WHERE bv.bundle_tree = bv2.bundle_tree\n    AND bv2.deprecated = 0\n    AND bv2.pre_release = 1\n)\nAND bv.updated = (\n  SELECT MAX(updated)\n  FROM bundle_version bv3\n  WHERE bv.bundle_tree = bv3.bundle_tree\n    AND bv.version_numeric = bv3.version_numeric\n    AND bv3.deprecated = 0\n    AND bv3.pre_release = 0\n)\nAND bv.deprecated = 0\nAND bv.pre_release = 0;"
		}`), &options)
		collection.SetOptions(options)

		// add
		del_name := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "m5p1wgdx",
			"name": "name",
			"type": "text",
			"required": false,
			"unique": false,
			"options": {
				"min": null,
				"max": null,
				"pattern": ""
			}
		}`), del_name)
		collection.Schema.AddField(del_name)

		// add
		del_description_bundle := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "0lngzf5d",
			"name": "description_bundle",
			"type": "text",
			"required": false,
			"unique": false,
			"options": {
				"min": null,
				"max": null,
				"pattern": ""
			}
		}`), del_description_bundle)
		collection.Schema.AddField(del_description_bundle)

		// add
		del_version := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "2xukgiu3",
			"name": "version",
			"type": "text",
			"required": false,
			"unique": false,
			"options": {
				"min": null,
				"max": null,
				"pattern": ""
			}
		}`), del_version)
		collection.Schema.AddField(del_version)

		// add
		del_device_identifiers := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "iywoeaix",
			"name": "device_identifiers",
			"type": "relation",
			"required": true,
			"unique": false,
			"options": {
				"collectionId": "2hgtp75dkzhuee4",
				"cascadeDelete": true,
				"minSelect": null,
				"maxSelect": null,
				"displayFields": [
					"modelid"
				]
			}
		}`), del_device_identifiers)
		collection.Schema.AddField(del_device_identifiers)

		// add
		del_file := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "6ndudtf1",
			"name": "file",
			"type": "file",
			"required": true,
			"unique": false,
			"options": {
				"maxSelect": 1,
				"maxSize": 512000,
				"mimeTypes": [],
				"thumbs": [],
				"protected": false
			}
		}`), del_file)
		collection.Schema.AddField(del_file)

		// add
		del_hash := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "zy28eo5r",
			"name": "hash",
			"type": "text",
			"required": false,
			"unique": false,
			"options": {
				"min": null,
				"max": null,
				"pattern": ""
			}
		}`), del_hash)
		collection.Schema.AddField(del_hash)

		// add
		del_description_version := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "st2oyckq",
			"name": "description_version",
			"type": "json",
			"required": false,
			"unique": false,
			"options": {}
		}`), del_description_version)
		collection.Schema.AddField(del_description_version)

		// add
		del_contributors := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "xkdxlwmt",
			"name": "contributors",
			"type": "relation",
			"required": false,
			"unique": false,
			"options": {
				"collectionId": "s3l41jpo7oosnpd",
				"cascadeDelete": false,
				"minSelect": null,
				"maxSelect": null,
				"displayFields": []
			}
		}`), del_contributors)
		collection.Schema.AddField(del_contributors)

		// remove
		collection.Schema.RemoveField("ygfz7n8x")

		// remove
		collection.Schema.RemoveField("eppdq1hf")

		// remove
		collection.Schema.RemoveField("xj6mhh4x")

		// remove
		collection.Schema.RemoveField("rorcxf8i")

		// remove
		collection.Schema.RemoveField("ypfcclun")

		// remove
		collection.Schema.RemoveField("lqcqiqmi")

		// remove
		collection.Schema.RemoveField("i03lyym2")

		// remove
		collection.Schema.RemoveField("qox0ikjm")

		return dao.SaveCollection(collection)
	})
}
