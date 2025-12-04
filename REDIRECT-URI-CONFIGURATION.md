# Redirect URI Configuration Guide

## 🎯 The Challenge

You need the widget to work in **two environments**:
- **Local Development**: `https://127.0.0.1:5001/app/widget.html`
- **Zoho CRM Production**: `https://crm.zohocloud.ca/crm/org110001007505/tab/WebTab13`

## ✅ Recommended Solution: Automatic Detection (Default)

The widget **already supports automatic URL detection**! No code changes needed.

### How It Works

```javascript
redirectUri: window.location.origin + window.location.pathname
```

This automatically becomes:
- `https://127.0.0.1:5001/app/widget.html` when testing locally
- `https://crm.zohocloud.ca/crm/org110001007505/tab/WebTab13` when running in Zoho

### Setup Steps

**1. Configure SideDrawer OAuth App**

Add **both** redirect URIs to your SideDrawer OAuth application:

```
https://127.0.0.1:5001/app/widget.html
https://crm.zohocloud.ca/crm/org110001007505/tab/WebTab13
```

**How to add them:**
1. Log into SideDrawer Sandbox: https://app-sbx.sidedrawersbx.com
2. Go to **Settings → API & Integrations → OAuth Applications**
3. Find your OAuth app (Client ID: `AYKueA9CuMXe7fMj8QfJM722F98NwZyA`)
4. In **Allowed Redirect URIs**, add both URLs (one per line)
5. **Save**

**2. Test Both Environments**

Local testing:
```bash
npm start
# Opens at: https://127.0.0.1:5001/app/widget.html
# Redirects to: https://127.0.0.1:5001/app/widget.html ✓
```

Zoho testing:
```
Open: https://crm.zohocloud.ca/crm/org110001007505/tab/WebTab13
Redirects to: https://crm.zohocloud.ca/crm/org110001007505/tab/WebTab13 ✓
```

**That's it!** The widget automatically uses the correct URL in each environment.

## 🎛️ Alternative: Zoho Extension Configuration (Advanced)

If you want to **override** the automatic detection or configure from Zoho CRM settings:

### Configuration Options Added

I've added two optional configuration fields to `plugin-manifest.json`:

1. **OAuth Redirect URI Override** (optional)
   - Leave empty for automatic detection
   - Set a specific URL if needed

2. **Environment** (optional)
   - Sandbox (Testing) - uses `-sbx` endpoints
   - Production - uses production endpoints

### How to Configure in Zoho

**1. After Installing the Extension**

Go to Zoho CRM → Settings → Extensions → Your Extension → Configure

**2. Set Configuration Values**

```
OAuth Redirect URI Override: (leave empty for auto-detect)
Environment: Sandbox (Testing)
```

Or for production:
```
OAuth Redirect URI Override: https://crm.zohocloud.ca/crm/org110001007505/tab/WebTab13
Environment: Production
```

### Code Behavior

The widget now checks Zoho configuration on load:

```javascript
async loadZohoConfig() {
  const config = await ZOHO.CRM.CONFIG.getExtensionConfig();
  
  // Use configured redirect URI or auto-detect
  if (config.oauth_redirect_uri) {
    OAUTH_CONFIG.redirectUri = config.oauth_redirect_uri;
  } else {
    OAUTH_CONFIG.redirectUri = window.location.origin + window.location.pathname;
  }
  
  // Switch environment endpoints
  if (config.environment === 'production') {
    // Use production URLs
  } else {
    // Use sandbox URLs
  }
}
```

## 📋 Multiple Redirect URI Support

OAuth 2.0 **allows multiple redirect URIs** in the same application. This is the standard approach for supporting multiple environments.

### In SideDrawer OAuth App Settings

```
Allowed Redirect URIs:
  https://127.0.0.1:5001/app/widget.html
  https://127.0.0.1:5002/app/widget.html  (if port 5001 is busy)
  https://crm.zohocloud.ca/crm/org110001007505/tab/WebTab13
  https://your-staging-server.com/widget.html  (if you have staging)
```

The OAuth server will accept **any** of these URIs during the authorization flow.

## 🔍 How OAuth Validates Redirect URIs

When you initiate OAuth:

```
1. Widget sends authorization request with redirect_uri parameter
2. SideDrawer checks if redirect_uri is in the allowed list
3. If match found → Authorization proceeds ✓
4. If no match → "redirect_uri mismatch" error ✗
```

**The redirect_uri sent MUST exactly match one in the allowed list:**
- Protocol must match (https)
- Domain must match exactly
- Port must match (if specified)
- Path must match exactly
- No trailing slashes unless in both
- No query parameters (unless allowed)

## 🧪 Testing Configuration

### Test 1: Automatic Detection (Local)

