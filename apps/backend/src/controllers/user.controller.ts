import { Request, Response } from "express";
import { fetchUserData, updateUserData } from "../repositories/user.repository";
import * as userRepo from "../repositories/user.repository.postgres";
import * as wsRepo from "../repositories/workspace.repository.postgres";
import * as prjRepo from "../repositories/project.repository.postgres";
import { getEffectiveRole } from "../repositories/permission.repository.postgres";

function ensureAdmin(req: any, res: any, role: string) {
  if (role !== 'ADMIN') {
    res.status(403).json({ message: 'Admin permission required' });
    return false;
  }
  return true;
}

export const getUserData = async (req: any, res: any) => {
    const userId = req.params.id;

    try {
        const user = await fetchUserData(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const listUsers = async (req: any, res: any) => {
  const role = await getEffectiveRole(req.userId);
  if (!ensureAdmin(req, res, role)) return;
  try {
    const rows = await userRepo.listUsers({
      workspaceId: req.query.workspaceId || undefined,
      noWorkspace: String(req.query.noWorkspace || '').toLowerCase() === 'true',
      projectId: req.query.projectId || undefined,
      sortBy: req.query.sortBy as any,
      sortDir: req.query.sortDir as any,
      q: req.query.q || undefined,
    });
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const inviteUser = async (req: any, res: any) => {
  const role = await getEffectiveRole(req.userId);
  if (!ensureAdmin(req, res, role)) return;
  const { email, name } = req.body || {};
  if (!email) return res.status(400).json({ message: 'Email is required' });
  try {
    const user = await userRepo.inviteUser(email, name);
    res.status(201).json(user);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const deactivateUser = async (req: any, res: any) => {
  const role = await getEffectiveRole(req.userId);
  if (!ensureAdmin(req, res, role)) return;
  const { id } = req.params;
  try {
    await userRepo.deactivateUser(id);
    res.json({ message: 'User deactivated' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateUser = async (req: any, res: any) => {
    const userId = req.params.id;
    const data = req.body;

    console.log("Received Update Request:", { userId, data });

    if (!userId || !data) {
        return res.status(400).json({ message: "User ID and data are required" });
    }

    try {
        await updateUserData(userId, data);
        res.json({ message: "User updated successfully" });
    } catch (error: any) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.toString() });
    }
};

export const addUserToWorkspace = async (req: any, res: any) => {
  const role = await getEffectiveRole(req.userId);
  if (!ensureAdmin(req, res, role)) return;
  const { userId, workspaceId, workspaceRole } = req.body || {};
  if (!userId || !workspaceId) return res.status(400).json({ message: 'userId and workspaceId required' });
  try {
    await wsRepo.addMember(workspaceId, userId, workspaceRole || 'MEMBER');
    res.json({ message: 'Added to workspace' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const removeUserFromWorkspace = async (req: any, res: any) => {
  const role = await getEffectiveRole(req.userId);
  if (!ensureAdmin(req, res, role)) return;
  const { userId, workspaceId } = req.body || {};
  if (!userId || !workspaceId) return res.status(400).json({ message: 'userId and workspaceId required' });
  try {
    await wsRepo.removeMember(workspaceId, userId);
    res.json({ message: 'Removed from workspace' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const addUserToProject = async (req: any, res: any) => {
  const role = await getEffectiveRole(req.userId);
  if (!ensureAdmin(req, res, role)) return;
  const { userId, projectId, projectRole } = req.body || {};
  if (!userId || !projectId) return res.status(400).json({ message: 'userId and projectId required' });
  try {
    await prjRepo.addMember(projectId, userId, projectRole || 'MEMBER');
    res.json({ message: 'Added to project' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const removeUserFromProject = async (req: any, res: any) => {
  const role = await getEffectiveRole(req.userId);
  if (!ensureAdmin(req, res, role)) return;
  const { userId, projectId } = req.body || {};
  if (!userId || !projectId) return res.status(400).json({ message: 'userId and projectId required' });
  try {
    await prjRepo.removeMember(projectId, userId);
    res.json({ message: 'Removed from project' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};