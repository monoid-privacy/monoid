# Monoid Protocol

The Monoid Protocol describes a series of standard components and all the interactions between them in order to declare a specification for a data silo, and to enable automated requests against that data silo.

The formulation of the Monoid Protocol (along with Monoid's documentation) are inspired by [Airbyte](https://airbyte.com).

## Key Concepts

### Monoid Protocol Interface

Communication with live data silos follows the Monoid Protocol interface. Any protocol implementation (Monoid itself uses Docker) must enable the functions defined in the interface, and communicate using the types used by the protocol (which are described below).

The Monoid Protocol Interface is as follows:
```
spec() -> MonoidSiloSpec
validate(Config) -> MonoidValidateMessage
query(Config, MonoidQuery) -> []MonoidRecord
sample(Config, MonoidSchemasMessage) -> []MonoidRecord
delete(Config, MonoidQuery) -> []MonoidRecord
schema(Config) -> MonoidSchemasMessage
```

#### Spec
```
spec() -> MonoidSiloSpec
```
The `spec` command allows a data silo to broadcast information about itself and how it can be configured.
**Input:**
1. None
**Output:**
1. `spec` -- a `MonoidSiloSpec` wrapped in a `MonoidMessage` of type `SPEC`.

#### Validate
```
validate(Config) -> MonoidValidateMessage
```
The `validate` command allows a data silo to broadcast information about itself and how it can be configured.
**Input:**
1. None
**Output:**
1. `spec` -- a `MonoidSiloSpec` wrapped in a `MonoidMessage` of type `SPEC`.
