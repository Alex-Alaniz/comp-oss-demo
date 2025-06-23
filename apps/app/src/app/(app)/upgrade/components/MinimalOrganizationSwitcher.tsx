'use client';

import { changeOrganizationAction } from '@/actions/change-organization';
import type { Organization } from '@comp/db/types';
import { Button } from '@comp/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@comp/ui/dropdown-menu';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';

interface MinimalOrganizationSwitcherProps {
  organizations: Organization[];
  currentOrganization: Organization | null;
}

export function MinimalOrganizationSwitcher({
  organizations,
  currentOrganization,
}: MinimalOrganizationSwitcherProps) {
  const router = useRouter();
  const { execute, status } = useAction(changeOrganizationAction, {
    onSuccess: (result) => {
      const orgId = result.data?.data?.id;
      if (orgId) {
        // Full page reload to ensure data is fresh
        window.location.href = `/${orgId}/`;
      }
    },
  });

  const handleOrgChange = (org: Organization) => {
    if (org.id !== currentOrganization?.id) {
      execute({ organizationId: org.id });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto p-1 text-sm font-medium"
          disabled={status === 'executing'}
        >
          {currentOrganization?.name || 'Select Organization'}
          {status === 'executing' ? (
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {organizations.map((org) => (
          <DropdownMenuItem key={org.id} onClick={() => handleOrgChange(org)}>
            <div className="flex items-center">
              {org.id === currentOrganization?.id && <Check className="mr-2 h-4 w-4" />}
              {org.name}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
