"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import API_BASE_URL from "@/lib/api-config";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`${API_BASE_URL}/auth/password-reset/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        setIsSuccess(true);
        toast({
          title: "Success",
          description: "Password reset instructions have been sent to your email",
        });
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.detail || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0f172a] text-white">
      <Header />
      
      <main className="container mx-auto flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8 rounded-xl bg-[#1e293b] p-8 shadow-lg">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#a855f7]">Reset Password</h1>
            <p className="mt-2 text-gray-400">
              Enter your email address and we'll send you instructions to reset your password
            </p>
          </div>
          
          {isSuccess ? (
            <div className="space-y-6">
              <div className="rounded-md bg-green-900/20 p-4">
                <p className="text-center text-green-400">
                  Check your email for password reset instructions
                </p>
              </div>
              <div className="text-center">
                <Link href="/login" className="text-[#a855f7] hover:underline">
                  Return to login
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-[#334155] bg-[#0f172a] text-white focus-visible:ring-[#a855f7]"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-[#a855f7] hover:bg-[#9333ea]"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Reset Instructions"}
              </Button>
              
              <div className="text-center">
                <Link href="/login" className="text-[#a855f7] hover:underline">
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}