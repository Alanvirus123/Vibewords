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
import { Loader2, LogIn, UserPlus, Ghost, Sparkles, ShieldCheck } from "lucide-react";
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
          description: error.message || "Invalid credentials." 
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
        await updateProfile(cred.user, { displayName });
        const db = getFirestore();
        const userRef = doc(db, "users", cred.user.uid);
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
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden px-4 md:px-8">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />

      <div className="w-full max-w-md space-y-8 z-10">
        <div className="text-center space-y-2 overflow-hidden">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-4 animate-logo-reveal animate-subtle-pulse">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground animate-tracking-in-expand">
            VibeWords
          </h1>
          <p className="text-muted-foreground text-sm animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-500 fill-mode-both">
            AI-powered content engine for modern creators.
          </p>
        </div>

        <Card className="border-border/50 shadow-2xl bg-card/50 backdrop-blur-sm animate-in zoom-in-95 duration-700 delay-300 fill-mode-both">
          <Tabs defaultValue="login" className="w-full">
            <div className="px-6 pt-6">
              <TabsList className="grid w-full grid-cols-2 h-11">
                <TabsTrigger value="login" className="text-sm">Log In</TabsTrigger>
                <TabsTrigger value="signup" className="text-sm">Sign Up</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="login" className="mt-0">
              <form onSubmit={handleSignIn}>
                <CardHeader>
                  <CardTitle className="text-xl">Authentication</CardTitle>
                  <CardDescription>Enter your credentials to access your Vibespace.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                </CardContent>
                <CardFooter className="flex-col gap-4">
                  <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                    Continue to Vibespace
                  </Button>
                  <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or</span></div>
                  </div>
                  <Button type="button" variant="outline" className="w-full h-11" onClick={handleGuestLogin} disabled={isSubmitting}>
                    <Ghost className="mr-2 h-4 w-4" /> Start as Guest
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-0">
              <form onSubmit={handleSignUp}>
                <CardHeader>
                  <CardTitle className="text-xl">Create Vibespace</CardTitle>
                  <CardDescription>Get started with your AI content strategy.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input id="signup-name" placeholder="John Doe" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Work Email</Label>
                    <Input id="signup-email" type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                    Complete Registration
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
        
        <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1 animate-in fade-in duration-1000 delay-1000 fill-mode-both">
          <ShieldCheck className="h-3 w-3" />
          Secure Enterprise Authentication
        </p>
      </div>
    </div>
  );
}
