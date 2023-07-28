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
			"id": "1solqx16hmcqayg",
			"created": "2023-07-12 10:28:31.563Z",
			"updated": "2023-07-12 10:28:31.563Z",
			"name": "user_badge",
			"type": "base",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "2jhqxk5v",
					"name": "title",
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
			"options": {}
		}`

		collection := &models.Collection{}
		if err := json.Unmarshal([]byte(jsonData), &collection); err != nil {
			return err
		}

		return daos.New(db).SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("1solqx16hmcqayg")
		if err != nil {
			return err
		}

		return dao.DeleteCollection(collection)
	})
}
