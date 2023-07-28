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

		collection, err := dao.FindCollectionByNameOrId("72u55i8q9k0ymkj")
		if err != nil {
			return err
		}

		// update
		edit_bundle_lastest := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "9twxodwr",
			"name": "bundle_lastest",
			"type": "relation",
			"required": false,
			"unique": false,
			"options": {
				"collectionId": "q97y8xw37o2blnu",
				"cascadeDelete": false,
				"minSelect": null,
				"maxSelect": 1,
				"displayFields": [
					"name",
					"version"
				]
			}
		}`), edit_bundle_lastest)
		collection.Schema.AddField(edit_bundle_lastest)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("72u55i8q9k0ymkj")
		if err != nil {
			return err
		}

		// update
		edit_bundle_lastest := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "9twxodwr",
			"name": "bundle_lastest",
			"type": "relation",
			"required": false,
			"unique": false,
			"options": {
				"collectionId": "q97y8xw37o2blnu",
				"cascadeDelete": true,
				"minSelect": null,
				"maxSelect": 1,
				"displayFields": [
					"name",
					"version"
				]
			}
		}`), edit_bundle_lastest)
		collection.Schema.AddField(edit_bundle_lastest)

		return dao.SaveCollection(collection)
	})
}
