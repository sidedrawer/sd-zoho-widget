# SideDrawer Integration - Customer Installation Guide

## Prerequisites

- Zoho CRM account with admin access
- SideDrawer account (sandbox or production)
- Access to create OAuth applications in SideDrawer

## Installation Steps

### 1. Create SideDrawer OAuth Application

1. Log into SideDrawer:
   - **Sandbox**: https://auth-sbx.sidedrawersbx.com
   - **Production**: https://auth.sidedrawer.com

2. Navigate to **Settings** → **OAuth Applications**

3. Click **Create New Application**

4. Fill in the form:
   - **Name**: `Zoho CRM Integration - [Your Company Name]`
   - **Redirect URI**: `https://sidedrawer.github.io/SideDrawer/app/widget.html`
   - **Grant Types**: ✓ Authorization Code
   - **PKCE**: ✓ Enabled (required)

5. Click **Save**

6. **Copy and save** these credentials:
   - **Client ID** (example: `AYKueA9CuMXe7fMj8QfJM722F98NwZyA`)
   - **Client Secret** (example: `Dwd47Osd6secRvrrfC31ng2oWGGuiwnr55IGm0qRxHsgiDtYSwu8GMEEHKScksTD`)

### 2. Add Widget to Zoho CRM

1. In Zoho CRM, go to **Setup** → **Customization** → **Modules and Fields**

2. Select the module where you want the widget (or create a custom tab)

3. Click **Web Tab** to add a new web tab widget

4. Configure the web tab:
   - **Name**: `SideDrawer`
   - **URL**: Build your URL using this template:

**For Sandbox:**
```
https://sidedrawer.github.io/SideDrawer/app/widget.html?client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&redirect_uri=https://sidedrawer.github.io/SideDrawer/app/widget.html&environment=sandbox
```

**For Production:**
```
https://sidedrawer.github.io/SideDrawer/app/widget.html?client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&redirect_uri=https://sidedrawer.github.io/SideDrawer/app/widget.html&environment=production
```

**Example (using sample credentials):**
```
https://sidedrawer.github.io/SideDrawer/app/widget.html?client_id=AYKueA9CuMXe7fMj8QfJM722F98NwZyA&client_secret=Dwd47Osd6secRvrrfC31ng2oWGGuiwnr55IGm0qRxHsgiDtYSwu8GMEEHKScksTD&redirect_uri=https://sidedrawer.github.io/SideDrawer/app/widget.html&environment=sandbox
```

5. Click **Save**

### 3. Test the Integration

1. Open the SideDrawer widget tab in Zoho CRM

2. You should see the widget interface with a **"Connect to SideDrawer"** button

3. Click **Connect to SideDrawer**

4. A popup window opens with the SideDrawer login page

5. Log in with your SideDrawer credentials

6. Click **Authorize** to grant permissions

7. The popup closes automatically

8. The widget now shows **"Connected to SideDrawer"** ✅

### 4. Verify Connection

After connecting, the widget should display:
- ✅ **Connected to SideDrawer**
- Your tenant information (Tenant ID, Brand Code, Region)
- Token expiry time
- **Test Connection** button

Click **Test Connection** to verify the integration is working properly.

## Understanding the URL Parameters

The widget URL includes these configuration parameters:

| Parameter | Description | Required |
|-----------|-------------|----------|
| `client_id` | Your SideDrawer OAuth Client ID | ✓ Yes |
| `client_secret` | Your SideDrawer OAuth Client Secret | ✓ Yes |
| `redirect_uri` | Where OAuth redirects after login | ✓ Yes |
| `environment` | `sandbox` or `production` | ✓ Yes |

**Why URL parameters?**

For externally-hosted widgets (like this one on GitHub Pages), URL parameters are the **only** way to configure credentials in Zoho CRM. This is the standard approach used by other Zoho integrations (HeyAdvisor, Cloven, etc.).

## Troubleshooting

### "Client ID not configured" Error

**Cause**: URL parameters are missing or incorrect

**Solution**:
1. Verify your widget URL includes all 4 parameters: `client_id`, `client_secret`, `redirect_uri`, `environment`
2. Check for typos (parameter names are case-sensitive)
3. Ensure there are no line breaks in the URL
4. Try copying the example URL and replacing just the credentials

### "Popup blocked" Error

**Cause**: Browser is blocking the OAuth popup

