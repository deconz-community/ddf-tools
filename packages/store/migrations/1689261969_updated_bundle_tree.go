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

		collection, err := dao.FindCollectionByNameOrId("jocyv5zq61fi982")
		if err != nil {
			return err
		}

		// update
		edit_uuid := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "o6t6x3iu",
			"name": "uuid",
			"type": "text",
			"required": true,
			"unique": false,
			"options": {
				"min": 36,
				"max": 36,
				"pattern": "/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i"
			}
		}`), edit_uuid)
		collection.Schema.AddField(edit_uuid)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("jocyv5zq61fi982")
		if err != nil {
			return err
		}

		// update
		edit_uuid := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "o6t6x3iu",
			"name": "uuid",
			"type": "text",
			"required": true,
			"unique": false,
			"options": {
				"min": 36,
				"max": 36,
				"pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89aB][0-9a-f]{3}-[0-9a-f]{12}$"
			}
		}`), edit_uuid)
		collection.Schema.AddField(edit_uuid)

		return dao.SaveCollection(collection)
	})
}
