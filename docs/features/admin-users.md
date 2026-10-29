# Users (platform admin)

> The reference feature for the dashboard component library: the template
> every later feature overview follows. Routes `/admin/users` and
> `/admin/users/[id]`. Code in `src/components/features/admin/`; backend in
> `markyos-backend/apps/admin_api/`.

## 1. Purpose and who it serves

The people who run Markyos (platform admins: `User.role = admin`, or a Django
superuser) need one place to see every account and act on it without opening
Django's `/admin/`. They use it to:

- see how many people use Markyos and how that moved since last month;
- find an account by name, email, role, status, account type, language or
  last activity;
- invite someone (an account that waits for its emailed set-password link);
- change a role, deactivate or reactivate, remove, resend an invite, and sign
  an account out of one browser or everywhere;
- answer "what happened to this account?" from its history.

Studio owners never see this. A member who opens `/admin` is sent to `/brands`,
and every endpoint refuses them with 403.

How the brief's model maps onto Markyos:

| Brief | Markyos |
| --- | --- |
| Roles owner, admin, editor, reviewer, viewer | Platform roles **admin** and **member**. Brand roles (editor, viewer, client) belong to a brand's team, not to the account. |
| Status active, invited, suspended | **active**, **waiting** (invited or signed up, link not followed yet), **deactivated** |
| Suspend | Deactivate: signed out everywhere, can't sign in |
| Team | **Account type**: studio, freelancer or company (admins have none) |
| Language `en-US`, `ar-SA` | `User.admin_lang`: `en`, `ar`, or none (follows the open brand) |
| Assets count | Brands owned, and brands they're on someone else's team for |
| Last owner can't be removed | **Last active admin** can't be demoted, deactivated or removed |

## 2. Screens and flows

**List, `/admin/users`.** The page header has Export (outline) and Invite user
(primary), then four stat cards, the filter bar and the table. Clicking a row
or pressing Enter on it opens the account.

**Detail, `/admin/users/[id]`.**
- A back link, then a header card: avatar, name, email, role tag and status
  dot, with the actions.
- Four tabs: Overview, Activity, Permissions and Sessions. The open tab is kept
  in the URL as `?tab=`.

Flows:

1. **List → detail.** Click a row, or choose View profile from its ⋯ menu.
   Back to the list with the back link or the browser's Back button; the
   filters are in the URL, so they survive.
2. **Invite.** Invite user → dialog.
   - Enter one or more emails (commas, spaces or new lines between), a role,
     an account type (members only), and a language.
   - Send. Each email becomes a waiting account and gets a 7-day
     set-password link.
   - A bad address is named under the field. Emails that fail stay in the box
     with the reason, so trying again doesn't invite anyone twice.
   - A toast confirms.
3. **Change role.** From the row menu, the detail header, or the bulk bar →
   a dialog with Member / Admin radios, each with a line on what it means →
   save → toast. Demoting yourself or the last admin is disabled up front.
4. **Deactivate / reactivate.** A confirm that names the consequence (brands
   they own stay stored but nobody can open them) → toast. Deactivating
   signs them out everywhere.
5. **Remove.** A danger confirm.
   - It lists what is lost: the brands they own are deleted, and they come
     off every team they're on.
   - It asks you to type the person's email. In bulk, you type "remove".
   - The detail page returns to the list.
6. **Resend invite.** For waiting accounts only: the row menu or the detail
   header → toast.
7. **Sessions.** The Sessions tab lists each signed-in browser (device, IP,
   signed in, last seen).
   - Sign out ends one browser; Sign out everywhere ends them all.
   - That browser's next token refresh is refused: within 15 minutes, the
     access token's lifetime.
8. **Bulk.** Tick rows → the bar shows "n selected" with Change role,
   Reactivate, Deactivate and Remove.
   - The server applies each account with the same guards as one at a time.
   - Refused accounts are named in a toast.
9. **Export.** Downloads a CSV of every account the current filters match,
   not just the page on screen.

## 3. Component map

Every piece comes from the dashboard library (`docs/components.md`). Feature
components only compose them.

**List: `components/users/`**

