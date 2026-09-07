# Contact-first customer work — interface plan for owner review

Status: plan only. No files were edited, no Build was run, no routes or data were
connected, and the rejected `/dev/customer-workspace` remains untouched.

For users this is one YORSO system: no second login, and no words for
integration, synchronization, gateway, backend, provider, prototype or demo in
any visible text. `app.yorso.com` is used only as a functional reference for
fields and business scenarios, never for its old visual design.

## 1. Screen map and transitions

```text
Contacts (start screen)
 ├─ Create client (modal)                → new contact record
 ├─ Contact record
 │   ├─ tabs: Activity | Tasks | Notes | Correspondence
 │   ├─ create task / create note (in context)
 │   ├─ company context block           → Company record
 │   └─ edit details (inline section edit)
 ├─ List actions → Import (Owner/Administrator only, 6 steps)
 └─ Companies (secondary)
     ├─ Company record
     │   ├─ details | contacts | addresses | tasks | notes | activity
     │   ├─ trust data (YORSO)
     │   └─ product profile (YORSO)
     └─ add contact                      → Create client, company pre-filled

Account navigation (unchanged): Personal · Company · Branches · Products ·
Meta-regions · Notifications · Employees
```

Employees stays in account navigation. Customer-work navigation is Contacts,
Companies, Tasks, Notes, Search — Employees never appears there.
`/account/personal` composition is not touched.

## 2. Structure of each screen

**Contacts start screen (primary, ~20× Companies).** Section title, general
search, filter strip (contact tags, company tags, company country, plus the
legacy "Latin names" control shown as a deferred open question, not implemented
with guessed semantics), saved views if the pinned edition provides them,
result count, dense table: Name · Contacts (email/phone with copy) · Company +
country · Contact owner · Registered · Actions. Sorting per column,
pagination, quick communication actions only where a channel value exists.
Narrow layout: one card per contact, name first, channel row, company +
country, owner, single actions menu.

**Create client (modal).** Identity (name required, surname), optional company
relation or create-company inline, job title, owner, stage, channels
(email/phone/messengers), language. No account, membership, password or
employee fields. Company/email/phone requiredness is an owner decision (§6).

**Contact record.** Header with name, stage control, owner, channel actions.
Details section (multiple emails and phones, job title, company, language,
messenger handles: Telegram, WhatsApp, WeChat, Instagram, Facebook, LinkedIn),
tags, notification preferences as separate switches for email, phone, Telegram,
WhatsApp and YORSO, company context summary, then tabs Activity, Tasks, Notes,
Correspondence. Support impersonation is a YORSO-only action, attributed to the
YORSO employee in an internal log visible only to YORSO Administrator. HubSpot,
auction and legacy demo controls are excluded.

**Companies list (secondary).** Search, sortable columns Company name · Email ·
Phone · Company owner · Created, pagination.

**Company record.** Details (name, email, phone, owner, domain, description,
Facebook, Instagram, LinkedIn), tags, addresses, linked contacts + add contact,
tasks, notes, activity, YORSO trust checks and documents, and product profile
with first-release fields only: Product, State, Buy or Sell, Monthly volume,
Unit, Cut/format, active/inactive. Visible action «Редактировать» for Owner and
Administrator; Manager and Observer read only.

**Import (presented as YORSO, Owner/Administrator only).** Six steps: file →
column mapping → preview → valid/error rows with matches and duplicates →
explicit update/restore decision → progress, then partial result and retry of
failed rows only.

## 3. Reusable component inventory

Reused as-is: page shell, section header, dense table row, `Field` / `FormRow`
from `src/components/account/fields.tsx`, list section primitives, dialog,
tabs, radio group, badge-free plain status text, pagination control, search
input, filter chip.

New shared pieces (built once, used in ≥2 places): `ChannelActions`
(email/phone/messenger quick actions), `StageSelect`, `RecordHeader`,
`RelatedRecordList`, `NotificationPreferenceRows`, `ImportStepper`.

Design language: Inter body, Plus Jakarta Sans headings, quiet dense work UI,
radius ≤8px, semantic tokens only, no hero, no gradients, no cards inside
cards.

## 4. State inventory (every list and record)

loading · ready · empty · no search results · active filters · read-only ·
no access · unavailable · conflict · validation error · saving · success ·
inactive/trash. No-access and unavailable states use neutral wording and never
name a technology or a second system.

## 5. Wide and narrow behavior

Wide (1280×800): table layout, record page with left content and right context
column, filters horizontal above the list. Narrow (390×844): cards instead of
tables, tabs become a scrollable row, context column moves below content, no
horizontal overflow, tap targets ≥44px, visible focus, Escape closes dialogs,
no nested interactive controls.

## 6. Capability classification

Native (pinned Twenty edition, verification required): tables, record pages,
relations, tasks, notes, timeline/activity, views, filters, search, pagination,
import, forms.

YORSO layer (proven gaps only): identity and access, workspace isolation,
product profile, trust data and documents, support audit log, brand language
and RU/EN/ES copy, contact-first list composition.

Deferred: the "Latin names" control, Chat and WeChat behavior, saved views if
not native in the pinned edition, auction and HubSpot legacy controls
(excluded), any server design.

## 7. Owner decisions required

1. Exact semantics of the legacy "Latin names" control.
2. Russian labels and business meaning of the six contact stages (New,
   Negotiation, Qualified, Unqualified, Irrelevant, No Response) — they must not
   be confused with opportunity stages.
3. Whether company, email and phone are required for every manually created
   contact (the plan proposes contact without company allowed).
4. What legacy Chat and WeChat actions actually open.
5. Exact per-field visibility and editability by role (Owner, Administrator,
   Manager, Observer).
6. Which capabilities the pinned edition provides without paid restrictions.

## 8. RU/EN/ES content strategy

All three languages planned together, one key per visible string, no technology
words. Strings whose meaning is unresolved (§7) stay unwritten rather than
guessed; they are listed as blocked keys until the owner decides.

## 9. Boundary

Build is forbidden until the owner approves this plan and then separately
approves a new clickable interface with the exact phrase «Интерфейс принят».
Server design does not begin in this plan.
