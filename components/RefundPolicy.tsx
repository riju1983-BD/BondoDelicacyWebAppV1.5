import React from "react";
import bongoDelicacyLogo from "../src/assets/bongodelicacylogo.png";
import { Icon } from "./Icon";

interface RefundPolicyProps {
  onBack: () => void;
}

const sections = [
  {
    title: "1. Order Cancellation",
    subsections: [
      {
        subtitle: "A. Cancellation Before Preparation",
        content: `Customers may cancel an order before order pickup. The refund structure is as follows:

• Before order preparation begins → 60% refund of total payment
• Before pickup (after preparation) → 40% refund of total payment
• After pickup → No refund applicable

To cancel your order:
• Cancel directly from Order History in your user profile
• Call us immediately at 9611774424`,
      },
      {
        subtitle: "B. Cancellation After Preparation Has Started",
        content: `Once food has been picked up by the delivery rider, orders cannot be cancelled. All ingredients are fresh and prepared specifically for each order, making cancellations at this stage not feasible.`,
      },
    ],
  },
  {
    title: "2. Refund Eligibility",
    content: `Refunds may be issued under the following circumstances:

• Order was cancelled within the allowed time window
• Incorrect item was delivered
• Items were missing from the order
• Food quality issue (with valid photo proof submitted within 30 minutes of delivery)
• Order was not delivered due to an operational failure on our end`,
  },
  {
    title: "3. Non-Refundable Situations",
    content: `Refunds will not be provided in the following cases:

• Change of taste preference after order is placed
• Delays caused by traffic or delivery partner issues beyond reasonable control
• Incorrect delivery address provided by the customer
• Orders placed through third-party platforms (Swiggy / Zomato) — refunds for such orders will follow their respective policies`,
  },
  {
    title: "4. Refund Process",
    content: `If your refund request is approved:

• Refunds will be processed to the original payment method used at checkout
• Refund timeline: 5–7 business days (may vary depending on your bank or payment provider)
• For Cash on Delivery (COD) orders, refunds will be processed via UPI or bank transfer`,
  },
  {
    title: "5. Damaged or Quality Concerns",
    content: `If you experience any issue with your order:

• Contact us within 30 minutes of delivery
• Share your Order ID and clear photographs of the issue
• Our team will review your complaint and resolve it promptly

We prioritize customer satisfaction and fairness in every resolution.`,
  },
  {
    title: "6. Contact Us",
    content: `For cancellations or refund queries, please reach out to us:

Email: contact@bongodelicacy.com
Phone: 9611774424
Website: www.bongodelicacy.com

Bongo Delicacy Pvt Ltd — Banglar Jhale Jhole`,
  },
];
const handleNavigate = (route: string) => {
  window.location.hash = route;
};
const RefundPolicy: React.FC<RefundPolicyProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-gray-900/90 backdrop-blur-md z-50 border-b border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex sm:hidden items-center justify-center w-8 h-8 rounded-full text-gray-300 hover:text-cyan-400 hover:bg-gray-800 transition-all shrink-0"
            aria-label="Go back"
          >
            <Icon type="arrow-left" className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavigate('#')}>
            <img
              src={bongoDelicacyLogo}
              alt="Bongo Delicacy Logo"
              className="h-10 sm:h-12 w-auto"
            />
            <div>
              <h1 className="text-lg sm:text-xl font-serif font-bold text-cyan-500 leading-none">
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
            <Icon type="refresh-cw" className="w-7 h-7 text-cyan-400" />
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-white">
            Refund &amp; Cancellation Policy
          </h2>
          <p className="mt-3 text-gray-400 text-sm">
            Effective Date: &nbsp;
            <span className="text-cyan-400 font-medium">
              {new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            &nbsp;·&nbsp; Website:{" "}
            <a
              href="https://www.bongodelicacy.com"
              className="text-cyan-400 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              www.bongodelicacy.com
            </a>
          </p>
        </div>
      </div>

      {/* Refund Timeline Visual */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-4xl">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Before Preparation", refund: "60% Refund", color: "bg-green-500/10 border-green-500/30 text-green-400" },
            { label: "Before Pickup", refund: "40% Refund", color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" },
            { label: "After Pickup", refund: "No Refund", color: "bg-red-500/10 border-red-500/30 text-red-400" },
          ].map((stage, i) => (
            <div key={i} className={`rounded-xl border p-4 ${stage.color}`}>
              <p className="text-xs text-gray-400 mb-1">{stage.label}</p>
              <p className="font-bold text-sm">{stage.refund}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12 max-w-4xl">
        {/* Intro */}
        <div className="mb-8 p-5 bg-cyan-500/5 border border-cyan-500/20 rounded-xl text-gray-300 text-sm leading-relaxed">
          At Bongo Delicacy, we strive to ensure a fair and transparent experience for every customer.
          Please read our refund and cancellation policy carefully before placing an order.
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, idx) => (
            <div
              key={idx}
              className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors"
            >
              <h3 className="text-lg font-semibold text-cyan-400 mb-4">
                {section.title}
              </h3>

              {/* With subsections */}
              {"subsections" in section && section.subsections ? (
                <div className="space-y-5">
                  {section.subsections.map((sub, subIdx) => (
                    <div key={subIdx}>
                      <p className="text-white font-medium text-sm mb-2">
                        {sub.subtitle}
                      </p>
                      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                        {sub.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                  {section.content}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Contact Card */}
        <div className="mt-8 p-6 bg-gray-800 border border-cyan-500/20 rounded-xl">
          <h4 className="text-white font-semibold mb-4">Need Help?</h4>
          <div className="space-y-3">
            <a
              href="tel:9611774424"
              className="flex items-center gap-3 text-gray-300 hover:text-cyan-400 transition-colors text-sm"
            >
              <Icon type="phone" className="w-4 h-4 text-cyan-400 shrink-0" />
              9611774424
            </a>
            <a
              href="mailto:contact@bongodelicacy.com"
              className="flex items-center gap-3 text-gray-300 hover:text-cyan-400 transition-colors text-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-cyan-400 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M2 7l10 7 10-7" />
              </svg>
              contact@bongodelicacy.com
            </a>
            <a
              href="https://www.bongodelicacy.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 text-gray-300 hover:text-cyan-400 transition-colors text-sm"
            >
              <Icon type="globe" className="w-4 h-4 text-cyan-400 shrink-0" />
              www.bongodelicacy.com
            </a>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-10 text-center text-gray-500 text-xs">
          <p>
            This policy was last updated on{" "}
            {new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            .
          </p>
          <p className="mt-1">
            © {new Date().getFullYear()} Bongo Delicacy Pvt Ltd. All rights reserved.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-950 py-8 text-center text-gray-500 text-sm border-t border-gray-800">
        <p>© {new Date().getFullYear()} Bongo Delicacy Group. All rights reserved.</p>
        <div className="mt-3 flex justify-center gap-6 text-xs">
          <button onClick={onBack} className="hover:text-gray-300 transition-colors">
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

export default RefundPolicy;
