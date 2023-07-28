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

		collection, err := dao.FindCollectionByNameOrId("2hgtp75dkzhuee4")
		if err != nil {
			return err
		}

		return dao.DeleteCollection(collection)
	}, func(db dbx.Builder) error {
		jsonData := `{
			"id": "2hgtp75dkzhuee4",
			"created": "2023-07-12 10:28:31.564Z",
			"updated": "2023-07-12 15:25:36.135Z",
			"name": "device_identifier",
			"type": "base",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "ptajhziq",
					"name": "manufacturername",
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
					"id": "cz33gr73",
					"name": "modelid",
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
					"id": "qihwpagg",
					"name": "contributor",
					"type": "relation",
					"required": true,
					"unique": false,
					"options": {
						"collectionId": "_pb_users_auth_",
						"cascadeDelete": false,
						"minSelect": null,
						"maxSelect": 1,
						"displayFields": [
							"username"
						]
					}
				}
			],
			"indexes": [
				"CREATE INDEX ` + "`" + `idx_ckLuyun` + "`" + ` ON ` + "`" + `device_identifier` + "`" + ` (` + "`" + `manufacturername` + "`" + `)"
			],
			"listRule": "",
			"viewRule": "",
			"createRule": "@request.auth.id = @request.data.contributor",
			"updateRule": null,
			"deleteRule": null,
			"options": {}
		}`

		collection := &models.Collection{}
		if err := json.Unmarshal([]byte(jsonData), &collection); err != nil {
			return err
		}

		return daos.New(db).SaveCollection(collection)
	})
}
