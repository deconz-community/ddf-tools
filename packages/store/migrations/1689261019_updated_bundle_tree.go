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

		// remove
		collection.Schema.RemoveField("ep3wlpsm")

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("jocyv5zq61fi982")
		if err != nil {
			return err
		}

		// add
		del_source_url := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "ep3wlpsm",
			"name": "source_url",
			"type": "url",
			"required": false,
			"unique": false,
			"options": {
				"exceptDomains": [],
				"onlyDomains": []
			}
		}`), del_source_url)
		collection.Schema.AddField(del_source_url)

		return dao.SaveCollection(collection)
	})
}