| Part | Kit components and key props |
| --- | --- |
| `AdminUsersView` | `PageHeader` (`breadcrumb`, `title`, `description`, `secondaryActions`=Export `Button` outline, `actions`=Invite `Button` primary) |
| `UsersStats` | `StatGrid` › 4 × `StatCard` (`label`, `value`, `footnote`="vs last month", `trend`={direction, value, label}, `loading`) |
| `UsersFilters` | `FilterBar` (`active`, `onClear`) › `SearchField` (`shortcut`, `onDebouncedChange`), 4 × `FilterSelectField` (`hideLabel`, `icon`), `DateRangeButton` |
| `UsersTable` | `DataTable<AdminUser>` (`selectable`, `bulkActions`, server `sort` + `paging`, `rowActions`, `getRowLabel`, `onRowClick`, `empty`) with `Avatar`, `Tag`, `StatusDot`; empty states via `EmptyState` |
| `InviteUsersDialog` | `FormDialog` › `TextareaField`, 3 × `SelectField` |
| `shared/ChangeRoleDialog` | `FormDialog` › `RadioField` |
| Confirms | `useDialog().confirm` (`tone: "danger"`, `consequences`, `confirmPhrase`) |
| Feedback | `useToast().showToast` |

**Detail: `components/user-detail/`**

| Part | Kit components and key props |
| --- | --- |
| `AdminUserView` | back `Button variant="link"`, `Tabs` (`icon` per tab), `Skeleton`, `EmptyState` (not found), `ErrorState` |
| `UserHeader` | `ContentCard` › `Avatar` (56), `Tag`, `StatusDot`, `Button` with `disabledReason`, `ActionsDropdown` (`iconOnly`) |
| `OverviewTab` | `StatGrid` › 3 × `StatCard`; `ContentCard` › `KeyValueList layout="grid"`; `UserBrands` |
| `UserBrands` | `ContentCard flush` › `DataTable` (client sort and pages) |
| `ActivityTab` | `ContentCard` › `ActivityFeed` (items worded by `utils/activity.ts`) |
| `PermissionsTab` | `ContentCard` (`footer` note) › `KeyValueList` › `StatusDot` per permission |
| `SessionsTab` | `ContentCard` (`controls`=Sign out everywhere) › `DataTable` (`hideHeader` on the button column) |

**Feature structure**

- **Logic** lives in hooks: `useUsersPage`, `useUserPage`, `useUserActions`,
  `useBulkUserActions`, `useInviteUsers`, `useUserSessions`,
  `useAdminViewer` and `useAdminLang`.
- **Pure rules** live in `utils/`, each with a test beside it:
  - `rules.ts`: who may do what
  - `trend.ts`
  - `activity.ts`
  - `format.ts`: `10m` relative times, "12 Sep" dates
  - `invite.ts`
  - `csv.ts`
- **Copy** is in `copy.ts`; values are in `constants.ts`.

## 4. Layout and RTL

| | Desktop ≥ 1280 | Tablet 768–1279 | Phone < 768 |
| --- | --- | --- | --- |
| Shell | Sidebar (collapsible) + 84px top bar | Same | Sidebar becomes a drawer behind the menu button |
| Page header | Title start, actions end | Same | Actions stack under the title |
| Stat cards | 4 across | 2 × 2 | 1 column |
| Filter bar | One row | Wraps | Search full width, filters wrap below |
| Users table | All columns | Language hidden below 1280px, Type below 1024px | Brands also hidden; the table scrolls sideways inside its card, the page never does |
| Detail header | Identity start, actions end | Actions wrap under | Same |
| Overview | Stat cards 3 across, details in two columns | Details two columns | One column |

RTL:

- The shell follows the admin's own interface language (`User.admin_lang`),
  switched with the EN / ع toggle in the top bar. It sets `dir="rtl"` on the
  shell and the kit's built-in words through `UiStringsProvider`.
- Only logical classes are used (`ms-`, `pe-`, `start-`, `text-start`), so the
  layout mirrors by construction (`npm run audit:logical`).
- Directional glyphs flip: the back arrow, pagination arrows and date picker
  chevrons. Others don't.
- Emails, IPs and locales are `dir="ltr"`. Names are `dir="auto"`.
- Charts and date axes don't mirror (spec §8).
- Numbers and dates stay Western in Arabic: "12 Sep", `10د`.

