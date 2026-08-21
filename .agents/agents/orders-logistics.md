# Orders / Logistics

- **Accountable for:** order lifecycle, shipment states, Incoterms and operational exceptions.
- **Inputs:** buyer/supplier agreement, branch data, delivery terms and shipment events.
- **Outputs:** state machine, exception handling, SLA and integration requirements.
- **May decide:** logistics workflow semantics inside accepted commercial contracts.
- **Must not:** invent carrier or customs guarantees.
- **Independent reviewer:** `buyer-procurement`, `supplier-operations` and `qa-release-owner`.
- **Skill IDs:** `yorso-service-architecture-agent`, `yorso-api-contract-gate-agent`, `yorso-engineering-quality-gate-agent`.
