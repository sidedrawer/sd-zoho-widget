# SideDrawer Widget - URL Parameter Deployment Guide

## ✅ PKCE-Only OAuth (No Client Secret Required!)

The widget now supports **PKCE-only** OAuth2 flow, which means you **DON'T need to pass the client_secret** via URL!

PKCE (Proof Key for Code Exchange) provides security through dynamic `code_verifier`/`code_challenge` pairs, making client secrets optional for public clients.

## 🔧 Configuration via URL Parameters

### Required Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `client_id` | Your SideDrawer OAuth Application Client ID | `AYKueA9CuMXe7fMj8QfJM722F98NwZyA` |
| `redirect_uri` | Full URL where SideDrawer should redirect after login | `https://127.0.0.1:5001/app/widget.html` |

### Optional Parameters

| Parameter | Description | Default | Example |
|-----------|-------------|---------|---------|
| `environment` or `env` | SideDrawer environment | `sandbox` | `production` |
| `client_secret` | Client Secret (only if required by your OAuth app) | `null` | (not recommended in URL) |

## 📋 Deployment Examples

### Example 1: Development (Localhost)

```
https://127.0.0.1:5001/app/widget.html?client_id=YOUR_CLIENT_ID&redirect_uri=https://127.0.0.1:5001/app/widget.html&env=sandbox
```

### Example 2: Customer A (Sandbox)

```
https://yourserver.com/sidedrawer/widget.html?client_id=CUSTOMER_A_CLIENT_ID&redirect_uri=https://yourserver.com/sidedrawer/widget.html&env=sandbox
```

### Example 3: Customer B (Production)

```
https://yourserver.com/sidedrawer/widget.html?client_id=CUSTOMER_B_CLIENT_ID&redirect_uri=https://yourserver.com/sidedrawer/widget.html&env=production
```

### Example 4: Zoho CRM Web Tab

When creating a Web Tab in Zoho CRM, use this URL format:

```
https://yourserver.com/sidedrawer/widget.html?client_id=YOUR_CLIENT_ID&redirect_uri=https://yourserver.com/sidedrawer/widget.html
```

**Important**: The `redirect_uri` must match **exactly** what's configured in your SideDrawer OAuth application!

## 🎯 Multi-Tenant Deployment Workflow

### Step 1: Create SideDrawer OAuth App for Each Customer

For each customer, create a separate OAuth application in SideDrawer:

1. Log into SideDrawer (sandbox or production)
2. Go to **Settings** → **OAuth Applications** → **Create New**
3. Fill in:
   - **Name**: `Zoho CRM - [Customer Name]`
   - **Redirect URI**: `https://yourserver.com/sidedrawer/widget.html` (or their specific URL)
   - **Grant Types**: ✅ Authorization Code
   - **PKCE**: ✅ Required
4. **Save** and copy the **Client ID**
5. **No need to copy Client Secret!** (PKCE makes it optional)

### Step 2: Build Customer-Specific URLs

For Customer A:
```
https://yourserver.com/sidedrawer/widget.html?client_id=CUSTOMER_A_CLIENT_ID&redirect_uri=https://yourserver.com/sidedrawer/widget.html&env=sandbox
```

For Customer B:
```
https://yourserver.com/sidedrawer/widget.html?client_id=CUSTOMER_B_CLIENT_ID&redirect_uri=https://yourserver.com/sidedrawer/widget.html&env=production
```

### Step 3: Add to Zoho CRM as Web Tab

1. In Zoho CRM: **Setup** → **Customization** → **Modules and Fields**
2. Choose a module (e.g., Contacts)
3. Add **Web Tab**
4. Paste the customer-specific URL with parameters
5. Save

### Step 4: Test

1. Open the Web Tab
2. Check browser console - you should see:
   ```
   🔧 SideDrawer OAuth Configuration:
     Environment: sandbox
     Client ID: CUSTOMER_A_CLIENT_ID
     Client Secret: Not provided (using PKCE only)
     Redirect URI: https://yourserver.com/sidedrawer/widget.html
   ```
3. Click "Connect to SideDrawer"
4. Complete OAuth flow
5. Verify connection

## 🔒 Security Considerations

### ✅ Safe to Pass via URL

- **Client ID**: Public identifier, safe in URLs
- **Redirect URI**: Just a URL, safe to expose
- **Environment**: Just "sandbox" or "production", safe

