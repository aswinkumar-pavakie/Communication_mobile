import type { TileIcon } from '@/components/ui/icon-tile-card';
import type { ActivityType, InterviewType, RoleplayScenario, WritingType } from '@/types/api';

/** One icon + color per practice mode/sub-type, so every list and feed shows the same symbol. */

export const ACTIVITY_TYPE_ICON: Record<ActivityType, TileIcon> = {
  SPEAKING: { name: 'microphone-outline', color: '#0284C7' },
  INTERVIEW: { name: 'account-tie-outline', color: '#0284C7' },
  ROLEPLAY: { name: 'drama-masks', color: '#DB2777' },
  DEBATE: { name: 'forum-outline', color: '#DC2626' },
  VOCABULARY: { name: 'book-alphabet', color: '#8B5CF6' },
  GRAMMAR: { name: 'format-letter-case', color: '#6366F1' },
  LISTENING: { name: 'headphones', color: '#0891B2' },
  PRONUNCIATION: { name: 'account-voice', color: '#F59E0B' },
  WRITING: { name: 'pencil-outline', color: '#8B5CF6' },
  NETWORKING: { name: 'account-group-outline', color: '#10B981' },
};

export const INTERVIEW_TYPE_ICON: Record<InterviewType, TileIcon> = {
  HR: { name: 'account-tie-outline', color: '#0284C7' },
  TECHNICAL: { name: 'code-braces', color: '#6366F1' },
  PROJECT: { name: 'clipboard-text-outline', color: '#16A34A' },
};

export const ROLEPLAY_SCENARIO_ICON: Record<RoleplayScenario, TileIcon> = {
  TEAM_CONFLICT: { name: 'account-group-outline', color: '#DC2626' },
  TALKING_TO_MANAGER: { name: 'account-tie-voice-outline', color: '#0284C7' },
  CUSTOMER_CONVERSATION: { name: 'face-agent', color: '#F97316' },
  ASKING_FOR_HELP: { name: 'hand-heart-outline', color: '#8B5CF6' },
  GIVING_FEEDBACK: { name: 'comment-quote-outline', color: '#10B981' },
  HANDLING_DISAGREEMENT: { name: 'scale-balance', color: '#E11D48' },
  WORKPLACE_PROBLEM_SOLVING: { name: 'puzzle-outline', color: '#EA580C' },
};

export const WRITING_TYPE_ICON: Record<WritingType, TileIcon> = {
  EMAIL: { name: 'email-outline', color: '#0284C7' },
  FOLLOW_UP_EMAIL: { name: 'email-fast-outline', color: '#0891B2' },
  INTERNSHIP_REQUEST: { name: 'briefcase-outline', color: '#7C3AED' },
  MEETING_REQUEST: { name: 'calendar-clock', color: '#F59E0B' },
  PROJECT_UPDATE: { name: 'chart-timeline-variant', color: '#16A34A' },
  PROFESSIONAL_CHAT: { name: 'chat-processing-outline', color: '#DB2777' },
};

const DEBATE_KEYWORD_ICON: [RegExp, TileIcon][] = [
  [/\bai\b|artificial|robot|automation/i, { name: 'robot-outline', color: '#6366F1' }],
  [/remote|office|work from/i, { name: 'laptop', color: '#0284C7' }],
  [/social media|phone|internet/i, { name: 'cellphone', color: '#DB2777' }],
  [/education|exam|college|school/i, { name: 'school-outline', color: '#8B5CF6' }],
  [/environment|climate|green/i, { name: 'leaf', color: '#16A34A' }],
];

export function debateIcon(topic: string): TileIcon {
  return DEBATE_KEYWORD_ICON.find(([re]) => re.test(topic))?.[1] ?? { name: 'scale-balance', color: '#DC2626' };
}
