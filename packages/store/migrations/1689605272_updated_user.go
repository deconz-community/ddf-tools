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

		collection, err := dao.FindCollectionByNameOrId("_pb_users_auth_")
		if err != nil {
			return err
		}

		// add
		new_is_admin := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "tdonwlvd",
			"name": "is_admin",
			"type": "bool",
			"required": false,
			"unique": false,
			"options": {}
		}`), new_is_admin)
		collection.Schema.AddField(new_is_admin)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("_pb_users_auth_")
		if err != nil {
			return err
		}

		// remove
		collection.Schema.RemoveField("tdonwlvd")

		return dao.SaveCollection(collection)
	})
}
