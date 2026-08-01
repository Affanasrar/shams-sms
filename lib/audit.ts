// lib/audit.ts

import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

interface AuditParams {
  action: string
  entity: string
  entityId: string
  userId?: string
  userName?: string
  details?: Record<string, unknown>
}

/**
 * Log an audit event to the AuditLog table.
 * Fire-and-forget — never throws, never blocks the caller.
 */
export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        userId: params.userId ?? null,
        userName: params.userName ?? null,
        details: params.details ? (params.details as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    })
  } catch (error) {
    // Audit logging should never break the main flow
    console.error('[AuditLog] Failed to log:', error)
  }
}

/**
 * Fetch recent audit logs with pagination.
 */
export async function getAuditLogs(options?: {
  entity?: string
  entityId?: string
  action?: string
  take?: number
  skip?: number
}) {
  const { entity, entityId, action, take = 50, skip = 0 } = options ?? {}

  const where: Record<string, unknown> = {}
  if (entity) where.entity = entity
  if (entityId) where.entityId = entityId
  if (action) where.action = action

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
    prisma.auditLog.count({ where }),
  ])

  return { logs, total }
}
