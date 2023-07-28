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

		collection, err := dao.FindCollectionByNameOrId("s3l41jpo7oosnpd")
		if err != nil {
			return err
		}

		options := map[string]any{}
		json.Unmarshal([]byte(`{
			"query": "SELECT \n    user.id,\n    user.username as name,\n    user.created,\n    providerId as github_id,\n    user.public_key\nFROM user\nLEFT JOIN _externalAuths \n    ON user.id = _externalAuths.recordId;"
		}`), &options)
		collection.SetOptions(options)

		// remove
		collection.Schema.RemoveField("aielccul")

		// remove
		collection.Schema.RemoveField("c7tipcoj")

		// remove
		collection.Schema.RemoveField("cd4eeksp")

		// remove
		collection.Schema.RemoveField("etjurvz5")

		// add
		new_name := &schema.SchemaField{}
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
		}`), new_name)
		collection.Schema.AddField(new_name)

		// add
		new_github_id := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "y1pjpp0k",
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
		}`), new_public_key)
		collection.Schema.AddField(new_public_key)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("s3l41jpo7oosnpd")
		if err != nil {
			return err
		}

		options := map[string]any{}
		json.Unmarshal([]byte(`{
			"query": "SELECT \n    user.id,\n    user.username as name,\n    user.created,\n    providerId as github_id,\n    user.public_key,\n    user.private_key\nFROM user\nLEFT JOIN _externalAuths \n    ON user.id = _externalAuths.recordId;"
		}`), &options)
		collection.SetOptions(options)

		// add
		del_name := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "aielccul",
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
			"id": "c7tipcoj",
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
			"id": "cd4eeksp",
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

		// add
		del_private_key := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "etjurvz5",
			"name": "private_key",
			"type": "text",
			"required": false,
			"unique": false,
			"options": {
				"min": null,
				"max": null,
				"pattern": ""
			}
		}`), del_private_key)
		collection.Schema.AddField(del_private_key)

		// remove
		collection.Schema.RemoveField("jhrv33hl")

		// remove
		collection.Schema.RemoveField("y1pjpp0k")

		// remove
		collection.Schema.RemoveField("locdacuw")

		return dao.SaveCollection(collection)
	})
}
