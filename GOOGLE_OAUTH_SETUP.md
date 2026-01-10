# Google OAuth Setup for Production

## The Problem
"Authentication cancelled" error occurs when Google OAuth settings don't match your production environment.

## 🎯 YOUR SPECIFIC CONFIGURATION (label.mn)

**Your Domains:**
- Frontend: `https://label.mn`
- Backend: `https://api.label.mn`

### What to Register in Google Cloud Console for label.mn:

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
   - Select your project
   - Navigate to **APIs & Services** → **Credentials**

2. **Configure OAuth Consent Screen** (if not done):
   - User Type: **External**
   - App name: Your app name
   - User support email: Your email
   - Developer contact: Your email
   - **Authorized domains:** Add `label.mn` and `api.label.mn`
   - Save and continue

3. **Create/Edit OAuth 2.0 Client ID:**
   - Application type: **Web application**
   - Name: `Label.mn Production`

4. **Authorized JavaScript Origins** (add these):
   ```
   https://label.mn
   https://www.label.mn
   ```

5. **Authorized Redirect URIs** (add this):
   ```
   https://api.label.mn/api/auth/google/callback
   ```

6. **Your Backend Environment Variables** (`.env`):
   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_CALLBACK_URL=https://api.label.mn/api/auth/google/callback
   FRONTEND_URL=https://label.mn
   ```

7. **Your Frontend Environment Variables**:
   ```env
   NEXT_PUBLIC_API_URL=https://api.label.mn/api
   ```

---

## What to Register in Google Cloud Console (General Guide)

### Step 1: Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** → **Credentials**

### Step 2: Configure OAuth 2.0 Client ID

#### For Production:
1. Click **Create Credentials** → **OAuth client ID**
2. If prompted, configure the **OAuth consent screen** first:
   - User Type: **External** (unless you have Google Workspace)
   - App name: Your app name
   - User support email: Your email
   - Developer contact: Your email
   - **Add your production domain to Authorized domains**
   - Save and continue through scopes, test users, etc.

3. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: `Production OAuth Client` (or any name)

### Step 3: Configure Authorized JavaScript Origins

Add your **frontend production domain** (where users click the login button):

```
https://your-production-frontend.com
https://www.your-production-frontend.com  (if you use www)
```

**Important:** 
- Include protocol (`https://`)
- No trailing slash
- Include both `www` and non-`www` versions if applicable

### Step 4: Configure Authorized Redirect URIs

Add your **backend callback URL**:

```
https://your-production-api.com/api/auth/google/callback
```

**Important:**
- Must match exactly what's in your `GOOGLE_CALLBACK_URL` environment variable
- Include the full path: `/api/auth/google/callback`
- Use `https://` (not `http://`) for production
- No trailing slash

### Step 5: Environment Variables

Make sure your production environment has these variables set correctly:

**Backend (.env):**
```env
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=https://your-production-api.com/api/auth/google/callback
FRONTEND_URL=https://your-production-frontend.com
```

**Frontend (.env.local or production environment):**
```env
NEXT_PUBLIC_API_URL=https://your-production-api.com/api
```

### Step 6: Common Issues & Solutions

#### Issue 1: "redirect_uri_mismatch"
- **Cause:** Redirect URI in Google Console doesn't match `GOOGLE_CALLBACK_URL`
- **Solution:** Double-check both match exactly (including protocol, domain, and path)

#### Issue 2: "Access blocked: This app's request is invalid"
- **Cause:** JavaScript origin not authorized
- **Solution:** Add your frontend domain to "Authorized JavaScript origins"

#### Issue 3: "Authentication cancelled" ⚠️ **MOST COMMON**
- **Causes:**
  1. **Redirect URI mismatch** - The redirect URI in Google Console doesn't exactly match your `GOOGLE_CALLBACK_URL`
  2. **JavaScript origin not authorized** - Your frontend domain (`label.mn`) is not in "Authorized JavaScript origins"
  3. **OAuth consent screen not published** - For production, you need to publish the consent screen OR add test users
  4. **Domain not in authorized domains** - `label.mn` or `api.label.mn` not added to OAuth consent screen authorized domains
  5. **Wrong Client ID** - Using development Client ID in production

