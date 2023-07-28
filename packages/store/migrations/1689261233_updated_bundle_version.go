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

		collection, err := dao.FindCollectionByNameOrId("s3k1ps4o2zogd9o")
		if err != nil {
			return err
		}

		// update
		edit_bundle_tree := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "2wi0eij4",
			"name": "bundle_tree",
			"type": "relation",
			"required": false,
			"unique": false,
			"options": {
				"collectionId": "jocyv5zq61fi982",
				"cascadeDelete": true,
				"minSelect": null,
				"maxSelect": 1,
				"displayFields": []
			}
		}`), edit_bundle_tree)
		collection.Schema.AddField(edit_bundle_tree)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("s3k1ps4o2zogd9o")
		if err != nil {
			return err
		}

		// update
		edit_bundle_tree := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "2wi0eij4",
			"name": "bundle_tree",
			"type": "relation",
			"required": false,
			"unique": false,
			"options": {
				"collectionId": "jocyv5zq61fi982",
				"cascadeDelete": false,
				"minSelect": null,
				"maxSelect": 1,
				"displayFields": []
			}
		}`), edit_bundle_tree)
		collection.Schema.AddField(edit_bundle_tree)

		return dao.SaveCollection(collection)
	})
}
