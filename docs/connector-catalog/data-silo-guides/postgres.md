# Postgres

Connecting to Postgres with Monoid works as it does with most standard tools. To do so, navigate to `Data Silos > New Data Silo` from the left-hand sidebar, and select `Postgres` for the Silo type. 

:::caution
If you're connecting to a local Postgres instance after running Docker compose, you'll need to replace `localhost` with `host.docker.internal`
:::

![Creating a Postgres Silo](../../img/postgres-silo.png)

Enter the connection credentials for the Postgres DB. Monoid enables SSL connection as well; indicate whether this is necessary in the relevant part of the form. 

By default, Monoid will connect to every DB. There are two ways to avoid this; you can either indicate DB's to exclude in the `Exclude DBs` section, or you can turn off `Scan All DBs` to connect only to the DB specified in `Default Database`.