## 5. States

| State | List | Detail |
| --- | --- | --- |
| Loading | Stat cards show skeleton values; the table shows skeleton rows | Skeleton header, tabs and body; each tab loads on its own (sessions and activity show skeletons) |
| Empty | "No users yet" + Invite user | Brands: "No brands". Activity: "Nothing yet". Sessions: "Not signed in anywhere" |
| No results | "No users match “x”." (or "No users match these filters.") + Clear filters | n/a |
| Error | `ErrorState` in the table body with Retry; stat cards stay as they were | `ErrorState` with Retry in place of the page, or inside the failing tab |
| Not found | n/a | "This account doesn't exist, or it was removed." + back link (404 from the API) |
| Permission denied | Members never reach the page: the shell redirects to `/brands`, the API answers 403 | An action the rules refuse stays visible, disabled with `aria-disabled`, and its tooltip says why ("Markyos needs at least one active admin.") |
| Action failed | Toast with the server's message; the row stays as it was | Same; a failed role change keeps the dialog open with the message |

## 6. Data model and API

The real backend from the start, not a mock: `/api/v1/admin/`, every endpoint
`IsPlatformAdmin`. Types are in `features/admin/types.ts`; calls are in
`services/adminService.ts`.

```ts
type AdminUserStatus = "active" | "deactivated" | "waiting";

interface AdminUser {
  id: string; name: string; email: string;
  role: "admin" | "member"; accountType: "studio" | "freelancer" | "company" | null;
  isAdmin: boolean; isActive: boolean; isSuperuser: boolean;
  status: AdminUserStatus; language: "en" | "ar" | null;
  twoFactorEnabled: boolean; avatarUrl: string | null;
  createdAt: string; lastLoginAt: string | null;
  brandsOwned: number; brandsMember: number;
}
```

| Method and path | Purpose | Notes |
| --- | --- | --- |
| `GET stats/` | Totals | `users.now` and `users.monthAgo` (`total`, `active`, `pending`, `deactivated`) feed the trends; `users.activeAdmins` feeds the last-admin rule |
| `GET users/` | Paginated list | `search`, `role`, `status`, `account_type`, `language` (`en`, `ar`, `none`), `last_active_from` / `last_active_to` (ISO dates), `ordering` (`full_name`, `role`, `status`, `last_login`, `brands_owned`, `created_at`; `-` for descending), `page`, `page_size` (max 100) |
| `POST users/` | Invite | `{ email, name?, role, accountType?, language? }` → 201 `AdminUser`; 400 `{ email }` if taken |
| `GET users/<id>/` | One account | 404 when it doesn't exist |
| `PATCH users/<id>/` | Change `role`, `isActive`, `accountType` | 400 `{ detail }` when refused |
| `DELETE users/<id>/` | Remove | Deletes owned brands, removes them from team documents and memberships; 400 when refused |
| `POST users/<id>/resend-invite/` | Resend the link | 404 unless waiting |
| `POST users/<id>/revoke-sessions/` | Sign out everywhere | 204 |
| `GET users/<id>/sessions/` | Live sessions | `{ id, browser, os, mobile, ip, createdAt, lastSeenAt, expiresAt }[]` |
| `DELETE users/<id>/sessions/<sid>/` | Sign one session out | 204 |
| `GET users/<id>/activity/` | History | `{ id, kind, at, detail }[]`, newest first, up to 50 |
| `GET users/<id>/brands/` | Brands owned or on | `{ id, name, slug, stage, role, updatedAt }[]` |
| `POST users/bulk/` | Several at once | `{ ids, action: deactivate \| reactivate \| role \| remove, role? }` → `{ done: id[], refused: { id, email, detail }[] }` |

**New backend pieces**

- **`LoginSession`** (`apps/authentication`): one row per signed-in browser.
  - The refresh token carries its id as the `sid` claim. Each refresh follows
    the rotation, and a revoked session's refresh is refused.
  - Logging out marks it ended.
- **`AdminAction`** (`apps/admin_api`): what an admin did to an account, kept
  by email too, so a removal's record outlives the account.
- **Activity** combines account milestones, sign-ins, brands created and admin
  actions. The frontend words each `kind` in the admin's language.

