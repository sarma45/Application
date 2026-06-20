"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

const footerLinks = [
  {
    title: "Platform",
    links: [
      { label: "Agents", href: "/agents" },
      { label: "Categories", href: "/agents" },
      { label: "Pricing", href: "/pricing" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "API Docs", href: "/api/docs" },
      { label: "Status", href: "/status" },
      { label: "Blog", href: "/blog" },
      { label: "Support", href: "/support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "GDPR", href: "/gdpr" },
    ],
  },
];

export default function FooterSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <footer ref={ref} className="relative border-t border-zinc-800/50 bg-zinc-950">
      <div className="container-main py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-8"
        >
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-white">AIVerse</span>
            </Link>
            <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
              The premier marketplace for AI agents. Build, publish, and monetize intelligent agents with the world&apos;s leading AI models.
            </p>
          </div>

          {footerLinks.map((group, i) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * (i + 1) }}
            >
              <h4 className="text-sm font-semibold text-zinc-300 mb-4">{group.title}</h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-600 hover:text-purple-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 pt-8 border-t border-zinc-800/30 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} AIVerse. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            {[
              { label: "GitHub", href: "#" },
              { label: "Twitter", href: "#" },
              { label: "Discord", href: "#" },
            ].map((social) => (
              <Link
                key={social.label}
                href={social.href}
                className="text-xs text-zinc-600 hover:text-purple-400 transition-colors"
              >
                {social.label}
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
