
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CaptionWiseClient from "@/components/caption-wise-client";
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This effect should only run on the client side
    try {
      const user = localStorage.getItem('caption-wise-user');
      if (user) {
        setIsAuthenticated(true);
      } else {
        router.replace('/login');
      }
    } catch (error) {
      console.error("Could not access localStorage:", error);
      router.replace('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <CaptionWiseClient />;
  }

  // Return null while redirecting to prevent flashing content
  return null;
}
