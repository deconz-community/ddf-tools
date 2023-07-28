package main

import (
	"log"
	"os"
	"strings"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
)

func main() {
	app := pocketbase.New()

	// loosely check if it was executed using "go run"
	isGoRun := strings.HasPrefix(os.Args[0], os.TempDir())

	migratecmd.MustRegister(app, app.RootCmd, &migratecmd.Options{
		// enable auto creation of migration files when making collection changes
		// (the isGoRun check is to enable it only during development)
		Automigrate: isGoRun,
	})

	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		/*
			e.Router.AddRoute(echo.Route{
				Method: http.MethodGet,
				Path:   "/api/upload",
				Handler: func(c echo.Context) error {

					return c.JSON(http.StatusOK, map[string]string{"foo": "Hello world!"})
				},
				Middlewares: []echo.MiddlewareFunc{
					apis.ActivityLogger(app),
					apis.RequireRecordAuth("user"),
				},
			})
		*/

		return nil
	})

	app.OnRecordBeforeCreateRequest().Add(func(e *core.RecordCreateEvent) error {
		// overwrite the newly submitted "posts" record status to pending
		if e.Record.Collection().Name == "bundle" {
			log.Println("bundle record created")
			e.Record.Set("version_tag", "lastest")
		}

		return nil
	})

	app.OnRecordBeforeUpdateRequest().Add(func(e *core.RecordUpdateEvent) error {
		if e.Record.Collection().Name == "bundle" {
			log.Println("bundle record edited = " + e.Record.GetString("id"))
		}

		return nil
	})

	app.OnRecordBeforeDeleteRequest().Add(func(e *core.RecordDeleteEvent) error {
		// overwrite the newly submitted "posts" record status to pending
		if e.Record.Collection().Name == "bundle" {
			log.Println("bundle record deleted")
		}

		return nil
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
