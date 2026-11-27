# Helpdesk: Support Ticket Management System

A mini helpdesk where users raise support tickets and admins (the support team) work through them until they are resolved. Built with Node.js, Express, MongoDB and React.

| | |
| --- | --- |
| Live app | `<add Vercel URL>` |
| Live API | `<add Render URL>/api/health` |
| Demo user | Register your own account on the live app |
| Demo admin | `<add admin email>` / `<add admin password>` |

## How it works

1. A user registers, logs in and raises a ticket (title, description, category, priority). Status starts as **Open**.
2. The admin sees every ticket, filters them by status or priority, and sets the ticket to **In progress**.
3. The admin and the user talk through comments on the ticket.
4. When the problem is fixed the admin sets the ticket to **Resolved**, and once the user is happy, to **Closed**.
5. Every important action fires an event. Events write an activity log and send in-app notifications to the other side.

Who can see what: a user sees only their own tickets. An admin sees all tickets. Admin accounts are never created through public sign-up; they are created with a seed script.

## Features

- **Auth:** register and login, JWT, bcrypt password hashing, `USER` and `ADMIN` roles.
- **Tickets:** create, view, edit, delete and track status.
- **Admin tools:** all tickets, filter by status, priority, category or user, change status and priority, reply on any ticket, dashboard counts.
- **Comments:** linked to a ticket and its author.
- **Events:** `ticket.created`, `ticket.updated`, `ticket.status_changed`, `comment.added`, `ticket.resolved` and `ticket.deleted` trigger an activity log and notifications.
- **Extras:** search, pagination, sorting, automated tests, Postman collection, React frontend, optional Docker setup.

## Tech stack

- **Backend:** Node.js 20, Express 4, Mongoose 8, Zod, jsonwebtoken, bcryptjs, helmet, cors, express-rate-limit
- **Frontend:** React 18, React Router 6, Axios, Vite
- **Database:** MongoDB
- **Testing:** Jest, Supertest

## Folder structure

```
backend/src
  config/        environment and database connection
  models/        User, Ticket, Comment, ActivityLog, Notification
  validators/    Zod schemas for all request input
  middleware/    authenticate, authorize, validate, error handler
  controllers/   request handling for each resource
  services/      shared ticket access (ownership) rule
  events/        event bus and event handlers
  routes/        route table
  scripts/       seed.js creates the first admin
frontend/src     pages, components, auth context, API client
```

## Run it locally

You need Node 18 or newer and a MongoDB database (local or Atlas).

**Backend**

```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

Open `.env` first and set `MONGO_URI` and a long random `JWT_SECRET`. The seed command creates the admin from `ADMIN_EMAIL` and `ADMIN_PASSWORD`. The API runs at http://localhost:5000.

**Frontend** (in a second terminal)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The app runs at http://localhost:5173 and expects `VITE_API_URL=http://localhost:5000/api`.

**With Docker (optional)**

```bash
docker compose up --build
docker compose exec api node src/scripts/seed.js
```

This starts the API and a MongoDB container. The frontend is still started with `npm run dev`.

### Backend environment variables

| Variable | Purpose |
| --- | --- |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign tokens (required) |
| `JWT_EXPIRES_IN` | Token lifetime, default `1d` |
| `CLIENT_URL` | Allowed frontend origin(s) for CORS, comma separated |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Used only by `npm run seed` |

### Creating an admin

Run `npm run seed` against the database your app uses. To seed the deployed database, put the Atlas connection string in your local `backend/.env` and run the same command from your laptop. Another option is changing a user's `role` to `ADMIN` in MongoDB.

### Tests

```bash
cd backend
npm test
```

This runs the checks that need no database (auth guards, validation, role-escalation attempt, unknown routes). To also run the full ticket workflow (create, admin resolve, comments, events, access control), point it at a throwaway database:

```bash
MONGO_URI_TEST=mongodb://127.0.0.1:27017/helpdesk_test npm test
```

These tests drop the database they connect to, so never use your real one.

## API

Base path: `/api`. Every route except register and login needs the header `Authorization: Bearer <token>`. A ready-to-use Postman collection is in `Helpdesk.postman_collection.json`.

| Method | Endpoint | Who | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | Anyone | Create a user account |
| POST | `/auth/login` | Anyone | Returns a token and the user |
| GET | `/auth/me` | Logged in | Current user |
| GET | `/tickets` | Logged in | Users get their own tickets, admins get all. Query: `status`, `priority`, `category`, `search`, `createdBy` (admin), `page`, `limit`, `sort` |
| POST | `/tickets` | Logged in | Create a ticket |
| GET | `/tickets/:id` | Owner, admin | Ticket details |
| PATCH | `/tickets/:id` | Owner, admin | Owner edits title, description, category, priority while the ticket is Open. Admin changes status and priority |
| DELETE | `/tickets/:id` | Owner (while Open), admin | Delete the ticket and its comments |
| GET, POST | `/tickets/:id/comments` | Owner, admin | List or add comments |
| GET | `/tickets/:id/activity` | Owner, admin | Activity log of the ticket |
| GET | `/notifications` | Logged in | Your notifications and unread count |
| PATCH | `/notifications/read-all` and `/notifications/:id/read` | Logged in | Mark as read |
| GET | `/admin/stats` | Admin | Ticket counts by status, priority, category |
| GET | `/admin/users` | Admin | All users |
| GET | `/admin/activity` | Admin | Latest activity across all tickets |

