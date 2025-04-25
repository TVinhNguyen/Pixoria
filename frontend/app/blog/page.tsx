import React from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function BlogPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 pt-24 pb-12">
        <h1 className="text-3xl font-bold mb-8 text-center">Blog</h1>
        
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-lg mb-12">
            Coming soon! Our blog will feature photography tips, artist spotlights, and more.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Placeholder for future blog posts */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-gray-100 dark:bg-gray-800 p-6 hover:shadow-lg transition-shadow">
                <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-md mb-4"></div>
                <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Stay tuned for exciting photography content.</p>
                <div className="text-sm text-gray-500 dark:text-gray-400">April 26, 2025</div>
              </div>
            ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}