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

		collection, err := dao.FindCollectionByNameOrId("a8avpfp4q0a21k2")
		if err != nil {
			return err
		}

		collection.Name = "bundle_identifiers"

		json.Unmarshal([]byte(`[
			"CREATE INDEX ` + "`" + `idx_3oDICG5` + "`" + ` ON ` + "`" + `bundle_identifiers` + "`" + ` (` + "`" + `bundle_version` + "`" + `)",
			"CREATE INDEX ` + "`" + `idx_v7szwcV` + "`" + ` ON ` + "`" + `bundle_identifiers` + "`" + ` (\n  ` + "`" + `manufacturer` + "`" + `,\n  ` + "`" + `model` + "`" + `\n)"
		]`), &collection.Indexes)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("a8avpfp4q0a21k2")
		if err != nil {
			return err
		}

		collection.Name = "bundle_version_identifiers"

		json.Unmarshal([]byte(`[
			"CREATE INDEX ` + "`" + `idx_3oDICG5` + "`" + ` ON ` + "`" + `bundle_version_identifiers` + "`" + ` (` + "`" + `bundle_version` + "`" + `)",
			"CREATE INDEX ` + "`" + `idx_v7szwcV` + "`" + ` ON ` + "`" + `bundle_version_identifiers` + "`" + ` (\n  ` + "`" + `manufacturer` + "`" + `,\n  ` + "`" + `model` + "`" + `\n)"
		]`), &collection.Indexes)

		return dao.SaveCollection(collection)
	})
}
