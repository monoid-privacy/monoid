# Google BigQuery

## Service Account Setup

Monoid accesses your BigQuery data stores through a dedicated service account. To set up the service account, follow the instructions [here](https://cloud.google.com/iam/docs/creating-managing-service-accounts#creating).

:::caution

Depending on your access controls and default role, you may need to enable certain permissions for your created service account. Monoid's needs permissions to **read** and **edit** data in BigQuery.

:::

Then, create a JSON service account key by following [these instructions]. You'll need to enter the text of the key directly into Monoid; the easiest way to do so is to download the key, then (on MacOS) run the command `pbcopy < [key file].json`

## Adding the Silo 

![Creating a BigQuery Silo](../../img/bigquery-silo.png)

Fill out the fields in the connector form. Enter the service account JSON key (instructions above) in the corresponding field; that is the only required field for BigQuery. By default, Monoid grabs all data stores; to exclude certain data stores, enter their names in the Exclude DBs field.