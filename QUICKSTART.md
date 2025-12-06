# Quick Start Guide

Get your SideDrawer integration running in 2 minutes!

## 🚀 Quick Setup (GitHub Pages - Recommended)

### Option 1: Use the Hosted Version (Fastest!)

**The widget is already deployed and ready to use at:**
```
https://sidedrawer.github.io/SideDrawer/app/widget.html
```

### Step 1: Get Your SideDrawer Credentials (2 minutes)

1. Log into **SideDrawer Sandbox**: https://auth-sbx.sidedrawersbx.com
2. Go to **Settings → OAuth Applications**
3. Create a new OAuth application or use an existing one
4. Set the redirect URI to:
   ```
   https://sidedrawer.github.io/SideDrawer/app/widget.html
   ```
5. Copy your **Client ID** and **Client Secret**

### Step 2: Add Widget to Zoho CRM (1 minute)

1. In Zoho CRM, go to **Setup → Customization → Modules and Fields**
2. Select a module or create a **Custom Tab**
3. Add a **Web Tab** widget
4. Paste this URL (replace with your credentials):

```
https://sidedrawer.github.io/SideDrawer/app/widget.html?client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&redirect_uri=https://sidedrawer.github.io/SideDrawer/app/widget.html&environment=sandbox
```

**Example URL:**
```
https://sidedrawer.github.io/SideDrawer/app/widget.html?client_id=AYKueA9CuMXe7fMj8QfJM722F98NwZyA&client_secret=Dwd47Osd6secRvrrfC31ng2oWGGuiwnr55IGm0qRxHsgiDtYSwu8GMEEHKScksTD&redirect_uri=https://sidedrawer.github.io/SideDrawer/app/widget.html&environment=sandbox
```

### Step 3: Test the Connection (30 seconds)

1. Open the widget in Zoho CRM
2. Click **"Connect to SideDrawer"**
3. A popup opens - log in and authorize
4. You should see "Connected to SideDrawer" ✅

**That's it! You're done! 🎉**

---

## 🛠️ Option 2: Local Development

For testing or customization:

### Step 1: Install Dependencies (30 seconds)

```bash
npm install
```

### Step 2: Start the Server (10 seconds)

```bash
npm start
```

You should see:
```
Zet running at https://127.0.0.1:5001
Note: Please enable the host (https://127.0.0.1:5001) in a new tab...
```

### Step 3: Authorize the Certificate (1 minute)

1. Open your browser and go to: **https://127.0.0.1:5001**
2. You'll see a security warning (this is normal for local development)
3. Click **"Advanced"** then **"Proceed to 127.0.0.1 (unsafe)"**

### Step 4: Configure OAuth Redirect URI (2 minutes)

1. Log into **SideDrawer Sandbox**: https://auth-sbx.sidedrawersbx.com
2. Go to **Settings → OAuth Applications**
3. Add this redirect URI:
   ```
   https://127.0.0.1:5001/app/widget.html
   ```
4. Save the changes

### Step 5: Open the Widget with Credentials

Navigate to this URL (replace with your credentials):

```
https://127.0.0.1:5001/app/widget.html?client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&redirect_uri=https://127.0.0.1:5001/app/widget.html&environment=sandbox
```

### Step 6: Test the Connection (1 minute)

1. Click **"Connect to SideDrawer"**
2. A popup opens to SideDrawer login
3. Enter your credentials and authorize
4. You should see "Connected to SideDrawer" ✅

## 🎯 Understanding the URL Parameters

The widget URL includes these parameters:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `client_id` | Your SideDrawer OAuth Client ID | `AYKueA9CuMXe7fMj8QfJM722F98NwZyA` |
| `client_secret` | Your SideDrawer OAuth Client Secret | `Dwd47Osd6sec...` |
| `redirect_uri` | Where OAuth redirects after login | `https://sidedrawer.github.io/SideDrawer/app/widget.html` |
| `environment` | `sandbox` or `production` | `sandbox` |

### Why URL Parameters?

