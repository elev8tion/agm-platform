# 29. Authorization & Role-Based Access Control (RBAC)

## Overview

This guide implements a comprehensive Role-Based Access Control (RBAC) system with fine-grained permissions for the Agentic Marketing Dashboard. Authorization controls what authenticated users can do based on their assigned roles.

**Production Considerations:**
- Hierarchical role system (Admin > Manager > User)
- Resource-level permissions (own, team, all)
- Dynamic permission checks in UI and API
- Audit logging for permission changes
- Role inheritance and composition

## Prerequisites

**Completed Phases:**
- Phase 6: Authentication (Document 28)

**Dependencies:**
```bash
# No additional packages required
# Uses Clerk metadata or custom database schema
```

## Role System Design

### Role Hierarchy

```
Super Admin
  └─> Can manage everything including other admins

Admin
  └─> Can manage all resources and users (except super admins)

Manager
  └─> Can manage team resources and team members

User
  └─> Can manage own resources only

Viewer
  └─> Read-only access to assigned resources
```

### Permission Categories

1. **Campaign Permissions**
   - `campaigns.create` - Create new campaigns
   - `campaigns.read.own` - View own campaigns
   - `campaigns.read.team` - View team campaigns
   - `campaigns.read.all` - View all campaigns
   - `campaigns.update.own` - Edit own campaigns
   - `campaigns.update.team` - Edit team campaigns
   - `campaigns.update.all` - Edit all campaigns
   - `campaigns.delete.own` - Delete own campaigns
   - `campaigns.delete.all` - Delete any campaign

2. **Content Permissions**
   - `content.create`
   - `content.read.own`
   - `content.read.team`
   - `content.read.all`
   - `content.update.own`
   - `content.update.team`
   - `content.publish` - Publish content
   - `content.approve` - Approve content for publishing

3. **Lead Permissions**
   - `leads.create`
   - `leads.read.own`
   - `leads.read.team`
   - `leads.read.all`
   - `leads.assign` - Assign leads to team members
   - `leads.export` - Export lead data

4. **User Management**
   - `users.read` - View user list
   - `users.create` - Invite new users
   - `users.update` - Edit user details
   - `users.delete` - Remove users
   - `users.roles.assign` - Assign roles to users

5. **Settings**
   - `settings.view` - View settings
   - `settings.update` - Modify settings
   - `billing.view` - View billing info
   - `billing.manage` - Manage subscriptions

## Database Schema

### PostgreSQL Schema (Supabase/Neon)

