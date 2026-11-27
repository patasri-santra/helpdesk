const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { EVENTS, on } = require('./eventBus');

const messages = {
  [EVENTS.TICKET_CREATED]: (p) => `${p.actor.name} created ticket "${p.title}"`,
  [EVENTS.TICKET_UPDATED]: (p) => `${p.actor.name} updated ${p.meta.fields.join(', ')} on "${p.title}"`,
  [EVENTS.STATUS_CHANGED]: (p) => `${p.actor.name} changed status from ${p.meta.from} to ${p.meta.to} on "${p.title}"`,
  [EVENTS.COMMENT_ADDED]: (p) => `${p.actor.name} commented on "${p.title}"`,
  [EVENTS.TICKET_RESOLVED]: (p) => `${p.actor.name} marked "${p.title}" as resolved`,
  [EVENTS.TICKET_DELETED]: (p) => `${p.actor.name} deleted ticket "${p.title}"`,
};

async function writeActivityLog(event, p) {
  await ActivityLog.create({
    ticket: p.ticketId,
    actor: p.actor.id,
    event,
    message: messages[event](p),
    meta: p.meta,
  });
}

async function recipientsFor(p) {
  let ids;
  if (p.actor.role === 'ADMIN') {
    ids = [String(p.ownerId)];
  } else {
    const admins = await User.find({ role: 'ADMIN' }).select('_id');
    ids = admins.map((a) => String(a._id));
  }
  return ids.filter((id) => id !== String(p.actor.id));
}

async function createNotifications(event, p) {
  if (event === EVENTS.STATUS_CHANGED && p.meta.to === 'RESOLVED') return;

  const recipients = await recipientsFor(p);
  if (!recipients.length) return;

  await Notification.insertMany(
    recipients.map((user) => ({ user, ticket: p.ticketId, event, message: messages[event](p) }))
  );
}

let registered = false;
function registerEventHandlers() {
  if (registered) return;
  registered = true;
  Object.values(EVENTS).forEach((event) => {
    on(event, (p) => writeActivityLog(event, p));
    on(event, (p) => createNotifications(event, p));
  });
}

module.exports = { registerEventHandlers };
