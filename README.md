# Vida Smart Supabase V3

Sistema Vida Smart v3 - Plataforma de acompanhamento saudável por IA com backend Supabase.

## Setup

### Prerequisites
- Node.js 18+
- Supabase CLI
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/agenciaclimb/vida-smart-supabase-V3.git
cd vida-smart-supabase-V3
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your Supabase project credentials.

### Development

1. Start Supabase locally:
```bash
supabase start
```

2. Link to your remote project:
```bash
supabase link --project-id zzugbgoylwbaojdnunuz
```

3. Pull remote schema:
```bash
supabase db pull
```

4. Generate TypeScript types:
```bash
supabase gen types typescript --local > src/types/database.types.ts
```

### Deployment

The project automatically deploys to Supabase when changes are pushed to the `main` branch via GitHub Actions.

## Project Structure

- `src/types/` - TypeScript type definitions
- `supabase/migrations/` - Database migration files
- `supabase/functions/` - Edge Functions
- `.github/workflows/` - CI/CD configuration

## Environment Variables

See `.env.example` for required environment variables.
