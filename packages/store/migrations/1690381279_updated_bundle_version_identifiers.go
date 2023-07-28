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
		edit_bundle_version := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "wvjjuzuh",
			"name": "bundle_version",
			"type": "relation",
			"required": true,
			"unique": false,
			"options": {
				"collectionId": "s3k1ps4o2zogd9o",
				"cascadeDelete": true,
				"minSelect": null,
				"maxSelect": 1,
				"displayFields": [
					"bundle_tree",
					"version"
				]
			}
		}`), edit_bundle_version)
		collection.Schema.AddField(edit_bundle_version)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("a8avpfp4q0a21k2")
		if err != nil {
			return err
		}

		// update
		edit_bundle_version := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "wvjjuzuh",
			"name": "bundle_version",
			"type": "relation",
			"required": true,
			"unique": false,
			"options": {
				"collectionId": "s3k1ps4o2zogd9o",
				"cascadeDelete": true,
				"minSelect": null,
				"maxSelect": 1,
				"displayFields": []
			}
		}`), edit_bundle_version)
		collection.Schema.AddField(edit_bundle_version)

		return dao.SaveCollection(collection)
	})
}
