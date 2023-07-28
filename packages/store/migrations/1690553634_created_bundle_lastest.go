package migrations

import (
	"encoding/json"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/daos"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/models"
)

func init() {
	m.Register(func(db dbx.Builder) error {
		jsonData := `{
			"id": "q97y8xw37o2blnu",
			"created": "2023-07-28 14:13:54.162Z",
			"updated": "2023-07-28 14:13:54.169Z",
			"name": "bundle_lastest",
			"type": "view",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "rzptlxnk",
					"name": "bundle_id",
					"type": "relation",
					"required": false,
					"unique": false,
					"options": {
						"collectionId": "s3k1ps4o2zogd9o",
						"cascadeDelete": false,
						"minSelect": null,
						"maxSelect": 1,
						"displayFields": null
					}
				},
				{
					"system": false,
					"id": "k1edzoyd",
					"name": "uuid",
					"type": "text",
					"required": true,
					"unique": false,
					"options": {
						"min": 36,
						"max": 36,
						"pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
					}
				},
				{
					"system": false,
					"id": "higkr7ta",
					"name": "name",
					"type": "text",
					"required": true,
					"unique": false,
					"options": {
						"min": null,
						"max": null,
						"pattern": ""
					}
				},
				{
					"system": false,
					"id": "ybxbdrki",
					"name": "version",
					"type": "text",
					"required": false,
					"unique": false,
					"options": {
						"min": null,
						"max": null,
						"pattern": ""
					}
				},
				{
					"system": false,
					"id": "hmrbfz6o",
					"name": "version_numeric",
					"type": "number",
					"required": true,
					"unique": false,
					"options": {
						"min": null,
						"max": null
					}
				},
				{
					"system": false,
					"id": "if8wgehh",
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
				},
				{
					"system": false,
					"id": "wllynblh",
					"name": "version_deconz",
					"type": "text",
					"required": false,
					"unique": false,
					"options": {
						"min": null,
						"max": null,
						"pattern": ""
					}
				},
				{
					"system": false,
					"id": "fdsir7zp",
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
				},
				{
					"system": false,
					"id": "ailmwmv7",
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
				},
				{
					"system": false,
					"id": "zgitmsq2",
					"name": "pre_release",
					"type": "bool",
					"required": false,
					"unique": false,
					"options": {}
				},
				{
					"system": false,
					"id": "acvomza2",
					"name": "deprecated",
					"type": "bool",
					"required": false,
					"unique": false,
					"options": {}
				},
				{
					"system": false,
					"id": "bsaobh15",
					"name": "deprecated_description",
					"type": "text",
					"required": false,
					"unique": false,
					"options": {
						"min": null,
						"max": null,
						"pattern": ""
					}
				},
				{
					"system": false,
					"id": "4bprabdl",
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
				},
				{
					"system": false,
					"id": "3wunlofi",
					"name": "hash",
					"type": "text",
					"required": false,
					"unique": false,
					"options": {
						"min": null,
						"max": null,
						"pattern": ""
					}
				}
			],
			"indexes": [],
			"listRule": null,
			"viewRule": null,
			"createRule": null,
			"updateRule": null,
			"deleteRule": null,
			"options": {
				"query": "SELECT \n  bundle.uuid as id,\n  bundle.id as bundle_id,\n  bundle.uuid,\n  bundle.name,\n  bundle.version,\n  bundle.version_numeric,\n  bundle.version_tag,\n  bundle.version_deconz,\n  bundle.source,\n  bundle.contributors,\n  bundle.pre_release,\n  bundle.deprecated,\n  bundle.deprecated_description,\n  bundle.file,\n  bundle.hash,\n  bundle.created,\n  bundle.updated\nFROM \n  bundle \nWHERE \n  bundle.version_tag = 'lastest'"
			}
		}`

		collection := &models.Collection{}
		if err := json.Unmarshal([]byte(jsonData), &collection); err != nil {
			return err
		}

		return daos.New(db).SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("q97y8xw37o2blnu")
		if err != nil {
			return err
		}

		return dao.DeleteCollection(collection)
	})
}
