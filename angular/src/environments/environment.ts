// environment.ts — development
// Values are read from the Angular build environment.
// SUPABASE_ANON_KEY is safe to expose in Angular (it is public by design).

export const environment = {
  production:      false,
  supabaseUrl:     'https://dpnkxrrtqfqkhuzbljbw.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbmt4cnJ0cWZxa2h1emJsamJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MjEzMjMsImV4cCI6MjA5MDM5NzMyM30.iAUiT3qpUpjxg1JMkybHII48hiEeJW449Gp3rl_UHFQ',
  divisionMcpUrl:      'http://localhost:3001',
  documentMcpUrl:      'http://localhost:3002',
  deliveryCycleMcpUrl: 'http://localhost:3003'
};
