package migrations

import (
	"encoding/json"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/daos"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/models/schema"
)

func init() {
	m.Register(func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("2hgtp75dkzhuee4")
		if err != nil {
			return err
		}

		// update
		edit_contributor := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
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
		}`), edit_contributor)
		collection.Schema.AddField(edit_contributor)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("2hgtp75dkzhuee4")
		if err != nil {
			return err
		}

		// update
		edit_contributor := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "qihwpagg",
			"name": "owner",
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
		}`), edit_contributor)
		collection.Schema.AddField(edit_contributor)

		return dao.SaveCollection(collection)
	})
}
