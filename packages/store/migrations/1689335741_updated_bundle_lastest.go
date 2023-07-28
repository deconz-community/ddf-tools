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
			"query": "SELECT bt.id, bt.name, bt.description as description_bundle, bt.source, bv.version, bv.device_identifiers, bv.file, bv.hash, bv.description as description_version, bv.updated, bv.contributors\nFROM bundle_tree bt\nJOIN bundle_version bv ON bt.id = bv.bundle_tree\nWHERE bv.version_numeric = (\n  SELECT MAX(version_numeric)\n  FROM bundle_version bv2\n  WHERE bv.bundle_tree = bv2.bundle_tree\n    AND bv2.deprecated = 0\n    AND bv2.pre_release = 0\n)\nAND bv.updated = (\n  SELECT MAX(updated)\n  FROM bundle_version bv3\n  WHERE bv.bundle_tree = bv3.bundle_tree\n    AND bv.version_numeric = bv3.version_numeric\n    AND bv3.deprecated = 0\n    AND bv3.pre_release = 0\n)\nAND bv.deprecated = 0\nAND bv.pre_release = 0;"
		}`), &options)
		collection.SetOptions(options)

		// remove
		collection.Schema.RemoveField("rbennfxu")

		// remove
		collection.Schema.RemoveField("yz6rd2b7")

		// remove
		collection.Schema.RemoveField("vd29pzor")

		// remove
		collection.Schema.RemoveField("ekxxboyq")

		// remove
		collection.Schema.RemoveField("i4ettuez")

		// remove
		collection.Schema.RemoveField("74nqxo9x")

		// remove
		collection.Schema.RemoveField("tb2bmsxc")

		// remove
		collection.Schema.RemoveField("trushfwv")

		// remove
		collection.Schema.RemoveField("jb60emrr")

		// add
		new_name := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "spqeghxm",
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
			"id": "wl7sfw9y",
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
		new_source := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "cpknaf0z",
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
			"id": "v0x5cptp",
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
			"id": "koxsdmcg",
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
			"id": "fbygenwi",
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
			"id": "fcnpfc9d",
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
			"id": "h3cyjk2e",
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
			"id": "4tx7reul",
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
			"query": "SELECT bt.id, bt.name, bt.description, bt.source, bv.version, bv.device_identifiers, bv.file, bv.hash, bv.desc, bv.updated, bv.contributors\nFROM bundle_tree bt\nJOIN bundle_version bv ON bt.id = bv.bundle_tree\nWHERE bv.version_numeric = (\n  SELECT MAX(version_numeric)\n  FROM bundle_version bv2\n  WHERE bv.bundle_tree = bv2.bundle_tree\n    AND bv2.deprecated = 0\n    AND bv2.pre_release = 0\n)\nAND bv.updated = (\n  SELECT MAX(updated)\n  FROM bundle_version bv3\n  WHERE bv.bundle_tree = bv3.bundle_tree\n    AND bv.version_numeric = bv3.version_numeric\n    AND bv3.deprecated = 0\n    AND bv3.pre_release = 0\n)\nAND bv.deprecated = 0\nAND bv.pre_release = 0;"
		}`), &options)
		collection.SetOptions(options)

		// add
		del_name := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "rbennfxu",
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
		del_description := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "yz6rd2b7",
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
			"id": "vd29pzor",
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
			"id": "ekxxboyq",
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
			"id": "i4ettuez",
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
			"id": "74nqxo9x",
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
			"id": "tb2bmsxc",
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
			"id": "trushfwv",
			"name": "desc",
			"type": "json",
			"required": false,
			"unique": false,
			"options": {}
		}`), del_desc)
		collection.Schema.AddField(del_desc)

		// add
		del_contributors := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "jb60emrr",
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
		collection.Schema.RemoveField("spqeghxm")

		// remove
		collection.Schema.RemoveField("wl7sfw9y")

		// remove
		collection.Schema.RemoveField("cpknaf0z")

		// remove
		collection.Schema.RemoveField("v0x5cptp")

		// remove
		collection.Schema.RemoveField("koxsdmcg")

		// remove
		collection.Schema.RemoveField("fbygenwi")

		// remove
		collection.Schema.RemoveField("fcnpfc9d")

		// remove
		collection.Schema.RemoveField("h3cyjk2e")

		// remove
		collection.Schema.RemoveField("4tx7reul")

		return dao.SaveCollection(collection)
	})
}
