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
			"id": "edu73sq7td7c8cv",
			"created": "2023-07-28 14:13:54.161Z",
			"updated": "2023-07-28 14:13:54.161Z",
			"name": "collection",
			"type": "base",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "9lfsmcz0",
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
					"id": "p67vgtft",
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
					"id": "i9axejbc",
					"name": "bundle_lastest",
					"type": "relation",
					"required": false,
					"unique": false,
					"options": {
						"collectionId": "q97y8xw37o2blnu",
						"cascadeDelete": true,
						"minSelect": null,
						"maxSelect": null,
						"displayFields": [
							"name",
							"version"
						]
					}
				},
				{
					"system": false,
					"id": "pezzx5zf",
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
			"listRule": "",
			"viewRule": "",
			"createRule": "contributors ~ @request.auth.id",
			"updateRule": "contributors ~ @request.auth.id",
			"deleteRule": "contributors ~ @request.auth.id",
			"options": {}
		}`

		collection := &models.Collection{}
		if err := json.Unmarshal([]byte(jsonData), &collection); err != nil {
			return err
		}

		return daos.New(db).SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("edu73sq7td7c8cv")
		if err != nil {
			return err
		}

		return dao.DeleteCollection(collection)
	})
}