```sql
-- Roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  level INTEGER NOT NULL, -- 1=Viewer, 2=User, 3=Manager, 4=Admin, 5=SuperAdmin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permissions table
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  resource VARCHAR(50) NOT NULL, -- campaigns, content, leads, etc.
  action VARCHAR(50) NOT NULL, -- create, read, update, delete
  scope VARCHAR(20), -- own, team, all
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Role-Permission mapping (many-to-many)
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- User-Role mapping (many-to-many with organization context)
CREATE TABLE user_roles (
  user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  organization_id UUID, -- Optional: for multi-org support
  assigned_by VARCHAR(255),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

-- User teams for scoped permissions
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE team_members (
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_permissions_resource ON permissions(resource);

-- Insert default roles
INSERT INTO roles (name, description, level) VALUES
  ('super_admin', 'Full system access', 5),
  ('admin', 'Organization administrator', 4),
  ('manager', 'Team manager', 3),
  ('user', 'Standard user', 2),
  ('viewer', 'Read-only access', 1);

-- Insert default permissions
INSERT INTO permissions (name, resource, action, scope, description) VALUES
  -- Campaign permissions
  ('campaigns.create', 'campaigns', 'create', NULL, 'Create new campaigns'),
  ('campaigns.read.own', 'campaigns', 'read', 'own', 'View own campaigns'),
  ('campaigns.read.team', 'campaigns', 'read', 'team', 'View team campaigns'),
  ('campaigns.read.all', 'campaigns', 'read', 'all', 'View all campaigns'),
  ('campaigns.update.own', 'campaigns', 'update', 'own', 'Edit own campaigns'),
  ('campaigns.update.team', 'campaigns', 'update', 'team', 'Edit team campaigns'),
  ('campaigns.update.all', 'campaigns', 'update', 'all', 'Edit all campaigns'),
  ('campaigns.delete.own', 'campaigns', 'delete', 'own', 'Delete own campaigns'),
  ('campaigns.delete.all', 'campaigns', 'delete', 'all', 'Delete any campaign'),

  -- Content permissions
  ('content.create', 'content', 'create', NULL, 'Create content'),
  ('content.read.own', 'content', 'read', 'own', 'View own content'),
  ('content.read.all', 'content', 'read', 'all', 'View all content'),
  ('content.update.own', 'content', 'update', 'own', 'Edit own content'),
  ('content.publish', 'content', 'publish', NULL, 'Publish content'),
  ('content.approve', 'content', 'approve', NULL, 'Approve content'),

  -- User management permissions
  ('users.read', 'users', 'read', NULL, 'View users'),
  ('users.create', 'users', 'create', NULL, 'Invite users'),
  ('users.update', 'users', 'update', NULL, 'Edit users'),
  ('users.delete', 'users', 'delete', NULL, 'Remove users'),
  ('users.roles.assign', 'users', 'assign_roles', NULL, 'Assign roles'),

  -- Settings permissions
  ('settings.view', 'settings', 'read', NULL, 'View settings'),
  ('settings.update', 'settings', 'update', NULL, 'Modify settings'),
  ('billing.view', 'billing', 'read', NULL, 'View billing'),
  ('billing.manage', 'billing', 'manage', NULL, 'Manage billing');

-- Assign permissions to roles
-- Super Admin: all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'super_admin';

-- Admin: all except some user management
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin'
  AND p.name NOT LIKE '%super_admin%';

-- Manager: team-level and below
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'manager'
  AND (
    p.scope IN ('own', 'team')
    OR p.name IN ('users.read', 'settings.view')
  );

-- User: own resources only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'user'
  AND (
    p.scope = 'own'
    OR p.action = 'create'
  );

-- Viewer: read-only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'viewer'
  AND p.action = 'read';
```

## Frontend Permission System

### Step 1: Permission Types

**File: `agentic-crm-template/lib/rbac/types.ts`**

```typescript
export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
  VIEWER = 'viewer',
}

export enum Permission {
  // Campaigns
  CAMPAIGNS_CREATE = 'campaigns.create',
  CAMPAIGNS_READ_OWN = 'campaigns.read.own',
  CAMPAIGNS_READ_TEAM = 'campaigns.read.team',
  CAMPAIGNS_READ_ALL = 'campaigns.read.all',
  CAMPAIGNS_UPDATE_OWN = 'campaigns.update.own',
  CAMPAIGNS_UPDATE_TEAM = 'campaigns.update.team',
  CAMPAIGNS_UPDATE_ALL = 'campaigns.update.all',
  CAMPAIGNS_DELETE_OWN = 'campaigns.delete.own',
  CAMPAIGNS_DELETE_ALL = 'campaigns.delete.all',

  // Content
  CONTENT_CREATE = 'content.create',
  CONTENT_READ_OWN = 'content.read.own',
  CONTENT_READ_ALL = 'content.read.all',
  CONTENT_UPDATE_OWN = 'content.update.own',
  CONTENT_PUBLISH = 'content.publish',
  CONTENT_APPROVE = 'content.approve',

  // Users
  USERS_READ = 'users.read',
  USERS_CREATE = 'users.create',
  USERS_UPDATE = 'users.update',
  USERS_DELETE = 'users.delete',
  USERS_ROLES_ASSIGN = 'users.roles.assign',

  // Settings
  SETTINGS_VIEW = 'settings.view',
  SETTINGS_UPDATE = 'settings.update',
  BILLING_VIEW = 'billing.view',
  BILLING_MANAGE = 'billing.manage',
}

export interface UserPermissions {
  userId: string;
  roles: Role[];
  permissions: Permission[];
  teamIds: string[];
}

export interface PermissionCheckContext {
  userId: string;
  resourceOwnerId?: string;
  resourceTeamId?: string;
}
```

