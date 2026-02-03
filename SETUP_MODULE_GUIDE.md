# SD_Widget_Setup Custom Module Guide

This guide explains how to create the `SD_Widget_Setup` custom module in Zoho CRM to store SideDrawer widget credentials.

## Overview

The `SD_Widget_Setup` custom module stores widget configuration credentials that are shared across all users in your Zoho CRM instance. This allows the widget to work without requiring widget variables to be configured upfront.

**Important:** This widget uses **PKCE (Proof Key for Code Exchange)** OAuth flow, which does **NOT require a client secret**. Only the Client ID is needed for authentication.

## Module Creation Steps

### 1. Create Custom Module

1. Log in to Zoho CRM as an Administrator
2. Go to **Settings** → **Customization** → **Modules**
3. Click **Create Custom Module**
4. Enter the following details:
   - **Module Name:** `SD_Widget_Setup`
   - **Plural Label:** `SD Widget Setups`
   - **API Name:** `SD_Widget_Setup` (auto-generated)
   - **Description:** "Stores SideDrawer widget configuration credentials"
5. Click **Create**

### 2. Add Fields

After creating the module, add the following fields:

#### Client_Id__c (Text)
- **Field Label:** `Client ID`
- **Field Name:** `Client_Id__c`
- **Data Type:** Text (Single Line)
- **Length:** 255
- **Required:** Yes
- **Description:** OAuth Client ID from SideDrawer (public identifier)

#### Environment__c (Picklist)
- **Field Label:** `Environment`
- **Field Name:** `Environment__c`
- **Data Type:** Picklist
- **Required:** Yes
- **Picklist Values:**
  - `sandbox`
  - `production`
- **Default Value:** `sandbox`
- **Description:** SideDrawer environment (sandbox or production)

#### Redirect_Uri__c (URL)
- **Field Label:** `Redirect URI`
- **Field Name:** `Redirect_Uri__c`
- **Data Type:** URL
- **Required:** Yes
- **Description:** OAuth redirect URI (must match SideDrawer app configuration)

#### Tenant_Id__c (Text)
- **Field Label:** `Tenant ID`
- **Field Name:** `Tenant_Id__c`
- **Data Type:** Text (Single Line)
- **Length:** 255
- **Required:** No
- **Description:** SideDrawer Tenant ID (optional, can be set later)

#### Brand_Code__c (Text)
- **Field Label:** `Brand Code`
- **Field Name:** `Brand_Code__c`
- **Data Type:** Text (Single Line)
- **Length:** 100
- **Required:** No
- **Description:** SideDrawer Brand Code (optional)

#### Is_Active__c (Boolean)
- **Field Label:** `Is Active`
- **Field Name:** `Is_Active__c`
- **Data Type:** Checkbox
- **Required:** No
- **Default Value:** Checked (true)
- **Description:** Connection active status

**Note:** Do NOT create a `Client_Secret__c` field - it is not needed for PKCE OAuth flow.

### 3. Configure Sharing Rules

1. Go to **Settings** → **Customization** → **Modules** → **SD_Widget_Setup**
2. Click **Sharing Settings**
3. Configure sharing rules:
   - **Public Read:** All users can read records
   - **Write Access:** Administrators only (via field-level permissions)

### 4. Configure Field-Level Permissions

1. Go to **Settings** → **Security** → **Profiles**
2. For each profile:
   - **Administrator Profile:**
     - All fields: **Read & Write**
   - **Standard User Profiles:**
     - All fields: **Read Only**

This ensures:
- All users can read credentials (required for OAuth flow)
- Only administrators can modify credentials

### 5. Create Initial Record (Optional)

You can create an initial record manually, or let the widget create it automatically when an administrator configures credentials through the Setup modal.

**To create manually:**
1. Go to **SD_Widget_Setup** module
2. Click **Create SD Widget Setup**
3. Fill in:
   - Client ID
   - Environment (sandbox or production)
   - Redirect URI
   - Tenant ID (optional)
   - Brand Code (optional)
4. Save

## Security Considerations

### No Client Secret Required

This widget uses **PKCE (Proof Key for Code Exchange)** OAuth flow:
- **Client ID** is a public identifier (not sensitive)
- **No Client Secret** needed - PKCE provides security through code verifier/challenge
- All API communication uses HTTPS (TLS 1.2/1.3)

### Access Control

- **Read Access:** All users can read credentials (required for OAuth flow)
- **Write Access:** Restricted to Administrators only
- **Permission Checks:** Widget checks user permissions before allowing credential configuration

### Best Practices

1. **Single Record Pattern:** Use only one record in this module (like Salesforce `Setup__c.getOrgDefaults()`)
2. **HTTPS Only:** Ensure redirect URI uses HTTPS
3. **Regular Updates:** Update credentials when rotating Client IDs
4. **Audit Trail:** Zoho CRM maintains audit logs for custom module access

## Widget Behavior

### Credential Priority

The widget loads credentials in this order:
1. **Custom Module** (`SD_Widget_Setup`) - Primary source
2. **Widget Variables** (`ZOHO.CRM.CONFIG.getVariables()`) - Fallback
3. **URL Parameters** - Development/testing fallback

### Permission-Based Access

- **Administrators:** Can see "Setup" and "Create Tenant" buttons, can configure credentials
- **Standard Users:** Cannot see setup buttons, can use widget with existing credentials

### Automatic Setup After Tenant Creation

When an administrator creates a tenant:
1. If credentials don't exist in custom module → Setup modal opens automatically
2. Tenant ID is pre-filled in the setup form
3. Administrator completes credential configuration
4. All users can then use the widget

## Troubleshooting

### Module Not Found

If you see "Custom module does not exist" error:
1. Verify module name is exactly `SD_Widget_Setup`
2. Check API name matches `SD_Widget_Setup`
3. Ensure user has read access to the module

### Permission Denied

If you see "Permission denied" error:
1. Verify user has Administrator role
2. Check field-level permissions allow write access
3. Ensure sharing rules allow administrator access

### Credentials Not Loading

If credentials don't load:
1. Check if record exists in `SD_Widget_Setup` module
2. Verify required fields (Client ID, Environment, Redirect URI) are filled
3. Check field-level permissions allow read access
4. Review browser console for error messages

## API Reference

The widget uses the following Zoho CRM APIs:

- `ZOHO.CRM.API.getRecords()` - Read setup configuration
- `ZOHO.CRM.API.insertRecord()` - Create setup record
- `ZOHO.CRM.API.updateRecord()` - Update setup record
- `ZOHO.CRM.CONFIG.getCurrentUser()` - Check user permissions
- `ZOHO.CRM.CONFIG.getVariables()` - Fallback to widget variables

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify module structure matches this guide
3. Ensure permissions are configured correctly
4. Contact SideDrawer support if issues persist
