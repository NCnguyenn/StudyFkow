"use client";

/**
 * ProfileHero — Facebook-style cover photo + avatar banner.
 *
 * Features:
 *   - Full-width cover photo with upload (localforage)
 *   - Overlapping avatar with shape/fit toggles
 *   - Inline-editable display name, bio, location, occupation
 *   - Parallax mouse-tracking on cover photo
 *   - Ambient particle decorations
 */

import { useRef, useState, useEffect, type ChangeEvent } from "react";
import {
  Upload,
  Camera,
  MapPin,
  Briefcase,
  Edit3,
  Check,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { AvatarShape, AvatarFit } from "./useProfileData";

interface ProfileHeroProps {
  displayName: string;
  bioText: string;
  location: string;
  occupation: string;
  avatarBase64: string | null;
  coverBase64: string | null;
  avatarShape: AvatarShape;
  avatarFit: AvatarFit;
  onUpdateName: (v: string) => void;
  onUpdateBio: (v: string) => void;
  onUpdateLocation: (v: string) => void;
  onUpdateOccupation: (v: string) => void;
  onUploadAvatar: (file: File) => void;
  onUploadCover: (file: File) => void;
  onToggleShape: () => void;
  onToggleFit: () => void;
}

// ─── Ambient Particles (CSS-only) ──────────────────────────────────

function AmbientParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/30 animate-float"
          style={{
            width: `${4 + Math.random() * 8}px`,
            height: `${4 + Math.random() * 8}px`,
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            animationDelay: `${Math.random() * 6}s`,
            animationDuration: `${5 + Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Inline Editable Text ──────────────────────────────────────────

function InlineEdit({
  value,
  onChange,
  placeholder,
  className,
  maxLength = 100,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
  maxLength?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== value) onChange(draft.trim());
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") { setDraft(value); setEditing(false); }
          }}
          maxLength={maxLength}
          className={`bg-white/30 border border-white/50 rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 ${className ?? ""}`}
        />
        <button onClick={commit} className="text-emerald-500 hover:text-emerald-600">
          <Check className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`group flex items-center gap-1.5 hover:bg-white/20 rounded-lg px-1.5 py-0.5 transition-colors ${className ?? ""}`}
      title="Click to edit"
    >
      <span className={value ? "text-inherit" : "text-slate-400 italic"}>
        {value || placeholder}
      </span>
      <Edit3 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────

export function ProfileHero({
  displayName,
  bioText,
  location,
  occupation,
  avatarBase64,
  coverBase64,
  avatarShape,
  avatarFit,
  onUpdateName,
  onUpdateBio,
  onUpdateLocation,
  onUpdateOccupation,
  onUploadAvatar,
  onUploadCover,
  onToggleShape,
  onToggleFit,
}: ProfileHeroProps) {
  const { soulColor } = useAppStore();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Parallax state
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 5;
    setParallax({ x, y });
  };

  const handleMouseLeave = () => setParallax({ x: 0, y: 0 });

  const handleCoverChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUploadCover(file);
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUploadAvatar(file);
  };

  const avatarClipPath = avatarShape === "circle" ? "rounded-full" : "rounded-2xl";

  return (
    <div className="w-full mb-8">
      {/* ── Cover Photo ── */}
      <div
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full h-48 md:h-64 rounded-3xl overflow-hidden glass-panel group cursor-pointer"
      >
        {coverBase64 ? (
          <img
            src={coverBase64}
            alt="Cover"
            className="w-full h-full object-cover transition-transform duration-500 ease-out"
            style={{
              transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0) scale(1.05)`,
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-200/40 via-violet-200/30 to-cyan-200/40 flex items-center justify-center">
            <AmbientParticles />
            <p className="text-slate-400 text-sm font-medium z-10">Click to add a cover photo</p>
          </div>
        )}

        {/* Cover photo upload overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <button
            onClick={() => coverInputRef.current?.click()}
            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 backdrop-blur-md text-slate-700 text-sm font-semibold shadow-lg hover:bg-white"
          >
            <Camera className="w-4 h-4" />
            {coverBase64 ? "Change Cover" : "Add Cover"}
          </button>
        </div>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={handleCoverChange}
          className="hidden"
        />

        {/* Subtle gradient overlay at bottom for text contrast */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/15 to-transparent pointer-events-none" />
      </div>

      {/* ── Profile Info Row (overlapping avatar) ── */}
      <div className="relative flex flex-col md:flex-row items-center md:items-end gap-4 px-6 -mt-16 md:-mt-14">
        {/* Avatar */}
        <div className="relative flex-shrink-0 z-10">
          <div
            className={`w-32 h-32 border-4 border-white shadow-xl overflow-hidden bg-white/40 backdrop-blur-md flex items-center justify-center ${avatarClipPath} transition-all duration-300`}
            style={{ boxShadow: `0 10px 30px -5px ${soulColor}50` }}
          >
            {avatarBase64 ? (
              <img
                src={avatarBase64}
                alt="Avatar"
                className={`w-full h-full transition-all ${
                  avatarFit === "cover" ? "object-cover" : "object-contain"
                }`}
              />
            ) : (
              <span className="text-4xl">🌸</span>
            )}
          </div>

          {/* Avatar upload button */}
          <button
            onClick={() => avatarInputRef.current?.click()}
            className="absolute bottom-1 right-1 p-2 rounded-full bg-white shadow-md border border-slate-100 hover:bg-slate-50 transition-colors z-10"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />

          {/* Shape & Fit toggles */}
          <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            <button
              onClick={onToggleShape}
              className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/60 backdrop-blur-md border border-white/50 text-slate-500 hover:text-indigo-600 transition-all"
            >
              {avatarShape === "circle" ? "○" : "▢"}
            </button>
            <button
              onClick={onToggleFit}
              className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/60 backdrop-blur-md border border-white/50 text-slate-500 hover:text-indigo-600 transition-all"
            >
              {avatarFit === "cover" ? "Fill" : "Fit"}
            </button>
          </div>
        </div>

        {/* Name + Meta */}
        <div className="flex-1 text-center md:text-left pb-2 mt-8 md:mt-0">
          <InlineEdit
            value={displayName}
            onChange={onUpdateName}
            placeholder="Your Name"
            className="text-2xl font-bold text-slate-800 tracking-tight"
            maxLength={50}
          />
          <InlineEdit
            value={bioText}
            onChange={onUpdateBio}
            placeholder="Write a short bio or intention..."
            className="text-sm text-slate-500 italic mt-0.5"
            maxLength={160}
          />
          <div className="flex flex-wrap items-center gap-3 mt-2 justify-center md:justify-start">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <MapPin className="w-3 h-3" />
              <InlineEdit
                value={location}
                onChange={onUpdateLocation}
                placeholder="Location"
                className="text-xs text-slate-500"
              />
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Briefcase className="w-3 h-3" />
              <InlineEdit
                value={occupation}
                onChange={onUpdateOccupation}
                placeholder="School / Work"
                className="text-xs text-slate-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
