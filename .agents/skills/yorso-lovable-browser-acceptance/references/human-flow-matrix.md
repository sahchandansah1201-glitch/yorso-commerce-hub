# Human Flow Matrix

Select only rows relevant to the changed surface, but never reduce a stateful
picker or CRUD flow to a single happy path.

| Area | Required human action | Evidence |
|---|---|---|
| Entry | Open the real route from its normal navigation path. | Route and initial screenshot. |
| Repeated selection | Select at least three options consecutively without reopening the form. | All three visible and control still usable. |
| Removal | Remove the middle option, select another, then remove and re-add the original. | State after every transition. |
| Duplicate | Attempt to add an already selected value. | Duplicate blocked with understandable feedback. |
| Search | Cover empty query, partial match, exact match and no results. | Visible list or empty state. |
| Keyboard | Use ArrowDown, ArrowUp, Enter, Escape and Home/End when supported. | Focus/selection evidence. |
| Validation | Submit empty and invalid states, then correct them. | Error placement and cleared error. |
| Cancel | Change data, cancel and reopen. | Original values restored. |
| Persistence | Save, reload the route and reopen Edit. | Saved values prefilled. |
| Mobile | Repeat the critical flow at 390px. | Screenshot, no overlap or clipping. |
| Structure | Check horizontal overflow and nested interactive controls. | Numeric results. |
| Runtime | Collect console errors, page errors and failed requests. | Counts and messages. |
| Defect loop | Report defects before fixing; rerun the same failing flow after a fix. | Before/after evidence. |
