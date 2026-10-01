import { apiClient, unwrap } from '@/lib/api-client';
import type { ApiSuccessResponse, StreakCalendar } from '@/types/api';

/** `month` is "YYYY-MM". */
export async function fetchStreakCalendar(month: string): Promise<StreakCalendar> {
  const response = await apiClient.get<ApiSuccessResponse<StreakCalendar>>('/streaks/calendar', {
    params: { month },
  });
  return unwrap(response);
}

export async function fetchStreakReminders(): Promise<{ streakReminderEmails: boolean }> {
  const response = await apiClient.get<ApiSuccessResponse<{ streakReminderEmails: boolean }>>('/streaks/reminders');
  return unwrap(response);
}

export async function updateStreakReminders(enabled: boolean): Promise<{ streakReminderEmails: boolean }> {
  const response = await apiClient.patch<ApiSuccessResponse<{ streakReminderEmails: boolean }>>('/streaks/reminders', {
    streakReminderEmails: enabled,
  });
  return unwrap(response);
}
