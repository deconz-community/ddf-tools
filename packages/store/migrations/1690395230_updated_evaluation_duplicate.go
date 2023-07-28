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
		collection.Schema.RemoveField("x7kgk7zl")

		// add
		new_bundle_lastest := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "y1c9vnig",
			"name": "bundle_lastest",
			"type": "relation",
			"required": false,
			"unique": false,
			"options": {
				"collectionId": "q97y8xw37o2blnu",
				"cascadeDelete": false,
				"minSelect": null,
				"maxSelect": null,
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
			"id": "x7kgk7zl",
			"name": "bundle",
			"type": "relation",
			"required": false,
			"unique": false,
			"options": {
				"collectionId": "s3k1ps4o2zogd9o",
				"cascadeDelete": true,
				"minSelect": null,
				"maxSelect": null,
				"displayFields": []
			}
		}`), del_bundle)
		collection.Schema.AddField(del_bundle)

		// remove
		collection.Schema.RemoveField("y1c9vnig")

		return dao.SaveCollection(collection)
	})
}
