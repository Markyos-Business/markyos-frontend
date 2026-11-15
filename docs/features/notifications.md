# Notification inbox

The shared account header provides a bell for signed-in API accounts in the
studio, brand pages and admin area. It opens the shared Popup as a responsive
sheet. Notifications are stored on the backend, independently of the browser.

## Current events

| Event | Recipient | Destination |
| --- | --- | --- |
| Account created | New account | Brands |
| Admin invites, resends, changes role/type/access or ends sessions | Affected account | Account profile |
| Discovery first answer or submission | Current brand owner | Form answers |
| Discovery section completed | Current brand owner, when `notifyOnSection` is enabled | Form answers |

Generation uses Django post-save signals for User, AdminAction and FormEvent.
The notification is written in the event's transaction where one exists. Each
recipient/event key is unique, so dispatching the same event again creates no
duplicate. Raw fixture loads are ignored. This is an in-app inbox, not an email
queue. Existing transactional email behavior remains separate. Historical
activity is not backfilled. Deleted accounts cascade-delete their inboxes.

## API and security

All routes are under `/api/v1/notifications/` and require authentication.

- `GET /`: newest first, 20 items per page; `page` and `unread=true|false`.
  Returns `count`, `next`, `previous`, `results` and global `unreadCount`.
- `GET /unread-count/`: returns the caller's unread count.
- `PATCH /<uuid>/`: `{ "isRead": true|false }`; returns the updated notification.
  Repeating mark-read preserves the original read timestamp.
- `POST /read-all/`: marks the caller's unread items created before the request
  cutoff; returns `updated` and the remaining `unreadCount`.

Each item has `id`, `kind`, `data`, `targetUrl`, `createdAt`, `readAt`. Every query
is scoped to the authenticated recipient, including for platform admins.
Other users' IDs return 404 on mutation. No endpoint accepts arbitrary recipient
IDs, event kinds or message content. Producer code constructs internal paths;
the UI also validates paths before navigation. Payloads contain display names,
not credentials or session IPs.

## Interface behavior

The bell refreshes its count on mount, window focus and return to the visible
tab, plus every 30 seconds while visible. Opening the panel fetches current
items. Refresh explicitly reloads the inbox; this release does not use sockets
or push delivery. All/Unread filters reset pagination. Load more deduplicates
items, while read-state changes return to the first page.

Opening an unread notification first persists its read state, then navigates.
A failed save keeps it open and shows an error. Busy actions block duplicate
submissions and dismissal. Marking all read does not mark newly arriving events
past the server cutoff. Closing without opening an item does not mark it read.
Changing accounts remounts the inbox so previous recipients' data cannot remain
visible. Count failures retain the last known count; list failures expose Retry.
Empty, loading and error states are localized in English/Arabic. Reduced motion
and keyboard behavior come from the shared Popup.

## Extending and deploying

Add event producers in `apps/notifications/signals.py` or call the idempotent
`notify` service inside the business transaction. Choose a stable source event
key, keep payloads minimal, and add both language labels in the frontend copy
module. Use a destination the recipient is allowed to open. Test recipient
isolation and event deduplication for each new kind. Notifications are retained
until the account is deleted; no automatic expiry is configured.

Deploy the backend, run `python manage.py migrate`, then deploy the frontend.
Migration `notifications.0001_initial` creates the inbox table. Existing users
start empty and receive new events going forward. Browser/device push,
notification preferences, webhooks and notification email digests are outside
this implementation.

## Frontend feature boundary

All notification-specific code lives in `src/features/notifications/`:

- `index.ts`: public entry point (`NotificationBell`).
- `components/`: bell and inbox presentation.
- `hooks/`: request state, polling, pagination and read actions.
- `api/notifications.api.ts`: backend calls.
- `types.ts`: notification and inbox response contracts.
- `copy.ts` and `copy.test.ts`: localized event content and destination checks.

Other features import only `@/features/notifications`. The shared UI library
provides generic Popup, Button and date primitives; it contains no notification
business rules. The account header composes the public bell without owning its
requests or state. ESLint enforces imports through each feature's public index.