- **Solutions (check in this order):**
  1. ✅ **Verify Redirect URI matches EXACTLY:**
     - Google Console: `https://api.label.mn/api/auth/google/callback`
     - Backend `.env`: `GOOGLE_CALLBACK_URL=https://api.label.mn/api/auth/google/callback`
     - Must match character-for-character (including `https://`, no trailing slash)
  
  2. ✅ **Add Frontend to JavaScript Origins:**
     - Google Console → OAuth Client → Authorized JavaScript origins
     - Add: `https://label.mn` and `https://www.label.mn` (if you use www)
  
  3. ✅ **Publish OAuth Consent Screen:**
     - Google Console → APIs & Services → OAuth consent screen
     - Click "PUBLISH APP" button (or add test users if in testing mode)
     - Add `label.mn` and `api.label.mn` to "Authorized domains"
  
  4. ✅ **Verify Client ID:**
     - Make sure you're using the production Client ID (not localhost one)
     - Check `GOOGLE_CLIENT_ID` in backend `.env` matches Google Console
  
  5. ✅ **Check Browser Console:**
     - Open browser DevTools → Console
     - Look for specific error messages from Google OAuth
     - Common errors: `redirect_uri_mismatch`, `access_denied`, `invalid_client`

#### Issue 4: Works in development but not production
- **Cause:** Different client IDs or missing production settings
- **Solution:** 
  - Create separate OAuth client for production
  - Or add both localhost and production URLs to the same client:
    - `http://localhost:3000` (development)
    - `https://your-production-frontend.com` (production)
    - `http://localhost:3001/api/auth/google/callback` (development)
    - `https://your-production-api.com/api/auth/google/callback` (production)

### Step 7: Testing Checklist

- [ ] OAuth consent screen configured and published (or test users added)
- [ ] Authorized JavaScript origins includes production frontend URL
- [ ] Authorized redirect URIs includes production backend callback URL
- [ ] `GOOGLE_CLIENT_ID` matches the Client ID in Google Console
- [ ] `GOOGLE_CLIENT_SECRET` matches the Client Secret in Google Console
- [ ] `GOOGLE_CALLBACK_URL` matches exactly with redirect URI in Google Console
- [ ] `FRONTEND_URL` matches your production frontend domain
- [ ] All URLs use `https://` (not `http://`) in production
- [ ] No trailing slashes in any URLs

### Example Configuration

**Google Cloud Console:**
- **Authorized JavaScript origins:**
  - `https://myapp.com`
  - `https://www.myapp.com`
  
- **Authorized redirect URIs:**
  - `https://api.myapp.com/api/auth/google/callback`

**Backend Environment:**
```env
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xyz123
GOOGLE_CALLBACK_URL=https://api.myapp.com/api/auth/google/callback
FRONTEND_URL=https://myapp.com
```

**Frontend Environment:**
```env
NEXT_PUBLIC_API_URL=https://api.myapp.com/api
```

### Quick Verification

After configuration, test by:
1. Opening your production site
2. Clicking "Login with Google"
3. If you see Google's login page → JavaScript origins are correct
4. After logging in, if you're redirected back → Redirect URI is correct
5. If you see "Authentication cancelled" → Check redirect URI and consent screen

---

## ✅ Quick Checklist for label.mn Production

Before testing, verify ALL of these:

### Google Cloud Console:
- [ ] OAuth consent screen is **PUBLISHED** (or test users added)
- [ ] `label.mn` and `api.label.mn` added to **Authorized domains** in consent screen
- [ ] **Authorized JavaScript origins** includes:
  - [ ] `https://label.mn`
  - [ ] `https://www.label.mn` (if you use www)
- [ ] **Authorized redirect URIs** includes:
  - [ ] `https://api.label.mn/api/auth/google/callback` (exact match, no trailing slash)

### Backend Environment (`.env`):
- [ ] `GOOGLE_CLIENT_ID` = matches Client ID from Google Console
- [ ] `GOOGLE_CLIENT_SECRET` = matches Client Secret from Google Console
- [ ] `GOOGLE_CALLBACK_URL` = `https://api.label.mn/api/auth/google/callback` (exact match)
- [ ] `FRONTEND_URL` = `https://label.mn`

### Frontend Environment:
- [ ] `NEXT_PUBLIC_API_URL` = `https://api.label.mn/api`

### Common Mistakes to Avoid:
- ❌ Using `http://` instead of `https://` in production
- ❌ Adding trailing slash: `https://api.label.mn/api/auth/google/callback/` (wrong!)
- ❌ Missing `/api` in the path: `https://api.label.mn/auth/google/callback` (wrong!)
- ❌ Using localhost Client ID in production
- ❌ OAuth consent screen not published (for production use)

