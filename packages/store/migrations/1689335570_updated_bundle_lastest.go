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
			"query": "SELECT bt.id, bt.name, bt.description, bt.source, bv.version, bv.device_identifiers, bv.file, bv.hash, bv.desc, bv.pre_release, bv.updated, bv.contributors\nFROM bundle_tree bt\nJOIN bundle_version bv ON bt.id = bv.bundle_tree\nWHERE bv.version_numeric = (\n  SELECT MAX(version_numeric)\n  FROM bundle_version bv2\n  WHERE bv.bundle_tree = bv2.bundle_tree\n    AND bv2.deprecated = 0\n)\nAND bv.updated = (\n  SELECT MAX(updated)\n  FROM bundle_version bv3\n  WHERE bv.bundle_tree = bv3.bundle_tree\n    AND bv.version_numeric = bv3.version_numeric\n    AND bv3.deprecated = 0\n)\nAND bv.deprecated = 0;"
		}`), &options)
		collection.SetOptions(options)

		// remove
		collection.Schema.RemoveField("koikdsjz")

		// remove
		collection.Schema.RemoveField("ypma4xbk")

		// remove
		collection.Schema.RemoveField("klggalsp")

		// remove
		collection.Schema.RemoveField("sjp9i5vk")

		// remove
		collection.Schema.RemoveField("zx86h6ip")

		// remove
		collection.Schema.RemoveField("b9hmotsf")

		// remove
		collection.Schema.RemoveField("6kynovfp")

		// remove
		collection.Schema.RemoveField("lmoibovi")

		// remove
		collection.Schema.RemoveField("yjpg1503")

		// remove
		collection.Schema.RemoveField("lfcb8vzq")

		// remove
		collection.Schema.RemoveField("ob3k0soo")

		// remove
		collection.Schema.RemoveField("wbfhdrbw")

		// add
		new_name := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "xvd3sigi",
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
		new_description := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "xszn6fxh",
			"name": "description",
			"type": "text",
			"required": false,
			"unique": false,
			"options": {
				"min": null,
				"max": null,
				"pattern": ""
			}
		}`), new_description)
		collection.Schema.AddField(new_description)

		// add
		new_source := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "gozh7poy",
			"name": "source",
			"type": "select",
			"required": false,
			"unique": false,
			"options": {
				"maxSelect": 1,
				"values": [
					"github",
					"upload"
				]
			}
		}`), new_source)
		collection.Schema.AddField(new_source)

		// add
		new_version := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "0ap4fh5n",
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
			"id": "zsyny0ma",
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
			"id": "ua06ahy3",
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
			"id": "gimbteig",
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
		new_desc := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "4pnrhky7",
			"name": "desc",
			"type": "json",
			"required": false,
			"unique": false,
			"options": {}
		}`), new_desc)
		collection.Schema.AddField(new_desc)

		// add
		new_pre_release := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "xgntsjtt",
			"name": "pre_release",
			"type": "bool",
			"required": false,
			"unique": false,
			"options": {}
		}`), new_pre_release)
		collection.Schema.AddField(new_pre_release)

		// add
		new_contributors := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "y4x5r298",
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
			"query": "SELECT \n  bt.id, \n  bt.name, \n  bv.device_identifiers, \n  bt.description, \n  bt.source, \n  bv.version, \n  bv.file, \n  bv.hash, \n  bv.desc, \n  bv.pre_release, \n  bv.deprecated, \n  bv.deprecated_description, \n  bv.updated, \n  bv.contributors \nFROM \n  bundle_tree bt \n  JOIN bundle_version bv ON bt.id = bv.bundle_tree \nWHERE \n  bv.version_numeric = (\n    SELECT \n      Max(version_numeric) \n    FROM \n      bundle_version bv2 \n    WHERE \n      bv.bundle_tree = bv2.bundle_tree\n  ) \n  AND bv.updated = (\n    SELECT \n      Max(updated) \n    FROM \n      bundle_version bv3 \n    WHERE \n      bv.bundle_tree = bv3.bundle_tree \n      AND bv.version_numeric = bv3.version_numeric\n  )\n"
		}`), &options)
		collection.SetOptions(options)

		// add
		del_name := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "koikdsjz",
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
		del_device_identifiers := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "ypma4xbk",
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
		del_description := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "klggalsp",
			"name": "description",
			"type": "text",
			"required": false,
			"unique": false,
			"options": {
				"min": null,
				"max": null,
				"pattern": ""
			}
		}`), del_description)
		collection.Schema.AddField(del_description)

		// add
		del_source := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "sjp9i5vk",
			"name": "source",
			"type": "select",
			"required": false,
			"unique": false,
			"options": {
				"maxSelect": 1,
				"values": [
					"github",
					"upload"
				]
			}
		}`), del_source)
		collection.Schema.AddField(del_source)

		// add
		del_version := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "zx86h6ip",
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
		del_file := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "b9hmotsf",
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
			"id": "6kynovfp",
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
		del_desc := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "lmoibovi",
			"name": "desc",
			"type": "json",
			"required": false,
			"unique": false,
			"options": {}
		}`), del_desc)
		collection.Schema.AddField(del_desc)

		// add
		del_pre_release := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "yjpg1503",
			"name": "pre_release",
			"type": "bool",
			"required": false,
			"unique": false,
			"options": {}
		}`), del_pre_release)
		collection.Schema.AddField(del_pre_release)

		// add
		del_deprecated := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "lfcb8vzq",
			"name": "deprecated",
			"type": "bool",
			"required": false,
			"unique": false,
			"options": {}
		}`), del_deprecated)
		collection.Schema.AddField(del_deprecated)

		// add
		del_deprecated_description := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "ob3k0soo",
			"name": "deprecated_description",
			"type": "text",
			"required": false,
			"unique": false,
			"options": {
				"min": null,
				"max": null,
				"pattern": ""
			}
		}`), del_deprecated_description)
		collection.Schema.AddField(del_deprecated_description)

		// add
		del_contributors := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "wbfhdrbw",
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
		collection.Schema.RemoveField("xvd3sigi")

		// remove
		collection.Schema.RemoveField("xszn6fxh")

		// remove
		collection.Schema.RemoveField("gozh7poy")

		// remove
		collection.Schema.RemoveField("0ap4fh5n")

		// remove
		collection.Schema.RemoveField("zsyny0ma")

		// remove
		collection.Schema.RemoveField("ua06ahy3")

		// remove
		collection.Schema.RemoveField("gimbteig")

		// remove
		collection.Schema.RemoveField("4pnrhky7")

		// remove
		collection.Schema.RemoveField("xgntsjtt")

		// remove
		collection.Schema.RemoveField("y4x5r298")

		return dao.SaveCollection(collection)
	})
}
