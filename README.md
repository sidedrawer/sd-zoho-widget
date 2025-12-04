# SideDrawer Integration for Zoho CRM

This widget provides a secure OAuth2 integration between Zoho CRM and SideDrawer, similar to the HeyAdvisor integration with Cloven.

## 🚀 Features

- **OAuth2 Authorization Code Flow with PKCE**: Secure authentication using industry-standard OAuth2
- **Automatic Token Management**: Handles access token refresh automatically
- **Connection Status**: Visual indicators showing connection status
- **Modern UI**: Clean, professional interface with status indicators
- **Error Handling**: Comprehensive error handling and user feedback

## 📋 Prerequisites

Before using this integration, ensure you have:

1. **SideDrawer Account**: Access to SideDrawer sandbox environment
2. **Zoho CRM Access**: Permissions to add web tab widgets
3. **OAuth2 Credentials**: Already configured in the widget (sandbox credentials)

## 🔧 Setup Instructions

### 1. Configure SideDrawer OAuth2 Application

In your SideDrawer sandbox account, you need to configure the OAuth2 application with:

**Redirect URI**: `https://crm.zohocloud.ca/crm/org110001007505/tab/WebTab7`

> **Note**: The redirect URI must exactly match the URL where your Zoho web tab is hosted. If your organization ID or tab ID is different, update the `redirectUri` in `app/widget.html` (line 187).

### 2. Install the Widget

1. Run the development server:
   ```bash
   npm install
   npm start
   ```

2. The server will start at `https://127.0.0.1:5000` (or next available port 5001-5009)

3. Open the URL in your browser and authorize the self-signed certificate:
   - Click "Advanced" → "Proceed to 127.0.0.1 (unsafe)"

4. In Zoho CRM:
   - Navigate to your web tab configuration
   - Point it to `https://127.0.0.1:5000/app/widget.html`

### 3. Configure Production

When deploying to production:

1. **Update OAuth Endpoints**: Change from sandbox (`-sbx`) to production URLs in `app/widget.html`:
   ```javascript
   authorizationEndpoint: 'https://auth.sidedrawer.com/authorize',
   tokenEndpoint: 'https://auth.sidedrawer.com/oauth/token',
   audience: 'https://user-api.sidedrawer.com',
   ```

2. **Update Credentials**: Replace with production OAuth credentials

3. **Update plugin-manifest.json**: Change CSP domains to production URLs

## 🎯 How It Works

### OAuth2 Flow

1. **User Clicks "Connect to SideDrawer"**
   - Widget generates a PKCE code verifier and challenge
   - Redirects to SideDrawer authorization page

2. **User Authorizes**
   - User logs into SideDrawer and grants permissions
   - SideDrawer redirects back with authorization code

3. **Token Exchange**
   - Widget exchanges code for access token
   - Tokens are stored in browser localStorage

4. **Automatic Refresh**
   - Widget automatically refreshes expired tokens
   - Maintains persistent connection

### Redirect URI Handling

The widget uses the current page URL as the redirect URI. In Zoho CRM web tabs, this means:
- The OAuth flow redirects back to the same web tab
- No separate callback page needed
- Seamless user experience

### Security Features

- **PKCE (Proof Key for Code Exchange)**: Protects against authorization code interception
- **Secure Token Storage**: Tokens stored in browser localStorage
- **Automatic Token Refresh**: Prevents expired token errors
- **CSP Headers**: Content Security Policy restricts allowed domains

## 🔑 Configuration

### OAuth2 Credentials (Currently Configured)

```javascript
const OAUTH_CONFIG = {
  authorizationEndpoint: 'https://auth-sbx.sidedrawersbx.com/authorize',
  tokenEndpoint: 'https://auth-sbx.sidedrawersbx.com/oauth/token',
  clientId: 'AYKueA9CuMXe7fMj8QfJM722F98NwZyA',
  clientSecret: 'Dwd47Osd6secRvrrfC31ng2oWGGuiwnr55IGm0qRxHsgiDtYSwu8GMEEHKScksTD',
  audience: 'https://user-api-sbx.sidedrawersbx.com',
  redirectUri: window.location.origin + window.location.pathname,
  scope: 'openid profile email offline_access'
};
```

### Updating Redirect URI

If your Zoho web tab URL is different, update line 187 in `app/widget.html`:

```javascript
redirectUri: 'https://your-actual-zoho-url',
```

Or keep it dynamic (recommended):
```javascript
redirectUri: window.location.origin + window.location.pathname,
```

## 🧪 Testing the Connection

1. Click "Connect to SideDrawer"
2. Complete the OAuth authorization
3. Once connected, click "Test Connection"
4. Verify the connection is working

## 🛠️ Troubleshooting

### "Redirect URI mismatch" Error

**Problem**: SideDrawer rejects the redirect URI

**Solution**: 
1. Check the exact URL of your Zoho web tab
2. Configure this exact URL in SideDrawer OAuth app settings
3. Update `redirectUri` in widget.html if needed

### OAuth Flow Opens in Iframe

**Expected Behavior**: The widget first tries to redirect the whole page. If Zoho blocks this, it falls back to an iframe.

**If Stuck**: 
- Allow popups for the Zoho domain
- Try using a different browser
- Check browser console for errors

### Token Expired Errors

**Solution**: The widget should automatically refresh tokens. If not:
1. Click "Disconnect"
2. Click "Connect to SideDrawer" again
3. Re-authorize the connection

### CSP (Content Security Policy) Errors

**Problem**: Browser blocks connections to SideDrawer

**Solution**: Ensure `plugin-manifest.json` includes SideDrawer domains in `connect-src`:
```json
{
  "cspDomains": {
    "connect-src": [
      "https://auth-sbx.sidedrawersbx.com",
      "https://user-api-sbx.sidedrawersbx.com"
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

1. **Never expose client_secret in production**: Consider using a backend proxy for token exchange
2. **Use HTTPS**: Always use HTTPS in production
3. **Token Storage**: Currently uses localStorage; consider more secure alternatives for sensitive data
4. **Scope Limitation**: Only request necessary OAuth scopes

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

## 📝 License

Copyright (c) 2025. All rights reserved.

