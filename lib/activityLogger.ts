import { logUserActivity } from './api';
import { supabase } from './supabase';

// Centralized helper to record user activity without breaking the UI if logging fails.
type ActivityLogInput = {
  activityType: string;
  activityId?: string | null;
  description?: string | null;
  userId?: string | null;
};

const describeError = (error: unknown) => {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch (_e) {
    return 'Unknown error';
  }
};

export const logActivityEvent = async ({ activityType, activityId = null, description = null, userId }: ActivityLogInput) => {
  try {
    const resolvedUserId = userId
      ?? (await supabase.auth.getUser()).data.user?.id
      ?? 'anonymous';

    await logUserActivity(resolvedUserId, activityType, activityId, description);
  } catch (err) {
    console.warn('[ActivityLogger] Failed to log activity', err);
  }
};

export const logErrorEvent = async (
  activityType: string,
  error: unknown,
  options?: Omit<ActivityLogInput, 'activityType' | 'description'>,
) => {
  const description = describeError(error);
  await logActivityEvent({ activityType, description, ...options });
};
