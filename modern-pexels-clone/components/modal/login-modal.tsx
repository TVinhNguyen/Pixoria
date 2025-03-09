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
            console.log(data_token);
            console.log(data_user);
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