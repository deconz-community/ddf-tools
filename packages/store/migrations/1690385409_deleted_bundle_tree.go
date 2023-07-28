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
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("jocyv5zq61fi982")
		if err != nil {
			return err
		}

		return dao.DeleteCollection(collection)
	}, func(db dbx.Builder) error {
		jsonData := `{
			"id": "jocyv5zq61fi982",
			"created": "2023-07-12 10:28:31.563Z",
			"updated": "2023-07-14 11:59:22.818Z",
			"name": "bundle_tree",
			"type": "base",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "o6t6x3iu",
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
					"id": "6eckjuhb",
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
					"id": "x3atiauh",
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
					"id": "hibc69zt",
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
			"indexes": [
				"CREATE UNIQUE INDEX ` + "`" + `idx_EzIf05h` + "`" + ` ON ` + "`" + `bundle_tree` + "`" + ` (` + "`" + `uuid` + "`" + `)"
			],
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
	})
}
