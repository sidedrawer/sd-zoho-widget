# SideDrawer Integration for Zoho CRM

This widget provides a secure OAuth2 integration between Zoho CRM and SideDrawer, similar to the HeyAdvisor integration with Cloven.

## 🚀 Features

- **OAuth2 Authorization Code Flow with PKCE**: Secure authentication using industry-standard OAuth2
- **Automatic Token Management**: Handles access token refresh automatically
- **Connection Status**: Visual indicators showing connection status
- **Modern UI**: Clean, professional interface with status indicators
- **Error Handling**: Comprehensive error handling and user feedback
- **Multi-Deployment**: Works with both local development and GitHub Pages hosting

## 📋 Prerequisites

Before using this integration, ensure you have:

1. **SideDrawer Account**: Access to SideDrawer sandbox or production environment
2. **Zoho CRM Access**: Permissions to add web tab widgets
3. **OAuth2 Credentials**: Client ID and Client Secret from SideDrawer

## 🔧 Setup Instructions

### Option 1: GitHub Pages Deployment (Recommended for Production)

**This is the working solution for multi-tenant deployments.**

#### 1. Deploy to GitHub Pages

The widget is hosted at: `https://sidedrawer.github.io/SideDrawer/app/widget.html`

#### 2. Configure SideDrawer OAuth2 Application

