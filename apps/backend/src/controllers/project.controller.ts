import { Response } from 'express';
import * as repo from '../repositories/project.repository.postgres';
import * as activityRepo from '../repositories/activity.repository.postgres';
import * as wsRepo from '../repositories/workspace.repository.postgres';

function parseProjectStatus(input: any): number | undefined {
  if (input === undefined) return undefined;
  if (input === null || input === '') return null as any;
  const map: Record<string, number> = {
    '0': 0, 'new': 0,
    '1': 1, 'in progress': 1, 'progress': 1,
    '2': 2, 'closed': 2, 'close': 2,
  };
  if (typeof input === 'number' && Number.isInteger(input)) return input;
  const key = String(input).trim().toLowerCase();
  if (key in map) return map[key];
  const n = parseInt(key, 10);
  if (!Number.isNaN(n) && n >= 0 && n <= 2) return n;
  return undefined;
}

export async function listForWorkspace(req: any, res: Response): Promise<void> {
  const { workspaceId } = req.params;
  const q = req.query.q ? String(req.query.q) : undefined;
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
  const before = req.query.before ? String(req.query.before) : undefined;
  const order = (req.query.order === 'asc' ? 'asc' : undefined) as any;
  try {
    const items = await repo.listByWorkspace(workspaceId, { q, limit, before, order });
    res.json({ items });
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to list projects', error: String(e?.message || e) });
  }
}

export async function create(req: any, res: Response): Promise<void> {
  const { workspaceId } = req.params;
  const { name, description, status } = req.body || {};
  if (!name) { res.status(400).json({ message: 'name is required' }); return; }
  const parsedStatus = parseProjectStatus(status);
  if (status !== undefined && parsedStatus === undefined) {
    res.status(400).json({ message: 'Invalid status. Use 0:new, 1:in progress, 2:closed' });
    return;
  }
  try {
    const project = await repo.createProject(workspaceId, req.userId, { name, description, status: parsedStatus ?? null });
    // Activity log
    await activityRepo.add({ workspaceId, projectId: project.id, actorId: req.userId, action: 'project_created', meta: { name } });
    res.status(201).json(project);
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to create project', error: String(e?.message || e) });
  }
}

export async function getById(req: any, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const project = await repo.getById(id);
    if (!project) { res.status(404).json({ message: 'Project not found' }); return; }
    res.json(project);
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to get project', error: String(e?.message || e) });
  }
}

export async function update(req: any, res: Response): Promise<void> {
  const { id } = req.params;
  const { name, description, status } = req.body || {};
  const parsedStatus = parseProjectStatus(status);
  if (status !== undefined && parsedStatus === undefined) {
    res.status(400).json({ message: 'Invalid status. Use 0:new, 1:in progress, 2:closed' });
    return;
  }
  try {
    const before = await repo.getById(id);
    const project = await repo.updateProject(id, { name, description, status: parsedStatus ?? null });
    if (!project) { res.status(404).json({ message: 'Project not found' }); return; }
    // Activity
    await activityRepo.add({ workspaceId: project.workspaceId, projectId: project.id, actorId: req.userId, action: 'project_updated', meta: { before, after: project } });
    res.json(project);
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to update project', error: String(e?.message || e) });
  }
}

export async function remove(req: any, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const project = await repo.getById(id);
    if (!project) { res.status(404).json({ message: 'Project not found' }); return; }
    await repo.deleteProject(id);
    await activityRepo.add({ workspaceId: project.workspaceId, projectId: project.id, actorId: req.userId, action: 'project_deleted', meta: { name: project.name } });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to delete project', error: String(e?.message || e) });
  }
}

export async function addMember(req: any, res: Response): Promise<void> {
  const { id } = req.params; // project id
  const { userId, role } = req.body || {};
  if (!userId) { res.status(400).json({ message: 'userId is required' }); return; }
  try {
    const project = await repo.getById(id);
    if (!project) { res.status(404).json({ message: 'Project not found' }); return; }
    // Authorization: workspace WORKSPACE_OWNER/ADMIN for this project's workspace OR project owner
    const actorRole = await wsRepo.getMemberRole(project.workspaceId, req.userId);
    const isWorkspaceAdmin = actorRole === 'WORKSPACE_OWNER' || actorRole === 'ADMIN';
    const projectRole = await repo.getMemberRole(id, req.userId);
    const isProjectOwner = projectRole === 'PROJECT_OWNER';
    if (!isWorkspaceAdmin && !isProjectOwner) {
      res.status(403).json({ message: 'Only workspace WORKSPACE_OWNER/ADMIN or project owner can add project members' });
      return;
    }
    const normalizedRole = (role === 'GUEST') ? 'GUEST' : 'MEMBER';
    await repo.addMember(id, userId, normalizedRole as any);
    res.status(204).send();
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to add member to project', error: String(e?.message || e) });
  }
}

export async function removeMember(req: any, res: Response): Promise<void> {
  const { id, userId } = req.params; // project id and member userId
  try {
    const project = await repo.getById(id);
    if (!project) { res.status(404).json({ message: 'Project not found' }); return; }
    const actorRole = await wsRepo.getMemberRole(project.workspaceId, req.userId);
    const isWorkspaceAdmin = actorRole === 'WORKSPACE_OWNER' || actorRole === 'ADMIN';
    const projectRole = await repo.getMemberRole(id, req.userId);
    const isProjectOwner = projectRole === 'PROJECT_OWNER';
    if (!isWorkspaceAdmin && !isProjectOwner) {
      res.status(403).json({ message: 'Only workspace WORKSPACE_OWNER/ADMIN or project owner can remove project members' });
      return;
    }
    await repo.removeMember(id, userId);
    res.status(204).send();
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to remove member from project', error: String(e?.message || e) });
  }
}
