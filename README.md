# Merge JSON schemas

When writing a large [JSON schema](https://json-schema.org), it can be desirable to break it up into smaller subschemas.
This makes it simpler to reason about the schema and to track localized changes.
Each subschema is linked to its parent via `$ref` properties in the latter.
However, this multi-file setup can be difficult to consume for both human readers and applications.
It also complicates the use of `additionalProperties: false`, which is often necessary to protect against misspelled property names.

This repository contains a simple script to merge multiple subschemas together into a single file.
It accepts a single JSON schema as an "entrypoint", assuming that all other subschemas are linked (directly or indirectly) to this entrypoint via `$ref`s inside `allOf` clauses.
It then iterately merges the subschemas into a single schema, combining fields like `properties` and `required` by lifting them outside of the `allOf`.
This yields a large schema that is indistinguishable from a hand-written counterpart that did not use any `$ref`'d subschemas.
Currently, all `$ref`s are assumed to contain relative paths - remote queries are not yet supported.

Additionally, the script will recognize the special `_description` property.
This should be an array of strings that will be joined with newlines to obtain a `description` for the (sub)schema.
This functionality is provided to make it easier to write long descriptions without inordinate amounts of text wrapping. 

To run the script, use the following commands:

```shell
./src/merge.js ENTRYPOINT.json > merged.json

# Or via npx:
npx --package=merge-json-schemas ENTRYPOINT.json > merged.json
```