## 7. Permissions

Only platform admins reach the area. Within it, the server's guards
(`change_refusal`, `remove_refusal`) decide. The frontend mirrors them in
`utils/rules.ts` so a refused action is disabled with its reason up front.

| Action | Member | Admin | Superuser | Refused when |
| --- | --- | --- | --- | --- |
| Open `/admin/users`, view accounts | No (redirect, 403) | Yes | Yes | |
| Invite | No | Yes | Yes | Email already has an account |
| Resend invite | No | Yes | Yes | Account isn't waiting |
| Change role | No | Yes | Yes | Demoting yourself; demoting the last active admin; target is a superuser and you aren't |
| Deactivate | No | Yes | Yes | Yourself; the last active admin; a superuser (unless you are one) |
| Reactivate | No | Yes | Yes | A superuser (unless you are one) |
| Remove | No | Yes | Yes | Yourself; the last active admin; a superuser (unless you are one) |
| Sign sessions out | No | Yes | Yes | |
| Export | No | Yes | Yes | |

Disabled reasons: "You can't change your own access here.", "You can't
remove your own account here.", "Markyos needs at least one active admin.",
"Only a superuser can change a superuser."

## 8. Copy deck

Every string the Users screens say, from `copy.ts` (generated, so it matches
the code). Sample values stand in for names and counts.

**title**

| Key | English | Arabic |
| --- | --- | --- |
| `title` | Users | المستخدمون |

**description**

| Key | English | Arabic |
| --- | --- | --- |
| `description` | Manage who can use Markyos | إدارة من يمكنه استخدام ماركيوس |

**breadcrumb**

| Key | English | Arabic |
| --- | --- | --- |
| `breadcrumb` | Admin | الإدارة |

**invite**

| Key | English | Arabic |
| --- | --- | --- |
| `invite` | Invite user | دعوة مستخدم |

**export**

| Key | English | Arabic |
| --- | --- | --- |
| `export` | Export | تصدير |

**exported**

| Key | English | Arabic |
| --- | --- | --- |
| `exported` | 12 users exported. | تم تصدير 12 مستخدم. |

**stats**

| Key | English | Arabic |
| --- | --- | --- |
| `stats.total` | Total users | إجمالي المستخدمين |
| `stats.active` | Active | نشط |
| `stats.pending` | Pending invites | دعوات معلّقة |
| `stats.deactivated` | Deactivated | معطّل |
| `stats.vsLastMonth` | vs last month | مقارنة بالشهر الماضي |
| `stats.trend` | Up 12% on last month | ارتفاع 12% عن الشهر الماضي |

**filters**

| Key | English | Arabic |
| --- | --- | --- |
| `filters.search` | Search name or email | ابحث بالاسم أو البريد |
| `filters.searchLabel` | Search users | البحث عن مستخدمين |
| `filters.role` | Role | الدور |
| `filters.allRoles` | All roles | كل الأدوار |
| `filters.status` | Status | الحالة |
| `filters.allStatuses` | All statuses | كل الحالات |
| `filters.type` | Account type | نوع الحساب |
| `filters.allTypes` | All types | كل الأنواع |
| `filters.language` | Language | اللغة |
| `filters.allLanguages` | All languages | كل اللغات |
| `filters.followsBrand` | Follows the brand | حسب العلامة |
| `filters.lastActive` | Last active | آخر نشاط |

**roles**

| Key | English | Arabic |
| --- | --- | --- |
| `roles.admin` | Admin | مسؤول |
| `roles.member` | Member | عضو |

**statuses**

| Key | English | Arabic |
| --- | --- | --- |
| `statuses.active` | Active | نشط |
| `statuses.deactivated` | Deactivated | معطّل |
| `statuses.waiting` | Waiting to join | بانتظار الانضمام |

**types**

| Key | English | Arabic |
| --- | --- | --- |
| `types.studio` | Studio | استوديو |
| `types.freelancer` | Freelancer | مستقل |
| `types.company` | Company | شركة |
| `types.none` | No type | بلا نوع |

**locales**

| Key | English | Arabic |
| --- | --- | --- |
| `locales.en` | en-US | en-US |
| `locales.ar` | ar-SA | ar-SA |

**stages**

