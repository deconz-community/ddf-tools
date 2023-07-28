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

		json.Unmarshal([]byte(`[
			"CREATE UNIQUE INDEX ` + "`" + `idx_d1H4hsI` + "`" + ` ON ` + "`" + `bundle` + "`" + ` (` + "`" + `hash` + "`" + `)",
			"CREATE INDEX ` + "`" + `idx_fRczihl` + "`" + ` ON ` + "`" + `bundle` + "`" + ` (` + "`" + `version_tag` + "`" + `) WHERE ` + "`" + `version_tag` + "`" + ` != ''"
		]`), &collection.Indexes)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("s3k1ps4o2zogd9o")
		if err != nil {
			return err
		}

		json.Unmarshal([]byte(`[
			"CREATE UNIQUE INDEX ` + "`" + `idx_d1H4hsI` + "`" + ` ON ` + "`" + `bundle` + "`" + ` (` + "`" + `hash` + "`" + `)"
		]`), &collection.Indexes)

		return dao.SaveCollection(collection)
	})
}
