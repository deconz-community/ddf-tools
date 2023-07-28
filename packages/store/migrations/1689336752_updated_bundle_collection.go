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

		collection, err := dao.FindCollectionByNameOrId("edu73sq7td7c8cv")
		if err != nil {
			return err
		}

		// remove
		collection.Schema.RemoveField("jcv1wnmj")

		// add
		new_bundle_lastest := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "i9axejbc",
			"name": "bundle_lastest",
			"type": "relation",
			"required": false,
			"unique": false,
			"options": {
				"collectionId": "q97y8xw37o2blnu",
				"cascadeDelete": false,
				"minSelect": null,
				"maxSelect": null,
				"displayFields": []
			}
		}`), new_bundle_lastest)
		collection.Schema.AddField(new_bundle_lastest)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("edu73sq7td7c8cv")
		if err != nil {
			return err
		}

		// add
		del_bundle_trees := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "jcv1wnmj",
			"name": "bundle_trees",
			"type": "relation",
			"required": false,
			"unique": false,
			"options": {
				"collectionId": "jocyv5zq61fi982",
				"cascadeDelete": false,
				"minSelect": null,
				"maxSelect": null,
				"displayFields": []
			}
		}`), del_bundle_trees)
		collection.Schema.AddField(del_bundle_trees)

		// remove
		collection.Schema.RemoveField("i9axejbc")

		return dao.SaveCollection(collection)
	})
}