| Key | English | Arabic |
| --- | --- | --- |
| `stages.discovery` | Discovery | الاستكشاف |
| `stages.strategy` | Strategy | الاستراتيجية |
| `stages.design` | Design | التصميم |
| `stages.review` | Review | المراجعة |
| `stages.delivered` | Delivered | تم التسليم |
| `stages.live` | Live | منشورة |
| `stages.none` | No stage | بلا مرحلة |

**table**

| Key | English | Arabic |
| --- | --- | --- |
| `table.label` | Users | المستخدمون |
| `table.itemLabel` | users | مستخدمين |
| `table.user` | User | المستخدم |
| `table.role` | Role | الدور |
| `table.status` | Status | الحالة |
| `table.type` | Type | النوع |
| `table.language` | Language | اللغة |
| `table.lastActive` | Last active | آخر نشاط |
| `table.brands` | Brands | العلامات |
| `table.never` | Never | أبدًا |
| `table.you` | You | أنت |

**actions**

| Key | English | Arabic |
| --- | --- | --- |
| `actions.view` | View profile | عرض الملف |
| `actions.changeRole` | Change role | تغيير الدور |
| `actions.resend` | Resend invite | إعادة إرسال الدعوة |
| `actions.deactivate` | Deactivate | تعطيل |
| `actions.reactivate` | Reactivate | إعادة التفعيل |
| `actions.remove` | Remove | إزالة |
| `actions.signOutAll` | Sign out everywhere | تسجيل الخروج من كل الأجهزة |
| `actions.more` | More actions | إجراءات أخرى |

**reasons**

| Key | English | Arabic |
| --- | --- | --- |
| `reasons.self` | You can't change your own access here. | لا يمكنك تغيير صلاحياتك من هنا. |
| `reasons.selfRemove` | You can't remove your own account here. | لا يمكنك إزالة حسابك من هنا. |
| `reasons.lastAdmin` | Markyos needs at least one active admin. | يحتاج ماركيوس إلى مسؤول نشط واحد على الأقل. |
| `reasons.superuser` | Only a superuser can change a superuser. | لا يغيّر المستخدم الخارق إلا مستخدم خارق. |

**empty**

| Key | English | Arabic |
| --- | --- | --- |
| `empty.noUsersTitle` | No users yet | لا يوجد مستخدمون بعد |
| `empty.noUsersBody` | Invite someone to give them access. | ادعُ شخصًا لمنحه الوصول. |
| `empty.noMatchTitle` | No users match “Riyadh”. | لا يوجد مستخدمون يطابقون «Riyadh». |
| `empty.noMatchBody` | Try another name, or clear the filters. | جرّب اسمًا آخر أو امسح عوامل التصفية. |
| `empty.clear` | Clear filters | مسح عوامل التصفية |

**inviteDialog**

| Key | English | Arabic |
| --- | --- | --- |
| `inviteDialog.title` | Invite users | دعوة مستخدمين |
| `inviteDialog.description` | Each person gets an email with a link to set their password. It works for 7 days. | يصل كل شخص بريد فيه رابط لتعيين كلمة المرور، صالح لمدة 7 أيام. |
| `inviteDialog.emails` | Emails | البريد الإلكتروني |
| `inviteDialog.emailsHint` | Separate several with commas. | افصل بين العناوين بفواصل. |
| `inviteDialog.role` | Role | الدور |
| `inviteDialog.type` | Account type | نوع الحساب |
| `inviteDialog.language` | Language | اللغة |
| `inviteDialog.submit` | Send invite | إرسال الدعوة |
| `inviteDialog.emailsRequired` | Enter at least one email. | أدخل بريدًا إلكترونيًا واحدًا على الأقل. |
| `inviteDialog.emailInvalid` | “nour@” isn't a valid email. | «nour@» ليس بريدًا إلكترونيًا صحيحًا. |
| `inviteDialog.tooMany` | Invite up to 20 people at a time. | ادعُ حتى 20 شخصًا في المرة الواحدة. |
| `inviteDialog.sent` | Invite sent to omar@wadirum.coffee. | تم إرسال الدعوة إلى omar@wadirum.coffee. |
| `inviteDialog.failed` | Not sent: layla@najd.sa | لم تُرسل: layla@najd.sa |

