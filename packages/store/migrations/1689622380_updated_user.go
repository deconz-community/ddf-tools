package migrations

import (
	"encoding/json"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/daos"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("_pb_users_auth_")
		if err != nil {
			return err
		}

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

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("_pb_users_auth_")
		if err != nil {
			return err
		}

		options := map[string]any{}
		json.Unmarshal([]byte(`{
			"allowEmailAuth": false,
			"allowOAuth2Auth": true,
			"allowUsernameAuth": false,
			"exceptEmailDomains": null,
			"manageRule": null,
			"minPasswordLength": 8,
			"onlyEmailDomains": null,
			"requireEmail": false
		}`), &options)
		collection.SetOptions(options)

		return dao.SaveCollection(collection)
	})
}
