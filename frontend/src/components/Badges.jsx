export const label = (v) => v.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

export const StatusBadge = ({ value }) => <span className={`badge status-${value}`}>{label(value)}</span>;
export const PriorityBadge = ({ value }) => <span className={`badge priority-${value}`}>{label(value)}</span>;

export const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
export const CATEGORIES = ['BUG', 'BILLING', 'ACCOUNT', 'FEATURE_REQUEST', 'GENERAL'];

export const fmt = (d) =>
  new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
