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
			"id": "s3k1ps4o2zogd9o",
			"created": "2023-07-12 10:28:31.564Z",
			"updated": "2023-07-12 10:28:31.564Z",
			"name": "bundle_version",
			"type": "base",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "2wi0eij4",
					"name": "bundle_tree",
					"type": "relation",
					"required": false,
					"unique": false,
					"options": {
						"collectionId": "jocyv5zq61fi982",
						"cascadeDelete": false,
						"minSelect": null,
						"maxSelect": 1,
						"displayFields": []
					}
				},
				{
					"system": false,
					"id": "usuz5ch3",
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
					"id": "onddevsk",
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
					"id": "jrz1a8j4",
					"name": "desc",
					"type": "json",
					"required": false,
					"unique": false,
					"options": {}
				},
				{
					"system": false,
					"id": "fp2bznzn",
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
					"id": "0ywefta1",
					"name": "device_identifiers",
					"type": "relation",
					"required": false,
					"unique": false,
					"options": {
						"collectionId": "2hgtp75dkzhuee4",
						"cascadeDelete": false,
						"minSelect": null,
						"maxSelect": null,
						"displayFields": []
					}
				},
				{
					"system": false,
					"id": "o0unjkaw",
					"name": "pre_release",
					"type": "bool",
					"required": false,
					"unique": false,
					"options": {}
				},
				{
					"system": false,
					"id": "kf8ksl7b",
					"name": "deprecated",
					"type": "bool",
					"required": false,
					"unique": false,
					"options": {}
				},
				{
					"system": false,
					"id": "eeyahqqv",
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
					"id": "j01pahcy",
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
					"id": "huc9iovt",
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
			"indexes": [
				"CREATE UNIQUE INDEX ` + "`" + `idx_d1H4hsI` + "`" + ` ON ` + "`" + `bundle_version` + "`" + ` (` + "`" + `hash` + "`" + `)"
			],
			"listRule": "",
			"viewRule": "",
			"createRule": null,
			"updateRule": null,
			"deleteRule": null,
			"options": {}
		}`

		collection := &models.Collection{}
		if err := json.Unmarshal([]byte(jsonData), &collection); err != nil {
			return err
		}

		return daos.New(db).SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("s3k1ps4o2zogd9o")
		if err != nil {
			return err
		}

		return dao.DeleteCollection(collection)
	})
}
