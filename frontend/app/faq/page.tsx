import React from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function FAQPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 pt-24 pb-12">
        <h1 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h1>
        
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-3">What is Pixoria?</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Pixoria is a platform for sharing and discovering high-quality images. Our community of photographers and creators share their work for everyone to use.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-3">How can I use the images?</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Images on Pixoria are free to use for both personal and commercial projects. Attribution is not required but always appreciated.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-3">How do I upload my photos?</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Sign up for an account, verify your email, and click on the Upload button in the navigation bar. You can upload multiple images at once.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Can I create collections?</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Yes, you can create collections to organize images you like. Collections can be private or public depending on your preference.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-3">How do I search for specific images?</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Use the search bar at the top of the page. You can search by keywords, colors, or categories. We also offer advanced visual search features.
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}