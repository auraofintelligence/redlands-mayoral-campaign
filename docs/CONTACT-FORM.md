# Optional contact-form setup

The public website includes a contact-form shell. Deploying the separate submission service is an option Luke can choose. It does not show a campaign email address or use a `mailto:` link. The form stays disabled while `data/campaign.json` has an empty `contactFormUrl`. Do not show a sent or received state until the deployed service confirms that it saved a record.

This integration is a **separate Apps Script project** from the private administration portal. When deployed and verified, the public contact endpoint accepts inbound messages and creates private JSON files. It cannot list messages, export the contact register, send email or publish content. Never put the private administration app's code into this public project.

## Setup if this option is chosen

1. Sign in to the Google account Luke selected for campaign storage. Create an Apps Script project named `Redlands campaign contact form`.
2. Add `integrations/contact-form/Code.gs` and replace the manifest with `integrations/contact-form/appsscript.json`.
3. In Script Properties, set `OWNER_EMAIL` to the selected account address and `ROOT_FOLDER_ID` to the ID of the verified owner-only campaign folder. Neither value belongs in the public site bundle. Optionally set `PRIVACY_NOTICE_VERSION` to the published privacy notice date.
4. Run `setupContactIntake` from the editor as the owner and authorise the requested Google permissions. It verifies storage ownership and sharing, creates an owner-only `Contact form submissions` subfolder and creates a private rate-limit secret. It does not deploy a public endpoint.
5. Deploy a new **Web app**, execute as **Me**, access **Anyone** including visitors who are not signed in. The manifest values are `USER_DEPLOYING` and `ANYONE_ANONYMOUS`. This is intentionally different from the owner-only admin portal's `USER_ACCESSING` and `MYSELF`.
6. Copy the actual deployed `/exec` URL into `contactFormUrl`. Use the deployment URL, not an editor URL or the `/dev` test URL. Keep the field empty until the deployment exists.
7. Check the public page's form action and Content Security Policy allow the deployed Google Apps Script destination. Submit a test message through normal browser navigation. A successful receipt must show a reference ID. Verify a matching JSON file in the private inbound folder and then remove that identified test record manually if it is no longer needed.
8. Check the signed-out path, a missing required field, the honeypot, consent checkbox and a storage failure. Do not mark the form connected until the browser-to-Drive write and readback are confirmed.

Apps Script requests Drive and account-identity scopes, with no Gmail or email-sending scope. Google may show information about the app or its deployer during its own service flows. The campaign site and returned receipt do not display the owner address.

## Form contract

Use an ordinary HTML form with `method="post"`, `enctype="application/x-www-form-urlencoded"` and the deployed `/exec` URL as its `action`. Navigation displays the Apps Script receipt page. Do not replace this with a cross-origin `fetch`, optimistic toast or a `no-cors` request whose result cannot be read.

| Field | Rule |
| --- | --- |
| `name` | Required, 1 to 120 characters |
| `email` | Required, valid address, at most 254 characters |
| `topic` | `general`, `media`, `project`, `correction`, `accessibility` or `privacy` |
| `message` | Required, 1 to 5000 characters |
| `updates` | Optional checkbox, value `yes`; leave absent when unchecked |
| `website` | Honeypot; empty, hidden from normal interaction and excluded from keyboard focus |

The server rejects oversized bodies, unexpected fields, duplicate field values, unsupported topics and a filled honeypot. It does not echo submitted content into the receipt. Messages remain plain JSON, so spreadsheet formula strings are not evaluated.

## Storage and optional review

Each successful submission creates one independent JSON file named with a random reference. The server reads the saved file back before showing success. A failure to confirm the write shows no receipt ID and does not claim delivery. A failed verification can leave a saved file, so a retry may create a duplicate; compare the submitted content and timestamps during review.

The contact form stores the visitor's stated name, reply address, topic and message. The updates checkbox creates only an unverified request, with `consentStatus: requested`. It does not add anyone to a mailing list. Review consent evidence before changing a private contact record to granted consent. No automatic reply or notification is sent. Luke can inspect the private inbound folder when he chooses. This integration creates no review schedule or response commitment.

The endpoint enforces three submissions per hashed reply address per fixed UTC hour and fifty submissions in total per hour. Script locks protect counters and writes. The counter stores an HMAC of the address with a private random secret, not the address itself. These limits and the honeypot reduce routine abuse; they are not identity verification or a substitute for stronger abuse controls if needed. A shared or changed storage folder fails closed.

The inbox files and the administration register are separate. Read an inbound file and create an enquiry record deliberately; this version has no automatic import or notification. Keep retention and deletion decisions in the private operating record.

## Verification references

- [Apps Script web apps, event parameters and deployment](https://developers.google.com/apps-script/guides/web)
- [Manifest execution and access values](https://developers.google.com/apps-script/manifest/web-app-api-executable)
- [Utilities HMAC support](https://developers.google.com/apps-script/reference/utilities/utilities)

Source code and local tests do not establish that a hosted form is connected. Record the deployed URL and completed browser submission check separately.
