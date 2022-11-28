package requestactivity

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/monoid-privacy/monoid/cmd"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"
	"gorm.io/gorm"
)

const testEncKey = "Tc7ILcxCi68Xk7646IrNBYmbMzbWNU+s94fnZMJ1zzk="

func setupDB() (container testcontainers.Container, db *gorm.DB, err error) {
	req := testcontainers.ContainerRequest{
		Image:        "postgres:latest",
		ExposedPorts: []string{"5432/tcp"},
		WaitingFor:   wait.ForListeningPort("5432/tcp"),
		AutoRemove:   true,
		Env: map[string]string{
			"POSTGRES_USER":     "postgres",
			"POSTGRES_PASSWORD": "postgres",
			"POSTGRES_DB":       "postgres",
		},
	}

	ctx := context.Background()

	postgres, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: req,
		Started:          true,
	})

	if err != nil {
		return nil, nil, err
	}

	defer func() {
		if err != nil {
			postgres.Terminate(context.Background())
		}
	}()

	p, err := postgres.MappedPort(ctx, "5432")
	if err != nil {
		return nil, nil, err
	}

	h, err := postgres.Host(ctx)
	if err != nil {
		return nil, nil, err
	}

	psqlInfo := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		h, p.Port(), "postgres", "postgres", "postgres",
	)

	rawDB, err := sql.Open("postgres", psqlInfo)
	if err != nil {
		return nil, nil, err
	}

	_, err = rawDB.Exec("CREATE DATABASE monoidtest")
	if err != nil {
		rawDB.Close()

		return nil, nil, err
	}

	rawDB.Close()

	fmt.Println("Successfully connected!")

	db = cmd.InitDb(cmd.DBInfo{
		User:     "postgres",
		Password: "postgres",
		TCPHost:  h,
		Port:     p.Port(),
		Name:     "monoidtest",
	})

	cmd.MigrateDb(db, cmd.Models)

	return container, db, nil
}
