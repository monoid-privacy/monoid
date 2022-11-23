---
sidebar_position: 5
---

# Create and Automate User Data Requests

## How Automated Requests Work

A **request** is a type (*Delete* or *Query*) along with a set of *(Identifier, Value)* pairs, where the possible identifiers come from the `Identifiers` tab on the left sidebar.

When a request is executed, Monoid goes through each data source; if a data source includes a property that's mapped to one of the identifiers that is present in the request, it will run a `delete` or `query` command against that data source using the user identifier value from the request. *Query* requests return records that can be viewed in the `User Data Requests` tab on the left sidebar, while *Delete* requests only change job status on completion.

For a deeper look at how request automation works, see [the Monoid Protocol guide](/understand/technical/monoid-protocol).

### Create a Request

To create a user data request in Monoid, navigate to `User Data Requests > New User Data Request` and fill out the form. *This does not execute the request*; this simply creates a request record that can be executed when desired.
### The Request Page

You can view all created requests, including those already executed, in the `User Data Requests` tab. To view information about the request's makeup and progress, click a request to be brought to its page. The `User Identifiers` tab on a request page includes the specified identifiers for a particular request. The `Request Statuses` tab includes the progress (and, if the request is a *Query*, the results) for each data source.

### Execute a Request

To execute a request, click the `Execute Request` button on the top right of the request's page. Request execution may take a while; you can view progress, as well as results, in the `Request Statuses` tab of the request page.

### Handle Requests Programmatically

You can also handle requests without the UI through the server's GraphQL API. While API docs are forthcoming, you can see the GraphQL schema for creating and executing requests [here](https://github.com/monoid-privacy/monoid/blob/master/monoid-api/schema/requests.graphqls) (specifically the `createUserDataRequest` and `executeUserDataRequest` mutations).