### Step 2: Permission Service

**File: `agentic-crm-template/lib/rbac/permissions.ts`**

```typescript
import { Permission, Role, UserPermissions, PermissionCheckContext } from './types';

// Role hierarchy levels (higher number = more permissions)
const ROLE_LEVELS: Record<Role, number> = {
  [Role.SUPER_ADMIN]: 5,
  [Role.ADMIN]: 4,
  [Role.MANAGER]: 3,
  [Role.USER]: 2,
  [Role.VIEWER]: 1,
};

export class PermissionService {
  /**
   * Check if user has a specific permission
   */
  static hasPermission(
    userPermissions: UserPermissions,
    permission: Permission,
    context?: PermissionCheckContext
  ): boolean {
    // Super admins have all permissions
    if (userPermissions.roles.includes(Role.SUPER_ADMIN)) {
      return true;
    }

    // Check if permission exists in user's permission set
    if (!userPermissions.permissions.includes(permission)) {
      return false;
    }

    // For scoped permissions, check ownership/team membership
    if (context) {
      return this.checkScope(permission, userPermissions, context);
    }

    return true;
  }

  /**
   * Check scope-based permissions (own, team, all)
   */
  private static checkScope(
    permission: Permission,
    userPermissions: UserPermissions,
    context: PermissionCheckContext
  ): boolean {
    const permissionStr = permission.toString();

    // Check if it's an "own" scoped permission
    if (permissionStr.includes('.own')) {
      return context.resourceOwnerId === context.userId;
    }

    // Check if it's a "team" scoped permission
    if (permissionStr.includes('.team')) {
      if (!context.resourceTeamId) return false;
      return userPermissions.teamIds.includes(context.resourceTeamId);
    }

    // "all" scope or no scope means permission already granted
    return true;
  }

  /**
   * Check if user has any of the specified permissions
   */
  static hasAnyPermission(
    userPermissions: UserPermissions,
    permissions: Permission[],
    context?: PermissionCheckContext
  ): boolean {
    return permissions.some(permission =>
      this.hasPermission(userPermissions, permission, context)
    );
  }

  /**
   * Check if user has all of the specified permissions
   */
  static hasAllPermissions(
    userPermissions: UserPermissions,
    permissions: Permission[],
    context?: PermissionCheckContext
  ): boolean {
    return permissions.every(permission =>
      this.hasPermission(userPermissions, permission, context)
    );
  }

  /**
   * Check if user has a specific role
   */
  static hasRole(userPermissions: UserPermissions, role: Role): boolean {
    return userPermissions.roles.includes(role);
  }

  /**
   * Check if user has minimum role level
   */
  static hasMinimumRole(userPermissions: UserPermissions, minimumRole: Role): boolean {
    const userHighestLevel = Math.max(
      ...userPermissions.roles.map(role => ROLE_LEVELS[role] || 0)
    );
    return userHighestLevel >= ROLE_LEVELS[minimumRole];
  }

  /**
   * Get effective permissions for a user (from database)
   */
  static async getUserPermissions(userId: string): Promise<UserPermissions> {
    const response = await fetch(`/api/rbac/user-permissions?userId=${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user permissions');
    }
    return response.json();
  }
}
```

### Step 3: Permission Hook

**File: `agentic-crm-template/hooks/usePermissions.ts`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Permission, Role, UserPermissions } from '@/lib/rbac/types';
import { PermissionService } from '@/lib/rbac/permissions';

export function usePermissions() {
  const { user } = useUser();
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPermissions(null);
      setLoading(false);
      return;
    }

    const loadPermissions = async () => {
      try {
        const userPerms = await PermissionService.getUserPermissions(user.id);
        setPermissions(userPerms);
      } catch (error) {
        console.error('Failed to load permissions:', error);
        setPermissions(null);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [user]);

  const hasPermission = (permission: Permission, context?: any) => {
    if (!permissions) return false;
    return PermissionService.hasPermission(permissions, permission, context);
  };

  const hasRole = (role: Role) => {
    if (!permissions) return false;
    return PermissionService.hasRole(permissions, role);
  };

  const hasMinimumRole = (minimumRole: Role) => {
    if (!permissions) return false;
    return PermissionService.hasMinimumRole(permissions, minimumRole);
  };

  return {
    permissions,
    loading,
    hasPermission,
    hasRole,
    hasMinimumRole,
    isAdmin: hasMinimumRole(Role.ADMIN),
    isManager: hasMinimumRole(Role.MANAGER),
  };
}
```

