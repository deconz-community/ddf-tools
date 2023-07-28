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

		collection, err := dao.FindCollectionByNameOrId("s3k1ps4o2zogd9o")
		if err != nil {
			return err
		}

		collection.Name = "bundle"

		json.Unmarshal([]byte(`[
			"CREATE UNIQUE INDEX ` + "`" + `idx_d1H4hsI` + "`" + ` ON ` + "`" + `bundle` + "`" + ` (` + "`" + `hash` + "`" + `)"
		]`), &collection.Indexes)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("s3k1ps4o2zogd9o")
		if err != nil {
			return err
		}

		collection.Name = "bundle_version"

		json.Unmarshal([]byte(`[
			"CREATE UNIQUE INDEX ` + "`" + `idx_d1H4hsI` + "`" + ` ON ` + "`" + `bundle_version` + "`" + ` (` + "`" + `hash` + "`" + `)"
		]`), &collection.Indexes)

		return dao.SaveCollection(collection)
	})
}
