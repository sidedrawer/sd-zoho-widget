# SideDrawer Session Management & Silent Refresh

## 🔐 Overview

The integration now uses **Zoho Session Storage** for access tokens and **localStorage** for refresh tokens, enabling:

1. **Shared Access Across Widgets** - Multiple widgets can share the same SideDrawer session
2. **Silent Refresh** - Automatically refresh expired tokens without user interaction
3. **Persistent Login** - Users stay logged in across browser sessions

## 📊 Storage Architecture

### Access Token Storage: Zoho Session (`sdSession`)

**Stored in:** Zoho CRM session variables  
**Shared:** Yes, across all widgets in the same Zoho session  
**Persistent:** No, cleared when Zoho session ends  
**Contains:**
```javascript
{
  accessToken: "eyJhbGciOiJSUzI1NiIs...",
  expiresAt: 1701234567890,
  tokenType: "Bearer"
}
```

**Why Zoho Session?**
- Shared across all SideDrawer widgets in your Zoho CRM
- Automatic cleanup when user logs out of Zoho
- Secure, managed by Zoho infrastructure
- Follows Zoho security best practices

### Refresh Token Storage: localStorage

**Stored in:** Browser localStorage  
**Shared:** No, specific to the browser  
**Persistent:** Yes, survives browser restarts  
**Contains:**
```javascript
"refresh_token_value_here"
```

**Why localStorage?**
- Persists across browser sessions
- Enables silent refresh when returning after long periods
- Not shared (more secure for long-lived credentials)
- Standard OAuth2 best practice

## 🔄 How Silent Refresh Works

### First Login Flow

```
User clicks "Connect to SideDrawer"
    ↓
OAuth2 authorization flow
    ↓
Receive access_token + refresh_token
    ↓
Store access_token in Zoho session (sdSession)
    ↓
Store refresh_token in localStorage
    ↓
User is connected ✓
```

### Returning to Widget (Same Session)

```
Widget loads
    ↓
Check Zoho session (sdSession)
    ↓
Access token found and valid?
    ↓ Yes
Show "Connected" status ✓
(No API call needed - instant!)
```

### Returning After Long Time (Expired Token)

```
Widget loads
    ↓
Check Zoho session (sdSession)
    ↓
Access token expired or missing
    ↓
Check localStorage for refresh_token
    ↓
refresh_token found?
    ↓ Yes
Call SideDrawer OAuth endpoint
    ↓
Exchange refresh_token for new access_token
    ↓
Store new access_token in Zoho session
    ↓
Show "Connected" status ✓
(User never sees login screen!)
```

### No Tokens Available

```
Widget loads
    ↓
No valid access_token
    ↓
No refresh_token
    ↓
Show "Connect to SideDrawer" button
(User must authenticate)
```

## 💻 Code Implementation

### Initialization Sequence

```javascript
class SideDrawerAuth {
  constructor() {
    this.zohoInitialized = false;
    this.initZoho();  // Step 1: Initialize Zoho SDK
  }

  async initZoho() {
    // Initialize Zoho SDK
    await ZOHO.embeddedApp.init();
    this.zohoInitialized = true;
    
    // Then initialize auth
    this.init();
  }

  async init() {
    // Check if returning from OAuth
    if (code) {
      await this.handleOAuthCallback(code);
      return;
    }

    // Check existing connection
    await this.checkConnection();
  }

  async checkConnection() {
    const session = await this.getZohoSession();
    
    if (session && !this.isTokenExpired(session.expiresAt)) {
      // Valid session exists
      this.showConnectedStatus();
    } else if (this.getRefreshToken()) {
      // Silent refresh
      await this.refreshAccessToken();
    } else {
      // Must authenticate
      this.showDisconnectedStatus();
    }
  }
}
```

### Storage Methods

