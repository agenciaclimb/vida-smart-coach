# 🚀 Vida Smart V3.0 - Supabase Backend

## 📋 Overview

Complete Supabase backend infrastructure for Vida Smart V3.0, including database schema, Edge Functions, and comprehensive migration system for the AI-powered health coaching platform.

## 🏗️ Architecture

### Core Components
- **PostgreSQL Database** - User data, health tracking, gamification
- **Edge Functions** - WhatsApp integration, AI processing, admin operations
- **Row Level Security** - Comprehensive data access control
- **Real-time Subscriptions** - Live data updates
- **Authentication** - Supabase Auth with custom claims

### Key Features
- ✅ **Error 500 Fix Implemented** - Resolved signup authentication issues
- ✅ **System Logger** - Comprehensive logging Edge Function
- ✅ **JWT Custom Claims** - Enhanced authentication system
- ✅ **RLS Verification** - Row Level Security validation
- ✅ **WhatsApp Integration** - Evolution API webhook processing
- ✅ **AI Coach** - OpenAI GPT-3.5 integration
- ✅ **Gamification** - Points, levels, badges, streaks
- ✅ **Admin Dashboard** - Affiliate management system

## 📊 Database Schema

### Tables (6)
| Table | Purpose | Key Features |
|-------|---------|--------------|
| `plans` | Subscription plans | Public read, pricing info |
| `rewards` | Gamification rewards | Badges, achievements |
| `user_profiles` | User information | Health data, preferences |
| `daily_checkins` | Health tracking | Mood, energy, sleep, exercise |
| `gamification` | User progress | Points, levels, streaks |
| `whatsapp_messages` | Message history | AI responses, processing |

### Custom Functions (6)
- `update_updated_at_column()` - Automatic timestamps
- `create_gamification_for_user()` - Auto-create gamification
- `calculate_user_level()` - Level calculation logic
- `update_user_streak()` - Streak management
- `award_points()` - Point system
- `get_user_stats()` - Comprehensive user statistics

### Triggers (7)
- Automatic timestamp updates
- Gamification record creation
- Point awarding system
- Data validation
- Security enforcement

### RLS Policies (15)
- User-specific data access
- Service role permissions
- Public read access for plans/rewards
- Role escalation prevention

## 🔧 Edge Functions

### Core Functions
| Function | Purpose | Dependencies |
|----------|---------|--------------|
| `evolution-webhook` | WhatsApp message processing | OpenAI, Evolution API |
| `admin-affiliates` | List affiliate partners | Supabase Auth |
| `admin-create-affiliate` | Create new affiliates | Supabase Auth |
| `admin-delete-affiliate` | Remove affiliates | Supabase Auth |

### Utility Functions
| Function | Purpose | Dependencies |
|----------|---------|--------------|
| `get-active-provider` | Provider status | None |
| `evolution-qr` | QR code generation | Evolution API |
| `hello-world` | Health check/testing | None |
| `get-google-credentials` | Google OAuth | Google APIs |
| `get-google-calendar-credentials` | Calendar OAuth | Google Calendar API |

## 🌍 Environment Variables

### Required Core Variables
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=sk-your_openai_key
EVOLUTION_API_URL=https://your-evolution-api.com
EVOLUTION_API_KEY=your_evolution_key
EVOLUTION_INSTANCE_ID=your_instance_id
```

### Optional Integration Variables
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALENDAR_CLIENT_ID=your_calendar_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=your_calendar_secret
```

## 🚀 Quick Start

### 1. Setup Project
```bash
# Clone repository
git clone https://github.com/agenciaclimb/vida-smart-coach.git
cd vida-smart-coach/supabase

# Install Supabase CLI
npm install -g supabase

# Initialize and link project
supabase init
supabase link --project-ref YOUR_PROJECT_ID
```

### 2. Database Setup
```bash
# Run all migrations
supabase db push

# Or run schema files individually
supabase db push --file schema/00_initial_schema.sql
supabase db push --file schema/01_functions.sql
supabase db push --file schema/02_triggers.sql
supabase db push --file schema/03_policies.sql
```

### 3. Deploy Functions
```bash
# Deploy all Edge Functions
supabase functions deploy

# Or deploy individually
supabase functions deploy evolution-webhook
supabase functions deploy admin-affiliates
```

### 4. Configure Secrets
```bash
# Set required environment variables
supabase secrets set OPENAI_API_KEY=your_key
supabase secrets set EVOLUTION_API_URL=your_url
supabase secrets set EVOLUTION_API_KEY=your_key
supabase secrets set EVOLUTION_INSTANCE_ID=your_id
```

