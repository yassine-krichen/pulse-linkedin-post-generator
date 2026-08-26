import fs from 'fs';
import path from 'path';

const CONTENT_SYSTEM_DIR = path.join(process.cwd(), '..', 'content-studio');
const LINKEDIN_PROFILE_PATH = path.join(process.cwd(), '..', 'docs', 'linkedin-profile.md');

function readFile(filePath: string): string {
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf-8');
}

export interface ProfileContext {
  profile: string;
  linkedinProfile: string;
  combined: string;
}

let cached: ProfileContext | null = null;

// Every pipeline/regenerate/trending call was re-reading 4 files off disk.
// These files only change when the user edits their profile/examples by
// hand, so cache for the lifetime of the process.
export function loadProfileContext(): ProfileContext {
  if (cached) return cached;
  cached = readProfileContext();
  return cached;
}

function readProfileContext(): ProfileContext {
  const profilePath = path.join(CONTENT_SYSTEM_DIR, 'PROFILE.md');

  const profile = readFile(profilePath);
  const linkedinProfile = readFile(LINKEDIN_PROFILE_PATH);

  const combined = [
    profile ? `USER PROFILE:\n${profile}` : '',
    linkedinProfile ? `LINKEDIN PROFILE CONTEXT:\n${linkedinProfile}` : '',
  ]
    .filter(Boolean)
    .join('\n\n---\n\n');

  return { profile, linkedinProfile, combined };
}
