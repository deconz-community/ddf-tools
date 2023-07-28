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
			"id": "s3l41jpo7oosnpd",
			"created": "2023-07-28 14:13:54.161Z",
			"updated": "2023-07-28 14:13:54.167Z",
			"name": "user_info",
			"type": "view",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "ojjlgiq6",
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
					"id": "1tm4ofse",
					"name": "github_id",
					"type": "json",
					"required": false,
					"unique": false,
					"options": {}
				},
				{
					"system": false,
					"id": "lvpjjefx",
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
			"listRule": "",
			"viewRule": "",
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

		collection, err := dao.FindCollectionByNameOrId("s3l41jpo7oosnpd")
		if err != nil {
			return err
		}

		return dao.DeleteCollection(collection)
	})
}
