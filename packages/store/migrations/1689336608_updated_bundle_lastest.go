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
			"query": "\n\nSELECT \n  bt.id, \n  bt.name, \n  bv.device_identifiers, \n  bt.description as tree_description, \n  bv.description as version_description, \n  bv.version, \n  bv.file, \n  bv.hash, \n  bv.updated, \n  bv.contributors \nFROM \n  bundle_tree bt \n  JOIN bundle_version bv ON bt.id = bv.bundle_tree \nWHERE \n  bv.version_numeric = (\n    SELECT \n      MAX(version_numeric) \n    FROM \n      bundle_version bv2 \n    WHERE \n      bv.bundle_tree = bv2.bundle_tree \n      AND bv2.deprecated = 0 \n      AND bv2.pre_release = 0\n  ) \n  AND bv.updated = (\n    SELECT \n      MAX(updated) \n    FROM \n      bundle_version bv3 \n    WHERE \n      bv.bundle_tree = bv3.bundle_tree \n      AND bv.version_numeric = bv3.version_numeric \n      AND bv3.deprecated = 0 \n      AND bv3.pre_release = 0\n  ) \n  AND bv.deprecated = 0 \n  AND bv.pre_release = 0\n"
		}`), &options)
		collection.SetOptions(options)

		// remove
		collection.Schema.RemoveField("ycluivtv")

		// remove
		collection.Schema.RemoveField("gm7rykhs")

		// remove
		collection.Schema.RemoveField("gu1jhjdz")

		// remove
		collection.Schema.RemoveField("uvhjtdhk")

		// remove
		collection.Schema.RemoveField("52lzkuon")

		// remove
		collection.Schema.RemoveField("iiqqungf")

		// remove
		collection.Schema.RemoveField("de6kaxlw")

		// remove
		collection.Schema.RemoveField("pmmwkxu8")

		// add
		new_name := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "pneww2s6",
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
			"id": "l363zxpy",
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
			"id": "9jebkher",
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
			"id": "yr3m6smw",
			"name": "version_description",
			"type": "json",
			"required": false,
			"unique": false,
			"options": {}
		}`), new_version_description)
		collection.Schema.AddField(new_version_description)

		// add
		new_version := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "zj4q3d9z",
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
			"id": "vsgwihf1",
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
			"id": "ntkjcydp",
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
			"id": "bzlnhlht",
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
			"query": "\nSELECT \n  bt.id, \n  bt.name, \n  bt.description as description_bundle, \n  bv.version, \n  bv.device_identifiers, \n  bv.file, \n  bv.hash, \n  bv.description as description_version, \n  bv.updated, \n  bv.contributors \nFROM \n  bundle_tree bt \n  JOIN bundle_version bv ON bt.id = bv.bundle_tree \nWHERE \n  bv.version_numeric = (\n    SELECT \n      MAX(version_numeric) \n    FROM \n      bundle_version bv2 \n    WHERE \n      bv.bundle_tree = bv2.bundle_tree \n      AND bv2.deprecated = 0 \n      AND bv2.pre_release = 0\n  ) \n  AND bv.updated = (\n    SELECT \n      MAX(updated) \n    FROM \n      bundle_version bv3 \n    WHERE \n      bv.bundle_tree = bv3.bundle_tree \n      AND bv.version_numeric = bv3.version_numeric \n      AND bv3.deprecated = 0 \n      AND bv3.pre_release = 0\n  ) \n  AND bv.deprecated = 0 \n  AND bv.pre_release = 0\n"
		}`), &options)
		collection.SetOptions(options)

		// add
		del_name := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "ycluivtv",
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
			"id": "gm7rykhs",
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
			"id": "gu1jhjdz",
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
			"id": "uvhjtdhk",
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
			"id": "52lzkuon",
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
			"id": "iiqqungf",
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
			"id": "de6kaxlw",
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
			"id": "pmmwkxu8",
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
		collection.Schema.RemoveField("pneww2s6")

		// remove
		collection.Schema.RemoveField("l363zxpy")

		// remove
		collection.Schema.RemoveField("9jebkher")

		// remove
		collection.Schema.RemoveField("yr3m6smw")

		// remove
		collection.Schema.RemoveField("zj4q3d9z")

		// remove
		collection.Schema.RemoveField("vsgwihf1")

		// remove
		collection.Schema.RemoveField("ntkjcydp")

		// remove
		collection.Schema.RemoveField("bzlnhlht")

		return dao.SaveCollection(collection)
	})
}
