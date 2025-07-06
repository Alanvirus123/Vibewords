
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Schema for the user details form
const detailsSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  phone: z.string().min(10, { message: "Please enter a valid phone number." }).regex(/^\+?[0-9\s-()]+$/, { message: "Invalid phone number format." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  otpMethod: z.enum(["email", "phone"], { required_error: "Please select an OTP method." }),
});

type DetailsFormValues = z.infer<typeof detailsSchema>;

// Mock OTP for prototype
const MOCK_OTP = "123456";

export default function LoginForm() {
  const [formStep, setFormStep] = useState<'details' | 'otp'>('details');
  const [userDetails, setUserDetails] = useState<DetailsFormValues | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const detailsForm = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      otpMethod: "email",
    },
  });

  // Handle submission of the details form to "send" the OTP
  const handleSendOtp = (data: DetailsFormValues) => {
    setUserDetails(data);
    setFormStep('otp');
    toast({
      title: "OTP Sent!",
      description: `For this prototype, your OTP is: ${MOCK_OTP}`,
      duration: 9000,
    });
  };

  // Handle verification of the OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput === MOCK_OTP) {
      if (userDetails) {
        localStorage.setItem('caption-wise-user', JSON.stringify(userDetails));
        toast({ title: "Success!", description: "You have been logged in." });
        router.push('/');
      }
    } else {
      toast({
        variant: "destructive",
        title: "Invalid OTP",
        description: "The OTP you entered is incorrect. Please try again.",
      });
    }
  };

  return (
    <Card className="w-full max-w-sm shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="text-2xl text-center text-[hsl(var(--app-title))]">Welcome to VibeWords</CardTitle>
        <CardDescription className="text-center">
          {formStep === 'details'
            ? "Please enter your details to continue."
            : `Enter the OTP sent to your ${userDetails?.otpMethod}.`}
        </CardDescription>
      </CardHeader>

      {formStep === 'details' ? (
        <Form {...detailsForm}>
          <form onSubmit={detailsForm.handleSubmit(handleSendOtp)}>
            <CardContent className="grid gap-4">
              <FormField
                control={detailsForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={detailsForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 123-456-7890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={detailsForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={detailsForm.control}
                name="otpMethod"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Send OTP via</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="email" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">Email</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="phone" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">Phone</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button className="w-full" type="submit">Send OTP</Button>
            </CardFooter>
          </form>
        </Form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="otp">One-Time Password</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                placeholder="Enter 6-digit OTP"
                required
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                maxLength={6}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit">Verify & Continue</Button>
            <Button variant="outline" className="w-full" onClick={() => setFormStep('details')}>Go Back</Button>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
