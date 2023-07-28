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
			"id": "0m3xpiprxh27iys",
			"created": "2023-07-28 14:13:54.161Z",
			"updated": "2023-07-28 14:13:54.161Z",
			"name": "evaluation",
			"type": "base",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "9rdvagky",
					"name": "bundle",
					"type": "relation",
					"required": false,
					"unique": false,
					"options": {
						"collectionId": "s3k1ps4o2zogd9o",
						"cascadeDelete": true,
						"minSelect": null,
						"maxSelect": 1,
						"displayFields": [
							"name",
							"version"
						]
					}
				},
				{
					"system": false,
					"id": "8dz5shhs",
					"name": "contributor",
					"type": "relation",
					"required": false,
					"unique": false,
					"options": {
						"collectionId": "s3l41jpo7oosnpd",
						"cascadeDelete": false,
						"minSelect": null,
						"maxSelect": 1,
						"displayFields": []
					}
				},
				{
					"system": false,
					"id": "b0lyqv7s",
					"name": "rating",
					"type": "number",
					"required": false,
					"unique": false,
					"options": {
						"min": 1,
						"max": 5
					}
				},
				{
					"system": false,
					"id": "mj1p9brm",
					"name": "comment",
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
			"listRule": "",
			"viewRule": "",
			"createRule": "contributor = @request.auth.id",
			"updateRule": "contributor = @request.auth.id",
			"deleteRule": "contributor = @request.auth.id",
			"options": {}
		}`

		collection := &models.Collection{}
		if err := json.Unmarshal([]byte(jsonData), &collection); err != nil {
			return err
		}

		return daos.New(db).SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("0m3xpiprxh27iys")
		if err != nil {
			return err
		}

		return dao.DeleteCollection(collection)
	})
}
