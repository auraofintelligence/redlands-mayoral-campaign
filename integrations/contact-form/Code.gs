/* Public inbound contact endpoint. Deploy separately from the private admin app. */
var CONTACT_TOPICS = ['general', 'media', 'project', 'correction', 'accessibility', 'privacy'];
var CONTACT_FIELDS = ['name', 'email', 'topic', 'message', 'updates', 'website'];
var CONTACT_MAX_BODY = 32768;

function contactProperties_() { return PropertiesService.getScriptProperties(); }
function ownerEmail_() {
  var owner = String(contactProperties_().getProperty('OWNER_EMAIL') || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner) || Session.getEffectiveUser().getEmail().toLowerCase() !== owner) throw new Error('Configuration unavailable.');
  return owner;
}
function privateFolder_(id, owner) {
  if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) throw new Error('Configuration unavailable.');
  var folder = DriveApp.getFolderById(id);
  if (!folder.getOwner() || folder.getOwner().getEmail().toLowerCase() !== owner || folder.getSharingAccess() !== DriveApp.Access.PRIVATE || folder.getEditors().length || folder.getViewers().length) throw new Error('Private storage required.');
  return folder;
}
function contactDestination_() {
  var properties = contactProperties_(), owner = ownerEmail_();
  var root = privateFolder_(properties.getProperty('ROOT_FOLDER_ID'), owner);
  var inbound = privateFolder_(properties.getProperty('INBOUND_FOLDER_ID'), owner);
  var parents = inbound.getParents(), inside = false;
  while (parents.hasNext()) if (parents.next().getId() === root.getId()) inside = true;
  if (!inside) throw new Error('Private storage required.');
  return inbound;
}
function setupContactIntake() {
  var owner = ownerEmail_();
  if (Session.getActiveUser().getEmail().toLowerCase() !== owner) throw new Error('Owner sign-in required.');
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var properties = contactProperties_();
    var root = privateFolder_(properties.getProperty('ROOT_FOLDER_ID'), owner);
    if (!properties.getProperty('INBOUND_FOLDER_ID')) properties.setProperty('INBOUND_FOLDER_ID', root.createFolder('Contact form submissions').getId());
    if (!properties.getProperty('RATE_LIMIT_SECRET')) properties.setProperty('RATE_LIMIT_SECRET', Utilities.getUuid() + Utilities.getUuid());
    contactDestination_();
    return {ready: true, storage: 'Owner-only inbound folder verified'};
  } finally { lock.releaseLock(); }
}
function validateContact_(event) {
  if (!event || !event.postData || !/^application\/x-www-form-urlencoded(?:;|$)/i.test(String(event.postData.type || ''))) throw new Error('invalid');
  var length = Number(event.contentLength);
  if (!Number.isFinite(length) || length < 1 || length > CONTACT_MAX_BODY || String(event.postData.contents || '').length > CONTACT_MAX_BODY) throw new Error('invalid');
  var parameters = event.parameter || {}, multiple = event.parameters || {};
  Object.keys(parameters).forEach(function (key) {
    if (CONTACT_FIELDS.indexOf(key) < 0 || typeof parameters[key] !== 'string' || (multiple[key] && multiple[key].length !== 1)) throw new Error('invalid');
  });
  if (String(parameters.website || '').trim()) throw new Error('invalid');
  var name = String(parameters.name || '').trim(), email = String(parameters.email || '').trim().toLowerCase();
  var topic = String(parameters.topic || ''), message = String(parameters.message || '').trim();
  if (!name || name.length > 120 || /[\u0000-\u001F\u007F]/.test(name)) throw new Error('invalid');
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('invalid');
  if (CONTACT_TOPICS.indexOf(topic) < 0 || !message || message.length > 5000 || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(message)) throw new Error('invalid');
  if (parameters.updates !== undefined && parameters.updates !== '' && parameters.updates !== 'yes') throw new Error('invalid');
  return {name: name, email: email, topic: topic, message: message, updatesRequested: parameters.updates === 'yes', consentStatus: parameters.updates === 'yes' ? 'requested' : 'not_requested'};
}
function enforceContactRate_(email) {
  var properties = contactProperties_(), secret = properties.getProperty('RATE_LIMIT_SECRET');
  if (!secret) throw new Error('Configuration unavailable.');
  var digest = Utilities.computeHmacSha256Signature(email, secret).map(function (byte) { return ('0' + ((byte + 256) % 256).toString(16)).slice(-2); }).join('');
  var now = Date.now(), window = Math.floor(now / 3600000);
  var state = JSON.parse(properties.getProperty('CONTACT_RATE_STATE') || '{}');
  if (state.window !== window) state = {window: window, total: 0, addresses: {}};
  if (state.total >= 50 || (state.addresses[digest] || 0) >= 3) throw new Error('rate');
  state.total++; state.addresses[digest] = (state.addresses[digest] || 0) + 1;
  properties.setProperty('CONTACT_RATE_STATE', JSON.stringify(state));
}
function contactPage_(title, detail, reference) {
  function escape(value) { return String(value).replace(/[&<>"']/g, function (character) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]; }); }
  var receipt = reference ? '<p><strong>Reference:</strong> ' + escape(reference) + '</p>' : '';
  return HtmlService.createHtmlOutput('<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>' + escape(title) + '</title><style>body{font-family:system-ui,sans-serif;background:#150022;color:#fff7ff;line-height:1.6;margin:0;padding:3rem 1.25rem}main{max-width:38rem;margin:auto;background:#241039;border:1px solid #654778;border-radius:1rem;padding:2rem}h1{line-height:1.15;font-size:2rem}p{overflow-wrap:anywhere}</style></head><body><main><h1>' + escape(title) + '</h1><p>' + escape(detail) + '</p>' + receipt + '<p>You can return to the campaign site using your browser.</p></main></body></html>').setTitle(title);
}
function doGet() { return contactPage_('Campaign contact form', 'Submit a message through the form on the campaign website. This page does not display stored messages.'); }
function doPost(event) {
  var record;
  try { record = validateContact_(event); }
  catch (error) { return contactPage_('Message not submitted', 'The form could not be accepted. Return to the form, check the fields and try again.'); }
  var lock = LockService.getScriptLock(), acquired = false;
  try {
    lock.waitLock(20000); acquired = true;
    var destination = contactDestination_();
    enforceContactRate_(record.email);
    var id = Utilities.getUuid();
    record.reference = id; record.receivedAt = new Date().toISOString(); record.status = 'new'; record.source = 'public-contact-form';
    record.privacyNoticeVersion = String(contactProperties_().getProperty('PRIVACY_NOTICE_VERSION') || '2026-11-08');
    var content = JSON.stringify(record, null, 2);
    var file = destination.createFile('enquiry-' + id + '.json', content, MimeType.PLAIN_TEXT);
    if (file.getBlob().getDataAsString('UTF-8') !== content) throw new Error('Storage verification failed.');
    return contactPage_('Message received', 'Your message has been saved for review. Keep the reference below. Requesting updates does not automatically subscribe you.', id);
  } catch (error) {
    return error.message === 'rate'
      ? contactPage_('Message not submitted', 'The form has received too many submissions. Please try again later.')
      : contactPage_('Receipt not confirmed', 'A storage receipt could not be confirmed. Your message may not have been saved. Please try again later.');
  } finally { if (acquired) lock.releaseLock(); }
}
