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

		// add
		new_source := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
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
		}`), new_source)
		collection.Schema.AddField(new_source)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("s3k1ps4o2zogd9o")
		if err != nil {
			return err
		}

		// remove
		collection.Schema.RemoveField("df2jneej")

		return dao.SaveCollection(collection)
	})
}
