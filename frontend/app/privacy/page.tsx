import React from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Privacy Policy</h1>
          
          <div className="prose dark:prose-invert max-w-none">
            <p className="mb-4">
              Last updated: April 26, 2025
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
            <p>
              Welcome to Pixoria's Privacy Policy. This policy describes how Pixoria ("we", "our", or "us") collects, uses, and shares your information when you use our website, services, and applications (collectively, the "Services").
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
            <p>
              We collect information you provide directly to us, such as when you create an account, update your profile, use interactive features, make a purchase, request customer support, or communicate with us.
            </p>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Account Information</h3>
            <p>
              When you create an account, we collect your name, email address, username, password, and profile picture.
            </p>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Content You Share</h3>
            <p>
              We collect the content you share through our Services, including photos, comments, and other materials.
            </p>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">2.3 Automatically Collected Information</h3>
            <p>
              When you access or use our Services, we automatically collect information about you, including:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Log Information: We log information about your use of our Services, such as your IP address, device information, browser type, pages viewed, and the time spent on those pages.</li>
              <li>Device Information: We collect information about the device you use to access our Services, including hardware model, operating system, and unique device identifiers.</li>
              <li>Location Information: With your consent, we may collect information about your precise location.</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
            <p>
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Provide, maintain, and improve our Services</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices, updates, security alerts, and support messages</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Communicate with you about products, services, offers, and events</li>
              <li>Monitor and analyze trends, usage, and activities in connection with our Services</li>
              <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
              <li>Personalize the Services and provide advertisements, content, or features that match user profiles or interests</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at privacy@pixoria.com.
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}