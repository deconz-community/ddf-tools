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
			"id": "9kjr0wspnoi6c0d",
			"created": "2023-07-17 14:25:02.485Z",
			"updated": "2023-07-17 14:25:02.485Z",
			"name": "user_public_info",
			"type": "view",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "dk0oobdq",
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
					"id": "ooverdm6",
					"name": "github_id",
					"type": "json",
					"required": false,
					"unique": false,
					"options": {}
				},
				{
					"system": false,
					"id": "lgt1ftzn",
					"name": "public_key",
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
			"options": {
				"query": "SELECT \n    user.id,\n    user.username as name,\n    user.created,\n    providerId as github_id,\n    user.public_key\nFROM user\nLEFT JOIN _externalAuths \n    ON user.id = _externalAuths.recordId;"
			}
		}`

		collection := &models.Collection{}
		if err := json.Unmarshal([]byte(jsonData), &collection); err != nil {
			return err
		}

		return daos.New(db).SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("9kjr0wspnoi6c0d")
		if err != nil {
			return err
		}

		return dao.DeleteCollection(collection)
	})
}
