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
			"id": "s3k1ps4o2zogd9o",
			"created": "2023-07-28 14:13:54.161Z",
			"updated": "2023-07-28 14:13:54.161Z",
			"name": "bundle",
			"type": "base",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "ex7bkkxo",
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
					"id": "lngandb5",
					"name": "name",
					"type": "text",
					"required": true,
					"unique": false,
					"options": {
						"min": null,
						"max": null,
						"pattern": ""
					}
				},
				{
					"system": false,
					"id": "usuz5ch3",
					"name": "version",
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
					"id": "0gz6gpbr",
					"name": "version_numeric",
					"type": "number",
					"required": true,
					"unique": false,
					"options": {
						"min": null,
						"max": null
					}
				},
				{
					"system": false,
					"id": "onuhoxln",
					"name": "version_tag",
					"type": "select",
					"required": false,
					"unique": false,
					"options": {
						"maxSelect": 1,
						"values": [
							"lastest"
						]
					}
				},
				{
					"system": false,
					"id": "onddevsk",
					"name": "version_deconz",
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
					"id": "df2jneej",
					"name": "source",
					"type": "select",
					"required": false,
					"unique": false,
					"options": {
						"maxSelect": 1,
						"values": [
							"github",
							"upload"
						]
					}
				},
				{
					"system": false,
					"id": "fp2bznzn",
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
					"id": "o0unjkaw",
					"name": "pre_release",
					"type": "bool",
					"required": false,
					"unique": false,
					"options": {}
				},
				{
					"system": false,
					"id": "kf8ksl7b",
					"name": "deprecated",
					"type": "bool",
					"required": false,
					"unique": false,
					"options": {}
				},
				{
					"system": false,
					"id": "eeyahqqv",
					"name": "deprecated_description",
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
					"id": "j01pahcy",
					"name": "file",
					"type": "file",
					"required": true,
					"unique": false,
					"options": {
						"maxSelect": 1,
						"maxSize": 512000,
						"mimeTypes": [],
						"thumbs": [],
						"protected": false
					}
				},
				{
					"system": false,
					"id": "huc9iovt",
					"name": "hash",
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
			"indexes": [
				"CREATE UNIQUE INDEX ` + "`" + `idx_d1H4hsI` + "`" + ` ON ` + "`" + `bundle` + "`" + ` (` + "`" + `hash` + "`" + `)",
				"CREATE INDEX ` + "`" + `idx_fRczihl` + "`" + ` ON ` + "`" + `bundle` + "`" + ` (` + "`" + `version_tag` + "`" + `) WHERE ` + "`" + `version_tag` + "`" + ` != ''"
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
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("s3k1ps4o2zogd9o")
		if err != nil {
			return err
		}

		return dao.DeleteCollection(collection)
	})
}
