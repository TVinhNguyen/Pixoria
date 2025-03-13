import { useEffect, useState } from "react";

export function useTheme() {
    const [theme, setTheme] = useState(
        typeof window !== "undefined" ? localStorage.getItem("theme") || "dark" : "dark"
    );
    useEffect(() => {
        if (theme == "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
        localStorage.setItem("theme", theme);
    }, [theme]);
    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };
    return {theme, toggleTheme};
}