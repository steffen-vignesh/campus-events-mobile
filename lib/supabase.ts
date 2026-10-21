import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const supabase = createClient(
  "https://oyezdgezyhfpzivxyiyc.supabase.co",
  "sb_publishable_smpClswQfC67urVbgQs2UQ_RW2LGyWE",
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