```javascript
// Save tokens after successful authentication
async saveTokens(tokenData) {
  // Access token → Zoho session
  const sessionData = {
    accessToken: tokenData.access_token,
    expiresAt: Date.now() + (tokenData.expires_in * 1000),
    tokenType: 'Bearer'
  };
  await this.setZohoSession(sessionData);
  
  // Refresh token → localStorage
  if (tokenData.refresh_token) {
    localStorage.setItem(STORAGE_KEYS.refreshToken, tokenData.refresh_token);
  }
}

// Get access token from Zoho session
async getAccessToken() {
  const session = await this.getZohoSession();
  return session ? session.accessToken : null;
}

// Get refresh token from localStorage
getRefreshToken() {
  return localStorage.getItem(STORAGE_KEYS.refreshToken);
}
```

### Silent Refresh Implementation

```javascript
async refreshAccessToken() {
  const refreshToken = this.getRefreshToken();
  
  if (!refreshToken) {
    this.showDisconnectedStatus();
    return;
  }

  try {
    const response = await fetch(OAUTH_CONFIG.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: OAUTH_CONFIG.clientId,
        client_secret: OAUTH_CONFIG.clientSecret,
        refresh_token: refreshToken,
        audience: OAUTH_CONFIG.audience
      })
    });

    const tokenData = await response.json();
    
    // Save new tokens
    await this.saveTokens(tokenData);
    
    // Show connected status
    this.showConnectedStatus();
    
  } catch (error) {
    // Refresh failed - clear everything and show login
    this.disconnect();
  }
}
```

## 🎯 User Experience Benefits

### Before (Without Silent Refresh)

1. User logs into SideDrawer
2. ✓ Connected for ~1 hour
3. Token expires
4. ❌ "Not Connected" - must log in again
5. User clicks "Connect to SideDrawer"
6. Redirected to login page
7. Enters credentials again
8. ✓ Connected again

**Problem:** User must re-authenticate every time token expires

### After (With Silent Refresh)

