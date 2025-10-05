"use client";

import { Car } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
}

export function AppHeader({ 
  title = "SpokeHire", 
  subtitle = "Admin Dashboard" 
}: AppHeaderProps) {
  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Car className="h-6 w-6" />
              {title}
            </h1>
          </div>
          {subtitle && (
            <div className="hidden sm:block">
              <span className="text-sm text-muted-foreground">{subtitle}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
