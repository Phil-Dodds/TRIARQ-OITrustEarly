// environment.ts — development
// Values are read from the Angular build environment.
// SUPABASE_ANON_KEY is safe to expose in Angular (it is public by design).

export const environment = {
  production:      false,
  supabaseUrl:     'https://dpnkxrrtqfqkhuzbljbw.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbmt4cnJ0cWZxa2h1emJsamJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MjEzMjMsImV4cCI6MjA5MDM5NzMyM30.iAUiT3qpUpjxg1JMkybHII48hiEeJW449Gp3rl_UHFQ',
  divisionMcpUrl:      'http://localhost:3001',
  documentMcpUrl:      'http://localhost:3002',
  deliveryCycleMcpUrl: 'http://localhost:3003',
  // Contract 31 (D-473/D-475): public initiative-public-mcp base URL. Used ONLY
  // to render the Setup Instructions config block on /admin/api-keys — Angular
  // never calls this server (it is API-key authed for external Claude Desktop
  // clients). Phil sets the real deployed value in environment.production.ts.
  initiativeMcpBaseUrl: 'http://localhost:3004'
};
