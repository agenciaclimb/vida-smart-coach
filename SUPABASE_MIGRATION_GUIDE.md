# 🚀 Supabase Migration Guide - Vida Smart V3.0

## 📋 Overview

This guide provides comprehensive instructions for migrating the Vida Smart V3.0 Supabase database structure and Edge Functions to a new GitHub repository or Supabase project.

## 🏗️ Project Structure

```
/supabase
├── migrations/                 # Database migrations (chronological order)
│   ├── 20240101000000_create_plans_table.sql
│   ├── 20240101000001_create_rewards_table.sql
│   ├── 20240101000002_create_user_profiles_table.sql
│   ├── 20240101000003_create_daily_checkins_table.sql
│   ├── 20240101000004_create_gamification_table.sql
│   └── 20250831170636_create_whatsapp_messages.sql
├── functions/                  # Edge Functions (Deno/TypeScript)
│   ├── evolution-webhook/
│   ├── admin-affiliates/
│   ├── admin-create-affiliate/
│   ├── admin-delete-affiliate/
│   ├── get-active-provider/
│   ├── evolution-qr/
│   ├── hello-world/
│   ├── get-google-credentials/
│   └── get-google-calendar-credentials/
├── schema/                     # Organized schema exports
│   ├── 00_initial_schema.sql
│   ├── 01_functions.sql
│   ├── 02_triggers.sql
│   └── 03_policies.sql
├── config.toml                 # Supabase configuration
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
└── README.md                  # Project documentation
```

## 📊 Database Schema Overview

### Tables (6)
1. **plans** - Subscription plans and pricing
2. **rewards** - Gamification rewards system
3. **user_profiles** - User profile information
4. **daily_checkins** - Daily health check-ins
5. **gamification** - User points, levels, badges
6. **whatsapp_messages** - WhatsApp message history

### Custom Functions (2)
1. **update_updated_at_column()** - Automatic timestamp updates
2. **create_gamification_for_user()** - Auto-create gamification records

### Triggers (3)
1. **update_user_profiles_updated_at** - Update timestamps on user_profiles
2. **update_gamification_updated_at** - Update timestamps on gamification
3. **create_gamification_on_user_creation** - Create gamification on new user

### RLS Policies (12)
- User-specific access control across all tables
- Service role permissions for system operations
- Public read access for plans and rewards

## 🔧 Edge Functions Overview

### Core Functions
- **evolution-webhook** - WhatsApp webhook integration with OpenAI
- **admin-affiliates** - Affiliate management (list)
- **admin-create-affiliate** - Create new affiliates
- **admin-delete-affiliate** - Delete affiliates

### Utility Functions
- **get-active-provider** - Provider status information
- **evolution-qr** - QR code generation for WhatsApp
- **hello-world** - Test function
- **get-google-credentials** - Google OAuth credentials
- **get-google-calendar-credentials** - Google Calendar OAuth

## 🌍 Environment Variables

### Required for All Functions
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### WhatsApp Integration (evolution-webhook)
```env
OPENAI_API_KEY=your_openai_api_key
EVOLUTION_API_URL=your_evolution_api_url
EVOLUTION_API_KEY=your_evolution_api_key
EVOLUTION_INSTANCE_ID=your_instance_id
```

### Google Integration
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=your_redirect_uri
GOOGLE_CALENDAR_CLIENT_ID=your_calendar_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=your_calendar_client_secret
GOOGLE_CALENDAR_REDIRECT_URI=your_calendar_redirect_uri
```

## 🚀 Migration Steps

### 1. Setup New Supabase Project

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize new project
supabase init

# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_ID
```

### 2. Run Database Migrations

```bash
# Run migrations in chronological order
supabase db push

# Or run individually
supabase db push --file supabase/migrations/20240101000000_create_plans_table.sql
supabase db push --file supabase/migrations/20240101000001_create_rewards_table.sql
# ... continue for all migrations
```

### 3. Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy

# Or deploy individually
supabase functions deploy evolution-webhook
supabase functions deploy admin-affiliates
# ... continue for all functions
```

### 4. Set Environment Variables

```bash
# Set secrets for Edge Functions
supabase secrets set OPENAI_API_KEY=your_key
supabase secrets set EVOLUTION_API_URL=your_url
supabase secrets set EVOLUTION_API_KEY=your_key
# ... continue for all required secrets
```

### 5. Verify Migration

```bash
# Check database schema
supabase db diff

# Test Edge Functions
supabase functions serve
```

## 🔒 Security Considerations

### Implemented Security Features
- **System Logger Edge Function** - Comprehensive logging system
- **JWT Custom Claims Hook** - Enhanced authentication
- **RLS Verification** - Row Level Security validation
- **Error 500 Fix** - Resolved signup authentication issues

### RLS Policies
All tables have proper Row Level Security enabled:
- Users can only access their own data
- Service role has full access for system operations
- Public read access only for plans and rewards

## 🧪 Testing

### Local Development
```bash
# Start local Supabase
supabase start

# Run Edge Functions locally
supabase functions serve

# Test database connections
supabase db reset
```

### Production Deployment
```bash
# Deploy to production
supabase db push --linked
supabase functions deploy --no-verify-jwt=false
```

## 📝 CI/CD Integration

### GitHub Actions Workflow
The project includes automated deployment via GitHub Actions:
- Automatic migration deployment
- Edge Function deployment
- Environment variable management

### Deployment Commands
```yaml
- name: Deploy Supabase
  run: |
    supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
    supabase db push
    supabase functions deploy
```

## 🔍 Troubleshooting

### Common Issues

1. **Migration Order**
   - Always run migrations in chronological order
   - Check dependencies between tables

2. **Environment Variables**
   - Ensure all required secrets are set
   - Verify variable names match function requirements

3. **RLS Policies**
   - Test policies with different user roles
   - Verify service role permissions

4. **Edge Functions**
   - Check Deno import URLs are accessible
   - Verify CORS headers for web requests

### Verification Commands
```bash
# Check migration status
supabase migration list

# Verify functions
supabase functions list

# Test database connection
supabase db ping
```

## 📞 Support

For issues with this migration:
1. Check Supabase logs: `supabase logs`
2. Verify environment variables
3. Test locally before production deployment
4. Review RLS policies for access issues

## 🎯 Success Criteria

Migration is successful when:
- ✅ All 6 tables created with proper structure
- ✅ All 2 custom functions deployed
- ✅ All 3 triggers active
- ✅ All 12 RLS policies enforced
- ✅ All 9 Edge Functions deployed and functional
- ✅ Environment variables configured
- ✅ Authentication working (no error 500)
- ✅ WhatsApp webhook integration active
- ✅ Admin functions accessible

---

**Last Updated:** September 2025  
**Version:** 3.0  
**Status:** Production Ready ✅
