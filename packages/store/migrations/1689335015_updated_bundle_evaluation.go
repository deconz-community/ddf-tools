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

		collection, err := dao.FindCollectionByNameOrId("0m3xpiprxh27iys")
		if err != nil {
			return err
		}

		// remove
		collection.Schema.RemoveField("jox6g36b")

		// add
		new_comment := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "mj1p9brm",
			"name": "comment",
			"type": "text",
			"required": false,
			"unique": false,
			"options": {
				"min": null,
				"max": null,
				"pattern": ""
			}
		}`), new_comment)
		collection.Schema.AddField(new_comment)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("0m3xpiprxh27iys")
		if err != nil {
			return err
		}

		// add
		del_comment := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "jox6g36b",
			"name": "comment",
			"type": "editor",
			"required": false,
			"unique": false,
			"options": {}
		}`), del_comment)
		collection.Schema.AddField(del_comment)

		// remove
		collection.Schema.RemoveField("mj1p9brm")

		return dao.SaveCollection(collection)
	})
}
