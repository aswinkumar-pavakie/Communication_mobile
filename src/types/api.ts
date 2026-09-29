// Mirrors the backend's DTOs/enums (Communication_backend/prisma/schema.prisma).
// Kept intentionally plain (no class-validator etc.) - this is a read-side contract only.

export type Role = 'STUDENT' | 'ADMIN' | 'FACULTY' | 'TRAINER' | 'INSTITUTION_ADMIN' | 'SUPER_ADMIN';

export type SkillCode =
  | 'GRAMMAR'
  | 'VOCABULARY'
  | 'FLUENCY'
  | 'PRONUNCIATION'
  | 'LISTENING'
  | 'CLARITY'
  | 'CONFIDENCE'
  | 'PROFESSIONAL_TONE'
  | 'INTERVIEW'
  | 'CRITICAL_THINKING'
  | 'TECHNICAL_COMMUNICATION';

export type ActivityType =
  | 'SPEAKING'
  | 'INTERVIEW'
  | 'ROLEPLAY'
  | 'DEBATE'
  | 'VOCABULARY'
  | 'GRAMMAR'
  | 'LISTENING'
  | 'PRONUNCIATION'
  | 'WRITING'
  | 'NETWORKING';

export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type AttemptStatus = 'STARTED' | 'COMPLETED' | 'ABANDONED';
export type ProgressTrend = 'IMPROVING' | 'DECLINING' | 'STABLE';
export type InterviewType = 'HR' | 'TECHNICAL' | 'PROJECT';
export type RoleplayScenario =
  | 'TEAM_CONFLICT'
  | 'TALKING_TO_MANAGER'
  | 'CUSTOMER_CONVERSATION'
  | 'ASKING_FOR_HELP'
  | 'GIVING_FEEDBACK'
  | 'HANDLING_DISAGREEMENT'
  | 'WORKPLACE_PROBLEM_SOLVING';
export type DebatePosition = 'FOR' | 'AGAINST';
export type WritingType =
  | 'EMAIL'
  | 'FOLLOW_UP_EMAIL'
  | 'INTERNSHIP_REQUEST'
  | 'MEETING_REQUEST'
  | 'PROJECT_UPDATE'
  | 'PROFESSIONAL_CHAT';
export type MessageRole = 'SYSTEM' | 'USER' | 'ASSISTANT';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface StudentProfileSummary {
  id: string;
  firstName: string;
  lastName: string;
  department?: string | null;
  year?: number | null;
  batch?: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  role: Role;
  studentProfile?: StudentProfileSummary | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface Skill {
  id: string;
  code: SkillCode;
  name: string;
  description?: string | null;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  type: ActivityType;
  difficulty: Difficulty;
  durationMinutes: number;
  instructions?: string | null;
  skill: Skill;
}

export interface AssessmentResult {
  id: string;
  overallScore: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  suggestedResponse?: string | null;
  scores: { skillId: string; score: number; skill: Skill }[];
}

export interface ActivityAttempt {
  id: string;
  studentId: string;
  activityId: string;
  status: AttemptStatus;
  startedAt: string;
  completedAt?: string | null;
  responseText?: string | null;
  audioUrl?: string | null;
  overallScore?: number | null;
}

export interface AttemptResult {
  attempt: ActivityAttempt;
  assessment: AssessmentResult;
}

export interface SkillProgress {
  skillCode: SkillCode;
  skillName: string;
  currentScore: number;
  previousScore: number | null;
  trend: ProgressTrend;
  lastAssessedAt: string;
}

export interface ProgressOverview {
  overallScore: number;
  skills: SkillProgress[];
}

export interface ProgressHistory {
  skillHistory: { skillCode: string; skillName: string; points: { date: string; score: number }[] }[];
  recentAssessments: { id: string; overallScore: number; feedback: string; createdAt: string }[];
  weeklyActivity: { date: string; count: number }[];
}

export interface Recommendation {
  id: string;
  skillCode: SkillCode;
  reason: string;
  priority: number;
  activity: { id: string; title: string } | null;
}

export interface DashboardResponse {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: string | null;
    year?: number | null;
    batch?: string | null;
  };
  overallScore: number;
  skills: SkillProgress[];
  todayActivities: Activity[];
  recommendations: Recommendation[];
  recentActivity: {
    attemptId: string;
    activityTitle: string;
    activityType: ActivityType;
    overallScore: number | null;
    completedAt: string | null;
  }[];
  placementReadiness: { score: number; label: 'READY' | 'DEVELOPING' | 'NEEDS_PRACTICE' };
  streak: { currentStreak: number; longestStreak: number };
}

export interface Interview {
  id: string;
  title: string;
  type: InterviewType;
  description?: string | null;
  difficulty: Difficulty;
  durationMinutes: number;
  totalQuestions?: number;
}

export interface InterviewQuestion {
  id: string;
  order: number;
  questionText: string;
  category?: string | null;
}

export interface InterviewAnswer {
  id: string;
  answerText?: string | null;
  score?: number | null;
  feedback?: unknown;
}

export interface Roleplay {
  id: string;
  title: string;
  scenario: RoleplayScenario;
  description?: string | null;
  difficulty: Difficulty;
}

export interface Debate {
  id: string;
  topic: string;
  description?: string | null;
  difficulty: Difficulty;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface WritingActivity {
  id: string;
  title: string;
  description?: string | null;
  type: WritingType;
  prompt: string;
  difficulty: Difficulty;
}

export interface WritingSubmission {
  id: string;
  content: string;
  overallScore?: number | null;
  feedback?: { feedback: string; strengths: string[]; weaknesses: string[]; suggestedResponse?: string } | null;
  createdAt: string;
}

export interface Report {
  id: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  skillBreakdown: SkillProgress[];
  strengths: string[];
  weaknesses: string[];
  improvement: Record<string, number>;
  interviewReadiness: { score: number; label: string };
  recommendedActions: string[];
  createdAt: string;
}
