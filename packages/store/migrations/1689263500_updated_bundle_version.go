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
		edit_device_identifiers := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "0ywefta1",
			"name": "device_identifiers",
			"type": "relation",
			"required": true,
			"unique": false,
			"options": {
				"collectionId": "2hgtp75dkzhuee4",
				"cascadeDelete": true,
				"minSelect": null,
				"maxSelect": null,
				"displayFields": [
					"modelid"
				]
			}
		}`), edit_device_identifiers)
		collection.Schema.AddField(edit_device_identifiers)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("s3k1ps4o2zogd9o")
		if err != nil {
			return err
		}

		// update
		edit_device_identifiers := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "0ywefta1",
			"name": "device_identifiers",
			"type": "relation",
			"required": false,
			"unique": false,
			"options": {
				"collectionId": "2hgtp75dkzhuee4",
				"cascadeDelete": false,
				"minSelect": null,
				"maxSelect": null,
				"displayFields": []
			}
		}`), edit_device_identifiers)
		collection.Schema.AddField(edit_device_identifiers)

		return dao.SaveCollection(collection)
	})
}
