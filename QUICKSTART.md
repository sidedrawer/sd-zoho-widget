# Quick Start Guide

Get your SideDrawer integration running in 5 minutes!

## 🚀 Quick Setup

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
Zet running at https://127.0.0.1:5000
Note: Please enable the host (https://127.0.0.1:5000) in a new tab...
```

### Step 3: Authorize the Certificate (1 minute)

1. Open your browser and go to: **https://127.0.0.1:5000**
2. You'll see a security warning (this is normal for local development)
3. Click **"Advanced"** then **"Proceed to 127.0.0.1 (unsafe)"**

### Step 4: Open the Widget (10 seconds)

Navigate to: **https://127.0.0.1:5000/app/widget.html**

You should see the SideDrawer integration interface!

### Step 5: Configure OAuth Redirect URI (2 minutes)

**Important**: Before you can connect, you need to configure the OAuth app in SideDrawer:

1. Log into **SideDrawer Sandbox**: https://app-sbx.sidedrawersbx.com
2. Go to **Settings → API & Integrations → OAuth Applications**
3. Find the OAuth app with Client ID: `AYKueA9CuMXe7fMj8QfJM722F98NwZyA`
4. Add this redirect URI:
   ```
   https://127.0.0.1:5000/app/widget.html
   ```
5. Save the changes

### Step 6: Test the Connection (1 minute)

1. In the widget, click **"Connect to SideDrawer"**
2. You'll be redirected to SideDrawer login
3. Enter your credentials and authorize
4. You'll be redirected back - you should see "Connected to SideDrawer" ✅

## 🎯 Using in Zoho CRM

### Add as Web Tab

1. In **Zoho CRM**, go to **Settings → Customization → Modules and Fields**
2. Select your module or create a custom module
3. Add a **Web Tab** widget
4. Set the URL to: `https://127.0.0.1:5000/app/widget.html`
5. The widget will load inside Zoho CRM!

### Update Redirect URI for Zoho

When using inside Zoho, update the redirect URI:

1. Copy the exact URL of your Zoho web tab (from browser address bar)
   - Example: `https://crm.zohocloud.ca/crm/org110001007505/tab/WebTab7`

2. Add this URL to SideDrawer OAuth app settings (same place as Step 5 above)

3. The widget will automatically use the current page URL as redirect URI

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

### "Redirect URI mismatch" Error

**Fix**: Add the exact URL to SideDrawer OAuth app settings

```bash
# Check what URL is being used:
# 1. Open browser console (F12)
# 2. Look for: "Redirecting to: https://auth-sbx..."
# 3. Find the redirect_uri parameter in that URL
# 4. Add that exact URI to SideDrawer OAuth app
```

### Certificate Warning Won't Go Away

**Chrome**: Type `thisisunsafe` while on the page (no input field needed)

**Firefox**: Click "Advanced" → "Accept the Risk and Continue"

### Can't Access https://127.0.0.1:5000

**Check if server is running**:
```bash
# Should show "Zet running at https://127.0.0.1:5000"
# If not, run: npm start
```

**Port already in use**:
```bash
# The server will try ports 5000-5009 automatically
# Check console output for actual port number
```

### OAuth Flow Stuck

1. **Clear browser storage**:
   - Open browser console (F12)
   - Run: `localStorage.clear()`
   - Reload page

2. **Try again**:
   - Click "Connect to SideDrawer"
   - Complete authorization

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

You're all set when you can:

- [ ] Start the server with `npm start`
- [ ] Access https://127.0.0.1:5000/app/widget.html
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

Your SideDrawer integration is now running locally. Start building your integration or explore the example implementation!

**Happy coding! 🚀**

