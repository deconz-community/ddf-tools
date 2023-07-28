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
		collection.Schema.RemoveField("87nr5t69")

		// remove
		collection.Schema.RemoveField("wfyfghyh")

		// remove
		collection.Schema.RemoveField("mdpvdodi")

		// remove
		collection.Schema.RemoveField("dvpvz6x8")

		// remove
		collection.Schema.RemoveField("pt5rhh5g")

		// remove
		collection.Schema.RemoveField("l21yi2mm")

		// remove
		collection.Schema.RemoveField("uqerpbd8")

		// remove
		collection.Schema.RemoveField("k0arjnyh")

		// remove
		collection.Schema.RemoveField("vhpyjejz")

		// remove
		collection.Schema.RemoveField("l0pzsird")

		// remove
		collection.Schema.RemoveField("twhbswsj")

		// remove
		collection.Schema.RemoveField("rennjlzf")

		// remove
		collection.Schema.RemoveField("2mln8lqq")

		// add
		new_uuid := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "hdmahn3i",
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
			"id": "hzuabkc6",
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
			"id": "sxyjljll",
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
			"id": "cttpqbpi",
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
			"id": "3upvq3ae",
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
			"id": "rv166tu3",
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
			"id": "1vxlucui",
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
			"id": "womy2auy",
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
			"id": "dxzck8x2",
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
			"id": "uovjncnz",
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
			"id": "vgjfpaxe",
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
			"id": "9w328hxq",
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
			"id": "p50qaatc",
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
			"query": "SELECT \n  bundle.uuid,\n  bundle.id,\n  bundle.name,\n  bundle.version,\n  bundle.version_numeric,\n  bundle.version_tag,\n  bundle.version_deconz,\n  bundle.source,\n  bundle.contributors,\n  bundle.pre_release,\n  bundle.deprecated,\n  bundle.deprecated_description,\n  bundle.file,\n  bundle.hash,\n  bundle.created,\n  bundle.updated\nFROM \n  bundle \nWHERE \n  bundle.version_tag = 'lastest'"
		}`), &options)
		collection.SetOptions(options)

		// add
		del_uuid := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "87nr5t69",
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
			"id": "wfyfghyh",
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
			"id": "mdpvdodi",
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
			"id": "dvpvz6x8",
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
			"id": "pt5rhh5g",
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
			"id": "l21yi2mm",
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
			"id": "uqerpbd8",
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
			"id": "k0arjnyh",
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
			"id": "vhpyjejz",
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
			"id": "l0pzsird",
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
			"id": "twhbswsj",
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
			"id": "rennjlzf",
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
			"id": "2mln8lqq",
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
		collection.Schema.RemoveField("hdmahn3i")

		// remove
		collection.Schema.RemoveField("hzuabkc6")

		// remove
		collection.Schema.RemoveField("sxyjljll")

		// remove
		collection.Schema.RemoveField("cttpqbpi")

		// remove
		collection.Schema.RemoveField("3upvq3ae")

		// remove
		collection.Schema.RemoveField("rv166tu3")

		// remove
		collection.Schema.RemoveField("1vxlucui")

		// remove
		collection.Schema.RemoveField("womy2auy")

		// remove
		collection.Schema.RemoveField("dxzck8x2")

		// remove
		collection.Schema.RemoveField("uovjncnz")

		// remove
		collection.Schema.RemoveField("vgjfpaxe")

		// remove
		collection.Schema.RemoveField("9w328hxq")

		// remove
		collection.Schema.RemoveField("p50qaatc")

		return dao.SaveCollection(collection)
	})
}
