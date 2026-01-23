import axios from 'axios';
import { supabase } from './supabase';

console.log("[API] api.ts module loaded (Native)");

const BACKEND_API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://api.sanctuaryapp.us';

const apiClient = axios.create({
  baseURL: BACKEND_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

apiClient.interceptors.request.use(async (config) => {
  if (apiClient.defaults.headers.common['Authorization']) {
    return config;
  }

  // Helper to wait for session (RN version)
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) {
      config.headers.Authorization = `Bearer ${data.session.access_token}`;
    }
  } catch (err) {
    // Ignore
  }
  return config;
}, (error) => Promise.reject(error));

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
        .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !data.session) throw refreshError;
        
        const newToken = data.session.access_token;
        setAuthToken(newToken);
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        processQueue(null, newToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// --- API METHODS ---

export const fetchDailyNewsSynopsis = async () => {
    try {
      const response = await apiClient.get('/daily-news-synopses', {
        params: { limit: 1, order: 'desc' }
      });
      return response.data && response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      console.error('Error fetching daily news synopsis:', error);
      return null;
    }
  };

export const fetchUserProfile = async (userId: string) => {
    try {
      const response = await apiClient.get(`/user-profile/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
};

export const fetchGeneralDevotional = async () => {
    // Using supabase directly for this as per web app
    const today = new Date().toISOString().split('T')[0];
    
    // Simplistic query for today's generic devotional
    // In web app it queries 'general_devotionals' by date or ID
    try {
      const { data, error } = await supabase
        .from('general_devotionals')
        .select('*')
         // Logic to get "today's" or latest
        .limit(1)
        .order('date', { ascending: false })
        .maybeSingle();

      if (error || !data) return null;

      return {
        devotional: {
          devotional_id: `general-${data.id}`,
          title: data.title,
          content: data.content,
          scripture: data.scripture_reference,
          created_at: data.created_at,
          type: 'general',
        },
        prayer: {
          prayer_id: `general-${data.id}`,
          generated_prayer: data.prayer,
          created_at: data.created_at,
          type: 'general',
        }
      };
    } catch (err) {
        console.error("Error general devotional:", err);
        return null;
    }
}

export const fetchUserStreak = async (userId: string, activityType: string) => {        
    try {
      const response = await apiClient.get(`/streak/${userId}/${activityType}`);        
      return response.data;
    } catch (error) {
      return { current_streak: 0 };
    }
};

export const fetchCommunityStats = async () => {
    try {
      const response = await apiClient.get('/community/stats');
      return response.data;
    } catch (error) {
      return { totalPrayedForYou: 0 };
    }
};

export const fetchDailyDevotionals = async (userId: string) => {
    try {
        const response = await apiClient.get(`/devotionals/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching devotionals:', error);
        return [];
    }
};

export const fetchDailyPrayers = async (userId: string) => {
     try {
        const response = await apiClient.get(`/prayers/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching prayers:', error);
        return [];
    }
}

export const logUserActivity = async (userId: string, activityType: string, activityId: string | null = null, description: string | null = null) => {
    try {
      await apiClient.post('/log-activity', {
        userId,
        activityType,
        activityId,
        description
      });
    } catch (error) {
      console.error('Error logging user activity:', error);
    }
};

export const checkAdviceLimit = async (userId: string) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    try {
        const { count } = await supabase
        .from('advice_guidance')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfMonth);
        return { usage: count || 0, limitReached: (count || 0) >= 1 };
    } catch (error) {
        return { usage: 0, limitReached: false };
    }
}

export const fetchAppOptions = async () => {
    try {
      const response = await apiClient.get('/app-options');
      return response.data;
    } catch (error) {
      console.error('Error fetching app options:', error);
      return null;
    }
};

export const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/categories');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
};

export const fetchUserFollowedCategories = async (userId: string) => {
    try {
      const response = await apiClient.get('/user-followed-categories/' + userId);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching followed categories:', error);
      return [];
    }
};

export const updateUserProfile = async (userId: string, updates: any) => {
    try {
      const response = await apiClient.post('/user-profile/' + userId, updates);        
      console.log('Updated user profile:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
};

export const updateUserFollowedCategories = async (userId: string, categoryIds: number[]) => {
    try {
      const response = await apiClient.post('/user-followed-categories/' + userId, { categoryIds });
      return response.data;
    } catch (error) {
      console.error('Error updating user categories:', error);
      return null;
    }
};


export const fetchAdvice = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('advice_guidance')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching advice:', error);
        return [];
    }
};

export const fetchAdviceById = async (adviceId: string) => {
    try {
        const { data, error } = await supabase
            .from('advice_guidance')
            .select('*')
            .eq('advice_id', adviceId)
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching advice by id:', error);
        return null;
    }
};

export const deleteAdvice = async (adviceId: string) => {
    try {
        const { error } = await supabase
            .from('advice_guidance')
            .delete()
            .eq('advice_id', adviceId);
            
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting advice:', error);
        return false;
    }
};

export const generateContent = async (endpoint: string, body: any) => {
    try {
        const response = await apiClient.post(endpoint, body);
        return response.data;
    } catch (error) {
        console.error('Error generating content at ' + endpoint + ':', error);
        return null;
    }
};


export const fetchDevotionalById = async (id: string) => {
    try {
        if (id.startsWith('general-')) {
            const realId = id.replace('general-', '');
            const { data, error } = await supabase
                .from('general_devotionals')
                .select('*')
                .eq('id', realId)
                .single();
            
            if (error) throw error;
            return {
                devotional_id: `general-${data.id}`,
                title: data.title,
                content: data.content,
                scripture: data.scripture_reference,
                prayer: data.prayer,
                created_at: data.created_at,
                type: 'general',
            };
        } else {
            const { data, error } = await supabase
                .from('daily_devotionals')
                .select('*')
                .eq('devotional_id', id)
                .single();
            
            if (error) throw error;
            return data;
        }
    } catch (error) {
        console.error('Error fetching devotional by id:', error);
        return null;
    }
};

export const fetchPrayerById = async (id: string) => {
    try {
        if (id.startsWith('general-')) {
            const realId = id.replace('general-', '');
            const { data, error } = await supabase
                .from('general_devotionals')
                .select('*')
                .eq('id', realId)
                .single();
            
            if (error) throw error;
            return {
                prayer_id: `general-${data.id}`,
                content: data.prayer,
                title: "Daily Prayer",
                created_at: data.created_at,
                type: 'general',
            };
        } else {
             const { data, error } = await supabase
                .from('daily_prayers')
                .select('*')
                .eq('prayer_id', id)
                .single();
             
             if (error) throw error;
             return data;
        }
    } catch (error) {
        console.error('Error fetching prayer by id:', error);
        return null;
    }
};

export const fetchNewsArticles = async (params: {
    page?: number;
    limit?: number;
    topic_id?: string;
    category_id?: string;
    category_ids?: string; 
    q?: string;
  }) => {
    try {
      if (params.q) {
        const response = await apiClient.get('/search', {
          params: { q: params.q, limit: params.limit || 20 }
        });
        return response.data.results || [];
      }
      const response = await apiClient.get('/scriptural-outlooks', {
        params: params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching news articles:', error);
      return [];
    }
};
export const fetchNewsList = async () => {
    try {
      const response = await apiClient.get('/daily-news-synopses', {
        params: { limit: 20, order: 'desc' }
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching news list:', error);
      return [];
    }
};

export const fetchNewsById = async (id: string) => {
  console.log("[API] fetchNewsById called with id:", id);
    try {
      const response = await apiClient.get(`/scriptural-outlooks/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching article:', error);
      return null;
    }
};



export const fetchFavorites = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching favorites:', error);
        return [];
    }
};

export const fetchRandomCommunityPrayer = async () => {
  try {
    const response = await apiClient.get('/community/pray-for-others');
    return response.data;
  } catch (error) {
    console.error("Error fetching random prayer:", error);
    return null;
  }
};

export const markPrayerAsPrayed = async (prayerId: string) => {
  try {
    const response = await apiClient.post(`/community/pray/${prayerId}`);
    return response.data;
  } catch (error) {
    console.error("Error marking prayer:", error);
    return null;
  }
};

export const submitPrayerRequest = async (userId: string, content: string) => {
  try {
    const response = await apiClient.post('/community/request', { userId, content });
    return response.data;
  } catch (error) {
    console.error("Error submitting prayer:", error);
    throw error;
  }
};

export const deleteDevotional = async (devotionalId: string) => {
    try {
        const response = await apiClient.delete(`/devotionals/${devotionalId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting devotional:', error);
        return null;
    }
};

export const deletePrayer = async (prayerId: string) => {
    try {
        const response = await apiClient.delete(`/prayers/${prayerId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting prayer:', error);
        return null;
    }
};