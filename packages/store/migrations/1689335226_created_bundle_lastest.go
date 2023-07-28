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
			"created": "2023-07-14 11:47:06.266Z",
			"updated": "2023-07-14 11:47:06.266Z",
			"name": "bundle_lastest",
			"type": "view",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "x91tyczl",
					"name": "name",
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
					"id": "es2dmogq",
					"name": "description",
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
					"id": "lttcxqid",
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
					"id": "vrm3cma0",
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
					"id": "znid34mf",
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
				},
				{
					"system": false,
					"id": "xyzrlrb2",
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
					"id": "lyrb5bqp",
					"name": "hash",
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
					"id": "wbe4cv8d",
					"name": "desc",
					"type": "json",
					"required": false,
					"unique": false,
					"options": {}
				},
				{
					"system": false,
					"id": "6sw36ad5",
					"name": "pre_release",
					"type": "bool",
					"required": false,
					"unique": false,
					"options": {}
				},
				{
					"system": false,
					"id": "goti1cpc",
					"name": "deprecated",
					"type": "bool",
					"required": false,
					"unique": false,
					"options": {}
				},
				{
					"system": false,
					"id": "jg3l4f6g",
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
					"id": "nxa6otde",
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
				}
			],
			"indexes": [],
			"listRule": null,
			"viewRule": null,
			"createRule": null,
			"updateRule": null,
			"deleteRule": null,
			"options": {
				"query": "SELECT bt.id, bt.name, bt.description, bt.source, bv.version, bv.device_identifiers, bv.file, bv.hash, bv.desc, bv.pre_release, bv.deprecated, bv.deprecated_description, bv.updated, bv.contributors\nFROM bundle_tree bt\nJOIN bundle_version bv ON bt.id = bv.bundle_tree\nWHERE bv.version_numeric = (\n  SELECT MAX(version_numeric)\n  FROM bundle_version bv2\n  WHERE bv.bundle_tree = bv2.bundle_tree\n)\nAND bv.updated = (\n  SELECT MAX(updated)\n  FROM bundle_version bv3\n  WHERE bv.bundle_tree = bv3.bundle_tree\n  AND bv.version_numeric = bv3.version_numeric\n)"
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
