/**
 * Clipboard Hook
 * 
 * Provides a reusable clipboard copy function with toast notifications
 */

import { toast } from "sonner";

export function useClipboard() {
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
      return true;
    } catch {
      toast.error(`Failed to copy ${label}`);
      return false;
    }
  };

  return { copyToClipboard };
}

