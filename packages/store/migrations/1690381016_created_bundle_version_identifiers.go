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
			"id": "a8avpfp4q0a21k2",
			"created": "2023-07-26 14:16:56.170Z",
			"updated": "2023-07-26 14:16:56.170Z",
			"name": "bundle_version_identifiers",
			"type": "base",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "wvjjuzuh",
					"name": "bundle_version",
					"type": "relation",
					"required": true,
					"unique": false,
					"options": {
						"collectionId": "s3k1ps4o2zogd9o",
						"cascadeDelete": true,
						"minSelect": null,
						"maxSelect": 1,
						"displayFields": []
					}
				},
				{
					"system": false,
					"id": "pqk6l24h",
					"name": "manufacturer",
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
					"id": "dv4z7biy",
					"name": "model",
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
				"CREATE INDEX ` + "`" + `idx_3oDICG5` + "`" + ` ON ` + "`" + `bundle_version_identifiers` + "`" + ` (` + "`" + `bundle_version` + "`" + `)",
				"CREATE INDEX ` + "`" + `idx_v7szwcV` + "`" + ` ON ` + "`" + `bundle_version_identifiers` + "`" + ` (\n  ` + "`" + `manufacturer` + "`" + `,\n  ` + "`" + `model` + "`" + `\n)"
			],
			"listRule": null,
			"viewRule": null,
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

		collection, err := dao.FindCollectionByNameOrId("a8avpfp4q0a21k2")
		if err != nil {
			return err
		}

		return dao.DeleteCollection(collection)
	})
}
