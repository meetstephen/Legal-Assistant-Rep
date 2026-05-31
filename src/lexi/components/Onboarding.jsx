// ============================================================
// lexi/components/Onboarding.jsx — first-run onboarding wizard
// ============================================================

import React, { useState, useCallback } from 'react';
import { Scale, Brain, ShieldCheck, FolderOpen, Globe, ArrowRight } from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { Button, Input, PasswordInput } from './ui.jsx';
import { STORAGE_KEYS } from '../database.js';

const LS_KEY = `lexi2:${STORAGE_KEYS.ONBOARDING_DONE}`;

export function Onboarding() {
  const { setProfile, setPasscode } = useApp();
  const [visible, setVisible] = useState(() => {
    try {
      return localStorage.getItem(LS_KEY) !== 'true';
    } catch {
      return true;
    }
  });
  const [step, setStep] = useState(0);

  // Step 2 state
  const [firmName, setFirmName] = useState('');
  const [lawyerName, setLawyerName] = useState('');

  // Step 4 state
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');

  const finish = useCallback(() => {
    try {
      localStorage.setItem(LS_KEY, 'true');
    } catch { /* ignore */ }
    setVisible(false);
  }, []);

  const handleDetailsSubmit = useCallback(() => {
    const patch = {};
    if (firmName.trim()) patch.firmName = firmName.trim();
    if (lawyerName.trim()) patch.lawyerName = lawyerName.trim();
    if (Object.keys(patch).length) setProfile(patch);
    setStep(2);
  }, [firmName, lawyerName, setProfile]);

  const handlePasscodeSubmit = useCallback(async () => {
    setPassError('');
    if (!newPass) {
      setPassError('Please enter a new passcode');
      return;
    }
    if (newPass.length < 4) {
      setPassError('Passcode must be at least 4 characters');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('Passcodes do not match');
      return;
    }
    await setPasscode(newPass);
    finish();
  }, [newPass, confirmPass, setPasscode, finish]);

  if (!visible) return null;

  const STEPS = [StepWelcome, StepDetails, StepFeatures, StepSecurity];
  const CurrentStep = STEPS[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          <CurrentStep
            step={step}
            setStep={setStep}
            firmName={firmName}
            setFirmName={setFirmName}
            lawyerName={lawyerName}
            setLawyerName={setLawyerName}
            handleDetailsSubmit={handleDetailsSubmit}
            newPass={newPass}
            setNewPass={setNewPass}
            confirmPass={confirmPass}
            setConfirmPass={setConfirmPass}
            passError={passError}
            handlePasscodeSubmit={handlePasscodeSubmit}
            finish={finish}
          />
        </div>
        {/* Step indicator dots */}
        <div className="flex items-center justify-center gap-2 pb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i === step
                  ? 'bg-emerald-500 scale-110'
                  : 'bg-slate-300 dark:bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Step 1: Welcome ---
function StepWelcome({ setStep }) {
  return (
    <div className="flex flex-col items-center text-center space-y-5">
      {/* Logo */}
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
        <Scale className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
        Welcome to LexiAssist 2.0
      </h1>
      <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed max-w-sm">
        AI-powered legal research, drafting, and practice management for Nigerian lawyers.
      </p>
      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-sm">
        Reasons before it answers. Cites real, verifiable authorities. Built for your jurisdiction.
      </p>
      <Button onClick={() => setStep(1)} className="mt-4" rightIcon={<ArrowRight className="w-4 h-4" />}>
        Get Started
      </Button>
    </div>
  );
}

// --- Step 2: Your Details ---
function StepDetails({ setStep, firmName, setFirmName, lawyerName, setLawyerName, handleDetailsSubmit }) {
  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Set up your workspace</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">These are optional - you can always change them later in Profile.</p>
      </div>
      <div className="space-y-4">
        <Input
          label="Firm / Chamber Name"
          placeholder="e.g. Adekunle & Partners"
          value={firmName}
          onChange={(e) => setFirmName(e.target.value)}
        />
        <Input
          label="Your Name"
          placeholder="e.g. Barr. Chioma Okonkwo"
          value={lawyerName}
          onChange={(e) => setLawyerName(e.target.value)}
        />
      </div>
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          Skip
        </button>
        <Button onClick={handleDetailsSubmit} rightIcon={<ArrowRight className="w-4 h-4" />}>
          Continue
        </Button>
      </div>
    </div>
  );
}

// --- Step 3: Key Features ---
function StepFeatures({ setStep }) {
  const features = [
    { icon: Brain, title: 'AI Assistant', desc: 'Draft, analyse, research - grounded in Nigerian law with reasoning you can audit' },
    { icon: ShieldCheck, title: 'Citation Verify', desc: 'Every case cited is checked against a verified database + live web search' },
    { icon: FolderOpen, title: 'Practice Management', desc: 'Track cases, hearings, tasks, clients, billing - all in one place' },
    { icon: Globe, title: 'Live Web Grounding', desc: 'Put answers online to cite real, current sources with clickable links' },
  ];

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">What you can do</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-2"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <f.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{f.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-end pt-2">
        <Button onClick={() => setStep(3)} rightIcon={<ArrowRight className="w-4 h-4" />}>
          Almost done
        </Button>
      </div>
    </div>
  );
}

// --- Step 4: Security ---
function StepSecurity({ newPass, setNewPass, confirmPass, setConfirmPass, passError, handlePasscodeSubmit, finish }) {
  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Secure your workspace</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Change the default passcode from &lsquo;admin&rsquo; to something personal.
        </p>
      </div>
      <div className="space-y-4">
        <PasswordInput
          label="New Passcode"
          placeholder="Enter new passcode"
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
          error={passError}
        />
        <PasswordInput
          label="Confirm Passcode"
          placeholder="Re-enter passcode"
          value={confirmPass}
          onChange={(e) => setConfirmPass(e.target.value)}
        />
      </div>
      <div className="flex flex-col items-center gap-3 pt-2">
        <Button onClick={handlePasscodeSubmit} className="w-full">
          Set passcode &amp; finish
        </Button>
        <button
          type="button"
          onClick={finish}
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          I'll do this later
        </button>
      </div>
    </div>
  );
}
