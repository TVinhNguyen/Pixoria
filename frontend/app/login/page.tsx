import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export default function Login() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0f172a] text-white">
      <header className="container mx-auto flex h-16 items-center px-4">
        <Link href="/" className="text-2xl font-bold text-[#a855f7]">
          ModernPexels
        </Link>
      </header>
      <main className="container mx-auto flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8 rounded-xl bg-[#1e293b] p-8 shadow-lg">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#a855f7]">Welcome back</h1>
            <p className="mt-2 text-gray-400">Log in to your account to continue</p>
          </div>
          <form className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  className="border-[#334155] bg-[#0f172a] text-white focus-visible:ring-[#a855f7]"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-sm text-[#a855f7] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  className="border-[#334155] bg-[#0f172a] text-white focus-visible:ring-[#a855f7]"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  className="border-[#334155] data-[state=checked]:bg-[#a855f7] data-[state=checked]:text-white"
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me
                </label>
              </div>
            </div>
            <Button type="submit" className="w-full bg-[#a855f7] hover:bg-[#9333ea]">
              Log in
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#334155]"></span>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#1e293b] px-2 text-gray-400">Or continue with</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="border-[#334155] bg-[#0f172a] text-white hover:bg-[#1e293b]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
                GitHub
              </Button>
              <Button variant="outline" className="border-[#334155] bg-[#0f172a] text-white hover:bg-[#1e293b]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="4" />
                  <line x1="21.17" x2="12" y1="8" y2="8" />
                  <line x1="3.95" x2="8.54" y1="6.06" y2="14" />
                  <line x1="10.88" x2="15.46" y1="21.94" y2="14" />
                </svg>
                Google
              </Button>
            </div>
          </form>
          <div className="text-center text-sm text-gray-400">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-[#a855f7] hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