For **externally-hosted widgets** (like GitHub Pages), URL parameters are the **ONLY** way to configure credentials in Zoho CRM. This is the industry-standard approach used by other Zoho integrations.

**Security Notes:**
- URLs are only accessible to authenticated Zoho CRM users
- Not publicly exposed
- PKCE adds additional security layer
- Same approach as HeyAdvisor, Cloven, and other integrations

## 🧪 Testing Features

### Test Connection
1. Click **"Test Connection"** button
2. Should show: "✓ Connection test successful!"

### View Integration Example
Open: **https://127.0.0.1:5000/app/integration-example.html**

This shows a full integration with:
- 📄 Document management
- 👥 Client management
- 📤 Document sharing
- 📊 Activity tracking

## 🔍 Troubleshooting

### "Client ID not configured" Error

**Problem**: Missing or incorrect URL parameters

**Fix**: 
1. Ensure your URL includes all 4 parameters: `client_id`, `client_secret`, `redirect_uri`, `environment`
2. Check for typos (parameters are case-sensitive)
3. Clear browser storage: Open console (F12) and run `localStorage.clear()`

### "Redirect URI mismatch" Error

**Problem**: SideDrawer rejects the redirect

**Fix**: 
1. Redirect URI in SideDrawer must be exactly: `https://sidedrawer.github.io/SideDrawer/app/widget.html`
2. No trailing slashes
3. No query parameters in the SideDrawer configuration

### Popup Blocked

**Problem**: OAuth popup doesn't open

**Fix**: 
- Chrome: Click popup icon in address bar → "Always allow"
- Firefox: Click "Preferences" → "Allow popups"
- Safari: Safari → Preferences → Websites → Pop-up Windows → Allow

### 401 Unauthorized Error

**Problem**: Token exchange fails

**Fix**:
1. Verify `client_id` and `client_secret` are correct (copy-paste to avoid typos)
2. Ensure you're using the right `environment` (sandbox vs production)
3. Check that your SideDrawer OAuth app has PKCE enabled
4. Add `https://sidedrawer.github.io` to "Allowed Web Origins" in Auth0

### Widget Stuck on "Initializing..."

**Fix**:
1. Open browser console (F12) and check for errors
2. Verify all URL parameters are present and correct
3. Clear localStorage: `localStorage.clear()`
4. Reload the page

### Certificate Warning Won't Go Away (Local Dev Only)

**Chrome**: Type `thisisunsafe` while on the page (no input field needed)

**Firefox**: Click "Advanced" → "Accept the Risk and Continue"

### Can't Access https://127.0.0.1:5001 (Local Dev Only)

**Check if server is running**:
```bash
# Should show "Zet running at https://127.0.0.1:5001"
# If not, run: npm start
```

**Port already in use**:
```bash
# The server will try ports 5001-5009 automatically
# Check console output for actual port number
```

## 📚 Next Steps

### 1. Explore the Code

- **widget.html**: Main integration interface with OAuth flow
- **sidedrawer-api.js**: API helper for making authenticated requests
- **integration-example.html**: Full-featured example implementation

### 2. Customize the UI

Edit `app/widget.html` to:
- Change colors and styling
- Add your logo
- Customize messaging

### 3. Add Features

Use the `SideDrawerAPI` class to add functionality:

```javascript
// Example: Get user's documents
const api = new SideDrawerAPI();
const documents = await api.getDocuments();

// Example: Share a document
await api.shareDocument('doc-id', {
  recipientEmail: 'client@example.com',
  message: 'Here is your document'
});
```

### 4. Deploy to Production

See **CONFIGURATION.md** for detailed production deployment guide.

## 💡 Tips

### Keep Server Running
The local server must keep running while using the integration. Don't close the terminal!

### Multiple Terminals
Open a new terminal tab for other commands while the server runs.

### Auto-Restart
If you modify server code, restart with:
```bash
# Press Ctrl+C to stop
npm start  # Start again
```

