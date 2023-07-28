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

		collection, err := dao.FindCollectionByNameOrId("a8avpfp4q0a21k2")
		if err != nil {
			return err
		}

		// update
		edit_bundle := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "wvjjuzuh",
			"name": "bundle",
			"type": "relation",
			"required": true,
			"unique": false,
			"options": {
				"collectionId": "s3k1ps4o2zogd9o",
				"cascadeDelete": true,
				"minSelect": null,
				"maxSelect": 1,
				"displayFields": [
					"name",
					"version"
				]
			}
		}`), edit_bundle)
		collection.Schema.AddField(edit_bundle)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("a8avpfp4q0a21k2")
		if err != nil {
			return err
		}

		// update
		edit_bundle := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "wvjjuzuh",
			"name": "bundle",
			"type": "relation",
			"required": true,
			"unique": false,
			"options": {
				"collectionId": "s3k1ps4o2zogd9o",
				"cascadeDelete": true,
				"minSelect": null,
				"maxSelect": 1,
				"displayFields": [
					"version"
				]
			}
		}`), edit_bundle)
		collection.Schema.AddField(edit_bundle)

		return dao.SaveCollection(collection)
	})
}
