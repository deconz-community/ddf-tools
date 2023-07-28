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

		collection.ListRule = nil

		collection.ViewRule = types.Pointer("@request.auth.id = id")

		options := map[string]any{}
		json.Unmarshal([]byte(`{
			"query": "SELECT \n    user.id,\n    user.username as name,\n    user.created,\n    providerId as github_id,\n    user.public_key,\n    user.private_key\nFROM user\nLEFT JOIN _externalAuths \n    ON user.id = _externalAuths.recordId;"
		}`), &options)
		collection.SetOptions(options)

		// remove
		collection.Schema.RemoveField("nyuqicvz")

		// remove
		collection.Schema.RemoveField("s9oxl80q")

		// remove
		collection.Schema.RemoveField("mbje7mgh")

		// add
		new_name := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "5eajb21x",
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
			"id": "ydsa8hwi",
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
			"id": "3eeqrhns",
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

		// add
		new_private_key := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "qiaxe2xh",
			"name": "private_key",
			"type": "text",
			"required": false,
			"unique": false,
			"options": {
				"min": null,
				"max": null,
				"pattern": ""
			}
		}`), new_private_key)
		collection.Schema.AddField(new_private_key)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("s3l41jpo7oosnpd")
		if err != nil {
			return err
		}

		collection.ListRule = types.Pointer("")

		collection.ViewRule = nil

		options := map[string]any{}
		json.Unmarshal([]byte(`{
			"query": "SELECT \n    user.id,\n    user.username as name,\n    user.created,\n    providerId as github_id,\n    user.public_key\nFROM user\nLEFT JOIN _externalAuths \n    ON user.id = _externalAuths.recordId;"
		}`), &options)
		collection.SetOptions(options)

		// add
		del_name := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "nyuqicvz",
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
			"id": "s9oxl80q",
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
			"id": "mbje7mgh",
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
		collection.Schema.RemoveField("5eajb21x")

		// remove
		collection.Schema.RemoveField("ydsa8hwi")

		// remove
		collection.Schema.RemoveField("3eeqrhns")

		// remove
		collection.Schema.RemoveField("qiaxe2xh")

		return dao.SaveCollection(collection)
	})
}