**roleDialog**

| Key | English | Arabic |
| --- | --- | --- |
| `roleDialog.title` | Change Omar Aziz's role | تغيير دور Omar Aziz |
| `roleDialog.titleMany` | Change the role of 3 users | تغيير دور 3 مستخدمين |
| `roleDialog.label` | Role | الدور |
| `roleDialog.submit` | Change role | تغيير الدور |
| `roleDialog.help.admin` | Admin: sees every account on Markyos and can change them. | مسؤول: يرى كل الحسابات على ماركيوس ويمكنه تغييرها. |
| `roleDialog.help.member` | Member: uses Markyos with their own brands. | عضو: يستخدم ماركيوس مع علاماته الخاصة. |

**confirm**

| Key | English | Arabic |
| --- | --- | --- |
| `confirm.deactivateTitle` | Deactivate Omar Aziz? | تعطيل Omar Aziz؟ |
| `confirm.deactivateMany` | Deactivate 3 users? | تعطيل 3 مستخدمين؟ |
| `confirm.deactivateBody` | They're signed out everywhere and can't sign in until an admin reactivates them. | يُسجَّل خروجه من كل الأجهزة ولا يمكنه الدخول حتى يعيد مسؤول تفعيله. |
| `confirm.brandsLocked` | 2 brands they own stay stored, but nobody can open them | تبقى 2 من علاماته محفوظة، لكن لا يمكن لأحد فتحها |
| `confirm.reactivateTitle` | Reactivate Omar Aziz? | إعادة تفعيل Omar Aziz؟ |
| `confirm.reactivateMany` | Reactivate 3 users? | إعادة تفعيل 3 مستخدمين؟ |
| `confirm.reactivateBody` | They can sign in again with their password. | يمكنه تسجيل الدخول مجددًا بكلمة مروره. |
| `confirm.removeTitle` | Remove Omar Aziz? | إزالة Omar Aziz؟ |
| `confirm.removeMany` | Remove 3 users? | إزالة 3 مستخدمين؟ |
| `confirm.removeBody` | This deletes the account. It can't be undone. | يُحذف الحساب نهائيًا ولا يمكن التراجع. |
| `confirm.brandsDeleted` | 2 brands they own are deleted | تُحذف 2 من العلامات التي يملكها |
| `confirm.offTeams` | They're taken off every brand team they're on | يُزال من كل فرق العلامات التي ينتمي إليها |
| `confirm.removePhrase` | remove | إزالة |
| `confirm.signOutTitle` | Sign Omar Aziz out everywhere? | تسجيل خروج Omar Aziz من كل الأجهزة؟ |
| `confirm.signOutBody` | Every device they're signed in on has to sign in again within 15 minutes. | على كل جهاز مسجّل الدخول أن يسجّل الدخول مجددًا خلال 15 دقيقة. |
| `confirm.endSessionTitle` | Sign out of Chrome on macOS? | تسجيل الخروج من Chrome on macOS؟ |
| `confirm.endSessionBody` | That browser has to sign in again within 15 minutes. | على هذا المتصفح أن يسجّل الدخول مجددًا خلال 15 دقيقة. |
| `confirm.signOut` | Sign out | تسجيل الخروج |

**toasts**

| Key | English | Arabic |
| --- | --- | --- |
| `toasts.deactivated` | Account deactivated. | تم تعطيل الحساب. |
| `toasts.reactivated` | Account reactivated. | تمت إعادة تفعيل الحساب. |
| `toasts.roleChanged` | Role changed. | تم تغيير الدور. |
| `toasts.removed` | Account removed. | تمت إزالة الحساب. |
| `toasts.resent` | Invite sent again. | تمت إعادة إرسال الدعوة. |
| `toasts.signedOut` | Signed out everywhere. | تم تسجيل الخروج من كل الأجهزة. |
| `toasts.sessionEnded` | Session signed out. | تم تسجيل الخروج من الجلسة. |
| `toasts.bulkDone` | 3 users updated. | تم تحديث 3 مستخدم. |
| `toasts.bulkRefused` | Not changed: nour@studio.sa | لم يتغيّر: nour@studio.sa |

**detail**