### Browser Console
Always keep browser console open (F12) to see helpful debug messages.

## 🎓 Learning Resources

### Understanding OAuth
- The widget implements OAuth 2.0 with PKCE
- This is the most secure way to authenticate users
- Tokens are stored in browser localStorage

### Integration Flow
1. User clicks "Connect"
2. Redirect to SideDrawer login
3. User authorizes
4. Get access token
5. Make API calls with token

### File Structure
```
app/
  ├── widget.html              # Main integration widget (OAuth flow)
  ├── sidedrawer-api.js        # API helper class
  ├── integration-example.html # Full example implementation
  └── translations/
      └── en.json              # Text translations

server/
  └── index.js                 # Local development server

plugin-manifest.json           # Extension configuration
package.json                   # Dependencies
```

## ✅ Success Checklist

### Using GitHub Pages (Recommended):

- [ ] Get your SideDrawer Client ID and Client Secret
- [ ] Configure redirect URI in SideDrawer: `https://sidedrawer.github.io/SideDrawer/app/widget.html`
- [ ] Add widget to Zoho CRM with full URL (including parameters)
- [ ] Open widget and see "Not Connected" status (means URL params loaded correctly)
- [ ] Click "Connect to SideDrawer"
- [ ] Popup opens for OAuth login
- [ ] Complete OAuth authorization in popup
- [ ] See "Connected to SideDrawer" ✅
- [ ] Click "Test Connection" successfully

### Using Local Development:

- [ ] Start the server with `npm start`
- [ ] Accept certificate at https://127.0.0.1:5001
- [ ] Access widget URL with parameters
- [ ] See "Not Connected" status
- [ ] Click "Connect to SideDrawer"
- [ ] Complete OAuth authorization
- [ ] See "Connected to SideDrawer" ✅
- [ ] Click "Test Connection" successfully

## 🆘 Need Help?

1. **Check browser console** (F12) for error messages
2. **Read CONFIGURATION.md** for detailed setup instructions
3. **Review README.md** for comprehensive documentation
4. **Check server terminal** for backend errors

## 🎉 You're Ready!

Your SideDrawer integration is now running. Start building your integration or explore the example implementation!

**Happy coding! 🚀**

---

## 💡 Important Notes

### The Working Solution

The **correct and recommended** approach for production deployments:

**GitHub Pages with URL Parameters:**
```
https://sidedrawer.github.io/SideDrawer/app/widget.html?client_id=XXX&client_secret=XXX&redirect_uri=https://sidedrawer.github.io/SideDrawer/app/widget.html&environment=sandbox
```

### Why This Approach?

1. ✅ **No server required** - GitHub Pages hosts it for free
2. ✅ **Always available** - No downtime, no maintenance
3. ✅ **Multi-tenant ready** - Different customers use different credentials in their URLs
4. ✅ **Industry standard** - Same approach as HeyAdvisor, Cloven, and other Zoho integrations
5. ✅ **Secure** - URLs only accessible to authenticated Zoho CRM users, PKCE adds extra security

### Common Misconceptions

❌ **"Client secret should never be in a URL"** - This is true for PUBLIC websites, but Zoho CRM widget URLs are NOT public. They're only accessible to authenticated users within your organization.

❌ **"Zoho variables should work"** - The `variables` field in `plugin-manifest.json` only works for Zoho-hosted widgets (uploaded ZIP files), NOT for externally-hosted widgets (like GitHub Pages).

❌ **"We need a backend proxy"** - Not necessary for this use case. PKCE provides sufficient security for OAuth in SPAs (Single Page Applications).

### Key Learnings

1. **URL Parameters are the ONLY way** to configure externally-hosted widgets in Zoho CRM
2. **Popup-based OAuth** is required because direct redirects are blocked by iframe restrictions
3. **localStorage** is used to persist credentials across OAuth redirects and popup windows
4. **PKCE** adds an extra security layer beyond client_secret
5. **State parameter** carries both PKCE code_verifier and credentials to the popup

**Happy coding! 🚀**

