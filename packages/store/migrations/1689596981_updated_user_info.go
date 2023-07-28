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
			"query": "SELECT \n    user.id,\n    user.username as name,\n    user.created,\n    user.public_key,\n    providerId as github_id\nFROM user\nLEFT JOIN _externalAuths \n    ON user.id = _externalAuths.recordId;"
		}`), &options)
		collection.SetOptions(options)

		// remove
		collection.Schema.RemoveField("sslsgohr")

		// remove
		collection.Schema.RemoveField("iz4y97mr")

		// add
		new_name := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "ktuu7rh4",
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
		new_public_key := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "kmlqaw6v",
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
		new_github_id := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "rsuv8qwo",
			"name": "github_id",
			"type": "json",
			"required": false,
			"unique": false,
			"options": {}
		}`), new_github_id)
		collection.Schema.AddField(new_github_id)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("s3l41jpo7oosnpd")
		if err != nil {
			return err
		}

		options := map[string]any{}
		json.Unmarshal([]byte(`{
			"query": "SELECT \n    user.id,\n    user.username as name,\n    user.created,\n    providerId as github_id\nFROM user\nLEFT JOIN _externalAuths \n    ON user.id = _externalAuths.recordId;"
		}`), &options)
		collection.SetOptions(options)

		// add
		del_name := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "sslsgohr",
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
			"id": "iz4y97mr",
			"name": "github_id",
			"type": "json",
			"required": false,
			"unique": false,
			"options": {}
		}`), del_github_id)
		collection.Schema.AddField(del_github_id)

		// remove
		collection.Schema.RemoveField("ktuu7rh4")

		// remove
		collection.Schema.RemoveField("kmlqaw6v")

		// remove
		collection.Schema.RemoveField("rsuv8qwo")

		return dao.SaveCollection(collection)
	})
}
