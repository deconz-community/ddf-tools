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
			"id": "72u55i8q9k0ymkj",
			"created": "2023-07-26 17:29:05.316Z",
			"updated": "2023-07-26 17:29:05.316Z",
			"name": "evaluation_duplicate",
			"type": "base",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "im2zbxex",
					"name": "bundle",
					"type": "relation",
					"required": false,
					"unique": false,
					"options": {
						"collectionId": "a8avpfp4q0a21k2",
						"cascadeDelete": true,
						"minSelect": null,
						"maxSelect": 1,
						"displayFields": []
					}
				},
				{
					"system": false,
					"id": "buau4eqf",
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
					"id": "azttfgig",
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
					"id": "rpobfoeh",
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

		collection, err := dao.FindCollectionByNameOrId("72u55i8q9k0ymkj")
		if err != nil {
			return err
		}

		return dao.DeleteCollection(collection)
	})
}
