'use client';

import Link from 'next/link';
import { Car, Mail, Factory, CarFront } from 'lucide-react';
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
        title={`Welcome back, ${user.firstName ?? user.email}!`}
        description="Manage your vehicle listings and deals."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Car className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Vehicles</CardTitle>
                <CardDescription className="text-xs">
                  Manage listings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild size="sm" className="w-full">
              <Link href="/admin/vehicles?status=PUBLISHED">
                View Vehicles
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-base">Deals</CardTitle>
                <CardDescription className="text-xs">
                  Manage offers
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild size="sm" className="w-full">
              <Link href="/admin/deals">
                View Deals
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Factory className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-base">Makes</CardTitle>
                <CardDescription className="text-xs">
                  Manage brands
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild size="sm" className="w-full">
              <Link href="/admin/makes">
                View Makes
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <CarFront className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-base">Models</CardTitle>
                <CardDescription className="text-xs">
                  Manage models
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild size="sm" className="w-full">
              <Link href="/admin/models">
                View Models
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

