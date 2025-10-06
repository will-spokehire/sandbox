'use client';

import Link from 'next/link';
import { Car, Users, Settings } from 'lucide-react';
import { useRequireAdmin } from '~/providers/auth-provider';
import { UserMenu } from '~/components/auth/UserMenu';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';

/**
 * Admin Dashboard
 * 
 * Protected admin page. Requires authentication and admin role.
 */
export default function AdminDashboard() {
  const { user, isLoading } = useRequireAdmin();

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                SpokeHire Admin
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Vehicle Management Portal
              </p>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
            Welcome back, {user.firstName || user.email}!
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            You're signed in as an administrator.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>
                    Manage user accounts
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Coming soon...
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <CardTitle>Settings</CardTitle>
                  <CardDescription>
                    Configure system settings
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Coming soon...
              </p>
            </CardContent>
          </Card>
        </div>

        {/* User Info Card */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Your Account</CardTitle>
            <CardDescription>Current session information</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="font-medium text-slate-700 dark:text-slate-300">Email</dt>
                <dd className="text-slate-600 dark:text-slate-400">{user.email}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-700 dark:text-slate-300">Name</dt>
                <dd className="text-slate-600 dark:text-slate-400">
                  {user.firstName} {user.lastName}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-700 dark:text-slate-300">User Type</dt>
                <dd className="text-slate-600 dark:text-slate-400">
                  <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-200">
                    {user.userType}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-700 dark:text-slate-300">Status</dt>
                <dd className="text-slate-600 dark:text-slate-400">
                  <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-200">
                    {user.status}
                  </span>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