1. User logs into SideDrawer
2. ✓ Connected
3. Token expires (user doesn't notice)
4. Widget automatically refreshes token
5. ✓ Still connected
6. User never sees login screen again!

**Benefit:** Seamless experience, like staying logged in to Google or Facebook

## 🔍 Session Information Display

When connected, users see:

```
✓ Connected to SideDrawer

Tenant Information:
Storage: Zoho Session (shared across widgets)
Token Expires: Dec 2, 2024, 3:45 PM
Silent Refresh: ✓ Enabled
```

### Status Indicators

**Storage Location:**
- `Zoho Session (shared across widgets)` - Using Zoho CRM session storage
- `localStorage (fallback)` - Zoho SDK not available (development)

**Silent Refresh:**
- `✓ Enabled` - Refresh token available, will auto-refresh
- `✗ Disabled` - No refresh token, must re-authenticate when token expires

## 🛠️ Testing Silent Refresh

### Test 1: Basic Connection

```bash
1. Open widget
2. Click "Connect to SideDrawer"
3. Authenticate
4. Verify status shows:
   - Storage: Zoho Session
   - Silent Refresh: ✓ Enabled
```

### Test 2: Session Sharing (Multiple Widgets)

```bash
1. Add widget to two different Zoho tabs
2. Connect in Widget A
3. Refresh Widget B
4. Widget B should show "Connected" automatically
   (because access token is shared via Zoho session)
```

### Test 3: Silent Refresh After Expiry

```bash
Method 1: Wait for expiry
1. Connect to SideDrawer
2. Wait for token to expire (~1 hour)
3. Reload widget
4. Should see "Refreshing connection..."
5. Then "Connected" without login

Method 2: Manual test
1. Connect to SideDrawer
2. Open browser console
3. Get session: await auth.getZohoSession()
4. Modify expiresAt to past time
5. Reload widget
6. Should auto-refresh
```

### Test 4: Refresh Token Persistence

```bash
1. Connect to SideDrawer
2. Close browser completely
3. Reopen browser
4. Open widget
5. Should auto-refresh without login prompt
```

### Test 5: Disconnect and Reconnect

```bash
1. Click "Disconnect"
2. Verify refresh token is cleared:
   localStorage.getItem('sidedrawer_refresh_token') // null
3. Click "Connect to SideDrawer"
4. Must authenticate again (expected)
```

## 🐛 Troubleshooting

### "Silent Refresh: ✗ Disabled"

**Problem:** No refresh token stored

**Causes:**
1. `offline_access` scope not requested
2. SideDrawer didn't return refresh token
3. User disconnected previously

**Solution:**
1. Verify `scope` includes `offline_access`
2. Disconnect and reconnect
3. Check SideDrawer OAuth app settings

### Token Not Shared Across Widgets

**Problem:** Each widget shows different connection status

**Causes:**
1. Zoho SDK not initialized
2. Using localStorage fallback
3. Different Zoho sessions

**Solution:**
1. Check browser console: "✓ Zoho SDK initialized"
2. Verify script tag: `ZohoEmbededAppSDK.min.js` loaded
3. Ensure widgets in same Zoho session

### Silent Refresh Fails

**Problem:** Widget shows "Not Connected" after refresh attempt

**Causes:**
1. Refresh token expired (rare, usually 90 days)
2. Refresh token revoked
3. OAuth credentials changed
4. Network error

**Solution:**
1. Check browser console for error
2. Click "Connect to SideDrawer" to re-authenticate
3. Verify OAuth credentials are correct

### Zoho Session Not Working

**Problem:** "localStorage (fallback)" shown instead of "Zoho Session"

**Causes:**
1. Zoho SDK not loaded
2. Not running inside Zoho CRM
3. SDK initialization failed

**Solution:**
1. Check script tag in HTML head
2. Test inside actual Zoho CRM web tab
3. Check browser console for SDK errors

## 📊 Token Lifecycle

```
Login
  ↓
[Access Token] (1 hour) → Zoho Session (sdSession)
[Refresh Token] (90 days) → localStorage
  ↓
Access token expires
  ↓
Silent refresh using refresh token
  ↓
[New Access Token] → Zoho Session
[Same Refresh Token] → localStorage
  ↓
Repeat until refresh token expires
  ↓
After 90 days: User must re-authenticate
```

## ✅ Best Practices

### 1. Always Check Session on Load

```javascript
async init() {
  // Always check for existing session first
  await this.checkConnection();
}
```

### 2. Handle Refresh Failures Gracefully

```javascript
try {
  await this.refreshAccessToken();
} catch (error) {
  // Clear everything and show login
  this.disconnect();
}
```

### 3. Add Buffer Time Before Expiry

```javascript
isTokenExpired(expiresAt) {
  const bufferTime = 5 * 60 * 1000; // 5 minutes
  return Date.now() >= (expiresAt - bufferTime);
}
```

### 4. Provide User Feedback

```javascript
// Show "Refreshing..." during silent refresh
document.getElementById('app-content').innerHTML = `
  <div class="loading">
    <p>Refreshing connection...</p>
  </div>
`;
```

### 5. Fallback to localStorage

```javascript
// Always have a fallback if Zoho SDK unavailable
if (this.zohoInitialized) {
  await ZOHO.CRM.API.setVariable({ ... });
} else {
  localStorage.setItem(key, value);
}
```

## 🚀 Benefits Summary

✅ **Seamless Experience** - Users stay logged in across sessions  
✅ **Shared Access** - Multiple widgets share same authentication  
✅ **Automatic Refresh** - No manual re-authentication needed  
✅ **Secure** - Uses Zoho-managed session storage  
✅ **Persistent** - Survives browser restarts  
✅ **Fast** - No API calls for valid sessions  
✅ **User-Friendly** - Works like major platforms (Google, Facebook, etc.)

## 📝 Summary

The integration now provides **enterprise-grade session management** with:

- Zoho Session storage for shared access tokens
- localStorage for persistent refresh tokens
- Automatic silent refresh when tokens expire
- Seamless multi-widget support
- Professional user experience

Users authenticate **once** and stay connected across:
- Multiple widgets
- Browser sessions  
- Token expiration periods

This matches the experience users expect from modern SaaS applications! 🎉