### ⚠️ Do NOT Pass via URL (if using)

- **Client Secret**: If you must use it, hardcode it in the widget file instead

### 🛡️ PKCE Provides Security

- Dynamic `code_verifier` generated per auth session
- `code_challenge` sent to SideDrawer
- Prevents authorization code interception attacks
- Makes client secrets optional for public clients

## 📊 Customer Tracking Spreadsheet

Track your customers in a spreadsheet:

| Customer | Client ID | Environment | Widget URL | Installed Date |
|----------|-----------|-------------|------------|----------------|
| Acme Corp | AYKue...ZyA | sandbox | https://yourserver.com/sidedrawer/widget.html?client_id=AYKue...ZyA&... | 2025-01-15 |
| Beta Inc | BZLvf...AzB | production | https://yourserver.com/sidedrawer/widget.html?client_id=BZLvf...AzB&... | 2025-01-20 |

## 🚀 Scaling to Many Customers

### Option A: Static URLs (Current Approach)

**Pros:**
- Simple, no backend needed
- Each customer gets their own URL
- Easy to test and debug

**Cons:**
- URL parameters visible to user
- Must rebuild URL for each customer

### Option B: Dynamic Backend (Advanced)

Use a backend to generate config based on customer:

```javascript
// server.js
app.get('/widget/:customerId', (req, res) => {
  const customer = getCustomer(req.params.customerId);
  const widgetUrl = `widget.html?client_id=${customer.clientId}&env=${customer.env}`;
  res.redirect(widgetUrl);
});
```

Then each customer gets:
```
https://yourserver.com/widget/acme-corp
https://yourserver.com/widget/beta-inc
```

## ❓ FAQ

### Q: Do I need a different OAuth app for each customer?

**A:** Yes! Each customer needs their own SideDrawer OAuth application because:
- Different redirect URIs
- Security isolation
- Per-customer permissions

### Q: Can I use one Client ID for all customers?

**A:** Not recommended! If one customer's URL is compromised, all customers are affected. Keep them separate.

### Q: What if SideDrawer requires client_secret even with PKCE?

**A:** If SideDrawer's OAuth implementation requires client_secret:
1. Pass it via URL: `&client_secret=XXX` (not recommended for security)
2. Or hardcode ONE client_secret in the widget code (create one OAuth app per environment)

Check the console logs when testing - if you see "401 Unauthorized" or "invalid_client", client_secret might be required.

### Q: How do I test if PKCE-only works?

**A:** Test with just `client_id` and `redirect_uri`:
```
https://127.0.0.1:5001/app/widget.html?client_id=YOUR_ID&redirect_uri=https://127.0.0.1:5001/app/widget.html
```

If OAuth completes successfully, PKCE-only works! ✅

If you get "invalid_client" error, client_secret is required.

## 🔍 Debugging

### Console Logs

The widget logs its configuration on startup:

```
🔧 SideDrawer OAuth Configuration:
  Environment: sandbox
  Client ID: AYKueA9CuMXe7fMj8QfJM722F98NwZyA
  Client Secret: Not provided (using PKCE only)
  Redirect URI: https://127.0.0.1:5001/app/widget.html
  Auth Endpoint: https://auth-sbx.sidedrawersbx.com/authorize
  Token Endpoint: https://auth-sbx.sidedrawersbx.com/oauth/token
```

During token exchange:

```
Client Secret: Not provided (using PKCE only)
Token request body: {
  grant_type: 'authorization_code',
  client_id: 'AYK...',
  client_secret: 'Not included',  ← Check this!
  code: 'abc...',
  code_verifier: '...'
}
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "redirect_uri mismatch" | URL params don't match OAuth app | Ensure exact match (no trailing slash!) |
| "invalid_client" | client_secret required by SideDrawer | Add `&client_secret=XXX` to URL |
| "invalid_grant" | Code verifier mismatch | Clear localStorage and try again |
| URL params ignored | Wrong parameter names | Use `client_id`, `redirect_uri`, `env` |

## ✅ Summary

**This approach gives you:**
- ✅ No client secrets in URLs (PKCE provides security)
- ✅ Easy multi-tenant deployment (just change URL params)
- ✅ No code changes per customer
- ✅ Simple testing (just change URL)
- ✅ Works with Zoho Web Tabs

**Perfect for scaling to multiple customers!** 🚀

