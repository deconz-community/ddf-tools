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

		// remove
		collection.Schema.RemoveField("im2zbxex")

		// add
		new_bundle_lastest := &schema.SchemaField{}
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
				"displayFields": []
			}
		}`), new_bundle_lastest)
		collection.Schema.AddField(new_bundle_lastest)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("72u55i8q9k0ymkj")
		if err != nil {
			return err
		}

		// add
		del_bundle := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "im2zbxex",
			"name": "bundle",
			"type": "relation",
			"required": false,
			"unique": false,
			"options": {
				"collectionId": "a8avpfp4q0a21k2",
				"cascadeDelete": true,
				"minSelect": null,
				"maxSelect": 1,
				"displayFields": []
			}
		}`), del_bundle)
		collection.Schema.AddField(del_bundle)

		// remove
		collection.Schema.RemoveField("9twxodwr")

		return dao.SaveCollection(collection)
	})
}
