'use client';

import Link from 'next/link';
import { Car, Mail } from 'lucide-react';
import { useRequireAdmin } from '~/providers/auth-provider';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { PageHeader } from '~/app/_components/ui';

/**
 * Admin Dashboard
 * 
 * Protected admin page. Requires authentication and admin role.
 */
export default function AdminDashboard() {
  const { user, isLoading } = useRequireAdmin();

  if (isLoading || !user) {
    return null; // Layout handles loading state
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user.firstName || user.email}!`}
        description="Manage your vehicle listings and deals."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Car className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Vehicles</CardTitle>
                <CardDescription>
                  Manage vehicle listings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              View, search, and manage all vehicles in the system.
            </p>
            <Button asChild className="w-full">
              <Link href="/admin/vehicles?status=PUBLISHED">
                View Vehicles
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle>Deals</CardTitle>
                <CardDescription>
                  Manage job offers
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Send vehicle deals to users via email.
            </p>
            <Button asChild className="w-full">
              <Link href="/admin/deals">
                View Deals
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

