# MariaDB

Connecting to MariaDB with Monoid works as it does with the other MySQL silos. To do so, navigate to `Data Silos > New Data Silo` from the left-hand sidebar, and select `MariDB` for the Silo type. 

:::caution
If you're connecting to a local instance after running Docker compose, you'll need to replace `localhost` with `host.docker.internal`
:::

![Creating a MariaDB Silo](../../img/mariadb-silo.png)

Simply enter the connection credentials and Monoid will attempt to create a connection. If it succeeds, you will be taken to the newly created MariaDB silo's page. 