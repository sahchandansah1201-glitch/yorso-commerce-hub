# Admin Incident Trends Data Dictionary

This document maps Batch #107 trend fields to operator meaning. It exists to
prevent future UI and smoke fixtures from drifting away from the exported Zod
contracts.

## Bucket Fields

- `key`: stable hour or day bucket identifier.
- `startAt`: ISO datetime for bucket start.
- `endAt`: ISO datetime for bucket end.
- `total`: all incidents in the bucket.
- `critical`: critical severity incidents.
- `high`: high severity incidents.
- `breached`: SLA-breached incidents.
- `atRisk`: incidents approaching breach or high workload pressure.
- `open`: open incidents.
- `acknowledged`: acknowledged incidents.
- `resolved`: resolved incidents.
- `runtime`: runtime-source incidents.
- `audit`: audit-source incidents.
- `access`: access-source incidents.
- `policy`: policy-source incidents.
- `security`: security-source incidents.
- `executionOpen`: open execution items.
- `executionDone`: completed execution items.
- `executionBlocked`: blocked execution items.
- `loadScore`: derived load score for the bucket.

## Dimension Fields

- `key`: source, status or severity key.
- `label`: display label.
- `total`: total rows for this dimension.
- `open`: open rows in this dimension.
- `critical`: critical rows in this dimension.
- `breached`: breached rows in this dimension.
- `loadScore`: derived load score.
- `sharePct`: percentage share from the total response.

## Route Risk Fields

- `route`: route path.
- `total`: total incidents for the route.
- `critical`: critical incidents.
- `breached`: breached incidents.
- `blocked`: blocked execution pressure.
- `loadScore`: route load score.
- `recommendedAction`: bounded operator action.

## SLA Fields

- `unresolved`: open or acknowledged incidents.
- `breached`: breached incidents.
- `openCritical`: open critical incidents.
- `oldestOpenMinutes`: oldest open incident age.
- `acknowledgedPct`: percent acknowledged.
- `breachRatePct`: percent breached.

## Briefing Fields

- `summary.headline`: one-line shift headline.
- `sections`: narrative sections with bounded body lines.
- `operatorActions`: next operator actions.
- `capacityReview`: explicit capacity notes for the 10,000 concurrent users
  baseline.
- `riskRegister`: top route-risk rows.

Marker: Batch #107.
Marker: adminIncidentTrendBucketSchema.
Marker: adminIncidentTrendDimensionSchema.
