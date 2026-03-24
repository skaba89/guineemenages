// Clients Controller for GuinéaManager ERP

import { Request, Response } from 'express';
import * as clientService from '../services/client.service';
import { createClientSchema, updateClientSchema, clientFilterSchema } from '../utils/validation';
import { sendSuccess, sendCreated, sendNoContent, sendNotFound } from '../utils/response';
import { asyncHandler } from '../middlewares/error.middleware';

/**
 * Get all clients
 * GET /api/clients
 */
export const getClients = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const params = clientFilterSchema.parse(req.query);

  const result = await clientService.getClients(companyId, params);

  sendSuccess(res, result);
});

/**
 * Get client by ID
 * GET /api/clients/:id
 */
export const getClientById = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { id } = req.params;

  const client = await clientService.getClientById(companyId, id);

  sendSuccess(res, client);
});

/**
 * Create a new client
 * POST /api/clients
 */
export const createClient = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const validatedData = createClientSchema.parse(req.body);

  const client = await clientService.createClient(companyId, validatedData);

  sendCreated(res, client, 'Client créé avec succès');
});

/**
 * Update client
 * PUT /api/clients/:id
 */
export const updateClient = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { id } = req.params;
  const validatedData = updateClientSchema.parse(req.body);

  const client = await clientService.updateClient(companyId, id, validatedData);

  sendSuccess(res, client, 'Client mis à jour avec succès');
});

/**
 * Delete client
 * DELETE /api/clients/:id
 */
export const deleteClient = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { id } = req.params;

  await clientService.deleteClient(companyId, id);

  sendNoContent(res);
});

/**
 * Get client statistics
 * GET /api/clients/stats
 */
export const getClientStats = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;

  const stats = await clientService.getClientStats(companyId);

  sendSuccess(res, stats);
});