### Step 4: Permission-Based UI Components

**File: `agentic-crm-template/components/rbac/Can.tsx`**

```typescript
'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { Permission, Role } from '@/lib/rbac/types';

interface CanProps {
  permission?: Permission;
  permissions?: Permission[];
  role?: Role;
  minimumRole?: Role;
  requireAll?: boolean;
  context?: any;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Conditionally render children based on permissions
 *
 * Usage:
 * <Can permission={Permission.CAMPAIGNS_CREATE}>
 *   <CreateCampaignButton />
 * </Can>
 */
export function Can({
  permission,
  permissions,
  role,
  minimumRole,
  requireAll = false,
  context,
  fallback = null,
  children,
}: CanProps) {
  const { hasPermission, hasRole, hasMinimumRole, loading } = usePermissions();

  if (loading) {
    return null; // Or loading spinner
  }

  // Check single permission
  if (permission && !hasPermission(permission, context)) {
    return <>{fallback}</>;
  }

  // Check multiple permissions
  if (permissions) {
    const check = requireAll
      ? permissions.every(p => hasPermission(p, context))
      : permissions.some(p => hasPermission(p, context));

    if (!check) {
      return <>{fallback}</>;
    }
  }

  // Check role
  if (role && !hasRole(role)) {
    return <>{fallback}</>;
  }

  // Check minimum role
  if (minimumRole && !hasMinimumRole(minimumRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

**Usage Example:**

```typescript
import { Can } from '@/components/rbac/Can';
import { Permission } from '@/lib/rbac/types';

export function CampaignActions({ campaign }) {
  return (
    <div className="flex gap-2">
      {/* Show edit button only if user can edit this campaign */}
      <Can
        permission={Permission.CAMPAIGNS_UPDATE_OWN}
        context={{ userId: currentUser.id, resourceOwnerId: campaign.userId }}
      >
        <EditButton campaign={campaign} />
      </Can>

      {/* Show delete button only for admins */}
      <Can permission={Permission.CAMPAIGNS_DELETE_ALL}>
        <DeleteButton campaign={campaign} />
      </Can>
    </div>
  );
}
```

## Backend Permission Enforcement

### Step 1: RBAC Service

**File: `market-ai/services/rbac_service.py`**

```python
from typing import List, Optional, Dict
from enum import Enum
import asyncpg
from fastapi import HTTPException, status

