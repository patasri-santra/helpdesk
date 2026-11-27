const { z } = require('zod');
const { STATUSES, PRIORITIES, CATEGORIES } = require('../models/Ticket');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

const register = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password is too long')
      .regex(/[A-Za-z]/, 'Password needs at least one letter')
      .regex(/\d/, 'Password needs at least one number'),
  })
  .strict();

const login = z
  .object({
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    password: z.string().min(1, 'Password is required'),
  })
  .strict();

const createTicket = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150),
    description: z.string().trim().min(10, 'Description must be at least 10 characters').max(5000),
    category: z.enum(CATEGORIES).optional(),
    priority: z.enum(PRIORITIES).optional(),
  })
  .strict();

const updateTicket = z
  .object({
    title: z.string().trim().min(3).max(150),
    description: z.string().trim().min(10).max(5000),
    category: z.enum(CATEGORIES),
    priority: z.enum(PRIORITIES),
    status: z.enum(STATUSES),
  })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field to update' });

const comment = z.object({ body: z.string().trim().min(1, 'Comment cannot be empty').max(2000) }).strict();

const listTickets = z.object({
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  category: z.enum(CATEGORIES).optional(),
  createdBy: objectId.optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.enum(['createdAt', '-createdAt', 'updatedAt', '-updatedAt']).default('-createdAt'),
});

const idParam = z.object({ id: objectId });

module.exports = { register, login, createTicket, updateTicket, comment, listTickets, idParam };
