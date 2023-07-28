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
			"created": "2023-07-12 10:28:31.563Z",
			"updated": "2023-07-12 10:28:31.563Z",
			"name": "bundle_evaluation",
			"type": "base",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "qm5dm4zp",
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
					"id": "jox6g36b",
					"name": "comment",
					"type": "editor",
					"required": false,
					"unique": false,
					"options": {}
				}
			],
			"indexes": [],
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

		collection, err := dao.FindCollectionByNameOrId("0m3xpiprxh27iys")
		if err != nil {
			return err
		}

		return dao.DeleteCollection(collection)
	})
}
