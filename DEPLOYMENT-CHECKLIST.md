# SideDrawer Widget - Deployment Checklist

## For Widget Developers/Admins Deploying to Multiple Customers

### Before First Customer Deployment

- [ ] **Package the widget**
  ```bash
  zet pack
  ```
  This creates a `.zip` file for Zoho Marketplace

- [ ] **Test in your own Zoho sandbox**
  - Install the packaged widget
  - Configure with test credentials
  - Verify OAuth flow works
  - Test all features

- [ ] **Prepare customer documentation**
  - [ ] `CUSTOMER-INSTALLATION.md` (included)
  - [ ] Screenshots of configuration screen
  - [ ] Video walkthrough (optional but helpful)

- [ ] **Set up support channel**
  - [ ] Support email address
  - [ ] Ticket system (optional)
  - [ ] FAQ document

### For Each New Customer Deployment

#### Phase 1: Pre-Deployment

- [ ] **Confirm customer has:**
  - [ ] Zoho CRM account (with admin access)
  - [ ] SideDrawer account (sandbox or production)
  - [ ] Permissions to create OAuth apps in SideDrawer

- [ ] **Schedule deployment meeting**
  - Customer admin present
  - Screen sharing enabled
  - 30-45 minutes allocated

#### Phase 2: Deployment Steps

1. [ ] **Upload widget to customer's Zoho**
   - Go to Zoho CRM → Setup → Developer Hub → Widgets
   - Click "Add Widget" or "Upload"
   - Upload the `.zip` file

2. [ ] **Install the widget**
   - Click Install
   - Choose installation type (Organization-wide or specific users)
   - Accept permissions

3. [ ] **Add widget to CRM tab**
   - Setup → Customization → Modules and Fields
   - Choose module (usually "Contacts" or "Accounts")
   - Add new Web Tab
   - Name it "SideDrawer"
   - Link to the installed widget

4. [ ] **Get the widget URL**
   - Open the widget tab
   - Press F12 (DevTools)
   - Run:
     ```javascript
     document.querySelector('iframe[id="externalIframe"]')?.src
     ```
   - Copy the full URL

5. [ ] **Guide customer to create SideDrawer OAuth app**
   - Walk them through creating the OAuth app
   - Use the widget URL as redirect URI
   - Enable PKCE
   - Note down Client ID and Secret

6. [ ] **Configure the widget**
   - In Zoho: Setup → Developer Hub → Widgets → SideDrawer → Settings (⚙️)
   - Fill in all 4 fields:
     - OAuth Redirect URI
     - Client ID
     - Client Secret  
     - Environment (sandbox/production)
   - Save configuration

7. [ ] **Test the integration**
   - Open SideDrawer tab
   - Click "Connect to SideDrawer"
   - Complete OAuth flow in popup
   - Verify "Connected" status
   - Click "Test Connection"
   - Check tenant information displays

#### Phase 3: Post-Deployment

- [ ] **Document for this customer**
  - Widget URL
  - Environment (sandbox/production)
  - Installation date
  - Zoho org ID

- [ ] **Send follow-up email**
  - Confirmation of successful installation
  - Link to user documentation
  - Support contact information
  - Next steps / training schedule

- [ ] **Schedule follow-up call** (1 week later)
  - Verify users are connecting successfully
  - Address any questions
  - Gather feedback

### Common Deployment Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Can't find iframe URL | Widget not loaded | Refresh page, ensure widget is active |
| OAuth redirect mismatch | Wrong URL copied | Must be exact iframe `src`, not tab URL |
| Popup blocked | Browser settings | Enable popups for Zoho domain |
| "Invalid client" error | Wrong environment | Check sandbox vs production |
| Widget shows "Initializing..." | Config not saved | Re-save configuration, hard refresh |

### Multi-Tenant Architecture

**Important**: Each customer needs their own SideDrawer OAuth application because:

1. **Security Isolation**
   - Each customer has unique credentials
   - Tokens can't be shared across organizations
   - Prevents unauthorized access

2. **URL Uniqueness**
   - Each Zoho org has different org ID
   - Widget URL is different for each customer
   - OAuth redirect must match exactly

3. **Environment Separation**
   - Some customers use sandbox
   - Some use production
   - Can't mix environments

### Scaling to 10+ Customers

**Recommendation**: Create a tracking spreadsheet

| Customer Name | Zoho Org ID | Widget URL | Environment | Installed Date | Status |
|---------------|-------------|------------|-------------|----------------|--------|
| Acme Corp | org110001007505 | https://... | sandbox | 2025-01-15 | Active |
| Beta Inc | org110001008234 | https://... | production | 2025-01-20 | Active |

### Automation Opportunities (Future)

For large-scale deployments, consider:

- [ ] **Auto-configuration API**
  - Pre-populate config via Zoho API
  - Reduce manual configuration steps

- [ ] **Health monitoring**
  - Check widget status across all customers
  - Alert on authentication failures

- [ ] **Centralized logging**
  - Aggregate errors from all installations
  - Proactive issue detection

### Update/Upgrade Process

When releasing a new version:

1. [ ] Test in sandbox thoroughly
2. [ ] Package new version: `zet pack`
3. [ ] Notify all customers of upcoming update
4. [ ] Schedule maintenance window (if breaking changes)
5. [ ] Upload new version to each customer's Zoho
6. [ ] Monitor for issues post-upgrade
7. [ ] Update documentation

### Rollback Plan

If an update causes issues:

1. [ ] Have previous version `.zip` ready
2. [ ] Uninstall current version
3. [ ] Reinstall previous version
4. [ ] Configuration is preserved (stored in Zoho)
5. [ ] Notify customer of rollback

## Development vs Production

### Development Mode (Current Setup)

- **Widget URL**: `https://127.0.0.1:5001/app/widget.html`
- **OAuth Config**: Hardcoded defaults in code
- **Testing**: Local server with self-signed certificate
- **Use Case**: Development and testing only

### Production Mode (Customer Deployment)

- **Widget URL**: `https://creatorextn.zoho.com/crm/org[CUSTOMER_ORG]/...`
- **OAuth Config**: Loaded from Zoho configuration
- **Testing**: Deployed to Zoho Marketplace
- **Use Case**: Real customer usage

## Checklist Summary

✅ **The widget is already designed for multi-tenant deployment!**

Key features:
- ✅ Dynamic URL configuration per customer
- ✅ Per-customer OAuth credentials
- ✅ Environment switching (sandbox/production)
- ✅ Secure credential storage via Zoho
- ✅ No code changes needed per deployment

**You're ready to scale!** 🚀

