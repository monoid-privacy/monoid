# Python API

The Python API allows you to create a Monoid Protocol-compliant connector by just implementing a pair of simple Python interfaces.

## Installing the Python Development Kit

The Monoid Python development kit can be installed with `pip`:
```
pip install monoid_pydev
```

This package includes all the necessary scaffolding to run a connector.

## Python Connector Anatomy

A Monoid Python connector has 3 major parts, the implementation of the `AbstractSilo` abstract class, the implementation(s) of the `DataStore` abstract class, and a `spec.json` describing the schema of the
configuration of the connector. A `main.py` file ties everything together, but can generally just be a couple lines -- all the parsing boilerplate code is handled
for you by `monoid_pydev`. See the [Postgres Connector](https://github.com/monoid-privacy/monoid/blob/master/monoid-integrations/monoid-postgres/main.py) for an example of the `main.py` file.

### The `spec.json` file
The `monoid_pydev` library automatically looks for a `spec.json` file at the root of your connector
python module, and uses it as the response to the `spec` protocol message. It should be a JSON schema
compliant description of the expected config schema.

### Writing a `AbstractSilo` subclass

A subclass of the `AbstractSilo` class must implement 2 methods, the `data_stores` method, and the `validate` method. The `data_stores` method should initialize any necessary connections, and return a list of `DataStore` subclasses that can utilize those connections. See the [implementation](https://github.com/monoid-privacy/monoid/blob/078d17a37af28c456bca9f65d6b1567e68193f49/monoid-integrations/monoid-postgres/postgres/postgres_silo.py#L68) in the postgres connector for an example.
The `validate` method is straightforward -- you must verify that the config passed to the `validate` method
can make a valid connection with the service you are connecting with (valid password, etc.).

### Writing a `DataStore` subclass

The `DataStore` abstract class has a few more fields that you'll need to implement. You should create a
new `DataStore` for any disctinct data model that your connector exposes, for example, relational databases
would have a `DataStore` for each table of a database (they may, and probably should, share database connections, however). The `name` and `group` methods return the name and group of the data store -- for
databases, these would be the name of the table and the name of the database + schema, respectively. The
other functions in the `DataStore` class that must be implemented are `json_schema`, `run_query_request`, `run_delete_request`, `request_status`, `request_results` and `scan_records`.

The `run_query_request` and `run_delete_request` functions should return a
`MonoidRequestResult`, which includes indicators about the status of the request, and a handle that can be passed to `request_status` and `request_results`.
You can populate the `data` field with any data that is needed in those functions. Generally, if the requests can be performed synchronously, the status returned from these functions should automatically
be complete -- the `run_delete_request` should perform the deletion, while the `run_query_request` function
can store the parameters passed to it in the `data` of the handle, and perform the query in `request_results`.

The `request_results` and `request_status` functions should return a generator of `MonoidRecord` objects that represent the results of the request (query or delete). Commonly, delete requests wont have any
data returned by the generator.

The `scan_records` function should return a generator of some records sampled from the data store.

## Running the Connector
Once your connector is complete, you should create a `Dockerfile` that can be used to build an image for
your connector. Look [here](https://github.com/monoid-privacy/monoid/blob/master/monoid-integrations/monoid-postgres/Dockerfile) for an example. You should also add a `Makefile` that will build and push
your image to the directory, as this is used in our CI pipelines. Once your image is built,
you should add the connector to `monoid-config/integration-manifest.yaml`, and run `go run cmd/tools/discovery/main.go ../monoid-config/integration-manifest.yaml ../monoid-config/integration-spec.yaml` from the `monoid-api` directory. The next time you run the loader (automatically run when you run `docker-compose up`), your connector should automatically appear in the UI!
