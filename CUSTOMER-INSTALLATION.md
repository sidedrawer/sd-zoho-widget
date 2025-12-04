# SideDrawer Integration - Customer Installation Guide

## Prerequisites

- Zoho CRM account with admin access
- SideDrawer account (sandbox or production)
- Access to create OAuth applications in SideDrawer

## Installation Steps

### 1. Find Your Widget URL

After installing the widget in Zoho CRM:

1. Open the browser DevTools (F12)
2. Run this in the console:
   ```javascript
   const iframe = document.querySelector('iframe[id="externalIframe"]');
   console.log('Widget URL:', iframe?.src);
   ```
3. Copy the full URL (will look like `https://creatorextn.zoho.com/crm/org[YOUR_ORG_ID]/...`)

**IMPORTANT**: This is the URL you'll use as the OAuth redirect URI.

### 2. Create SideDrawer OAuth Application

1. Log into SideDrawer (sandbox: https://auth-sbx.sidedrawersbx.com or production: https://auth.sidedrawer.com)
2. Navigate to **Settings** → **OAuth Applications**
3. Click **Create New Application**
4. Fill in the form:
   - **Name**: `Zoho CRM Integration - [Your Company]`
   - **Redirect URI**: Paste the widget URL from step 1
   - **Grant Types**: Check "Authorization Code"
   - **PKCE**: Enable (required)
5. Click **Save**
6. **Copy** the generated **Client ID** and **Client Secret**

### 3. Configure the Widget in Zoho

1. In Zoho CRM, go to **Setup** → **Developer Hub** → **Widgets**
2. Find the **SideDrawer Integration** widget in the list
3. Click the **Settings** icon (⚙️) or **Configure** button next to it
4. Fill in the configuration:

   | Field | Value | Example |
   |-------|-------|---------|
   | **OAuth Redirect URI** | Your widget URL from step 1 | `https://creatorextn.zoho.com/crm/org110001007505/tab/WebTab13` |
   | **Client ID** | From SideDrawer OAuth app | `AYKueA9CuMXe7fMj8QfJM722F98NwZyA` |
   | **Client Secret** | From SideDrawer OAuth app | `Dwd47Osd6secRvrrfC31ng2oWGGuiwnr...` |
   | **Environment** | `sandbox` or `production` | `sandbox` (for testing) |

5. Click **Save**

### 4. Test the Integration

1. Open the SideDrawer widget tab in Zoho CRM
2. Click **Connect to SideDrawer**
3. A popup window should open asking you to log into SideDrawer
4. Log in with your SideDrawer credentials
5. Authorize the application
6. The popup should close and the widget should show **Connected** status

### 5. Verify Connection

After connecting, the widget should display:
- ✅ **Connected to SideDrawer**
- Your tenant information
- Token expiry time
- Test connection button

Click **Test Connection** to verify the integration is working properly.

## Troubleshooting

### "Popup blocked" Error

**Solution**: Allow popups for your Zoho CRM domain
- Chrome: Click the popup icon in the address bar → Always allow
- Firefox: Click Preferences → Allow popups from this site

### "Redirect URI mismatch" Error

**Cause**: The redirect URI in SideDrawer doesn't match the widget URL

**Solution**:
1. Double-check the widget URL (step 1)
2. Ensure the SideDrawer OAuth app has the **exact** same URL
3. No trailing slashes, must match exactly

### "Invalid client credentials" Error

**Cause**: Wrong Client ID or Client Secret

**Solution**:
1. Verify you copied the credentials correctly from SideDrawer
2. No extra spaces or line breaks
3. Make sure you're using the right environment (sandbox vs production)

### Widget Stuck on "Initializing..."

**Cause**: Configuration not loaded or incorrect

**Solution**:
1. Refresh the page
2. Check browser console for errors (F12)
3. Verify all configuration fields are filled in correctly

## Support

For technical support, contact:
- **Email**: support@yourcompany.com
- **Phone**: +1-XXX-XXX-XXXX

## Security Notes

- **Client Secret** is stored securely by Zoho and never exposed in the browser
- **Access Tokens** are stored in Zoho session storage (temporary)
- **Refresh Tokens** are stored in browser localStorage (persistent but encrypted by browser)
- All OAuth communication uses HTTPS with PKCE for additional security

## Multi-Organization Deployment

Each Zoho organization requires its own SideDrawer OAuth application because:
- Each has a unique widget URL
- OAuth redirect URIs must match exactly
- This ensures security and isolation between organizations

**Best Practice**: Create a separate SideDrawer OAuth app for each Zoho CRM customer/organization.

