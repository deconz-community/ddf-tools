package migrations

import (
	"encoding/json"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/daos"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/models/schema"
	"github.com/pocketbase/pocketbase/tools/types"
)

func init() {
	m.Register(func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("s3l41jpo7oosnpd")
		if err != nil {
			return err
		}

		collection.ListRule = types.Pointer("")

		collection.ViewRule = types.Pointer("")

		// remove
		collection.Schema.RemoveField("jhrv33hl")

		// remove
		collection.Schema.RemoveField("y1pjpp0k")

		// remove
		collection.Schema.RemoveField("locdacuw")

		// add
		new_name := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "01qucd1x",
			"name": "name",
			"type": "text",
			"required": false,
			"unique": false,
			"options": {
				"min": null,
				"max": null,
				"pattern": ""
			}
		}`), new_name)
		collection.Schema.AddField(new_name)

		// add
		new_github_id := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "byejahsi",
			"name": "github_id",
			"type": "json",
			"required": false,
			"unique": false,
			"options": {}
		}`), new_github_id)
		collection.Schema.AddField(new_github_id)

		// add
		new_public_key := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "eyv1ramg",
			"name": "public_key",
			"type": "text",
			"required": false,
			"unique": false,
			"options": {
				"min": null,
				"max": null,
				"pattern": ""
			}
		}`), new_public_key)
		collection.Schema.AddField(new_public_key)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("s3l41jpo7oosnpd")
		if err != nil {
			return err
		}

		collection.ListRule = nil

		collection.ViewRule = nil

		// add
		del_name := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "jhrv33hl",
			"name": "name",
			"type": "text",
			"required": false,
			"unique": false,
			"options": {
				"min": null,
				"max": null,
				"pattern": ""
			}
		}`), del_name)
		collection.Schema.AddField(del_name)

		// add
		del_github_id := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "y1pjpp0k",
			"name": "github_id",
			"type": "json",
			"required": false,
			"unique": false,
			"options": {}
		}`), del_github_id)
		collection.Schema.AddField(del_github_id)

		// add
		del_public_key := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "locdacuw",
			"name": "public_key",
			"type": "text",
			"required": false,
			"unique": false,
			"options": {
				"min": null,
				"max": null,
				"pattern": ""
			}
		}`), del_public_key)
		collection.Schema.AddField(del_public_key)

		// remove
		collection.Schema.RemoveField("01qucd1x")

		// remove
		collection.Schema.RemoveField("byejahsi")

		// remove
		collection.Schema.RemoveField("eyv1ramg")

		return dao.SaveCollection(collection)
	})
}
