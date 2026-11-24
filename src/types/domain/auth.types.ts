export interface User {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
}

export interface Permission {
  id: string;
  name: string;
  description?: string | null;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  action: string;
  module: string;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}
