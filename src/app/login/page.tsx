"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth, useUser } from "@/firebase";
import { initiateEmailSignIn, initiateEmailSignUp, initiateAnonymousSignIn } from "@/firebase/non-blocking-login";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn, UserPlus, Ghost, Sparkles } from "lucide-react";
import { doc, setDoc, getFirestore } from "firebase/firestore";
import { updateProfile } from "firebase/auth";

export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/");
    }
  }, [user, isUserLoading, router]);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    
    initiateEmailSignIn(auth, email, password)
      .catch((error: any) => {
        toast({ 
          variant: "destructive", 
          title: "Login Failed", 
          description: error.message || "Invalid credentials. Please check your email and password." 
        });
        setIsSubmitting(false);
      });
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName) return;
    setIsSubmitting(true);
    
    initiateEmailSignUp(auth, email, password)
      .then(async (cred) => {
        // 1. Update the Auth profile with the display name
        await updateProfile(cred.user, { displayName });
        
        // 2. Create the UserProfile document in Firestore
        const db = getFirestore();
        const userRef = doc(db, "users", cred.user.uid);
        // We don't await this mutation to maintain the non-blocking UX,
        // but we initiate it immediately.
        setDoc(userRef, {
          id: cred.user.uid,
          displayName: displayName,
          email: email,
          preferredTheme: "system",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      })
      .catch((error: any) => {
        toast({ 
          variant: "destructive", 
          title: "Signup Failed", 
          description: error.message || "Could not create account." 
        });
        setIsSubmitting(false);
      });
  };

  const handleGuestLogin = () => {
    setIsSubmitting(true);
    initiateAnonymousSignIn(auth).catch((error: any) => {
      toast({ variant: "destructive", title: "Guest Login Failed", description: error.message });
      setIsSubmitting(false);
    });
  };

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 md:p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[hsl(var(--app-title))] tracking-tight flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8" />
            VibeWords
          </h1>
          <p className="mt-2 text-muted-foreground">Smart captions for your social media vibes.</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card>
              <form onSubmit={handleSignIn}>
                <CardHeader>
                  <CardHeader>
                    <CardTitle>Welcome Back</CardTitle>
                    <CardDescription>Enter your credentials to access your workspace.</CardDescription>
                  </CardHeader>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                </CardContent>
                <CardFooter className="flex-col gap-3">
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                    Sign In
                  </Button>
                  <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
                  </div>
                  <Button type="button" variant="outline" className="w-full" onClick={handleGuestLogin} disabled={isSubmitting}>
                    <Ghost className="mr-2 h-4 w-4" /> Guest Mode
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <form onSubmit={handleSignUp}>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>Join our community of creators today.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Display Name</Label>
                    <Input id="signup-name" placeholder="John Doe" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                    Create Account
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
