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
			"query": "SELECT \n  bundle.uuid as id,\n  bundle.name,\n  bundle.version,\n  bundle.version_numeric,\n  bundle.version_tag,\n  bundle.version_deconz,\n  bundle.source,\n  bundle.contributors,\n  bundle.pre_release,\n  bundle.deprecated,\n  bundle.deprecated_description,\n  bundle.file,\n  bundle.hash,\n  bundle.created,\n  bundle.updated\nFROM \n  bundle \nWHERE \n  bundle.version_tag = 'lastest'"
		}`), &options)
		collection.SetOptions(options)

		// remove
		collection.Schema.RemoveField("g8cfhuyk")

		// remove
		collection.Schema.RemoveField("ejxpypbv")

		// remove
		collection.Schema.RemoveField("bmfa6rvf")

		// remove
		collection.Schema.RemoveField("1hjtw3aq")

		// remove
		collection.Schema.RemoveField("uvxn75nk")

		// remove
		collection.Schema.RemoveField("kjit9vqk")

		// remove
		collection.Schema.RemoveField("nognkaeu")

		// remove
		collection.Schema.RemoveField("xvpwxh2b")

		// remove
		collection.Schema.RemoveField("yr0fi8h1")

		// remove
		collection.Schema.RemoveField("rmye4dm3")

		// remove
		collection.Schema.RemoveField("x75ddyyq")

		// remove
		collection.Schema.RemoveField("lu1o7ryx")

		// remove
		collection.Schema.RemoveField("np6aqdxx")

		// add
		new_name := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "gch07p8b",
			"name": "name",
			"type": "text",
			"required": true,
			"unique": false,
			"options": {
				"min": null,
				"max": null,
				"pattern": ""
			}
		}`), new_name)
		collection.Schema.AddField(new_name)

		// add
		new_version := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "wfndmbrp",
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
		new_version_numeric := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "0basf0gg",
			"name": "version_numeric",
			"type": "number",
			"required": true,
			"unique": false,
			"options": {
				"min": null,
				"max": null
			}
		}`), new_version_numeric)
		collection.Schema.AddField(new_version_numeric)

		// add
		new_version_tag := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "nkwlqqia",
			"name": "version_tag",
			"type": "select",
			"required": false,
			"unique": false,
			"options": {
				"maxSelect": 1,
				"values": [
					"lastest"
				]
			}
		}`), new_version_tag)
		collection.Schema.AddField(new_version_tag)

		// add
		new_version_deconz := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "canv0gkk",
			"name": "version_deconz",
			"type": "text",
			"required": false,
			"unique": false,
			"options": {
				"min": null,
				"max": null,
				"pattern": ""
			}
		}`), new_version_deconz)
		collection.Schema.AddField(new_version_deconz)

		// add
		new_source := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "ztlkvanw",
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
		new_contributors := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "heahsrn3",
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

		// add
		new_pre_release := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "cv33480e",
			"name": "pre_release",
			"type": "bool",
			"required": false,
			"unique": false,
			"options": {}
		}`), new_pre_release)
		collection.Schema.AddField(new_pre_release)

		// add
		new_deprecated := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "mmhv8bbb",
			"name": "deprecated",
			"type": "bool",
			"required": false,
			"unique": false,
			"options": {}
		}`), new_deprecated)
		collection.Schema.AddField(new_deprecated)

		// add
		new_deprecated_description := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "ds3mncep",
			"name": "deprecated_description",
			"type": "text",
			"required": false,
			"unique": false,
			"options": {
				"min": null,
				"max": null,
				"pattern": ""
			}
		}`), new_deprecated_description)
		collection.Schema.AddField(new_deprecated_description)

		// add
		new_file := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "rcgsnvtw",
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
			"id": "onxtwfsj",
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

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("q97y8xw37o2blnu")
		if err != nil {
			return err
		}

		options := map[string]any{}
		json.Unmarshal([]byte(`{
			"query": "SELECT \n  bundle.id,\n  bundle.uuid,\n  bundle.name,\n  bundle.version,\n  bundle.version_numeric,\n  bundle.version_tag,\n  bundle.version_deconz,\n  bundle.source,\n  bundle.contributors,\n  bundle.pre_release,\n  bundle.deprecated,\n  bundle.deprecated_description,\n  bundle.file,\n  bundle.hash,\n  bundle.created,\n  bundle.updated\nFROM \n  bundle \nWHERE \n  bundle.version_tag = 'lastest'"
		}`), &options)
		collection.SetOptions(options)

		// add
		del_uuid := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "g8cfhuyk",
			"name": "uuid",
			"type": "text",
			"required": true,
			"unique": false,
			"options": {
				"min": 36,
				"max": 36,
				"pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
			}
		}`), del_uuid)
		collection.Schema.AddField(del_uuid)

		// add
		del_name := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "ejxpypbv",
			"name": "name",
			"type": "text",
			"required": true,
			"unique": false,
			"options": {
				"min": null,
				"max": null,
				"pattern": ""
			}
		}`), del_name)
		collection.Schema.AddField(del_name)

		// add
		del_version := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "bmfa6rvf",
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
		del_version_numeric := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "1hjtw3aq",
			"name": "version_numeric",
			"type": "number",
			"required": true,
			"unique": false,
			"options": {
				"min": null,
				"max": null
			}
		}`), del_version_numeric)
		collection.Schema.AddField(del_version_numeric)

		// add
		del_version_tag := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "uvxn75nk",
			"name": "version_tag",
			"type": "select",
			"required": false,
			"unique": false,
			"options": {
				"maxSelect": 1,
				"values": [
					"lastest"
				]
			}
		}`), del_version_tag)
		collection.Schema.AddField(del_version_tag)

		// add
		del_version_deconz := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "kjit9vqk",
			"name": "version_deconz",
			"type": "text",
			"required": false,
			"unique": false,
			"options": {
				"min": null,
				"max": null,
				"pattern": ""
			}
		}`), del_version_deconz)
		collection.Schema.AddField(del_version_deconz)

		// add
		del_source := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "nognkaeu",
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
		del_contributors := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "xvpwxh2b",
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

		// add
		del_pre_release := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "yr0fi8h1",
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
			"id": "rmye4dm3",
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
			"id": "x75ddyyq",
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
		del_file := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "lu1o7ryx",
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
			"id": "np6aqdxx",
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

		// remove
		collection.Schema.RemoveField("gch07p8b")

		// remove
		collection.Schema.RemoveField("wfndmbrp")

		// remove
		collection.Schema.RemoveField("0basf0gg")

		// remove
		collection.Schema.RemoveField("nkwlqqia")

		// remove
		collection.Schema.RemoveField("canv0gkk")

		// remove
		collection.Schema.RemoveField("ztlkvanw")

		// remove
		collection.Schema.RemoveField("heahsrn3")

		// remove
		collection.Schema.RemoveField("cv33480e")

		// remove
		collection.Schema.RemoveField("mmhv8bbb")

		// remove
		collection.Schema.RemoveField("ds3mncep")

		// remove
		collection.Schema.RemoveField("rcgsnvtw")

		// remove
		collection.Schema.RemoveField("onxtwfsj")

		return dao.SaveCollection(collection)
	})
}
