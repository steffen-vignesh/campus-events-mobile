import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const supabase = createClient(
  "https://lunoscljzlkzepqekmpm.supabase.co",
  "sb_publishable_Qi7YyBj98bSoOFstHXaFjw_0ZgfF9j8",
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