class Role(str, Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"
    VIEWER = "viewer"

class Permission(str, Enum):
    # Campaigns
    CAMPAIGNS_CREATE = "campaigns.create"
    CAMPAIGNS_READ_OWN = "campaigns.read.own"
    CAMPAIGNS_READ_TEAM = "campaigns.read.team"
    CAMPAIGNS_READ_ALL = "campaigns.read.all"
    CAMPAIGNS_UPDATE_OWN = "campaigns.update.own"
    CAMPAIGNS_UPDATE_ALL = "campaigns.update.all"
    CAMPAIGNS_DELETE_ALL = "campaigns.delete.all"

    # Add others...

class RBACService:
    def __init__(self, db_pool: asyncpg.Pool):
        self.db = db_pool

    async def get_user_permissions(self, user_id: str) -> Dict:
        """Get all permissions and roles for a user"""
        async with self.db.acquire() as conn:
            # Get roles
            roles = await conn.fetch("""
                SELECT r.name, r.level
                FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = $1
            """, user_id)

            # Get permissions
            permissions = await conn.fetch("""
                SELECT DISTINCT p.name
                FROM user_roles ur
                JOIN role_permissions rp ON ur.role_id = rp.role_id
                JOIN permissions p ON rp.permission_id = p.id
                WHERE ur.user_id = $1
            """, user_id)

            # Get teams
            teams = await conn.fetch("""
                SELECT team_id
                FROM team_members
                WHERE user_id = $1
            """, user_id)

            return {
                "user_id": user_id,
                "roles": [r["name"] for r in roles],
                "permissions": [p["name"] for p in permissions],
                "team_ids": [str(t["team_id"]) for t in teams],
            }

    async def has_permission(
        self,
        user_id: str,
        permission: Permission,
        resource_owner_id: Optional[str] = None,
        resource_team_id: Optional[str] = None
    ) -> bool:
        """Check if user has a specific permission"""
        user_perms = await self.get_user_permissions(user_id)

        # Super admin has all permissions
        if Role.SUPER_ADMIN in user_perms["roles"]:
            return True

        # Check if permission exists
        if permission.value not in user_perms["permissions"]:
            return False

        # Check scope
        perm_str = permission.value

        if ".own" in perm_str:
            return resource_owner_id == user_id

        if ".team" in perm_str:
            return resource_team_id in user_perms["team_ids"]

        # No scope restriction or ".all" scope
        return True

    async def require_permission(
        self,
        user_id: str,
        permission: Permission,
        resource_owner_id: Optional[str] = None,
        resource_team_id: Optional[str] = None
    ):
        """Raise exception if user doesn't have permission"""
        has_perm = await self.has_permission(
            user_id, permission, resource_owner_id, resource_team_id
        )

        if not has_perm:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission.value}"
            )

    async def assign_role(self, user_id: str, role: Role, assigned_by: str):
        """Assign a role to a user"""
        async with self.db.acquire() as conn:
            role_id = await conn.fetchval(
                "SELECT id FROM roles WHERE name = $1",
                role.value
            )

            if not role_id:
                raise ValueError(f"Role not found: {role}")

            await conn.execute("""
                INSERT INTO user_roles (user_id, role_id, assigned_by)
                VALUES ($1, $2, $3)
                ON CONFLICT (user_id, role_id) DO NOTHING
            """, user_id, role_id, assigned_by)
```

### Step 2: Permission Middleware

**File: `market-ai/middleware/rbac.py`**

```python
from fastapi import Depends, HTTPException, status
from middleware.auth import get_current_user
from services.rbac_service import RBACService, Permission
from typing import Optional
import os

# Database connection (initialize in main.py)
rbac_service: Optional[RBACService] = None

def require_permission(
    permission: Permission,
    resource_owner_id: Optional[str] = None,
    resource_team_id: Optional[str] = None
):
    """
    Dependency to require a specific permission

    Usage:
    @router.delete("/campaigns/{id}")
    async def delete_campaign(
        id: str,
        _: None = Depends(require_permission(Permission.CAMPAIGNS_DELETE_ALL))
    ):
        ...
    """
    async def permission_checker(
        current_user: dict = Depends(get_current_user)
    ):
        if rbac_service is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="RBAC service not initialized"
            )

        await rbac_service.require_permission(
            user_id=current_user["user_id"],
            permission=permission,
            resource_owner_id=resource_owner_id,
            resource_team_id=resource_team_id
        )

    return permission_checker
```

### Step 3: Protected API Endpoint Example

**File: `market-ai/api/routes/campaigns.py`**

```python
from fastapi import APIRouter, Depends, HTTPException
from middleware.auth import get_current_user
from middleware.rbac import require_permission
from services.rbac_service import Permission

router = APIRouter()

@router.post("/campaigns")
async def create_campaign(
    campaign_data: dict,
    current_user: dict = Depends(get_current_user),
    _: None = Depends(require_permission(Permission.CAMPAIGNS_CREATE))
):
    """Create a new campaign (requires campaigns.create permission)"""
    # Permission already checked by dependency
    campaign = await create_campaign_in_db(campaign_data, current_user["user_id"])
    return campaign

