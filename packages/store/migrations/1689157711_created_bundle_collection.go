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
			"created": "2023-07-12 10:28:31.563Z",
			"updated": "2023-07-12 10:28:31.563Z",
			"name": "bundle_collection",
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
					"id": "dyypdvmy",
					"name": "description",
					"type": "editor",
					"required": false,
					"unique": false,
					"options": {}
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
				},
				{
					"system": false,
					"id": "jcv1wnmj",
					"name": "bundle_trees",
					"type": "relation",
					"required": false,
					"unique": false,
					"options": {
						"collectionId": "jocyv5zq61fi982",
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

		collection, err := dao.FindCollectionByNameOrId("edu73sq7td7c8cv")
		if err != nil {
			return err
		}

		return dao.DeleteCollection(collection)
	})
}
