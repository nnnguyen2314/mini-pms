import { User } from '../entities/user';
import * as pgRepo from './user.repository.postgres';

export const fetchUserData = async (userId: string): Promise<User | null> => {
  return pgRepo.fetchUserData(userId);
};

export const updateUserData = async (userId: string, data: Partial<User>): Promise<void> => {
  return pgRepo.updateUserData(userId, data);
};