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
		edit_description := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "jrz1a8j4",
			"name": "description",
			"type": "json",
			"required": false,
			"unique": false,
			"options": {}
		}`), edit_description)
		collection.Schema.AddField(edit_description)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("s3k1ps4o2zogd9o")
		if err != nil {
			return err
		}

		// update
		edit_description := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "jrz1a8j4",
			"name": "desc",
			"type": "json",
			"required": false,
			"unique": false,
			"options": {}
		}`), edit_description)
		collection.Schema.AddField(edit_description)

		return dao.SaveCollection(collection)
	})
}
