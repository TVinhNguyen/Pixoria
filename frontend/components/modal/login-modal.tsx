import { FC, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (username: string, password: string) => void;
}

const LoginModal: FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!username || !password) {
        alert("Please enter both username and password!");
        return;
    }
    try {
        const response_token = await fetch("http://127.0.0.1:8000/api/token/", {
            method: "POST",
            headers: {
                "Content-type": "application/json",
            },
            body: JSON.stringify({username, password}),
        });
        const response_user = await fetch(`http://127.0.0.1:8000/users/get-user/?username=${username}`, {
            method: "GET",
            headers: {
                "Content-type": "application/json",
            },
        })
        const data_token = await response_token.json();
        const data_user = await response_user.json();
        if (response_token.ok) {
            localStorage.setItem("token", data_token.access);
            localStorage.setItem("user", JSON.stringify(data_user));
            localStorage.setItem("user_id", data_user.id);
            localStorage.setItem("username", username);
            console.log(data_token);
            onClose();
            setTimeout(() => {
                window.location.reload();
            }, 300);
        } else {
            alert("Login failed! Maybe incorrect username or password!");
        }
    } catch(error) {
        console.error("Login error:", error)
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white dark:bg-gray-900 p-6 rounded-lg">
        <div className="flex flex-col md:flex-row items-center">
          <div className="flex-1 flex justify-center md:justify-start">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
              ModernPexels
            </Link>
          </div>

          <div className="flex-1 space-y-4 w-full">
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
                Login
              </DialogTitle>
            </DialogHeader>
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="dark:bg-gray-800 dark:text-white"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="dark:bg-gray-800 dark:text-white"
            />

            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                New user?{" "}
                <Link href="/signup" className="text-blue-600 font-bold hover:underline">
                  Sign up
                </Link>
              </p>
              <div className="space-x-2">
                <Button onClick={handleLogin}>Login</Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;

// "use client"

// import type React from "react"

// import { useState } from "react"
// import { X } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Checkbox } from "@/components/ui/checkbox"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import Link from "next/link"

// interface LoginModalProps {
//   isOpen: boolean
//   onClose: () => void
//   onLogin: (username: string, password: string) => void
// }

// export default function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
//   const [username, setUsername] = useState("")
//   const [password, setPassword] = useState("")
//   const [email, setEmail] = useState("")
//   const [fullName, setFullName] = useState("")
//   const [confirmPassword, setConfirmPassword] = useState("")
//   const [rememberMe, setRememberMe] = useState(false)
//   const [activeTab, setActiveTab] = useState("login")

//   const handleLogin = (e: React.FormEvent) => {
//     e.preventDefault()
//     onLogin(username, password)
//     onClose()
//   }

//   const handleSignup = (e: React.FormEvent) => {
//     e.preventDefault()
//     // Handle signup logic here
//     console.log("Signup:", { fullName, email, password, confirmPassword })
//     onClose()
//   }

//   if (!isOpen) return null

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
//       <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-lg">
//         <div className="flex items-center justify-between mb-4">
//           <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
//             ModernPexels
//           </h2>
//           <Button variant="ghost" size="icon" onClick={onClose}>
//             <X className="h-5 w-5" />
//           </Button>
//         </div>

//         <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
//           <TabsList className="grid w-full grid-cols-2 mb-6">
//             <TabsTrigger value="login">Login</TabsTrigger>
//             <TabsTrigger value="signup">Sign Up</TabsTrigger>
//           </TabsList>

//           <TabsContent value="login">
//             <form onSubmit={handleLogin} className="space-y-4">
//               <div className="space-y-2">
//                 <Label htmlFor="username">Username or Email</Label>
//                 <Input
//                   id="username"
//                   value={username}
//                   onChange={(e) => setUsername(e.target.value)}
//                   placeholder="Enter your username or email"
//                   required
//                 />
//               </div>
//               <div className="space-y-2">
//                 <div className="flex items-center justify-between">
//                   <Label htmlFor="password">Password</Label>
//                   <Link href="/forgot-password" className="text-sm text-primary hover:underline">
//                     Forgot password?
//                   </Link>
//                 </div>
//                 <Input
//                   id="password"
//                   type="password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   placeholder="Enter your password"
//                   required
//                 />
//               </div>
//               <div className="flex items-center space-x-2">
//                 <Checkbox
//                   id="remember"
//                   checked={rememberMe}
//                   onCheckedChange={(checked) => setRememberMe(checked as boolean)}
//                 />
//                 <label
//                   htmlFor="remember"
//                   className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
//                 >
//                   Remember me
//                 </label>
//               </div>
//               <Button
//                 type="submit"
//                 className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
//               >
//                 Log in
//               </Button>
//               <div className="relative">
//                 <div className="absolute inset-0 flex items-center">
//                   <span className="w-full border-t border-border"></span>
//                 </div>
//                 <div className="relative flex justify-center text-xs">
//                   <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
//                 </div>
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <Button variant="outline" type="button">
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     width="18"
//                     height="18"
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="2"
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     className="mr-2"
//                   >
//                     <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
//                   </svg>
//                   GitHub
//                 </Button>
//                 <Button variant="outline" type="button">
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     width="18"
//                     height="18"
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="2"
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     className="mr-2"
//                   >
//                     <circle cx="12" cy="12" r="10" />
//                     <circle cx="12" cy="12" r="4" />
//                     <line x1="21.17" x2="12" y1="8" y2="8" />
//                     <line x1="3.95" x2="8.54" y1="6.06" y2="14" />
//                     <line x1="10.88" x2="15.46" y1="21.94" y2="14" />
//                   </svg>
//                   Google
//                 </Button>
//               </div>
//             </form>
//           </TabsContent>

//           <TabsContent value="signup">
//             <form onSubmit={handleSignup} className="space-y-4">
//               <div className="space-y-2">
//                 <Label htmlFor="fullName">Full Name</Label>
//                 <Input
//                   id="fullName"
//                   value={fullName}
//                   onChange={(e) => setFullName(e.target.value)}
//                   placeholder="Enter your full name"
//                   required
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="email">Email</Label>
//                 <Input
//                   id="email"
//                   type="email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   placeholder="Enter your email"
//                   required
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="signupPassword">Password</Label>
//                 <Input
//                   id="signupPassword"
//                   type="password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   placeholder="Create a password"
//                   required
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="confirmPassword">Confirm Password</Label>
//                 <Input
//                   id="confirmPassword"
//                   type="password"
//                   value={confirmPassword}
//                   onChange={(e) => setConfirmPassword(e.target.value)}
//                   placeholder="Confirm your password"
//                   required
//                 />
//               </div>
//               <Button
//                 type="submit"
//                 className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
//               >
//                 Sign Up
//               </Button>
//               <div className="relative">
//                 <div className="absolute inset-0 flex items-center">
//                   <span className="w-full border-t border-border"></span>
//                 </div>
//                 <div className="relative flex justify-center text-xs">
//                   <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
//                 </div>
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <Button variant="outline" type="button">
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     width="18"
//                     height="18"
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="2"
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     className="mr-2"
//                   >
//                     <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
//                   </svg>
//                   GitHub
//                 </Button>
//                 <Button variant="outline" type="button">
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     width="18"
//                     height="18"
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="2"
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     className="mr-2"
//                   >
//                     <circle cx="12" cy="12" r="10" />
//                     <circle cx="12" cy="12" r="4" />
//                     <line x1="21.17" x2="12" y1="8" y2="8" />
//                     <line x1="3.95" x2="8.54" y1="6.06" y2="14" />
//                     <line x1="10.88" x2="15.46" y1="21.94" y2="14" />
//                   </svg>
//                   Google
//                 </Button>
//               </div>
//             </form>
//           </TabsContent>
//         </Tabs>
//       </div>
//     </div>
//   )
// }

