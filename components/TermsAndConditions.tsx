import React from "react";
import bongoDelicacyLogo from "../src/assets/bongodelicacylogo.png";
import { Icon } from "./Icon";

interface PrivacyPolicyProps {
  onBack: () => void;
}

const sections = [
  {
    title: "1. Introduction",
    content: `Welcome to Bongo Delicacy. Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or place orders through our platform.

By accessing or using our website, you agree to the terms of this Privacy Policy.`,
  },
  {
    title: "2. Information We Collect",
    content: `A. Personal Information
• Name
• Phone number
• Email address
• Likes / Dislikes / Allergies
• Delivery address
• Billing details
• Order history

B. Payment Information
Payments are processed through secure third-party payment gateways. We do not store your card or banking details on our servers.

C. Technical Data
• IP address
• Browser type
• Device type
• Location data
• Cookies and usage data`,
  },
  {
    title: "3. How We Use Your Information",
    content: `We use your information to:

• Process and deliver your orders
• Provide customer support
• Improve website experience
• Send order confirmations and updates
• Send promotional offers (only if you opt-in)
• Improve menu, pricing and customer experience`,
  },
  {
    title: "4. Cookies Policy",
    content: `Our website uses cookies to:

• Improve browsing experience
• Analyze website traffic
• Personalize offers
• Remember your preferences

You may disable cookies in your browser settings, but certain features of the website may not function properly.`,
  },
  {
    title: "5. Data Sharing & Disclosure",
    content: `We do not sell or rent your personal information.

We may share your data only with:

• Delivery partners
• Payment gateway providers
• Marketing service providers (for opted-in users only)
• Government authorities if legally required`,
  },
  {
    title: "6. Data Security",
    content: `We implement industry-standard security measures to protect your data. However, no digital platform is 100% secure, and we cannot guarantee absolute security.`,
  },
  {
    title: "7. Your Rights",
    content: `You have the right to:

• Access your personal data
• Correct inaccurate information
• Request deletion of your data
• Withdraw marketing consent at any time

To exercise these rights, contact us at: contact@bongodelicacy.com`,
  },
  {
    title: "8. Third-Party Links",
    content: `Our website may contain links to third-party websites (e.g., Swiggy, Zomato, social media platforms). We are not responsible for their privacy practices.`,
  },
  {
    title: "9. Children's Privacy",
    content: `Our services are not directed to individuals under 18 years of age. We do not knowingly collect personal data from children.`,
  },
  {
    title: "10. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. Updates will be posted on this page with a revised effective date.`,
  },
  {
    title: "11. Contact Us",
    content: `If you have any questions about this Privacy Policy, please contact:

Bongo Delicacy Pvt Ltd — Banglar Jhale Jhole
Website: www.bongodelicacy.com
Email: contact@bongodelicacy.com
Phone: 9611774424

Locations:
• Takeaway & Delivery — L S Enclave, 1st Floor, Horamavu Main Road, 2nd Cross, Bangalore - 560045
• Dine In — Amigo's Avenue, Ground Floor, 15, New Temple Road, Nallurhalli Main Road, Whitefield, Bangalore - 560066`,
  },
];

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  // ✅ Read theme set by BrandPage
  const themePrimary = localStorage.getItem("themePrimary") || "#06b6d4";
  const themeAccent = localStorage.getItem("themeAccent") || "#06b6d4";
  const themeText = localStorage.getItem("themeText") || "#ffffff";

  const brandThemeStyle = {
    "--primary-color": themePrimary,
    "--accent-color": themeAccent,
    "--text-on-primary-color": themeText,
  } as React.CSSProperties;

  return (
    <div
      className="min-h-screen bg-gray-900 text-white"
      style={brandThemeStyle}
    >
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-gray-900/90 backdrop-blur-md z-50 border-b border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          {/* <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-300 hover:text-[var(--accent-color)] transition-colors"
          >
            <Icon type="arrow-left" className="w-5 h-5" />
            <span className="hidden sm:inline text-sm">Back</span>
          </button> */}

          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={onBack}
          >
            <img
              src={bongoDelicacyLogo}
              alt="Bongo Delicacy Logo"
              className="h-10 sm:h-12 w-auto"
            />
            <div>
              <h1 className="text-lg sm:text-xl font-serif font-bold text-[var(--accent-color)] leading-none">
                Bongo
              </h1>
              <span className="text-xs sm:text-sm font-light text-gray-300 tracking-widest">
                DELICACY
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Banner */}
      <div className="pt-24 pb-12 bg-gradient-to-b from-gray-800 to-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-4">
            <Icon
              type="shield"
              className="w-7 h-7 text-[var(--accent-color)]"
            />
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-white">
            Privacy Policy
          </h2>
          <p className="mt-3 text-gray-400 text-sm">
            Effective Date: &nbsp;
            <span className="text-[var(--accent-color)] font-medium">
              {new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            &nbsp;·&nbsp; Website:{" "}
            <a
              href="https://www.bongodelicacy.com"
              className="text-[var(--accent-color)] hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              www.bongodelicacy.com
            </a>
            &nbsp;·&nbsp; Company: Bongo Delicacy Pvt Ltd
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
        {/* Intro */}
        <div className="mb-10 p-5 bg-cyan-500/5 border border-cyan-500/20 rounded-xl text-gray-300 text-sm leading-relaxed">
          Please read this Privacy Policy carefully before using the Bongo
          Delicacy platform. By accessing our website or placing an order, you
          confirm that you have read, understood, and agree to how we collect
          and use your information.
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section, idx) => (
            <div
              key={idx}
              className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors"
            >
              <h3 className="text-lg font-semibold text-[var(--accent-color)] mb-3">
                {section.title}
              </h3>
              <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                {section.content}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-950 py-8 text-center text-gray-500 text-sm border-t border-gray-800">
        <p>
          © {new Date().getFullYear()} Bongo Delicacy Group. All rights
          reserved.
        </p>
        <div className="mt-3 flex justify-center gap-6 text-xs">
          <button
            onClick={onBack}
            className="hover:text-gray-300 transition-colors"
          >
            ← Back to Home
          </button>
          <a
            href="mailto:contact@bongodelicacy.com"
            className="hover:text-gray-300 transition-colors"
          >
            contact@bongodelicacy.com
          </a>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
