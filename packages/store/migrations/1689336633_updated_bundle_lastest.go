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
			"query": "SELECT \n  bt.id, \n  bt.name, \n  bv.device_identifiers, \n  bt.description as tree_description, \n  bv.description as version_description, \n  bv.source, \n  bv.version, \n  bv.file, \n  bv.hash, \n  bv.updated, \n  bv.contributors \nFROM \n  bundle_tree bt \n  JOIN bundle_version bv ON bt.id = bv.bundle_tree \nWHERE \n  bv.version_numeric = (\n    SELECT \n      MAX(version_numeric) \n    FROM \n      bundle_version bv2 \n    WHERE \n      bv.bundle_tree = bv2.bundle_tree \n      AND bv2.deprecated = 0 \n      AND bv2.pre_release = 0\n  ) \n  AND bv.updated = (\n    SELECT \n      MAX(updated) \n    FROM \n      bundle_version bv3 \n    WHERE \n      bv.bundle_tree = bv3.bundle_tree \n      AND bv.version_numeric = bv3.version_numeric \n      AND bv3.deprecated = 0 \n      AND bv3.pre_release = 0\n  ) \n  AND bv.deprecated = 0 \n  AND bv.pre_release = 0"
		}`), &options)
		collection.SetOptions(options)

		// remove
		collection.Schema.RemoveField("auxjmbcf")

		// remove
		collection.Schema.RemoveField("vjhfl0rn")

		// remove
		collection.Schema.RemoveField("5n7m29st")

		// remove
		collection.Schema.RemoveField("zvxriyfq")

		// remove
		collection.Schema.RemoveField("anaxhw7r")

		// remove
		collection.Schema.RemoveField("ly3xm8hl")

		// remove
		collection.Schema.RemoveField("2ztyjv7z")

		// remove
		collection.Schema.RemoveField("tshkb0fl")

		// remove
		collection.Schema.RemoveField("fnotqmfi")

		// add
		new_name := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "sjhhxsac",
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
		new_device_identifiers := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "bmspjbsz",
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
		new_tree_description := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "om0am1ms",
			"name": "tree_description",
			"type": "text",
			"required": false,
			"unique": false,
			"options": {
				"min": null,
				"max": null,
				"pattern": ""
			}
		}`), new_tree_description)
		collection.Schema.AddField(new_tree_description)

		// add
		new_version_description := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "gqwiimiu",
			"name": "version_description",
			"type": "json",
			"required": false,
			"unique": false,
			"options": {}
		}`), new_version_description)
		collection.Schema.AddField(new_version_description)

		// add
		new_source := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "erkecgp4",
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
			"id": "mvvix4xm",
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
		new_file := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "cfe47ea5",
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
			"id": "9snbek2h",
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
		new_contributors := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "ugzgaudr",
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
			"query": "\n\nSELECT \n  bt.id, \n  bt.name, \n  bv.device_identifiers, \n  bt.description as tree_description, \n  bv.description as version_description, \n  bv.source, \n  bv.version, \n  bv.file, \n  bv.hash, \n  bv.updated, \n  bv.contributors \nFROM \n  bundle_tree bt \n  JOIN bundle_version bv ON bt.id = bv.bundle_tree \nWHERE \n  bv.version_numeric = (\n    SELECT \n      MAX(version_numeric) \n    FROM \n      bundle_version bv2 \n    WHERE \n      bv.bundle_tree = bv2.bundle_tree \n      AND bv2.deprecated = 0 \n      AND bv2.pre_release = 0\n  ) \n  AND bv.updated = (\n    SELECT \n      MAX(updated) \n    FROM \n      bundle_version bv3 \n    WHERE \n      bv.bundle_tree = bv3.bundle_tree \n      AND bv.version_numeric = bv3.version_numeric \n      AND bv3.deprecated = 0 \n      AND bv3.pre_release = 0\n  ) \n  AND bv.deprecated = 0 \n  AND bv.pre_release = 0\n"
		}`), &options)
		collection.SetOptions(options)

		// add
		del_name := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "auxjmbcf",
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
			"id": "vjhfl0rn",
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
		del_tree_description := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "5n7m29st",
			"name": "tree_description",
			"type": "text",
			"required": false,
			"unique": false,
			"options": {
				"min": null,
				"max": null,
				"pattern": ""
			}
		}`), del_tree_description)
		collection.Schema.AddField(del_tree_description)

		// add
		del_version_description := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "zvxriyfq",
			"name": "version_description",
			"type": "json",
			"required": false,
			"unique": false,
			"options": {}
		}`), del_version_description)
		collection.Schema.AddField(del_version_description)

		// add
		del_source := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "anaxhw7r",
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
			"id": "ly3xm8hl",
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
			"id": "2ztyjv7z",
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
			"id": "tshkb0fl",
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
		del_contributors := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "fnotqmfi",
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
		collection.Schema.RemoveField("sjhhxsac")

		// remove
		collection.Schema.RemoveField("bmspjbsz")

		// remove
		collection.Schema.RemoveField("om0am1ms")

		// remove
		collection.Schema.RemoveField("gqwiimiu")

		// remove
		collection.Schema.RemoveField("erkecgp4")

		// remove
		collection.Schema.RemoveField("mvvix4xm")

		// remove
		collection.Schema.RemoveField("cfe47ea5")

		// remove
		collection.Schema.RemoveField("9snbek2h")

		// remove
		collection.Schema.RemoveField("ugzgaudr")

		return dao.SaveCollection(collection)
	})
}