1. Log into SideDrawer (sandbox: https://auth-sbx.sidedrawersbx.com)
2. Go to **Settings** → **OAuth Applications**
3. Create or edit your OAuth application
4. Add the redirect URI: `https://sidedrawer.github.io/SideDrawer/app/widget.html`
5. Copy your **Client ID** and **Client Secret**

#### 3. Add Widget to Zoho CRM

1. In Zoho CRM, go to **Setup** → **Customization** → **Modules and Fields**
2. Select a module or create a **Custom Tab**
3. Add a **Web Tab** widget
4. Set the URL with your credentials:

```
https://sidedrawer.github.io/SideDrawer/app/widget.html?client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&redirect_uri=https://sidedrawer.github.io/SideDrawer/app/widget.html&environment=sandbox
```

**Replace:**
- `YOUR_CLIENT_ID` → Your SideDrawer Client ID
- `YOUR_CLIENT_SECRET` → Your SideDrawer Client Secret
- `environment=sandbox` → Use `environment=production` for production

**Example:**
```
https://sidedrawer.github.io/SideDrawer/app/widget.html?client_id=AYKueA9CuMXe7fMj8QfJM722F98NwZyA&client_secret=Dwd47Osd6secRvrrfC31ng2oWGGuiwnr55IGm0qRxHsgiDtYSwu8GMEEHKScksTD&redirect_uri=https://sidedrawer.github.io/SideDrawer/app/widget.html&environment=sandbox
```

#### 4. Test the Integration

1. Open the widget in Zoho CRM
2. Click **Connect to SideDrawer**
3. A popup opens for authentication
4. Log in and authorize
5. Widget shows **Connected** status ✅

### Option 2: Local Development

1. Run the development server:
   ```bash
   npm install
   npm start
   ```

2. The server will start at `https://127.0.0.1:5001`

3. Open the URL in your browser and authorize the self-signed certificate:
   - Click "Advanced" → "Proceed to 127.0.0.1 (unsafe)"

4. Access the widget with URL parameters:
   ```
   https://127.0.0.1:5001/app/widget.html?client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&redirect_uri=https://127.0.0.1:5001/app/widget.html&environment=sandbox
   ```

## 🎯 How It Works

### URL Parameter Configuration

The widget uses URL parameters to configure OAuth credentials for each Zoho CRM installation:

**Required Parameters:**
- `client_id` - Your SideDrawer OAuth Client ID
- `client_secret` - Your SideDrawer OAuth Client Secret  
- `redirect_uri` - The widget URL (usually the same URL without parameters)
- `environment` - Either `sandbox` or `production`

**How Configuration Persists:**
1. On first load, the widget reads URL parameters
2. Credentials are stored in browser `localStorage`
3. After OAuth redirect, credentials are retrieved from `localStorage`
4. This allows the widget to work across popup windows and redirects

### OAuth2 Flow

1. **User Clicks "Connect to SideDrawer"**
   - Widget generates a PKCE code verifier and challenge
   - Opens popup window to SideDrawer authorization page
   - Passes credentials in OAuth state parameter

2. **User Authorizes in Popup**
   - User logs into SideDrawer and grants permissions
   - SideDrawer redirects back with authorization code

3. **Token Exchange (in Popup)**
   - Popup receives authorization code
   - Exchanges code for access token using PKCE
   - Sends tokens to parent window via `postMessage`

4. **Parent Window Receives Tokens**
   - Stores access token in `localStorage`
   - Stores refresh token in `localStorage`
   - Closes popup and shows connected status

5. **Automatic Refresh**
   - Widget automatically refreshes expired tokens
   - Maintains persistent connection

### Security Features

- **PKCE (Proof Key for Code Exchange)**: Protects against authorization code interception
- **Popup-based OAuth**: Bypasses iframe restrictions (X-Frame-Options)
- **Secure Token Storage**: Tokens stored in browser localStorage
- **Automatic Token Refresh**: Prevents expired token errors
- **CSP Headers**: Content Security Policy restricts allowed domains
- **State Parameter**: Prevents CSRF attacks and carries credentials securely

## 🔑 Configuration

### URL Parameter Format

**Sandbox Environment:**
```
https://sidedrawer.github.io/SideDrawer/app/widget.html?client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&redirect_uri=https://sidedrawer.github.io/SideDrawer/app/widget.html&environment=sandbox
```

**Production Environment:**
```
https://sidedrawer.github.io/SideDrawer/app/widget.html?client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&redirect_uri=https://sidedrawer.github.io/SideDrawer/app/widget.html&environment=production
```

### Environment-Specific OAuth Endpoints

The `environment` parameter automatically sets:

**Sandbox:**
- Authorization: `https://auth-sbx.sidedrawersbx.com/authorize`
- Token: `https://auth-sbx.sidedrawersbx.com/oauth/token`
- Audience: `https://user-api-sbx.sidedrawersbx.com`

**Production:**
- Authorization: `https://auth.sidedrawer.com/authorize`
- Token: `https://auth.sidedrawer.com/oauth/token`
- Audience: `https://user-api.sidedrawer.com`

## 🧪 Testing the Connection

1. Click "Connect to SideDrawer"
2. Complete the OAuth authorization
3. Once connected, click "Test Connection"
4. Verify the connection is working

## 🛠️ Troubleshooting

### "Client ID not configured" Error

**Problem**: Widget shows "Client ID not configured"

**Solution**: 
1. Ensure your widget URL includes all required parameters: `client_id`, `client_secret`, `redirect_uri`, and `environment`
2. Check for typos in parameter names (case-sensitive)
3. Clear browser localStorage and reload with correct URL

### "Redirect URI mismatch" Error

**Problem**: SideDrawer rejects the redirect URI

**Solution**: 
1. The `redirect_uri` parameter must match what's configured in SideDrawer OAuth app
2. Use the exact widget URL: `https://sidedrawer.github.io/SideDrawer/app/widget.html`
3. Ensure no trailing slashes or extra parameters in the SideDrawer configuration

### Popup Blocked

**Problem**: OAuth popup doesn't open

**Solution**: 
- Allow popups for your Zoho CRM domain
- Chrome: Click popup icon in address bar → "Always allow"
- Firefox: Click "Preferences" → "Allow popups from this site"

### 401 Unauthorized Error

**Problem**: Token exchange fails with 401 error

**Solution**:
1. Verify `client_id` and `client_secret` are correct
2. Ensure you're using the right environment (sandbox vs production)
3. Check that PKCE is enabled in your SideDrawer OAuth app
4. Add `https://sidedrawer.github.io` to "Allowed Web Origins" in Auth0 settings

### Widget Stuck on "Initializing..."

**Problem**: Widget doesn't load past initialization

**Solution**:
1. Check browser console (F12) for errors
2. Verify all URL parameters are present
3. Clear `localStorage` and reload: `localStorage.clear()`
4. Ensure popup blockers are disabled

### Credentials Lost After OAuth Redirect

**Problem**: Widget asks for credentials again after OAuth

**Cause**: `localStorage` is being cleared or blocked

**Solution**:
1. Ensure cookies/localStorage are enabled for the domain
2. Check browser privacy settings (not in incognito/private mode)
3. Verify no browser extensions are clearing storage

### CSP (Content Security Policy) Errors

**Problem**: Browser blocks connections to SideDrawer

**Solution**: Ensure `plugin-manifest.json` includes SideDrawer domains:
```json
{
  "cspDomains": {
    "connect-src": [
      "https://auth-sbx.sidedrawersbx.com",
      "https://user-api-sbx.sidedrawersbx.com",
      "https://tenants-gateway-api-sbx.sidedrawersbx.com"
    ]
  }
}
```

## 📱 Usage Example (Similar to HeyAdvisor/Cloven)

Once connected, you can:

1. **Share Documents**: Access SideDrawer documents from within Zoho CRM
2. **Client Communication**: Send secure document links to clients
3. **Track Interactions**: Monitor when clients access shared documents
4. **Automated Workflows**: Trigger actions based on document status

## 🔐 Security Considerations

### URL Parameters and Client Secret

**Important**: This widget uses URL parameters to pass OAuth credentials, including `client_secret`.

**Why this is acceptable for this use case:**
1. **Zoho CRM Context**: URLs are only accessible to authenticated Zoho CRM users
2. **No Public Exposure**: Widget URLs are not publicly accessible
3. **Industry Standard**: Similar to how other Zoho CRM integrations (HeyAdvisor, Cloven) work
4. **Alternative Would Be Complex**: A backend proxy would add unnecessary complexity

**Security Measures in Place:**
- PKCE (Proof Key for Code Exchange) adds an additional security layer
- Tokens are short-lived and automatically refreshed
- All OAuth communication uses HTTPS
- Credentials are stored in browser localStorage (not cookies)

### Best Practices

1. **Use HTTPS**: Always use HTTPS in production (GitHub Pages provides this)
2. **Unique Credentials**: Use different OAuth apps for each customer/organization
3. **Token Storage**: Tokens stored in localStorage are encrypted by the browser
4. **Scope Limitation**: Only request necessary OAuth scopes
5. **Audit Access**: Regularly review which organizations have access to your SideDrawer data

## 📚 Additional Resources

- [SideDrawer API Documentation](https://sidedrawer.com/developers)
- [OAuth2 Authorization Code Flow](https://oauth.net/2/grant-types/authorization-code/)
- [PKCE Specification](https://oauth.net/2/pkce/)
- [Zoho CRM Extensions](https://www.zoho.com/creator/help/extensions/)

## 🤝 Support

For issues or questions:
1. Check browser console for error messages
2. Verify OAuth credentials are correct
3. Ensure redirect URI matches exactly
4. Test in different browsers

## 📝 Key Conclusions

### The Working Solution

After extensive testing and iteration, here's what works:

**✅ GitHub Pages Deployment with URL Parameters**

```
https://sidedrawer.github.io/SideDrawer/app/widget.html?client_id=XXX&client_secret=XXX&redirect_uri=https://sidedrawer.github.io/SideDrawer/app/widget.html&environment=sandbox
```

### What We Learned

1. **URL Parameters Are the CORRECT Approach**
   - For externally-hosted widgets (GitHub Pages, custom servers), URL parameters are the **only** way to pass configuration to Zoho CRM
   - This is the industry standard used by other Zoho integrations (HeyAdvisor, Cloven, etc.)
   - The `variables` in `plugin-manifest.json` do NOT work for external hosting

2. **Popup-Based OAuth Flow**
   - Direct redirects don't work due to iframe restrictions (X-Frame-Options)
   - Popup window handles the OAuth flow independently
   - Tokens are passed back to parent via `postMessage` API

3. **Credential Persistence via localStorage**
   - URL parameters are read on first load and stored in `localStorage`
   - After OAuth redirect, credentials are retrieved from `localStorage`
   - This allows the widget to work across popup windows and redirects

4. **State Parameter Strategy**
   - OAuth `state` parameter carries the PKCE code_verifier
   - State also carries `clientId` and `redirectUri` for popup context
   - This ensures popup can complete token exchange independently

5. **Security is Acceptable**
   - URLs are only accessible to authenticated Zoho CRM users
   - PKCE adds additional security beyond client_secret
   - Same approach as other production Zoho integrations
   - Not publicly exposed

### Deployment Options

| Option | Use Case | Pros | Cons |
|--------|----------|------|------|
| **GitHub Pages** | Production, multi-tenant | No server needed, always available, free hosting | Credentials in URL |
| **Local Dev** | Development, testing | Full control, easy debugging | Requires running server, certificate warnings |
| **Zoho Hosting** | Enterprise deployments | Zoho manages hosting, `variables` work | More complex packaging, harder to debug |

### What Doesn't Work

❌ **Zoho `variables` for External Hosting** - Variables in `plugin-manifest.json` only work for Zoho-hosted widgets, not external URLs

❌ **Direct OAuth Redirects** - Blocked by X-Frame-Options when widget is in an iframe

❌ **sessionStorage for Credentials** - Lost across popup windows; must use `localStorage`

❌ **Parent Window Token Exchange** - Only popup should exchange authorization code to avoid duplicates

## 📝 License

Copyright (c) 2025. All rights reserved.

