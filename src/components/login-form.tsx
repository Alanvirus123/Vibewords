
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginForm() {
  const [name, setName] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      localStorage.setItem('caption-wise-user', JSON.stringify({ name: name.trim() }));
      router.push('/');
    }
  };

  return (
    <Card className="w-full max-w-sm shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="text-2xl text-center text-[hsl(var(--app-title))]">Welcome to VibeWords</CardTitle>
        <CardDescription className="text-center">Please enter your name to continue.</CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" type="submit">Continue</Button>
        </CardFooter>
      </form>
    </Card>
  );
}
