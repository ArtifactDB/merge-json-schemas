#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";

const all_resolved = {};
function resolveSchema(rel, wd) {
    const full = path.normalize(path.join(wd, rel))
    if (!(full in all_resolved)) {
        let contents;
        try {
            contents = JSON.parse(fs.readFileSync(full))
        } catch (e) {
            throw new Error("failed to parse '" + full + "'; " + String(e));
        }
        all_resolved[full] = recursiveResolveSchema(contents, full);
    }
    return all_resolved[full];
}

function recursiveResolveSchema(x, full) {
    if (x instanceof Array) {
        const replacement = [];
        for (var i = 0; i < x.length; ++i) { 
            replacement.push(recursiveResolveSchema(x[i], full));
        }
        return replacement;

    } else if (x instanceof Object) {
        let input_allOf = [];
        if ("allOf" in x) {
            input_allOf = x["allOf"];
        }

        const replacement = {}
        let description = null;
        for (const [k, v] of Object.entries(x)) {
            if (k == "_description") {
                description = v.join("\n");
            } else if (k != "allOf") {
                replacement[k] = recursiveResolveSchema(v, full);
            }
        }
        if (description != null) {
            if ("description" in replacement) {
                throw new Error("both '_description' and 'description' are already present in '" + full + "'");
            }
            replacement["description"] = description;
        }

        const remaining_allOf = []
        for (const y of input_allOf) {
            if ("$ref" in y) {
                const current = resolveSchema(y["$ref"], path.dirname(full));
                mergeSchema(replacement, current, full);
            } else {
                remaining_allOf.push(y);
            }
        }

        if (remaining_allOf.length) {
            if (!("allOf" in replacement)) {
                replacement["allOf"] = [];
            } 
            for (const y of remaining_allOf) {
                replacement["allOf"].push(y);
            }
        }
        return replacement;

    } else {
        return x;
    }
}

function mergeSchema(host, donor, path) {
    for (const [k, v] of Object.entries(donor)) {
        if (k in host) {
            const hostval = host[k];
            if (hostval instanceof Array && v instanceof Array) {
                for (const z of v) {
                    hostval.push(z);
                }
            } else if (hostval instanceof Object && v instanceof Object) {
                mergeSchema(hostval, v, path);
            } else if (hostval != v) {
                throw new Error("inconsistent values to be merged for key '" + k + "' in '" + path + "'");
            }
        } else {
            host[k] = v;
        }
    }
}

const target = process.argv[2]
const output = resolveSchema(target, ".");
console.log(JSON.stringify(output, null, 4));