## 🧪 Local Development

### Start Local Environment
```bash
# Start Supabase locally
supabase start

# Serve Edge Functions locally
supabase functions serve

# Reset database (with migrations)
supabase db reset
```

### Testing
```bash
# Test database connection
supabase db ping

# Test specific function
curl -X POST http://localhost:54321/functions/v1/hello-world \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}'

# View logs
supabase logs
```

## 📁 Directory Structure

```
supabase/
├── migrations/                 # Database migrations (chronological)
│   ├── 20240101000000_create_plans_table.sql
│   ├── 20240101000001_create_rewards_table.sql
│   ├── 20240101000002_create_user_profiles_table.sql
│   ├── 20240101000003_create_daily_checkins_table.sql
│   ├── 20240101000004_create_gamification_table.sql
│   └── 20250831170636_create_whatsapp_messages.sql
├── functions/                  # Edge Functions (Deno/TypeScript)
│   ├── evolution-webhook/
│   │   └── index.ts
│   ├── admin-affiliates/
│   │   └── index.ts
│   └── ... (7 more functions)
├── schema/                     # Organized schema exports
│   ├── 00_initial_schema.sql   # Tables, indexes, constraints
│   ├── 01_functions.sql        # Custom PostgreSQL functions
│   ├── 02_triggers.sql         # Database triggers
│   └── 03_policies.sql         # RLS policies
├── config.toml                 # Supabase configuration
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
└── README.md                  # This file
```

## 🔒 Security Features

### Implemented Security Measures
- ✅ **Row Level Security** - All tables protected
- ✅ **JWT Custom Claims** - Enhanced authentication
- ✅ **System Logging** - Comprehensive audit trail
- ✅ **Role-based Access** - Client/Admin/Affiliate roles
- ✅ **Data Validation** - Input sanitization and validation
- ✅ **CORS Protection** - Restricted origins
- ✅ **Rate Limiting** - API abuse prevention

### RLS Policy Summary
- Users can only access their own data
- Service role has full system access
- Public read access for plans and rewards
- Role escalation prevention
- Audit trail for sensitive operations

## 📈 Performance Optimizations

### Database Indexes
- User-specific data queries optimized
- Date-based queries for check-ins
- Phone number lookups for WhatsApp
- Points-based leaderboard queries

### Edge Function Optimizations
- Efficient Supabase client reuse
- Minimal cold start dependencies
- Optimized CORS handling
- Error handling and logging

## 🔄 CI/CD Integration

### GitHub Actions Workflow
```yaml
name: Deploy Supabase
on:
  push:
    branches: [main]
    paths: ['supabase/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: supabase/setup-cli@v1
      - run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
      - run: supabase db push
      - run: supabase functions deploy
```

### Environment Management
- Development: Local Supabase instance
- Staging: Dedicated Supabase project
- Production: Main Supabase project with monitoring

## 🔍 Monitoring & Debugging

### Available Logs
```bash
# View all logs
supabase logs

# Function-specific logs
supabase logs --type=function --filter=evolution-webhook

# Database logs
supabase logs --type=database

# Real-time logs
supabase logs --follow
```

### Health Checks
- Database connectivity: `supabase db ping`
- Function status: `supabase functions list`
- Migration status: `supabase migration list`

## 🆘 Troubleshooting

### Common Issues

1. **Migration Errors**
   ```bash
   # Check migration status
   supabase migration list
   
   # Reset and retry
   supabase db reset
   ```

2. **Function Deployment Issues**
   ```bash
   # Check function logs
   supabase logs --type=function
   
   # Redeploy specific function
   supabase functions deploy function-name
   ```

3. **Environment Variable Issues**
   ```bash
   # List current secrets
   supabase secrets list
   
   # Update secret
   supabase secrets set KEY=value
   ```

4. **RLS Policy Issues**
   ```sql
   -- Test policy as user
   SELECT * FROM table_name WHERE user_id = auth.uid();
   
   -- Check current user
   SELECT auth.uid(), auth.role();
   ```

## 📞 Support & Documentation

### Resources
- [Supabase Documentation](https://supabase.com/docs)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [RLS Policies Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Migration Guide](./SUPABASE_MIGRATION_GUIDE.md)

### Project Contacts
- **Development Team**: Vida Smart Development
- **Repository**: [agenciaclimb/vida-smart-coach](https://github.com/agenciaclimb/vida-smart-coach)
- **Supabase Project**: `zzugbgoylwbaojdnunuz`

---

**Version**: 3.0  
**Last Updated**: September 2025  
**Status**: Production Ready ✅  
**Error 500 Status**: Resolved ✅
