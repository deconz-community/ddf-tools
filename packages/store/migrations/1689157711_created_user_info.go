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
			"created": "2023-07-12 10:28:31.564Z",
			"updated": "2023-07-12 10:28:31.566Z",
			"name": "user_info",
			"type": "view",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "rbgqb5ot",
					"name": "name",
					"type": "json",
					"required": false,
					"unique": false,
					"options": {}
				},
				{
					"system": false,
					"id": "tvh85epc",
					"name": "github_id",
					"type": "json",
					"required": false,
					"unique": false,
					"options": {}
				}
			],
			"indexes": [],
			"listRule": "",
			"viewRule": "",
			"createRule": null,
			"updateRule": null,
			"deleteRule": null,
			"options": {
				"query": "SELECT \n    user.id,\n    COALESCE(user.name, user.username) as name,\n    user.created,\n    providerId as github_id\nFROM user\nLEFT JOIN _externalAuths \n    ON user.id = _externalAuths.recordId;"
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
