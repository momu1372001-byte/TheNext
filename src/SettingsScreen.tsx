import { useState } from "react";
import {
  Bell,
  ChevronRight,
  Moon,
  RotateCcw,
  Target,
  Volume2,
  VolumeX,
  Sun,
  Info,
  X,
} from "lucide-react";
import {
  CEFR_LEVELS,
  DAILY_GOALS,
  type CefrLevel,
  type DailyGoal,
  type Settings as SettingsType,
} from "./useSettings";

const APP_VERSION = "1.0.0";

interface Props {
  settings: SettingsType;
  onUpdate: <K extends keyof SettingsType>(key: K, value: SettingsType[K]) => void;
  onReset: () => void;
}

export default function SettingsScreen({ settings, onUpdate, onReset }: Props) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  return (
    <div className="settings-page">
      <header className="settings-header">
        <h1>Settings</h1>
        <p className="settings-subtitle">Customize your learning experience</p>
      </header>

      <main className="settings-content">
        {/* Daily goal */}
        <Section title="Learning">
          <Row icon={<Target />} label="Daily goal" hint={`${settings.dailyGoal} words / day`}>
            <div className="pill-group">
              {DAILY_GOALS.map((g) => (
                <button
                  key={g}
                  className={`pill ${settings.dailyGoal === g ? "pill-active" : ""}`}
                  onClick={() => onUpdate("dailyGoal", g as DailyGoal)}
                  aria-pressed={settings.dailyGoal === g}
                >
                  {g}
                </button>
              ))}
            </div>
          </Row>

          <Row icon={<Target />} label="CEFR level" hint={settings.cefrLevel}>
            <select
              className="select"
              value={settings.cefrLevel}
              onChange={(e) => onUpdate("cefrLevel", e.target.value as CefrLevel)}
            >
              {CEFR_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </Row>
        </Section>

        {/* Preferences */}
        <Section title="Preferences">
          <Row
            icon={settings.sound ? <Volume2 /> : <VolumeX />}
            label="Sound"
            hint={settings.sound ? "On" : "Off"}
          >
            <Toggle
              checked={settings.sound}
              onChange={(v) => onUpdate("sound", v)}
              label="Sound"
            />
          </Row>

          <Row
            icon={<Bell />}
            label="Notifications"
            hint={settings.notifications ? "On" : "Off"}
          >
            <Toggle
              checked={settings.notifications}
              onChange={(v) => onUpdate("notifications", v)}
              label="Notifications"
            />
          </Row>

          <Row
            icon={settings.darkMode ? <Moon /> : <Sun />}
            label="Dark mode"
            hint={settings.darkMode ? "On" : "Off"}
          >
            <Toggle
              checked={settings.darkMode}
              onChange={(v) => onUpdate("darkMode", v)}
              label="Dark mode"
            />
          </Row>
        </Section>

        {/* Data */}
        <Section title="Data">
          <Row icon={<RotateCcw />} label="Reset progress" hint="Clear all your stats">
            <button className="danger-btn" onClick={() => setShowResetConfirm(true)}>
              Reset
            </button>
          </Row>
        </Section>

        {/* About */}
        <Section title="About">
          <Row icon={<Info />} label="About / Version" hint={`v${APP_VERSION}`}>
            <button className="ghost-btn" onClick={() => setShowAbout(true)}>
              <ChevronRight />
            </button>
          </Row>
        </Section>
      </main>

      {showResetConfirm && (
        <ConfirmModal
          title="Reset progress?"
          message="This will erase all your learning stats and streaks. This action cannot be undone."
          confirmLabel="Reset"
          onConfirm={() => {
            onReset();
            setShowResetConfirm(false);
          }}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}

      {showAbout && (
        <AboutModal version={APP_VERSION} onClose={() => setShowAbout(false)} />
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="section">
      <h2 className="section-title">{title}</h2>
      <div className="section-body">{children}</div>
    </section>
  );
}

function Row({
  icon,
  label,
  hint,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="row">
      <div className="row-icon">{icon}</div>
      <div className="row-text">
        <span className="row-label">{label}</span>
        {hint && <span className="row-hint">{hint}</span>}
      </div>
      <div className="row-action">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`toggle ${checked ? "toggle-on" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-knob" />
    </button>
  );
}

function ConfirmModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onCancel} aria-label="Close">
            <X />
          </button>
        </div>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="ghost-btn modal-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="danger-btn modal-btn" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function AboutModal({ version, onClose }: { version: string; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3>About</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>
        <div className="about-body">
          <div className="about-logo">Aa</div>
          <h4>Language Learning</h4>
          <p className="about-version">Version {version}</p>
          <p className="about-text">
            A focused daily language practice app. Set your goal, pick your level,
            and build a streak — one word at a time.
          </p>
        </div>
      </div>
    </div>
  );
}
