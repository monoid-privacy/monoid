# MySQL

Connecting to MySQL with Monoid works as it does with most standard tools. To do so, navigate to `Data Silos > New Data Silo` from the left-hand sidebar, and select `MySQL` for the Silo type. 

:::caution
If you're connecting to a local MySQL instance after running Docker compose, you'll need to replace `localhost` with `host.docker.internal`
:::

![Creating a MySQL Silo](../../img/mysql-silo.png)

Simply enter the connection credentials for the MySQL DB, and Monoid will attempt to create a connection. If it succeeds, you will be taken to the newly created MySQL silo's page. 