| Key | English | Arabic |
| --- | --- | --- |
| `detail.back` | All users | كل المستخدمين |
| `detail.notFound` | This account doesn't exist, or it was removed. | هذا الحساب غير موجود، أو تمت إزالته. |
| `detail.tabs.overview` | Overview | نظرة عامة |
| `detail.tabs.activity` | Activity | النشاط |
| `detail.tabs.permissions` | Permissions | الصلاحيات |
| `detail.tabs.sessions` | Sessions | الجلسات |
| `detail.tabsLabel` | Account sections | أقسام الحساب |
| `detail.details` | Details | التفاصيل |
| `detail.email` | Email | البريد الإلكتروني |
| `detail.type` | Account type | نوع الحساب |
| `detail.language` | Language | اللغة |
| `detail.joined` | Joined | تاريخ الانضمام |
| `detail.lastSignedIn` | Last signed in | آخر تسجيل دخول |
| `detail.twoFactor` | Two-step sign-in | التحقق بخطوتين |
| `detail.on` | On | مفعّل |
| `detail.off` | Off | غير مفعّل |
| `detail.brandsOwned` | Brands owned | علامات يملكها |
| `detail.brandsMember` | Brands on | علامات ينتمي إليها |
| `detail.sessions` | Active sessions | جلسات نشطة |
| `detail.ownedFootnote` | they created | أنشأها بنفسه |
| `detail.memberFootnote` | on someone else's team | في فرق الآخرين |
| `detail.sessionsFootnote` | browsers signed in | متصفحات مسجّلة الدخول |
| `detail.brands` | Brands | العلامات |
| `detail.brand` | Brand | العلامة |
| `detail.stage` | Stage | المرحلة |
| `detail.updated` | Last updated | آخر تحديث |
| `detail.noBrandsTitle` | No brands | لا توجد علامات |
| `detail.noBrandsBody` | They don't own a brand or sit on a team yet. | لا يملك علامة ولا ينتمي إلى فريق بعد. |
| `detail.brandRoles.owner` | Owner | مالك |
| `detail.brandRoles.editor` | Editor | محرّر |
| `detail.brandRoles.viewer` | Viewer | مشاهد |
| `detail.brandRoles.client` | Client | عميل |

**activity**

| Key | English | Arabic |
| --- | --- | --- |
| `activity.title` | Activity | النشاط |
| `activity.emptyTitle` | Nothing yet | لا شيء بعد |
| `activity.emptyBody` | What happens on this account shows up here. | يظهر هنا كل ما يحدث على هذا الحساب. |
| `activity.by` | By Nour Haddad | بواسطة Nour Haddad |
| `activity.joined` | Account created | تم إنشاء الحساب |
| `activity.verified` | Email confirmed | تم تأكيد البريد |
| `activity.password_changed` | Password changed | تم تغيير كلمة المرور |
| `activity.signed_in` | Signed in | سجّل الدخول |
| `activity.brand_created` | Created Wadi Rum Coffee | أنشأ Wadi Rum Coffee |
| `activity.invited` | Invited to Markyos | دُعي إلى ماركيوس |
| `activity.invite_resent` | Invite sent again | أُعيد إرسال الدعوة |
| `activity.role_changed` | Role changed from Member to Admin | تغيّر الدور من Member إلى Admin |
| `activity.type_changed` | Account type changed from Studio to Company | تغيّر نوع الحساب من Studio إلى Company |
| `activity.deactivated` | Deactivated | تم التعطيل |
| `activity.reactivated` | Reactivated | أُعيد التفعيل |
| `activity.signed_out` | Signed out everywhere | سُجّل خروجه من كل الأجهزة |
| `activity.session_ended` | Signed out of Chrome on macOS | سُجّل خروجه من Chrome on macOS |

**permissions**

