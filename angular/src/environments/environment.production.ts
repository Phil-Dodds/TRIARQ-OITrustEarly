// environment.production.ts
// Values injected at build time via Angular CLI --configuration production.

export const environment = {
  production:      true,
  supabaseUrl:     'https://dpnkxrrtqfqkhuzbljbw.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbmt4cnJ0cWZxa2h1emJsamJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MjEzMjMsImV4cCI6MjA5MDM5NzMyM30.iAUiT3qpUpjxg1JMkybHII48hiEeJW449Gp3rl_UHFQ',
  // Redirect target for Supabase invite and password-reset emails (D-248).
  passwordSetUrl:      'https://phil-dodds.github.io/TRIARQ-OITrustEarly/auth/set-password',
  divisionMcpUrl:      'https://division-mcp.onrender.com',
  documentMcpUrl:      'https://document-access-mcp.onrender.com',
  deliveryCycleMcpUrl: 'https://delivery-cycle-mcp.onrender.com'
};
