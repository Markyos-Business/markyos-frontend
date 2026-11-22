# User lifecycle

Reviewed 16 November 2026. Use the integrated Django API for shared accounts; browser-local demo state does not enforce server authorization.

## Account model

Platform administrators manage accounts. Members use their owned brands and invited brand memberships. Brand editor/viewer/client roles are separate from platform role. Company, Studio and Freelancer are ownership and billing account types; choosing a type never grants platform admin access.

## Journeys

| Entry point | Flow |
| --- | --- |
| Email registration | Choose a type, submit signup, open the emailed setup link, set a password, then enter the app. Awaiting setup is distinct from active. |
| Administrator invitation | Open the emailed setup link and establish the password. The administrator may assign type and role. |
| Brand invitation | Join the shared brand with the assigned brand membership. An untyped collaborator can continue using invitations. |
| First owned brand | Untyped collaborators opening `/brands/new` go to Account → Profile. Choose a type explicitly and confirm once. The choice does not purchase a subscription. |
| Later type change | Contact a Markyos administrator. In `/admin/users/[id]`, use Change account type, review limits and approve. Existing Stripe subscriptions and prices remain unchanged. |
| Password recovery | Request a link through `/reset`, follow it and set a password. Outstanding reset links and other sessions are invalidated. |
| Change password | Account → Profile → Change password sends a secure link to the current account email. Open the link and set the new password; outstanding recovery links and other sessions are then invalidated. |
| Change email | Edit email, confirm the current password, then confirm from the new inbox. The original address remains active until confirmation; pending changes support resend/cancel. Google-only users first set a password through their verified inbox. |
| Two-factor sign-in | When enabled, password sign-in requires an emailed code. The six fields accept a complete pasted code and expose one-time-code autocomplete. |
| Account administration | Administrators can inspect history/sessions, change roles/types, deactivate/reactivate and remove accounts subject to last-admin and superuser safeguards. |

## Development contracts

- A verified, untyped member may choose a type once through POST `/auth/account-type/`. The API refuses subsequent self-service changes, including after an administrator clears the type.
- Untyped members cannot own a new brand. Existing memberships remain available. Existing over-limit brands/editors are retained after admin changes; limits apply to new additions.
- Keep account-type changes separate from Stripe subscription changes. Existing subscriptions retain their stored price; future checkout follows the current type.
- Start email changes through POST `/auth/email-change/` with `email` and `currentPassword`. PATCH `/auth/me/` cannot bypass confirmation.
- Profile password changes reuse POST `/auth/password-forgot/`; the new password is entered only through the emailed `/reset?token=…` link. Requests show loading, delivery errors, inbox confirmation and a 30-second resend cooldown. Google-only users use the same flow to set a password. The browser-only demo cannot send email.
- Use the shared FormDialog, native RadioField and existing feedback patterns. Preserve English/Arabic labels and RTL layout.
- Use safeNextPath for authentication return paths. Token pages send no-referrer and noindex headers. Never log recovery or OTP values.
- Pending delivery and failed delivery are different from successful inbox delivery. Production provider monitoring remains an operational responsibility.

## Verification and remaining review

Frontend: 723 tests passed, 2 skipped; production build passed. Backend: 717 tests passed, 5 skipped. Real isolated browser checks cover English/Arabic at 390px/1440px, keyboard radio selection, first-type choice, admin change, safe return paths, token-page headers, email reauthentication and complete OTP paste.

These checks use [WCAG accessible authentication guidance](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html) and [OWASP authentication guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html). They do not establish full WCAG conformance or security certification. Stronger MFA/passkeys, password policy, production delivery and infrastructure review remain separate work. Existing automatic sign-in after password reset is retained; OWASP recommends returning through normal login.
