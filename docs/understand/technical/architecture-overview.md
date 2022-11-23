# Architecture Overview

At a high level, Monoid consists of a React UI, a Go webapp server, a Temporal service.
The Temporal service manages jobs to run actions on data silos; for more information about
how Monoid interfaces with the data silo connectors, see documentation on the Monoid Protocol.

## Technical Stack

### Monoid Core Backend

* Go 1.18.8
* API: GraphQL
* Databases: PostgreSQL
* Orchestration: Temporal

The Monoid core backend can be found in `monoid-api`.

The `monoid-api/requests` package handles user data deletion/export request automation. The open-source PII scanner can be found in `monoid-api/scanner`; its design was inspired by that of Andrew Kane's open-source PII scanner [here](https://github.com/ankane/pdscan).

The GraphQL API schema is in `monoid-api/schema`. DB models can be found in `monoid-api/models`, while GraphQL API resolver functions can be found in `monoid-api/resolver`.

### Connectors

Connectors can be written in any language. Connectors written by the Monoid team are generally written in Python 3.7.6.

Connectors can be found in `monoid-integrations`, while tools to create connectors can be found in `monoid-py`.

### Frontend

* Typescript
* Web Framework: React

The UI can be found in `monoid-ui`.

### Additional Tools

* Containerization: Docker
