# Public contact form

The website submits to the separate Google Apps Script web app configured in `data/campaign.json`. The connected handler emails Luke's configured inbox. Its source is `integrations/contact-form/Code.gs`, with the manifest alongside it. It is separate from the private command centre and requires no access to its records.

The earlier Drive-file intake is no longer the integration described here. This handler does not create a Drive inbox, store enquiry JSON files, subscribe visitors to updates or import messages into the command centre. The public page and receipts do not display the destination email address.

## Configuration and deployment

Script Properties hold `OWNER_EMAIL` and `RATE_LIMIT_SECRET`. The owner address must match the executing Google account. Run `setupContactMail` as the owner to initialise the private rate-limit secret and inspect remaining sending quota. Keep these values, sign-in files and private deployment configuration out of Git.

The web app executes as its deploying owner and accepts anonymous submissions (`USER_DEPLOYING`, `ANYONE_ANONYMOUS`). Its scopes are `script.send_mail` and `userinfo.email`. It requests neither Gmail mailbox access nor Drive access. The visitor cannot choose the destination or add other recipients.

The deployed `/exec` URL belongs in `contactFormUrl`. An empty or invalid URL leaves the form disabled. Editing this repository does not update a hosted Apps Script deployment. Future deployment changes need the owner's existing Google authorisation and a delivery check; local tests alone do not establish inbox delivery.

The mail-only form was deployed and inbox-tested during the earlier setup. This migration review aligns the public source, tests and documentation with that handler. It sends no new test message and changes no Google deployment or permissions.

## Form and receipt

The site uses an ordinary HTML POST with `application/x-www-form-urlencoded`. Submission opens the Google receipt page. It does not use an unreadable cross-origin fetch or an optimistic success notice.

| Field | Rule |
| --- | --- |
| `name` | Required, 1 to 120 characters |
| `email` | Required, valid reply address, at most 254 characters |
| `topic` | `general`, `media`, `project`, `correction`, `accessibility` or `privacy` |
| `message` | Required, 1 to 5000 characters |
| `website` | Hidden honeypot; must be empty |

Unknown fields, duplicate values, oversized bodies, invalid topics and header injection are rejected. Messages use plain text. A receipt reference appears only after the mail service accepts the send. Acceptance is not a guarantee of final inbox delivery. If the provider throws an error, the receipt says sending could not be confirmed; retrying can produce a duplicate when an error happens after acceptance.

The source limits submissions to three per hashed reply address per UTC hour, thirty overall per UTC hour and ninety per UTC day, subject to the provider's remaining quota. Counters store a keyed hash, not plaintext reply addresses or message content. A script lock protects counters and sending. Missing owner configuration or a secret prevents sending. These controls reduce routine abuse without verifying a visitor's identity.

Enquiries remain private correspondence. Sending a message is not permission to publish its sender or contents, and it does not establish political support. Any later entry into private working records is a separate action.
