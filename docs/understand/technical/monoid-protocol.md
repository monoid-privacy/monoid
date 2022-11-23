# Monoid Protocol

The Monoid Protocol describes a series of standard components and all the interactions between them in order to declare a specification for a data silo, and to enable automated requests against that data silo.

The formulation of the Monoid Protocol (along with Monoid's documentation) are inspired by [Airbyte](https://airbyte.com).

## Monoid Protocol Interface

Communication with live data silos follows the Monoid Protocol interface. Any protocol implementation (Monoid itself uses Docker) must enable the functions defined in the interface, and communicate using the types used by the protocol (which are described below).

The Monoid Protocol Interface is as follows:
```
spec() -> MonoidSiloSpec
validate(Config) -> MonoidValidateMessage

query(Config, MonoidQuery) -> MonoidStream
delete(Config, PersistenceConfig, MonoidQuery) -> MonoidStream

scan(Config, PersistenceConfig, MonoidSchemasMessage) -> Stream<MonoidRecord>

stream_read(Config, PersistenceConfig, MonoidStreamHandle) -> Stream<MonoidRecord> | MonoidFile
stream_status(Config, MonoidStreamHandle) -> MonoidStreamStatus

schema(Config) -> MonoidSchemasMessage
```

### Spec
```
spec() -> MonoidSiloSpec
```

The `spec` command allows a data silo to broadcast information about itself and how it can be configured.

**Input:**
1. None

**Output:**
1. `spec` -- a `MonoidSiloSpec` wrapped in a `MonoidMessage` of type `SPEC`.

### Validate
```
validate(Config) -> MonoidValidateMessage
```
The `validate` command indicates whether a configuration is valid or not.

**Input:**
1. `config` -- a JSON object that conforms to the JSON Schema spec provided by the `spec` function.
The configuration should include any API keys/passwords and other data required to connect to the
silo.


**Output:**
1. `MonoidValidateMessage` -- a message that indicates whether or not the configuration is valid.
If the configuration is valid, the `status` field will be `SUCCESS`, otherwise, it will be `FAILURE`.
The `message` field should contain any error message if the validation fails.

### Query
```
query(Config, MonoidQuery) -> MonoidStream
```
The `query` command is used to pull data from the silo for a data right-to-know request. Depending
on the type of silo, the types of results can vary.

**Input:**
1. `Config` -- The silo config.
2. `MonoidQuery` -- Information about the query is provided here. This variable an array of
`MonoidQueryIdentifier`s, each of which includes information about the data source to query,
the field to query by, and the schema of the output. Some of this information may be irrelevant for
some silos -- for example, a SaaS service that offers its own data export features may not use
the output schema fields (see the Mixpanel Connector for an example of this).


**Output:**
1. `MonoidStream` -- provides a handle that can be used to access the stream, along with the stream status.
If the stream status is `COMPLETE`, you must provide a `dataType`, as well.

#### Postgres Example
When you run a query on a postgres database, the stream that will be returned is automatically complete,
with the monoid query as the data field of the handle.
```
{
    status: {
        status: 'COMPLETE'
        dataType: 'RECORDS'
    },
    handle: {
        data: {
            request: 'query'
            query: ...MonoidQuery
        }
    }
}
```
This is because retrieving data from postgres is fully synchronous -- we can directly read from the stream of records
from the database after running a query. This, however, may not be the case when you run `query` on a SaaS data silo, like Mixpanel, since they may not be able to generate a complete picture of your data on-demand.

#### Mixpanel Example
Initially, the result of a mixpanel query operation will look something like this:
```
{
    status: {
        status: 'PROCESSING'
    },
    handle: {
        data: {
            requestId: ...
        }
    }
}
```

You can pass the handle directly to the `stream_status` function to get updates as to the status of the
request, and when the status becomes `COMPLETE`, you can call `stream_read` to get the zip file of the data
provided by mixpanel. Of course, most of these calls are abstracted by the Monoid platform -- you just have
to fill in the implementation if you're writing new data silo integrations.

### Delete
```
delete(Config, PersistenceConfig, MonoidQuery) -> MonoidStream
```
The `delete` command is used to run a right-to-delete request.

**Input:**
1. `Config` -- The silo config.
2. `PersistenceConfig` -- Information about a file store that can be used to persist data that can
be used to store data for further processing. For example, a connector that parses unstructured data
and stores pointers to where data that may potentially need to be deleted exists.
2. `MonoidQuery` -- Information about the data to delete.


**Output:**
1. `MonoidStream` -- provides a handle that can be used to access the stream, along with the stream status.
The resulting `MonoidStream` may be complete with a `dataType` of `NONE` frequently, as the data has
been deleted.


### Scan
```
scan(Config, PersistenceConfig, MonoidSchemasMessage) -> Stream<MonoidRecord>
```
The `scan` command is used to iterate over a subset of the records in the data source.
This can be a no-op if the data silo doesn't need to be scanned, but it's highly recommended that
your connectors implement this function.

**Input:**
1. `Config` -- The silo config.
2. `PersistenceConfig` -- The persistence config.
2. `MonoidSchemasMessage` -- The schemas that need to be scanned and outputted.


**Output:**
1. `Stream<MonoidRecord>` -- A stream of records that are being scanned.

### Stream Status
```
stream_status(Config, MonoidStreamHandle) -> MonoidStreamStatus
```
The `stream_status` get the status of a `MonoidStream`

**Input:**
1. `Config` -- The silo config.
2. `PersistenceConfig` -- The persistence config.
2. `MonoidStreamHandle` -- Represents the data that can be used to retrieve data from a stream.


**Output:**
1. `MonoidStreamStatus` -- An object that describes information about the stream.
If the stream is ready to read from, the `status` field will be `COMPLETE`. The `dataType`
field indicates the type of data that should be expected from `stream_read`.


### Stream Read
```
stream_read(Config, PersistenceConfig, MonoidStreamHandle) -> Stream<MonoidRecord> | MonoidFile
```
The `stream_read` command is used to read data from a `MonoidStream`.

**Input:**
1. `Config` -- The silo config.
2. `PersistenceConfig` -- The persistence config.
2. `MonoidStreamHandle` -- Represents the data that can be used to retrieve data from a stream.


**Output:**
1. `Stream<MonoidRecord> | MonoidFile` -- If the stream's `dataType` is `RECORDS`, this function
will return a stream of records. If the stream's `dataType` is `FILE`, this must return the path to
the file on the `PersistenceConfig` instance. Do not output URLs that are not localized to the
data layer described by the `PersistenceConfig`, because the platform will not be able to read it.




## Monoid Protocol Types
The JSON schema definitions of these types can be found in the Monoid Github [repository](https://github.com/monoid-privacy/monoid-surgery/blob/docs/monoid-py/monoid_protocol.json). Please refer to those files for a
more comprehensive reference as to how to use these types.

#### MonoidMessage
A `MonoidMessage` is a wrapper for all output generated by an integration. The `type` field of the
message is required, and the corresponding field of the `MonoidMessage` will be guaranteed to be defined.

#### MonoidStream
A `MonoidStream` message wraps a `MonoidStreamStatus` and a `MonoidStreamHandle`, and is the result
of a `query` or `delete` operation.

#### MonoidStreamStatus
A `MonoidStreamStatus` message includes two fields `status` (`COMPLETE`, `PROGRESS`, or `FAILED`), which indicates whether the stream has finished
processing, or is currently in progress, and a `dataType`, which is either `NONE`, `FILE`, or `RECORDS`. The
`dataType` field may be empty if the `status` is not complete.

#### MonoidStreamHandle
A `MonoidStreamHandle` includes a `data` field, which represents arbitrary data that can be specified by a
connector as a result of a query or delete operation.

#### PersistenceConfig
A `PersistenceConfig` object includes a `directory` field that provides a handle to the directory in which
you can write files. Before being persisted, the data will be encrypted by the Monoid Platform.
