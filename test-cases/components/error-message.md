# ErrorMessageComponent — Functional Test Cases

Source: `src/app/shared/components/error-message/error-message.component.ts`

Presentational error card with a `message` input (default
`"An error occurred."`) and a `retry` output emitted when the user clicks
the Retry button.

---

## TC-EM-001 — Render the supplied message text verbatim

| Field | Value |
|---|---|
| Area / Module | `ErrorMessageComponent` template |
| Type | unit |
| Technique | Use-Case |
| Priority | P0 |
| Preconditions | TestBed renders the component with `message = "Network is offline"`. |
| Steps | **When** the component renders **Then** the message paragraph shows the input. |
| Test Data | message = `"Network is offline"` |
| Expected Result | The `<p>` element text equals `"Network is offline"`. |
| Source | `error-message.component.ts:29` |
| Automation | candidate |

## TC-EM-002 — Render the default message when none is provided

| Field | Value |
|---|---|
| Area / Module | `ErrorMessageComponent.message` default |
| Type | unit |
| Technique | EP (default) |
| Priority | P2 |
| Preconditions | Component is rendered without binding `message`. |
| Steps | **When** the component renders **Then** the default text is shown. |
| Test Data | n/a |
| Expected Result | The `<p>` element text equals `"An error occurred."`. |
| Source | `error-message.component.ts:40` |
| Automation | candidate |

## TC-EM-003 — Emit `retry` when the button is clicked

| Field | Value |
|---|---|
| Area / Module | `ErrorMessageComponent.retry` |
| Type | unit |
| Technique | Use-Case |
| Priority | P0 |
| Preconditions | Spy registered on the `retry` output. |
| Steps | **When** the user clicks the Retry button **Then** the output emits exactly once. |
| Test Data | n/a |
| Expected Result | `retry.emit` was called exactly once with no argument; subsequent clicks emit again, one per click. |
| Source | `error-message.component.ts:30-35, 41` |
| Automation | candidate |

## TC-EM-004 — Render the button as a focusable, keyboard-activatable control

| Field | Value |
|---|---|
| Area / Module | `ErrorMessageComponent` template |
| Type | accessibility |
| Technique | Use-Case (a11y) |
| Priority | P1 |
| Preconditions | Component rendered with any message. |
| Steps | **Given** keyboard-only navigation **When** the user tabs to the Retry control and presses `Enter` **Then** `retry` emits. |
| Test Data | key = `Enter` |
| Expected Result | After dispatching a `keydown` `Enter` on the focused button, `retry.emit` was called exactly once. |
| Source | `error-message.component.ts:30-35` |
| Automation | candidate |

## TC-EM-005 — Render the message as plain text (no HTML interpretation)

| Field | Value |
|---|---|
| Area / Module | `ErrorMessageComponent` template |
| Type | security |
| Technique | Error Guessing (XSS) |
| Priority | P1 |
| Preconditions | `message = '<script>alert("x")</script>'`. |
| Steps | **When** the component renders **Then** Angular's interpolation prevents HTML injection. |
| Test Data | message contains a `<script>` tag |
| Expected Result | The `<p>` element's `textContent` equals the literal string `'<script>alert("x")</script>'`; no `<script>` element is created in the DOM. |
| Source | `error-message.component.ts:29` |
| Automation | candidate |