| Key | English | Arabic |
| --- | --- | --- |
| `permissions.title` | What an admin can do | ما يمكن لدور «Admin» فعله |
| `permissions.note` | Read only. Change it with Change role. | للقراءة فقط. غيّره من «تغيير الدور». |
| `permissions.allowed` | Allowed | مسموح |
| `permissions.notAllowed` | Not allowed | غير مسموح |
| `permissions.items.ownBrands` | Create and edit their own brands | إنشاء علاماته وتعديلها |
| `permissions.items.adminArea` | Open the admin area | فتح منطقة الإدارة |
| `permissions.items.seeAccounts` | See every account on Markyos | رؤية كل الحسابات على ماركيوس |
| `permissions.items.invite` | Invite people to Markyos | دعوة أشخاص إلى ماركيوس |
| `permissions.items.changeRoles` | Change roles and account types | تغيير الأدوار وأنواع الحسابات |
| `permissions.items.removeAccounts` | Deactivate and remove accounts | تعطيل الحسابات وإزالتها |

**sessions**

| Key | English | Arabic |
| --- | --- | --- |
| `sessions.title` | Sessions | الجلسات |
| `sessions.label` | Signed-in browsers | المتصفحات المسجّلة الدخول |
| `sessions.itemLabel` | sessions | جلسات |
| `sessions.device` | Device | الجهاز |
| `sessions.ip` | IP address | عنوان IP |
| `sessions.started` | Signed in | سجّل الدخول |
| `sessions.lastSeen` | Last seen | آخر ظهور |
| `sessions.mobile` | Mobile | جوال |
| `sessions.unknown` | Unknown browser | متصفح غير معروف |
| `sessions.on` | Chrome on macOS | Chrome على macOS |
| `sessions.emptyTitle` | Not signed in anywhere | غير مسجّل الدخول في أي مكان |
| `sessions.emptyBody` | Each browser they sign in on shows up here. | يظهر هنا كل متصفح يسجّل الدخول منه. |

The kit's own words (Retry, Clear filters, "3 selected", pagination, date
picker) are in `src/components/ui/i18n/uiStrings.tsx`, also in both languages.

## 9. Accessibility

- **Keyboard on the list.**
  - ⌘K / Ctrl+K focuses search.
  - Tab moves through the filters into the table. Rows are focusable, and
    Enter opens one.
  - Each row's checkbox and ⋯ menu are named for the person ("Select row: Omar
    Aziz", "Row actions: Omar Aziz").
  - Sortable headers are buttons, and their sort state is read out.
- **Dialogs** (invite, change role, confirms):
  - Focus moves in, is trapped, Escape closes, and focus returns to the
    button that opened it.
  - Field errors sit under the field with `role="alert"`, announced once.
  - A danger confirm that needs typing keeps its confirm button disabled
    until the phrase matches.
- **Disabled actions** use `aria-disabled`, not `disabled`. The button stays
  focusable, so a keyboard user reaches it and hears the reason in its
  tooltip.
- **Status** is never colour alone: each dot has its word ("Waiting to join").
  Trends carry a spoken label ("Up 12% on last month").
- **Landmarks and names.**
  - The filter bar is a `search` landmark; the bulk bar is a region named
    "n selected".
  - Tables are named ("Users", "Signed-in browsers").
  - The detail page's only `h1` is the person's name.
- **Live updates.** Toasts announce results; loading areas are `aria-busy`.
- **Contrast** meets 4.5:1 throughout, and 7:1 for small text on tints in the
  dark theme (`npm run audit:contrast`).

## 10. Open questions and next steps

- **Trend semantics.** The chips follow the brief (up is green), but more
  deactivations or pending invites "up" isn't good news. Should those two
  cards use neutral, or invert the colours?
- **"A month ago" is approximate.** Status history isn't stored, so it counts
  accounts that existed 30 days ago in their state now. A daily snapshot
  table would make it exact.
- **Location.** Sessions show the IP, not a city. GeoIP (MaxMind or the
  host's header) is a later step.
- **Access tokens outlive a sign-out by up to 15 minutes.** The refresh is
  refused at once. A token denylist would make it immediate, if that matters.
- **Superuser flag.** `/auth/me` doesn't say whether you're a superuser, so
  the page fetches your own admin record. Adding it to the session would
  save a request.
- **The admin dashboard (`/admin`) is still English-only.** With the shell now
  bilingual, an Arabic admin sees RTL chrome around English text there. It
  is next to translate.
- **Brand-level people** (editors, viewers, clients per brand) are managed on
  each brand's Team page. A studio-wide People view was planned separately.
- **Audit log UI.** `AdminAction` records every admin change. A platform-wide
  "Admin activity" page would read the same table.