@router.get("/campaigns")
async def get_campaigns(
    current_user: dict = Depends(get_current_user)
):
    """Get campaigns based on user's permissions"""
    user_perms = await rbac_service.get_user_permissions(current_user["user_id"])

    # Determine scope based on permissions
    if Permission.CAMPAIGNS_READ_ALL.value in user_perms["permissions"]:
        campaigns = await get_all_campaigns()
    elif Permission.CAMPAIGNS_READ_TEAM.value in user_perms["permissions"]:
        campaigns = await get_team_campaigns(user_perms["team_ids"])
    elif Permission.CAMPAIGNS_READ_OWN.value in user_perms["permissions"]:
        campaigns = await get_user_campaigns(current_user["user_id"])
    else:
        raise HTTPException(status_code=403, detail="No permission to read campaigns")

    return campaigns

@router.delete("/campaigns/{campaign_id}")
async def delete_campaign(
    campaign_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a campaign (permission checked dynamically based on ownership)"""
    # Get campaign to check ownership
    campaign = await get_campaign_by_id(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Check permission with context
    has_delete_all = await rbac_service.has_permission(
        current_user["user_id"],
        Permission.CAMPAIGNS_DELETE_ALL
    )

    has_delete_own = await rbac_service.has_permission(
        current_user["user_id"],
        Permission.CAMPAIGNS_DELETE_OWN,
        resource_owner_id=campaign["user_id"]
    )

    if not (has_delete_all or has_delete_own):
        raise HTTPException(status_code=403, detail="Permission denied")

    await delete_campaign_from_db(campaign_id)
    return {"message": "Campaign deleted"}
```

## API Endpoints for RBAC Management

**File: `market-ai/api/routes/rbac.py`**

```python
from fastapi import APIRouter, Depends, HTTPException
from middleware.auth import get_current_user
from middleware.rbac import require_permission
from services.rbac_service import Permission, Role, RBACService

router = APIRouter()

@router.get("/rbac/user-permissions")
async def get_user_permissions(
    userId: str,
    current_user: dict = Depends(get_current_user)
):
    """Get permissions for a user (can only query self unless admin)"""
    # Allow users to query their own permissions
    if userId != current_user["user_id"]:
        # Require admin permission to query other users
        await rbac_service.require_permission(
            current_user["user_id"],
            Permission.USERS_READ
        )

    permissions = await rbac_service.get_user_permissions(userId)
    return permissions

@router.post("/rbac/assign-role")
async def assign_role(
    user_id: str,
    role: Role,
    current_user: dict = Depends(get_current_user),
    _: None = Depends(require_permission(Permission.USERS_ROLES_ASSIGN))
):
    """Assign a role to a user (requires users.roles.assign permission)"""
    await rbac_service.assign_role(
        user_id=user_id,
        role=role,
        assigned_by=current_user["user_id"]
    )

    return {"message": f"Role {role} assigned to user {user_id}"}

@router.get("/rbac/roles")
async def list_roles(
    current_user: dict = Depends(get_current_user),
    _: None = Depends(require_permission(Permission.USERS_READ))
):
    """List all available roles"""
    async with rbac_service.db.acquire() as conn:
        roles = await conn.fetch("SELECT * FROM roles ORDER BY level DESC")

    return [dict(role) for role in roles]

@router.get("/rbac/permissions")
async def list_permissions(
    current_user: dict = Depends(get_current_user),
    _: None = Depends(require_permission(Permission.USERS_READ))
):
    """List all available permissions"""
    async with rbac_service.db.acquire() as conn:
        permissions = await conn.fetch("""
            SELECT * FROM permissions
            ORDER BY resource, action, scope
        """)

    return [dict(perm) for perm in permissions]
```

## Testing Procedures

### 1. Permission Testing

**File: `agentic-crm-template/__tests__/rbac/permissions.test.ts`**

```typescript
import { PermissionService } from '@/lib/rbac/permissions';
import { Permission, Role, UserPermissions } from '@/lib/rbac/types';

describe('PermissionService', () => {
  const adminPerms: UserPermissions = {
    userId: 'user-1',
    roles: [Role.ADMIN],
    permissions: [
      Permission.CAMPAIGNS_CREATE,
      Permission.CAMPAIGNS_READ_ALL,
      Permission.CAMPAIGNS_UPDATE_ALL,
      Permission.CAMPAIGNS_DELETE_ALL,
    ],
    teamIds: [],
  };

  const userPerms: UserPermissions = {
    userId: 'user-2',
    roles: [Role.USER],
    permissions: [
      Permission.CAMPAIGNS_CREATE,
      Permission.CAMPAIGNS_READ_OWN,
      Permission.CAMPAIGNS_UPDATE_OWN,
    ],
    teamIds: ['team-1'],
  };

  it('should grant admin all permissions', () => {
    expect(
      PermissionService.hasPermission(adminPerms, Permission.CAMPAIGNS_DELETE_ALL)
    ).toBe(true);
  });

  it('should restrict user to own resources', () => {
    const context = { userId: 'user-2', resourceOwnerId: 'user-2' };
    expect(
      PermissionService.hasPermission(userPerms, Permission.CAMPAIGNS_UPDATE_OWN, context)
    ).toBe(true);

    const otherContext = { userId: 'user-2', resourceOwnerId: 'user-3' };
    expect(
      PermissionService.hasPermission(userPerms, Permission.CAMPAIGNS_UPDATE_OWN, otherContext)
    ).toBe(false);
  });

  it('should check role hierarchy', () => {
    expect(PermissionService.hasMinimumRole(adminPerms, Role.USER)).toBe(true);
    expect(PermissionService.hasMinimumRole(userPerms, Role.ADMIN)).toBe(false);
  });
});
```

## Troubleshooting

### Common Issues

1. **"Permission denied" despite having the role**
   - Check role-permission mapping in database
   - Verify permission name matches exactly
   - Clear permission cache if implemented

2. **User can't access own resources**
   - Check context.resourceOwnerId matches userId
   - Verify ".own" scoped permission exists in user's permissions

3. **Team permissions not working**
   - Confirm user is member of team (team_members table)
   - Check resourceTeamId is being passed in context

4. **Permission changes not taking effect**
   - Clear user session and re-login
   - Verify database triggers update permissions
   - Check caching layer

## Best Practices

### Security

1. **Always check permissions on the backend** - Frontend checks are for UX only
2. **Use least privilege principle** - Grant minimum permissions needed
3. **Audit permission changes** - Log who granted/revoked permissions
4. **Regular permission reviews** - Quarterly audit of user roles
5. **Separate admin roles** - Don't give everyone admin access

### Performance

1. **Cache user permissions** - Store in session or Redis
2. **Batch permission checks** - Single query for multiple resources
3. **Index database tables** - user_roles, role_permissions, team_members
4. **Lazy load permissions** - Only fetch when needed

### User Experience

1. **Hide disabled actions** - Don't show buttons users can't use
2. **Provide clear error messages** - "You need Manager role to perform this action"
3. **Show permission requirements** - "This feature requires: campaigns.create"
4. **Request access flow** - Allow users to request elevated permissions

## Monitoring & Alerts

### Metrics to Track

1. **Permission denial rate** - High rate may indicate UX issues
2. **Role distribution** - Monitor how many users have each role
3. **Permission usage** - Which permissions are actually used
4. **Access attempts** - Track unauthorized access attempts

### Audit Logging

```python
# Log permission checks
import logging

logger = logging.getLogger("rbac")

async def has_permission(...):
    result = # permission check logic

    logger.info(
        f"Permission check: user={user_id}, permission={permission}, "
        f"granted={result}, context={context}"
    )

    return result
```

## Next Steps

1. **Implement Audit Logging** - Track all permission-related actions
2. **Add Permission Request Workflow** - Users can request elevated access
3. **Create Admin Dashboard** - Manage roles and permissions visually
4. **Implement Dynamic Permissions** - Resource-specific permissions
5. **Add Permission Groups** - Combine permissions into logical groups
6. **Multi-Organization Support** - Scope permissions by organization

---

**Production Checklist:**
- [ ] Database schema deployed
- [ ] Default roles and permissions seeded
- [ ] Permission checks on all API endpoints
- [ ] Frontend permission components implemented
- [ ] usePermissions hook tested
- [ ] Admin role assigned to initial user
- [ ] Permission caching configured
- [ ] Audit logging enabled
- [ ] Error messages user-friendly
- [ ] Documentation for users about roles
