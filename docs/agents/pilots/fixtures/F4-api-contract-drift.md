# F4: API and storage contract drift

The UI sends `countries`, the API expects `countryCodes`, persistence uses a
different nullable shape, and errors lack stable codes. Identify every boundary,
state the migration/compatibility strategy, pagination/index implications and
the tests needed before release. Reject a UI-only workaround.
