const { EventEmitter } = require('events');

const EVENTS = {
  TICKET_CREATED: 'ticket.created',
  TICKET_UPDATED: 'ticket.updated',
  STATUS_CHANGED: 'ticket.status_changed',
  COMMENT_ADDED: 'comment.added',
  TICKET_RESOLVED: 'ticket.resolved',
  TICKET_DELETED: 'ticket.deleted',
};

const bus = new EventEmitter();

const emit = (event, payload) => bus.emit(event, payload);

const on = (event, handler) =>
  bus.on(event, (payload) =>
    Promise.resolve(handler(payload)).catch((err) => console.error(`[event:${event}] handler failed:`, err.message))
  );

module.exports = { EVENTS, emit, on, bus };
