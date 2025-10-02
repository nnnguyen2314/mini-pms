export enum UserStatus {
    Inactive = 0,
    Active = 1,
    Disable = 2,
    Reactivated = 3,
}

export interface User {
    id: string;
    name: string;
    email: string;
    status: UserStatus;
    createdAt?: string; // ISO
    updatedAt?: string; // ISO
}