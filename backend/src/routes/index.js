const router = require('express').Router();
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const s = require('../validators/schemas');

const auth = require('../controllers/authController');
const tickets = require('../controllers/ticketController');
const comments = require('../controllers/commentController');
const activity = require('../controllers/activityController');
const admin = require('../controllers/adminController');
const notifications = require('../controllers/notificationController');

router.post('/auth/register', validate(s.register), auth.register);
router.post('/auth/login', validate(s.login), auth.login);
router.get('/auth/me', authenticate, auth.me);

router.use(authenticate);

router.get('/tickets', validate(s.listTickets, 'query'), tickets.list);
router.post('/tickets', validate(s.createTicket), tickets.create);
router.get('/tickets/:id', validate(s.idParam, 'params'), tickets.getOne);
router.patch('/tickets/:id', validate(s.idParam, 'params'), validate(s.updateTicket), tickets.update);
router.delete('/tickets/:id', validate(s.idParam, 'params'), tickets.remove);

router.get('/tickets/:id/comments', validate(s.idParam, 'params'), comments.list);
router.post('/tickets/:id/comments', validate(s.idParam, 'params'), validate(s.comment), comments.create);
router.get('/tickets/:id/activity', validate(s.idParam, 'params'), activity.forTicket);

router.get('/notifications', notifications.list);
router.patch('/notifications/read-all', notifications.markAllRead);
router.patch('/notifications/:id/read', validate(s.idParam, 'params'), notifications.markRead);

router.get('/admin/stats', authorize('ADMIN'), admin.stats);
router.get('/admin/users', authorize('ADMIN'), admin.users);
router.get('/admin/activity', authorize('ADMIN'), activity.recent);

module.exports = router;
