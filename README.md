# Merge JSON schemas

## Background

When writing a large [JSON schema](https://json-schema.org), it can be desirable to break it up into smaller subschemas.
This makes it simpler to reason about the schema and to track localized changes.
Each subschema is linked to its parent via `$ref` properties in the latter.
However, the need to handle multiple files complicates the use of the schema by both human readers and applications.
It also interferes with the use of `additionalProperties: false`, which is often necessary to protect against misspelled property names.

This repository contains a simple script to merge multiple subschemas together into a single file.
It accepts a single JSON schema file as an "entrypoint", assuming that all other subschemas are linked (directly or indirectly) in this entrypoint via `$ref`s inside `allOf` clauses.
It iterately merges the subschemas into a single schema, lifting fields like `properties` and `required` out of the `allOf` and merging them with their counterparts in the parent schema.
This yields a large schema that is indistinguishable from a hand-written counterpart that did not use any `$ref`'d subschemas.

## Performing the merge

Use the following commands with any modern-ish version of Node.js:

```shell
./src/merge.js ENTRYPOINT.json > merged.json

# Or via npx:
npx --package=merge-json-schemas merge ENTRYPOINT.json > merged.json
```

Check out the [bioconductor-metadata-index](https://github.com/ArtifactDB/bioconductor-metadata-index) repository for an example. 

## Additional notes

The `merge.js` script will recognize the special `_description` property in each (sub)schema.
This property should be an array of strings that will be joined with newlines to generate a `description` for the (sub)schema.
We do this to facilite writing of long descriptions without inordinate amounts of text wrapping. 

Currently, all `$ref`s are assumed to point to relative paths, defined from the location of the schema file containing the `$ref`.
Remote queries are not yet supported.
