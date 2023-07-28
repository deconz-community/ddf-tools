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
			"query": "SELECT \n  bundle.id,\n  bundle.uuid,\n  bundle.name,\n  bundle.version,\n  bundle.version_numeric,\n  bundle.version_tag,\n  bundle.version_deconz,\n  bundle.source,\n  bundle.contributors,\n  bundle.pre_release,\n  bundle.deprecated,\n  bundle.deprecated_description,\n  bundle.file,\n  bundle.hash,\n  bundle.created,\n  bundle.updated\nFROM \n  bundle \nWHERE \n  bundle.version_tag = 'lastest'"
		}`), &options)
		collection.SetOptions(options)

		// remove
		collection.Schema.RemoveField("p82gux3p")

		// remove
		collection.Schema.RemoveField("saxyyiht")

		// remove
		collection.Schema.RemoveField("c2uzjqt8")

		// remove
		collection.Schema.RemoveField("j1qc4k4r")

		// remove
		collection.Schema.RemoveField("u5z16xka")

		// remove
		collection.Schema.RemoveField("yik1eczp")

		// remove
		collection.Schema.RemoveField("gj9q4bya")

		// remove
		collection.Schema.RemoveField("viuohcos")

		// remove
		collection.Schema.RemoveField("fk11q6u3")

		// remove
		collection.Schema.RemoveField("zwwn26ag")

		// remove
		collection.Schema.RemoveField("no1ohbs7")

		// remove
		collection.Schema.RemoveField("cjjp4nqb")

		// remove
		collection.Schema.RemoveField("u8wwsqlp")

		// add
		new_uuid := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "snytntyj",
			"name": "uuid",
			"type": "text",
			"required": true,
			"unique": false,
			"options": {
				"min": 36,
				"max": 36,
				"pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
			}
		}`), new_uuid)
		collection.Schema.AddField(new_uuid)

		// add
		new_name := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "qlmcm5ls",
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
			"id": "sdl8eucw",
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
			"id": "euoby40t",
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
			"id": "mpucx5vr",
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
			"id": "b8ikgl2s",
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
			"id": "spjh85bu",
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
			"id": "broqzean",
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
			"id": "la96yhfc",
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
			"id": "v9hitrgo",
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
			"id": "zmdrmmr4",
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
			"id": "l7khdcrt",
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
			"id": "f33ywu0e",
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
			"query": "SELECT \n  (ROW_NUMBER() OVER()) as id,\n  bundle.uuid,\n  bundle.name,\n  bundle.version,\n  bundle.version_numeric,\n  bundle.version_tag,\n  bundle.version_deconz,\n  bundle.source,\n  bundle.contributors,\n  bundle.pre_release,\n  bundle.deprecated,\n  bundle.deprecated_description,\n  bundle.file,\n  bundle.hash,\n  bundle.created,\n  bundle.updated\nFROM \n  bundle \nWHERE \n  bundle.version_tag = 'lastest'"
		}`), &options)
		collection.SetOptions(options)

		// add
		del_uuid := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "p82gux3p",
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
			"id": "saxyyiht",
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
			"id": "c2uzjqt8",
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
			"id": "j1qc4k4r",
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
			"id": "u5z16xka",
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
			"id": "yik1eczp",
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
			"id": "gj9q4bya",
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
			"id": "viuohcos",
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
			"id": "fk11q6u3",
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
			"id": "zwwn26ag",
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
			"id": "no1ohbs7",
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
			"id": "cjjp4nqb",
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
			"id": "u8wwsqlp",
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
		collection.Schema.RemoveField("snytntyj")

		// remove
		collection.Schema.RemoveField("qlmcm5ls")

		// remove
		collection.Schema.RemoveField("sdl8eucw")

		// remove
		collection.Schema.RemoveField("euoby40t")

		// remove
		collection.Schema.RemoveField("mpucx5vr")

		// remove
		collection.Schema.RemoveField("b8ikgl2s")

		// remove
		collection.Schema.RemoveField("spjh85bu")

		// remove
		collection.Schema.RemoveField("broqzean")

		// remove
		collection.Schema.RemoveField("la96yhfc")

		// remove
		collection.Schema.RemoveField("v9hitrgo")

		// remove
		collection.Schema.RemoveField("zmdrmmr4")

		// remove
		collection.Schema.RemoveField("l7khdcrt")

		// remove
		collection.Schema.RemoveField("f33ywu0e")

		return dao.SaveCollection(collection)
	})
}
