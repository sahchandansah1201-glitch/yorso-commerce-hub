# Pre-capability project-memory archive

These deterministic gzip files preserve the expanded project-memory snapshots
that existed at commit `8ca08ffbc10d01ce53572ff874f711bba9d8e012` before the capability-foundation
memory compaction.

| File | SHA-256 |
| --- | --- |
| `PROJECT_STATE.yaml.gz` | `daae307ea510d59a0a7b13d80af45b830196683ae91155d310b91e6182d40b04` |
| `HANDOFF.md.gz` | `eedd4fe9b12b64e878e8b18e1b4dce94c0c972c2d34a9f77e1da919944e182ad` |

`npm run check:project-memory` verifies path containment, symlink safety, gzip
validity and both checksums. Restore a snapshot with `gzip -dc <file>`.
