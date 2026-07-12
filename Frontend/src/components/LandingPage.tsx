import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { BrandLogo } from './BrandLogo';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (navRef.current) {
        if (window.scrollY > 60) {
          navRef.current.classList.add('bg-v30/90', 'backdrop-blur-md', 'border-b', 'border-white/10', 'py-3');
          navRef.current.classList.remove('py-5');
        } else {
          navRef.current.classList.remove('bg-v30/90', 'backdrop-blur-md', 'border-b', 'border-white/10', 'py-3');
          navRef.current.classList.add('py-5');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative flex flex-col items-center w-full min-h-screen bg-v60 text-text-primary overflow-hidden">
      {/* Sticky Navigation Bar */}
      <nav
        ref={navRef}
        className="fixed top-0 left-0 w-full z-50 flex justify-center items-center py-5 transition-all duration-300"
      >
        <div className="w-full max-w-6xl px-6 flex justify-between items-center">
          <BrandLogo size={22} />

          <div className="hidden md:flex gap-8 items-center text-xs font-medium tracking-wide">
            <a href="#features" className="text-text-secondary hover:text-text-primary transition-colors">FEATURES</a>
            <a href="#pricing" className="text-text-secondary hover:text-text-primary transition-colors">PRICING</a>
            <a href="#security" className="text-text-secondary hover:text-text-primary transition-colors">SECURITY</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onLogin}
              className="text-xs font-semibold px-4 py-2 text-text-secondary hover:text-text-primary border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 rounded-md transition-all"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="text-xs font-semibold px-4 py-2 bg-v10 hover:bg-v10-hover text-white rounded-md shadow-md transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative w-full max-w-4xl flex flex-col justify-center items-center px-10 pt-36 pb-16 text-center overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center"
        >
          <h1 className="font-heading font-extrabold text-4xl md:text-6xl tracking-tight leading-tight mb-6">
            Secure Storage.<br />
            <span className="bg-gradient-to-r from-v10 to-blue-400 bg-clip-text text-transparent">Absolute Sovereignty.</span>
          </h1>
          <p className="max-w-xl text-sm md:text-base text-text-secondary leading-relaxed mb-8">
            An enterprise-grade decentralized storage platform protecting your assets.
            All files are encrypted client-side prior to transit.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onGetStarted}
              className="flex items-center gap-2 font-semibold text-sm px-6 py-2.5 bg-v10 hover:bg-v10-hover text-white rounded-md shadow-lg transition-all"
            >
              Create Free Vault
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
            <a
              href="#features"
              className="font-semibold text-sm px-6 py-2.5 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-text-primary rounded-md transition-all"
            >
              Explore Tech Stack
            </a>
          </div>
        </motion.div>
      </header>

      {/* Bento Grid Features */}
      <section id="features" className="w-full max-w-5xl px-6 py-16 flex flex-col items-center">
        <div className="text-center max-w-lg mb-12">
          <h2 className="font-heading font-bold text-2xl md:text-3xl mb-3">Sleek Security Telemetry</h2>
          <p className="text-sm text-text-secondary">Redefining cloud backup services with decentralized frameworks and clean visual systems.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {/* Card 1 - Zero Knowledge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="md:col-span-2 md:row-span-2 p-6 rounded-lg glass-panel-tailwind flex flex-col justify-between min-h-[300px] border border-white/5 bg-v30/60"
          >
            <div className="w-10 h-10 rounded-md bg-v10/10 text-v10 flex justify-center items-center mb-6">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div>
              <h3 className="font-heading font-semibold text-lg mb-2">Zero-Knowledge Encrypted Vaults</h3>
              <p className="text-xs md:text-sm text-text-secondary leading-relaxed text-left">
                Your private files are encrypted client-side using industry-standard AES-256 ciphers prior to database sync. Keys are managed exclusively on your system, guaranteeing absolute privacy.
              </p>
            </div>
          </motion.div>

          {/* Card 2 - Secure Shares */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="md:col-span-1 p-6 rounded-lg glass-panel-tailwind flex flex-col justify-between border border-white/5 bg-v30/60"
          >
            <div className="w-10 h-10 rounded-md bg-v10/10 text-v10 flex justify-center items-center mb-6">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            </div>
            <div>
              <h3 className="font-heading font-semibold text-base mb-2">Custom Links</h3>
              <p className="text-xs text-text-secondary leading-relaxed text-left">
                Generate secure links containing custom expirations and cipher passcodes.
              </p>
            </div>
          </motion.div>

          {/* Card 3 - Speed */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="md:col-span-1 p-6 rounded-lg glass-panel-tailwind flex flex-col justify-between border border-white/5 bg-v30/60"
          >
            <div className="w-10 h-10 rounded-md bg-v10/10 text-v10 flex justify-center items-center mb-6">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
              </svg>
            </div>
            <div>
              <h3 className="font-heading font-semibold text-base mb-2">Streaming Uploads</h3>
              <p className="text-xs text-text-secondary leading-relaxed text-left">
                Parallel packet chunking streams files efficiently even on high-latency links.
              </p>
            </div>
          </motion.div>

          {/* Card 4 - Telemetry */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="md:col-span-1 p-6 rounded-lg glass-panel-tailwind flex flex-col justify-between border border-white/5 bg-v30/60"
          >
            <div className="w-10 h-10 rounded-md bg-v10/10 text-v10 flex justify-center items-center mb-6">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div>
              <h3 className="font-heading font-semibold text-base mb-2">Live Telemetry</h3>
              <p className="text-xs text-text-secondary leading-relaxed text-left">
                Review storage consumption rates via beautiful, clean mathematical visual gauges.
              </p>
            </div>
          </motion.div>

          {/* Card 5 - Auto indexing */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="md:col-span-2 p-6 rounded-lg glass-panel-tailwind flex flex-col justify-between border border-white/5 bg-v30/60"
          >
            <div className="w-10 h-10 rounded-md bg-v10/10 text-v10 flex justify-center items-center mb-6">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div>
              <h3 className="font-heading font-semibold text-base mb-2">Index Classification</h3>
              <p className="text-xs text-text-secondary leading-relaxed text-left">
                Files are automatically categorized into sleek catalog panels (Images, Documents, Media, Archives, Code, Others) based on content mime-type schemas.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonial Marquees */}
      <section id="security" className="w-full py-16 overflow-hidden flex flex-col items-center">
        <div className="text-center max-w-lg mb-10 px-6">
          <h2 className="font-heading font-bold text-2xl md:text-3xl mb-3">Endorsed Security Systems</h2>
          <p className="text-sm text-text-secondary">Explore why cryptographers and sysadmins rely on Cloud Vault for key sovereignty.</p>
        </div>

        <div className="flex flex-col gap-4 w-full">
          {/* Row 1 */}
          <div className="flex overflow-hidden select-none whitespace-nowrap">
            <div className="flex gap-4 animate-[scrollRight_30s_linear_infinite] hover:[animation-play-state:paused]">
              {Array(2).fill([
                { author: "Evelyn K.", role: "Cybersecurity Lead", text: "The zero-knowledge design is flawless. Finally, a storage service that respects user privacy." },
                { author: "Marcus Vance", role: "Fullstack Engineer", text: "Stunning aesthetic! The animations are super responsive and upload speed is incredibly fast." },
                { author: "Sonia G.", role: "Lead Dev @ FinTech", text: "We upload confidential financial documents securely daily. Cloud Vault has never disappointed us." },
                { author: "David P.", role: "Independent Auditor", text: "Checked the network payloads myself. Absolute privacy, data is securely encrypted client-side." }
              ]).flat().map((item, idx) => (
                <div key={`left-${idx}`} className="w-[300px] p-5 rounded-lg border border-white/5 bg-v30/40 whitespace-normal">
                  <p className="text-xs text-text-primary italic leading-relaxed mb-4">"{item.text}"</p>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-xs text-text-primary">{item.author}</span>
                    <span className="text-[10px] text-text-muted">{item.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Row 2 */}
          <div className="flex overflow-hidden select-none whitespace-nowrap">
            <div className="flex gap-4 animate-[scrollLeft_30s_linear_infinite] hover:[animation-play-state:paused]">
              {Array(2).fill([
                { author: "Liam Chen", role: "Venture Architect", text: "The Bento folder UI makes navigation extremely clean. A masterpiece of UX design." },
                { author: "Chloe R.", role: "Digital Archivist", text: "I store high-resolution audio files here. The categorizer arranges them instantly." },
                { author: "Professor Aris", role: "Cryptography Dept", text: "The implementation of WebCrypto API in client security matches pure mathematical guidelines." },
                { author: "Nora Blake", role: "Content Creator", text: "Password-protected sharing has made delivering assets to clients direct and completely secure." }
              ]).flat().map((item, idx) => (
                <div key={`right-${idx}`} className="w-[300px] p-5 rounded-lg border border-white/5 bg-v30/40 whitespace-normal">
                  <p className="text-xs text-text-primary italic leading-relaxed mb-4">"{item.text}"</p>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-xs text-text-primary">{item.author}</span>
                    <span className="text-[10px] text-text-muted">{item.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="w-full max-w-5xl px-6 py-16 flex flex-col items-center">
        <div className="text-center max-w-lg mb-12">
          <h2 className="font-heading font-bold text-2xl md:text-3xl mb-3">Flat Pricing Models</h2>
          <p className="text-sm text-text-secondary">Flexible quota tiers mapped to your backup telemetry. Cancel anytime.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full items-stretch">
          {/* Tier 1 */}
          <motion.div
            whileHover={{ y: -2 }}
            className="p-6 rounded-lg border border-white/5 bg-v30/60 flex flex-col justify-between"
          >
            <div>
              <h3 className="font-heading font-semibold text-base mb-2">Vault Starter</h3>
              <div className="text-3xl font-extrabold mb-4 font-heading text-text-primary">
                $0<span className="text-xs text-text-secondary font-normal font-sans">/mo</span>
              </div>
              <p className="text-xs text-text-secondary mb-6">For individuals starting with local key backups.</p>
              <ul className="text-xs text-text-secondary space-y-2 mb-8">
                <li className="flex items-center gap-2"><span className="text-v10">✓</span> 5 GB encrypted storage</li>
                <li className="flex items-center gap-2"><span className="text-v10">✓</span> Zero-Knowledge key crypto</li>
                <li className="flex items-center gap-2"><span className="text-v10">✓</span> Max file size 50 MB</li>
              </ul>
            </div>
            <button
              onClick={onGetStarted}
              className="w-full text-xs font-semibold py-2 bg-white/5 hover:bg-white/10 text-text-primary border border-white/10 rounded-md transition-all"
            >
              Sign Up Free
            </button>
          </motion.div>

          {/* Tier 2 */}
          <motion.div
            whileHover={{ y: -2 }}
            className="p-6 rounded-lg border-2 border-v10 bg-v30/90 flex flex-col justify-between shadow-xl relative"
          >
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-v10 text-white font-bold text-[10px] uppercase tracking-wider rounded-md">
              Most Popular
            </div>
            <div>
              <h3 className="font-heading font-semibold text-base mb-2">Vault Pro</h3>
              <div className="text-3xl font-extrabold mb-4 font-heading text-text-primary">
                $9<span className="text-xs text-text-secondary font-normal font-sans">/mo</span>
              </div>
              <p className="text-xs text-text-secondary mb-6">For power users requiring substantial quotas.</p>
              <ul className="text-xs text-text-secondary space-y-2 mb-8">
                <li className="flex items-center gap-2"><span className="text-v10">✓</span> 50 GB high-speed storage</li>
                <li className="flex items-center gap-2"><span className="text-v10">✓</span> Dynamic passworded link share</li>
                <li className="flex items-center gap-2"><span className="text-v10">✓</span> Infinite secure downloads</li>
                <li className="flex items-center gap-2"><span className="text-v10">✓</span> Dedicated user key assistance</li>
              </ul>
            </div>
            <button
              onClick={onGetStarted}
              className="w-full text-xs font-semibold py-2 bg-v10 hover:bg-v10-hover text-white rounded-md shadow-md transition-all"
            >
              Get Started Pro
            </button>
          </motion.div>

          {/* Tier 3 */}
          <motion.div
            whileHover={{ y: -2 }}
            className="p-6 rounded-lg border border-white/5 bg-v30/60 flex flex-col justify-between"
          >
            <div>
              <h3 className="font-heading font-semibold text-base mb-2">Vault Enterprise</h3>
              <div className="text-3xl font-extrabold mb-4 font-heading text-text-primary">
                $39<span className="text-xs text-text-secondary font-normal font-sans">/mo</span>
              </div>
              <p className="text-xs text-text-secondary mb-6">For teams needing total regulatory compliance.</p>
              <ul className="text-xs text-text-secondary space-y-2 mb-8">
                <li className="flex items-center gap-2"><span className="text-v10">✓</span> 1 TB absolute storage space</li>
                <li className="flex items-center gap-2"><span className="text-v10">✓</span> Domain authentication filters</li>
                <li className="flex items-center gap-2"><span className="text-v10">✓</span> Audits log telemetry panels</li>
                <li className="flex items-center gap-2"><span className="text-v10">✓</span> 24/7 priority compliance support</li>
              </ul>
            </div>
            <button
              onClick={onGetStarted}
              className="w-full text-xs font-semibold py-2 bg-white/5 hover:bg-white/10 text-text-primary border border-white/10 rounded-md transition-all"
            >
              Contact Sales
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-8 text-center mt-12">
        <p className="text-text-muted text-[10px]">&copy; 2026 CLOUD VAULT. All cryptography keys managed client-side.</p>
      </footer>
    </div>
  );
};
