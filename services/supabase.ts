import { createClient } from '@supabase/supabase-js';

// Configuration générée à partir de votre clé
const supabaseUrl = 'https://zafmtyqrtgiwfydkfmgq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphZm10eXFydGdpd2Z5ZGtmbWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODA2MzgsImV4cCI6MjA3OTE1NjYzOH0.EZlhqXNTOMUugl_OykAT4rAZ_4j6WilBszAnVUEgpYQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);