Success responses look like `{ "success": true, "data": ... }`. Errors look like `{ "success": false, "message": "...", "details": [...] }` and use proper status codes: 400 invalid input, 401 not logged in, 403 not allowed, 404 not found, 409 duplicate, 429 too many requests.

## Database design

MongoDB, five collections. Comments, activity and notifications reference the ticket by id instead of being embedded, because they keep growing.

```
User    1 ──< Ticket        (Ticket.createdBy)
Ticket  1 ──< Comment       (Comment.ticket, Comment.author)
Ticket  1 ──< ActivityLog   (ActivityLog.ticket, ActivityLog.actor)
User    1 ──< Notification  (Notification.user, Notification.ticket)
```

| Collection | Main fields | Indexes |
| --- | --- | --- |
| `users` | name, email, password (hashed, hidden from queries), role | unique `email` |
| `tickets` | title, description, category, priority, status, createdBy, resolvedAt | `createdBy + createdAt`, `status + priority + createdAt`, text index on title and description |
| `comments` | ticket, author, authorRole, body | `ticket + createdAt` |
| `activitylogs` | ticket, actor, event, message, meta | `ticket + createdAt`, `createdAt` |
| `notifications` | user, ticket, event, message, read | `user + read + createdAt` |

Allowed values: status is `OPEN`, `IN_PROGRESS`, `RESOLVED` or `CLOSED`. Priority is `LOW`, `MEDIUM`, `HIGH` or `URGENT`. Category is `BUG`, `BILLING`, `ACCOUNT`, `FEATURE_REQUEST` or `GENERAL`.

I chose MongoDB because tickets are simple documents and Mongoose gives validation and indexes with little setup. Each comment stores `authorRole`, so a reply from support keeps showing as "Support" even if that person's role changes later.

## Event handling

Controllers only announce what happened, for example `emit('ticket.created', ...)`. They do not know who reacts. Handlers in `events/handlers.js` do the work:

1. **Activity log:** every event saves a readable entry that is shown in the ticket's Activity section.
2. **Notifications:** when an admin acts, the ticket owner is notified. When a user acts, all admins are notified. Nobody is notified about their own action. Resolving a ticket fires two events but sends only one notification.

Handlers run in the background and catch their own errors, so a failed log or notification never breaks the request. Adding something new, like email, means subscribing to an event without touching the controllers.

Limit: the event bus lives in the server's memory, which is right for a single server. For several servers or guaranteed delivery I would move to a queue such as BullMQ with Redis.

## Security

- Passwords are hashed with bcrypt and never returned in responses.
- The JWT is checked on every request and the user is reloaded from the database, so deleted users lose access at once.
- Public sign-up always creates a normal user. The input schema is strict, so sending `role: "ADMIN"` is rejected.
- Access is enforced on the server, both per route (admin-only routes) and per ticket. Someone else's ticket returns 404, not 403, so ticket ids cannot be guessed.
- Field-level rules: users cannot change status, and admins can change only status and priority.
- All input is validated with Zod, which also blocks NoSQL operator injection such as `{ "email": { "$gt": "" } }`.
- helmet security headers, a CORS allow-list, a 10 kb body limit, rate limiting (stricter on login and register), the same error message for a wrong email or password, and no stack traces in production.

Known trade-off: the frontend stores the JWT in `localStorage` for simplicity, which is exposed if the site ever has an XSS bug. The hardened option is an httpOnly cookie with CSRF protection.

## Design decisions

- Users can edit or delete a ticket only while it is Open, so it does not change under an admin who has started working on it. Users can still comment.
- Users cannot comment on a Closed ticket and must raise a new one. Admins still can.
- Only admins change the status. Users cannot close or reopen their own ticket.
- Pagination is done on the server with a maximum of 50 items per page.
- Notifications are fetched by polling every 30 seconds instead of WebSockets, which keeps the system much simpler for this scope.

## Deployment

1. **Database:** create a free MongoDB Atlas cluster, allow network access, and copy the connection string.
2. **API on Render:** root directory `backend`, build command `npm install`, start command `npm start`. Set `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production` and `CLIENT_URL` (your frontend URL).
3. **Admin account:** run `npm run seed` from your laptop with the Atlas connection string in `backend/.env`.
4. **Frontend on Vercel:** root directory `frontend`, set `VITE_API_URL` to `<your API URL>/api`.

## Future improvements

- Assign tickets to a specific admin.
- Let the ticket owner confirm a resolved ticket or reopen it.
- File attachments on tickets.
- Email notifications, added as another event handler.
- Refresh tokens and an httpOnly cookie for login.
- A CI pipeline that runs the tests on every push.