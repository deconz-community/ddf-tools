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

		collection, err := dao.FindCollectionByNameOrId("_pb_users_auth_")
		if err != nil {
			return err
		}

		collection.Name = "user"

		collection.CreateRule = types.Pointer("@request.data.is_admin:isset = false")

		collection.UpdateRule = types.Pointer("id = @request.auth.id && @request.data.is_admin:isset = false")

		options := map[string]any{}
		json.Unmarshal([]byte(`{
			"allowEmailAuth": false,
			"allowOAuth2Auth": true,
			"allowUsernameAuth": false,
			"exceptEmailDomains": null,
			"manageRule": "id = @request.auth.id && @request.data.is_admin:isset = false",
			"minPasswordLength": 8,
			"onlyEmailDomains": null,
			"requireEmail": false
		}`), &options)
		collection.SetOptions(options)

		// remove
		collection.Schema.RemoveField("users_name")

		// remove
		collection.Schema.RemoveField("users_avatar")

		// add
		new_private_key := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "m4npj5tu",
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

		// add
		new_public_key := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "n7tjnhpu",
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

		collection.Name = "users"

		collection.CreateRule = nil

		collection.UpdateRule = nil

		options := map[string]any{}
		json.Unmarshal([]byte(`{
			"allowEmailAuth": true,
			"allowOAuth2Auth": true,
			"allowUsernameAuth": true,
			"exceptEmailDomains": null,
			"manageRule": null,
			"minPasswordLength": 8,
			"onlyEmailDomains": null,
			"requireEmail": false
		}`), &options)
		collection.SetOptions(options)

		// add
		del_name := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "users_name",
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
		del_avatar := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "users_avatar",
			"name": "avatar",
			"type": "file",
			"required": false,
			"unique": false,
			"options": {
				"maxSelect": 1,
				"maxSize": 5242880,
				"mimeTypes": [
					"image/jpeg",
					"image/png",
					"image/svg+xml",
					"image/gif",
					"image/webp"
				],
				"thumbs": null,
				"protected": false
			}
		}`), del_avatar)
		collection.Schema.AddField(del_avatar)

		// remove
		collection.Schema.RemoveField("m4npj5tu")

		// remove
		collection.Schema.RemoveField("n7tjnhpu")

		// remove
		collection.Schema.RemoveField("tdonwlvd")

		return dao.SaveCollection(collection)
	})
}