**Solution**: Allow popups for your Zoho CRM domain
- **Chrome**: Click the popup icon in the address bar → "Always allow popups from crm.zohocloud.ca"
- **Firefox**: Click "Preferences" → "Allow popups from this site"
- **Safari**: Safari → Preferences → Websites → Pop-up Windows → Allow for Zoho CRM

### "Redirect URI mismatch" Error

**Cause**: The redirect URI in SideDrawer doesn't match the widget URL

**Solution**:
1. The redirect URI in SideDrawer must be **exactly**: `https://sidedrawer.github.io/SideDrawer/app/widget.html`
2. No trailing slashes
3. No query parameters (the `?client_id=...` part should NOT be in SideDrawer config)
4. Case-sensitive match

### "Invalid client credentials" / 401 Unauthorized Error

**Cause**: Wrong Client ID or Client Secret, or environment mismatch

**Solution**:
1. Verify you copied the credentials correctly from SideDrawer (copy-paste to avoid typos)
2. Ensure no extra spaces or line breaks in the URL
3. Make sure you're using the right `environment`:
   - Use `environment=sandbox` for SideDrawer sandbox credentials
   - Use `environment=production` for SideDrawer production credentials
4. Verify PKCE is enabled in your SideDrawer OAuth app
5. Add `https://sidedrawer.github.io` to "Allowed Web Origins" in Auth0 settings

### Widget Stuck on "Initializing..."

**Cause**: Configuration not loaded properly

**Solution**:
1. Open browser console (F12) and check for errors
2. Verify the widget URL is correct and complete
3. Clear browser storage:
   - Open browser console (F12)
   - Type: `localStorage.clear()`
   - Reload the page
4. Verify all URL parameters are present

### Credentials Lost After Reconnecting

**Cause**: Browser localStorage is being cleared

**Solution**:
1. Don't use Incognito/Private browsing mode
2. Check browser privacy settings allow localStorage
3. Disable browser extensions that clear storage
4. Verify cookies are enabled for the domain

## Support

For technical support, contact:
- **Email**: support@yourcompany.com
- **Phone**: +1-XXX-XXX-XXXX

## Security Notes

### URL Parameters and Client Secret

**Question**: Is it safe to include `client_secret` in the URL?

**Answer**: Yes, for this specific use case:

1. **Not Publicly Accessible**: The widget URL is only accessible to authenticated Zoho CRM users within your organization
2. **Industry Standard**: This is how other Zoho CRM integrations (HeyAdvisor, Cloven) handle external widgets
3. **Additional Security with PKCE**: The OAuth flow uses PKCE (Proof Key for Code Exchange) which adds an extra layer of security beyond just the client secret
4. **HTTPS**: All communication is encrypted via HTTPS
5. **Short-lived Tokens**: Access tokens are short-lived and automatically refreshed

### What Gets Stored Where

- **URL Parameters**: Client ID and Secret are read once and stored in browser localStorage
- **Access Tokens**: Stored in browser localStorage (automatically encrypted by browser)
- **Refresh Tokens**: Stored in browser localStorage for silent re-authentication
- **OAuth Communication**: All requests use HTTPS with PKCE

### Best Practices

1. **Unique Credentials**: Use different OAuth applications for each customer/organization
2. **Environment Separation**: Never use production credentials in sandbox, or vice versa
3. **Regular Audits**: Periodically review which organizations have access to your SideDrawer data
4. **Revoke Access**: If an employee leaves, you can revoke their SideDrawer access without affecting the integration

## Multi-Organization Deployment

### Can I use the same OAuth app for multiple Zoho organizations?

**Yes!** Unlike some integrations, this widget uses the same redirect URI for all installations:
- `https://sidedrawer.github.io/SideDrawer/app/widget.html`

This means:
- ✅ **You can use the same OAuth app** for multiple Zoho CRM organizations
- ✅ **Simpler management** - one OAuth app, multiple deployments
- ✅ **Each organization still isolated** - tokens are stored per-browser, per-user

### Recommended Deployment Strategies

**Option 1: Single OAuth App (Simpler)**
- Create one OAuth app in SideDrawer
- Use the same `client_id` and `client_secret` for all Zoho organizations
- Easier to manage, single point of configuration

**Option 2: Per-Customer OAuth Apps (More Secure)**
- Create separate OAuth app for each customer/organization
- Different credentials for each deployment
- Better isolation, easier to revoke access for specific customers
- Recommended for white-label or multi-tenant SaaS