```bash
# 1. Start server
npm start

# 2. Open browser console (F12)
# 3. Open: https://127.0.0.1:5001/app/widget.html

# 4. Check console logs:
Proceeding with initialization (Zoho initialized: false)
OAuth Redirect URI: https://127.0.0.1:5001/app/widget.html
```

Expected: ✓ Auto-detected local URL

### Test 2: Automatic Detection (Zoho)

```
# 1. Deploy widget to Zoho
# 2. Open web tab
# 3. Check browser console (F12)

Zoho SDK initialized successfully
Using auto-detected redirect URI: https://crm.zohocloud.ca/crm/org110001007505/tab/WebTab13
OAuth Redirect URI: https://crm.zohocloud.ca/crm/org110001007505/tab/WebTab13
```

Expected: ✓ Auto-detected Zoho URL

### Test 3: Manual Override (Zoho)

```
# 1. In Zoho CRM → Extension Settings
# 2. Set: OAuth Redirect URI Override = https://custom-url.com
# 3. Reload widget
# 4. Check console

Using configured redirect URI: https://custom-url.com
OAuth Redirect URI: https://custom-url.com
```

Expected: ✓ Using custom URL

## 🐛 Troubleshooting

### "redirect_uri_mismatch" Error

**Problem**: SideDrawer rejects the redirect URI

**Diagnosis**:
1. Open browser console (F12)
2. Find the authorization URL in console logs
3. Look for `redirect_uri=...` parameter
4. Copy that exact URL

**Solution**:
1. Add that **exact** URL to SideDrawer OAuth app settings
2. Watch for:
   - Trailing slashes
   - Port numbers
   - HTTP vs HTTPS
   - Query parameters

**Example**:
```
Console shows: redirect_uri=https://127.0.0.1:5001/app/widget.html
Add to SideDrawer: https://127.0.0.1:5001/app/widget.html
(Must match exactly!)
```

### Different URL in Production

**Problem**: Zoho web tab URL is different than expected

**Solution**:
1. Open the web tab in Zoho CRM
2. Copy the **exact** URL from browser address bar
3. Add to SideDrawer OAuth app allowed redirect URIs
4. Optionally, set in extension configuration

### Auto-Detection Not Working

**Problem**: Using wrong URL

**Check**:
```javascript
// In browser console
console.log(window.location.origin + window.location.pathname)
```

**Solution**:
- Use the URL that's logged
- Add it to SideDrawer OAuth app
- Or override in extension configuration

## 🎯 Best Practices

### ✅ DO:
- Use automatic detection (default behavior)
- Add all environment URLs to SideDrawer OAuth app
- Test in each environment before deployment
- Keep redirect URIs consistent (don't change unnecessarily)

### ❌ DON'T:
- Hardcode a specific URL in the widget code
- Use wildcards in redirect URIs (not allowed by OAuth)
- Include query parameters in redirect URIs
- Change URLs without updating SideDrawer OAuth app

## 📝 Configuration Checklist

Before deploying:

- [ ] Decided on redirect URI strategy (auto-detect recommended)
- [ ] Added local development URL to SideDrawer OAuth app
- [ ] Added production Zoho URL to SideDrawer OAuth app
- [ ] Tested widget locally at https://127.0.0.1:5001/app/widget.html
- [ ] Tested widget in Zoho web tab
- [ ] Verified OAuth flow completes in both environments
- [ ] Checked browser console for redirect URI being used
- [ ] Confirmed "Connected to SideDrawer" appears in both environments

## 🚀 Deployment Workflow

### Development → Production

1. **Develop Locally**
   ```
   URL: https://127.0.0.1:5001/app/widget.html
   Redirect: Auto-detected ✓
   Environment: Sandbox
   ```

2. **Deploy to Zoho**
   ```
   URL: https://crm.zohocloud.ca/crm/org110001007505/tab/WebTab13
   Redirect: Auto-detected ✓
   Environment: Sandbox (initially)
   ```

3. **Test in Zoho**
   - Verify auto-detection working
   - Check OAuth flow completes
   - Test token refresh

4. **Switch to Production**
   - In extension configuration: Set Environment = Production
   - Update OAuth credentials (if different)
   - Test again

## 💡 Summary

**The redirect URI is already configured to work automatically!**

Just add **both** URLs to your SideDrawer OAuth application:
```
https://127.0.0.1:5001/app/widget.html  ← Local development
https://crm.zohocloud.ca/crm/org110001007505/tab/WebTab13  ← Zoho production
```

The widget will automatically use the correct one based on where it's running.

**No code changes needed!** ✅

---

**Advanced users** can override this behavior using the extension configuration in Zoho CRM settings, but the default automatic detection is recommended for most use cases.

