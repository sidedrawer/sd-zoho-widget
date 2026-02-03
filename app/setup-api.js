/**
 * Setup API - Manages SideDrawer widget credentials in Zoho Custom Module
 * 
 * This module handles CRUD operations for credentials stored in the SD_Widget_Setup custom module.
 * It includes permission checks to ensure only users with "Manage Organization" rights can modify credentials.
 * 
 * Dependencies:
 * - ZOHO.CRM.CONFIG.getCurrentUser() - For permission checking
 * - ZOHO.CRM.CONFIG.getVariables() - For fallback to widget variables
 * - ZOHO.CRM.API - For custom module operations
 */

const SETUP_MODULE_NAME = 'SD_Widget_Setup';

// Expose isStandaloneMode for use in other modules
if (typeof window !== 'undefined') {
  window.isStandaloneMode = isStandaloneMode;
}

/**
 * Check if we're running in standalone mode (local development)
 * @returns {boolean} True if running standalone (not in Zoho iframe)
 */
function isStandaloneMode() {
  // Check if we're in an iframe (Zoho) or standalone (local dev)
  const isInIframe = window.self !== window.top;
  
  // Standalone mode: not in iframe (running locally via npm start)
  // In Zoho, the widget runs inside an iframe, so window.self !== window.top
  // When running locally, window.self === window.top
  const isStandalone = !isInIframe;
  
  return isStandalone;
}

/**
 * Check if current user has "Manage Organization" rights
 * Uses ZOHO.CRM.CONFIG.getCurrentUser() to check user role
 * Bypasses check in standalone mode (local development)
 * @returns {Promise<boolean>} True if user is Administrator or in standalone mode
 */
async function checkUserHasManageOrgPermission() {
  console.log('[Setup API] checkUserHasManageOrgPermission called');
  
  // Bypass permission check in standalone mode (local development)
  if (isStandaloneMode()) {
    console.log('[Setup API] Standalone mode detected - bypassing permission check');
    return true;
  }
  
  console.log('[Setup API] Not in standalone mode - proceeding with Zoho permission check');
  
  try {
    // Wait for Zoho SDK to be available
    console.log('[Setup API] Checking Zoho SDK availability...');
    console.log('[Setup API] ZOHO object exists:', typeof ZOHO !== 'undefined');
    
    // Wait up to 5 seconds for ZOHO SDK to be available
    let attempts = 0;
    const maxAttempts = 50; // 50 attempts * 100ms = 5 seconds
    while (typeof ZOHO === 'undefined' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (typeof ZOHO === 'undefined') {
      console.warn('[Setup API] ZOHO SDK not loaded after waiting');
      return false;
    }
    
    console.log('[Setup API] ZOHO SDK found, waiting for SDK to be ready...');
    
    // Wait for ZOHO.CRM.CONFIG to be available (SDK should already be initialized by widget startup)
    attempts = 0;
    while ((!ZOHO?.CRM?.CONFIG?.getCurrentUser) && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    console.log('[Setup API] ZOHO.CRM exists:', typeof ZOHO?.CRM !== 'undefined');
    console.log('[Setup API] ZOHO.CRM.CONFIG exists:', typeof ZOHO?.CRM?.CONFIG !== 'undefined');
    console.log('[Setup API] getCurrentUser function exists:', typeof ZOHO?.CRM?.CONFIG?.getCurrentUser === 'function');
    
    if (!ZOHO?.CRM?.CONFIG?.getCurrentUser) {
      console.error('[Setup API] getCurrentUser function not available - SDK may not be initialized yet');
      return false;
    }
    
    console.log('[Setup API] Calling ZOHO.CRM.CONFIG.getCurrentUser()...');
    const user = await ZOHO.CRM.CONFIG.getCurrentUser();
    console.log('[Setup API] getCurrentUser() promise resolved');
    console.log('[Setup API] getCurrentUser() returned:', user);
    console.log('[Setup API] user type:', typeof user);
    console.log('[Setup API] user is null:', user === null);
    console.log('[Setup API] user is undefined:', user === undefined);
    console.log('[Setup API] user?.users:', user?.users);
    console.log('[Setup API] user?.users type:', typeof user?.users);
    console.log('[Setup API] user?.users is array:', Array.isArray(user?.users));
    console.log('[Setup API] user?.users length:', user?.users?.length);
    
    const userData = user?.users?.[0];
    console.log('[Setup API] Extracted userData:', userData);
    console.log('[Setup API] userData is null:', userData === null);
    console.log('[Setup API] userData is undefined:', userData === undefined);
    
    if (!userData) {
      console.warn('[Setup API] No user data found - user object:', user);
      console.warn('[Setup API] Returning false due to missing userData');
      return false;
    }
    
    console.log('[Setup API] UserData found, proceeding with permission check');
    
    // Log ALL user data for debugging
    console.log('[Setup API] Full user data:', JSON.stringify(userData, null, 2));
    console.log('[Setup API] User role object:', userData.role);
    console.log('[Setup API] User profile object:', userData.profile);
    console.log('[Setup API] User admin flag:', userData.admin);
    
    // Check multiple indicators of admin status
    const role = userData.role?.name || '';
    const roleId = userData.role?.id || '';
    const isAdminFlag = userData.admin === true;
    const profile = userData.profile?.name || '';
    const profileId = userData.profile?.id || '';
    
    console.log('[Setup API] Extracted values:');
    console.log('  - role.name:', role);
    console.log('  - role.id:', roleId);
    console.log('  - admin flag:', isAdminFlag);
    console.log('  - profile.name:', profile);
    console.log('  - profile.id:', profileId);
    
    // Check for manual override in URL or localStorage (for testing)
    const urlParams = new URLSearchParams(window.location.search);
    const manualAdmin = urlParams.get('admin') === 'true' || localStorage.getItem('sd_force_admin') === 'true';
    if (manualAdmin) {
      console.warn('[Setup API] MANUAL ADMIN OVERRIDE ENABLED (for testing)');
      return true;
    }
    
    // Administrator role check - expanded criteria
    const roleLower = role.toLowerCase();
    const profileLower = profile.toLowerCase();
    const roleIdUpper = roleId.toString().toUpperCase();
    const profileIdUpper = profileId.toString().toUpperCase();
    
    const isAdmin = 
      roleLower === 'administrator' || 
      roleLower === 'admin' ||
      roleIdUpper === 'ADMIN' ||
      roleIdUpper.includes('ADMIN') ||
      isAdminFlag ||
      profileLower.includes('admin') ||
      profileLower.includes('administrator') ||
      profileLower.includes('manager') ||
      profileLower.includes('management') ||
      profileIdUpper.includes('ADMIN') ||
      profileIdUpper === '1100000000001'; // Common Zoho admin profile ID
    
    // If standard checks fail, try checking profile permissions
    if (!isAdmin && profileId) {
      try {
        console.log('[Setup API] Standard checks failed, checking profile ID:', profileId);
        // Profile IDs for admins often contain 'ADMIN' or specific admin profile IDs
        if (profileIdUpper.includes('ADMIN') || profileId === '1100000000001') {
          console.log('[Setup API] Admin detected via profile ID');
          return true;
        }
      } catch (e) {
        console.warn('[Setup API] Could not check profile permissions:', e);
      }
    }
    
    console.log('[Setup API] Permission check - Role:', role, 'Profile:', profile, 'Is Admin:', isAdmin);
    console.log('[Setup API] Returning isAdmin value:', isAdmin);
    return isAdmin;
  } catch (error) {
    console.error('[Setup API] ERROR in checkUserHasManageOrgPermission:', error);
    console.error('[Setup API] Error name:', error?.name);
    console.error('[Setup API] Error message:', error?.message);
    console.error('[Setup API] Error stack:', error?.stack);
    console.warn('[Setup API] Could not verify permissions, returning false:', error);
    return false; // Default to false for security
  }
}

/**
 * Check if custom module exists
 * @param {string} moduleName - Module name to check
 * @returns {Promise<boolean>} True if module exists
 */
async function checkSetupModuleExists() {
  // Check if we're in standalone mode
  const isStandalone = isStandaloneMode();
  if (isStandalone) {
    console.log('[Setup API] Standalone mode - skipping module existence check');
    return false; // Assume module doesn't exist in standalone mode
  }
  
  try {
    // Try to get records from the module
    // If module doesn't exist, this will throw an error
    await ZOHO.CRM.API.getRecords({
      Entity: SETUP_MODULE_NAME,
      page: 1,
      perPage: 1
    });
    return true;
  } catch (error) {
    // Module doesn't exist or user doesn't have access
    console.warn(`[Setup API] Module ${SETUP_MODULE_NAME} not found or not accessible:`, error.message);
    return false;
  }
}

/**
 * Get setup configuration from custom module
 * @returns {Promise<Object|null>} Setup config object or null if not found
 */
async function getSetupConfig() {
  // Check if we're in standalone mode
  const isStandalone = isStandaloneMode();
  if (isStandalone) {
    console.log('[Setup API] Standalone mode - skipping custom module read');
    return null;
  }
  
  try {
    const moduleExists = await checkSetupModuleExists();
    if (!moduleExists) {
      console.log('[Setup API] Custom module does not exist, returning null');
      return null;
    }
    
    // Get all records (should be single record pattern)
    const response = await ZOHO.CRM.API.getRecords({
      Entity: SETUP_MODULE_NAME,
      page: 1,
      perPage: 10
    });
    
    if (!response?.data || response.data.length === 0) {
      console.log('[Setup API] No setup records found');
      return null;
    }
    
    // Use first record (single record pattern)
    const record = response.data[0];
    
    const config = {
      id: record.id,
      clientId: record.Client_Id__c || null,
      environment: record.Environment__c || null,
      redirectUri: record.Redirect_Uri__c || null,
      tenantId: record.Tenant_Id__c || null,
      brandCode: record.Brand_Code__c || null,
      isActive: record.Is_Active__c !== false // Default to true if not set
    };
    
    console.log('[Setup API] Loaded setup config from custom module:', {
      clientId: config.clientId ? 'Set' : 'Not Set',
      environment: config.environment,
      redirectUri: config.redirectUri ? 'Set' : 'Not Set',
      tenantId: config.tenantId ? 'Set' : 'Not Set'
    });
    
    return config;
  } catch (error) {
    console.error('[Setup API] Error getting setup config:', error);
    return null;
  }
}

/**
 * Save setup configuration to custom module
 * Requires admin permissions - throws error if user doesn't have rights
 * @param {Object} config - Configuration object
 * @param {string} config.clientId - OAuth Client ID (required)
 * @param {string} config.environment - Environment: 'sandbox' or 'production' (required)
 * @param {string} config.redirectUri - OAuth Redirect URI (required)
 * @param {string} [config.tenantId] - SideDrawer Tenant ID (optional)
 * @param {string} [config.brandCode] - Brand Code (optional)
 * @param {boolean} [config.isActive] - Connection active status (optional, default: true)
 * @returns {Promise<Object>} Saved configuration object
 */
async function saveSetupConfig(config) {
  // Check if we're in standalone mode
  const isStandalone = isStandaloneMode();
  
  // In standalone mode, allow saving to localStorage as fallback
  if (isStandalone) {
    console.log('[Setup API] Standalone mode - saving to localStorage (fallback)');
    try {
      localStorage.setItem('sd_widget_setup_config', JSON.stringify(config));
      console.log('[Setup API] Config saved to localStorage');
      return config; // Return config as-is for standalone mode
    } catch (error) {
      console.warn('[Setup API] Failed to save to localStorage:', error);
      throw new Error('Failed to save configuration in standalone mode');
    }
  }
  
  // Check permissions first (in Zoho environment)
  const hasPermission = await checkUserHasManageOrgPermission();
  if (!hasPermission) {
    throw new Error('Permission denied: Only users with "Manage Organization" rights can configure credentials.');
  }
  
  // Validate required fields
  if (!config.clientId || !config.clientId.trim()) {
    throw new Error('Client ID is required');
  }
  if (!config.environment || !['sandbox', 'production'].includes(config.environment.toLowerCase())) {
    throw new Error('Environment must be "sandbox" or "production"');
  }
  if (!config.redirectUri || !config.redirectUri.trim()) {
    throw new Error('Redirect URI is required');
  }
  
  try {
    const moduleExists = await checkSetupModuleExists();
    if (!moduleExists) {
      throw new Error(`Custom module ${SETUP_MODULE_NAME} does not exist. Please create it first using the setup guide.`);
    }
    
    // Prepare data for Zoho API
    const setupData = {
      Client_Id__c: config.clientId.trim(),
      Environment__c: config.environment.toLowerCase(),
      Redirect_Uri__c: config.redirectUri.trim(),
      Tenant_Id__c: config.tenantId?.trim() || null,
      Brand_Code__c: config.brandCode?.trim() || null,
      Is_Active__c: config.isActive !== false // Default to true
    };
    
    // Check if record already exists
    const existingConfig = await getSetupConfig();
    
    let savedRecord;
    if (existingConfig && existingConfig.id) {
      // Update existing record
      console.log('[Setup API] Updating existing setup record:', existingConfig.id);
      const response = await ZOHO.CRM.API.updateRecord({
        Entity: SETUP_MODULE_NAME,
        RecordID: existingConfig.id,
        APIData: setupData
      });
      savedRecord = response?.data?.[0];
    } else {
      // Create new record
      console.log('[Setup API] Creating new setup record');
      const response = await ZOHO.CRM.API.insertRecord({
        Entity: SETUP_MODULE_NAME,
        APIData: setupData
      });
      savedRecord = response?.data?.[0];
    }
    
    if (!savedRecord) {
      throw new Error('Failed to save setup configuration');
    }
    
    console.log('[Setup API] Setup config saved successfully');
    
    // Return saved config
    return {
      id: savedRecord.id,
      clientId: savedRecord.Client_Id__c || setupData.Client_Id__c,
      environment: savedRecord.Environment__c || setupData.Environment__c,
      redirectUri: savedRecord.Redirect_Uri__c || setupData.Redirect_Uri__c,
      tenantId: savedRecord.Tenant_Id__c || setupData.Tenant_Id__c,
      brandCode: savedRecord.Brand_Code__c || setupData.Brand_Code__c,
      isActive: savedRecord.Is_Active__c !== false
    };
  } catch (error) {
    console.error('[Setup API] Error saving setup config:', error);
    throw error;
  }
}

/**
 * Get credentials with fallback priority:
 * 1. Custom Module (SD_Widget_Setup)
 * 2. Widget Variables (ZOHO.CRM.CONFIG.getVariables())
 * 
 * @returns {Promise<Object|null>} Credentials object or null
 */
async function getCredentials() {
  // Check if we're in standalone mode
  const isStandalone = isStandaloneMode();
  
  // In standalone mode, skip Zoho API calls that might hang
  if (isStandalone) {
    console.log('[Setup API] Standalone mode - skipping Zoho API calls');
    return null;
  }
  
  try {
    // First, try custom module
    const customModuleConfig = await getSetupConfig();
    if (customModuleConfig && customModuleConfig.clientId) {
      console.log('[Setup API] Using credentials from custom module');
      return {
        clientId: customModuleConfig.clientId,
        environment: customModuleConfig.environment,
        redirectUri: customModuleConfig.redirectUri,
        tenantId: customModuleConfig.tenantId,
        brandCode: customModuleConfig.brandCode,
        source: 'custom_module'
      };
    }
  } catch (error) {
    console.warn('[Setup API] Error getting custom module config:', error);
  }
  
  // Fallback to widget variables (only if not standalone)
  if (!isStandalone) {
    try {
      if (typeof ZOHO !== 'undefined' && ZOHO.CRM && ZOHO.CRM.CONFIG) {
        const widgetConfig = await ZOHO.CRM.CONFIG.getVariables();
        if (widgetConfig && widgetConfig.client_id) {
          console.log('[Setup API] Using credentials from widget variables (fallback)');
          return {
            clientId: widgetConfig.client_id,
            environment: widgetConfig.environment || 'sandbox',
            redirectUri: widgetConfig.redirect_uri,
            tenantId: null,
            brandCode: null,
            source: 'widget_variables'
          };
        }
      }
    } catch (error) {
      console.warn('[Setup API] Could not load widget variables:', error);
    }
  }
  
  // In standalone mode, try localStorage fallback
  if (isStandalone) {
    try {
      const storedConfig = localStorage.getItem('sd_widget_setup_config');
      if (storedConfig) {
        const config = JSON.parse(storedConfig);
        if (config && config.clientId) {
          console.log('[Setup API] Using credentials from localStorage (standalone mode)');
          return {
            clientId: config.clientId,
            environment: config.environment || 'sandbox',
            redirectUri: config.redirectUri,
            tenantId: config.tenantId || null,
            brandCode: config.brandCode || null,
            source: 'localStorage'
          };
        }
      }
    } catch (error) {
      console.warn('[Setup API] Could not load from localStorage:', error);
    }
  }
  
  console.log('[Setup API] No credentials found');
  return null;
}

/**
 * Delete setup configuration from custom module
 * Requires admin permissions
 * @returns {Promise<boolean>} True if deleted successfully
 */
async function deleteSetupConfig() {
  // Check if we're in standalone mode
  const isStandalone = isStandaloneMode();
  if (isStandalone) {
    // In standalone mode, clear localStorage
    localStorage.removeItem('sd_widget_setup_config');
    console.log('[Setup API] Cleared localStorage config (standalone mode)');
    return true;
  }
  
  // Check permissions (in Zoho environment)
  const hasPermission = await checkUserHasManageOrgPermission();
  if (!hasPermission) {
    throw new Error('Permission denied: Only users with "Manage Organization" rights can delete credentials.');
  }
  
  try {
    const existingConfig = await getSetupConfig();
    if (existingConfig && existingConfig.id) {
      await ZOHO.CRM.API.deleteRecord({
        Entity: SETUP_MODULE_NAME,
        RecordID: existingConfig.id
      });
      console.log('[Setup API] Deleted setup record:', existingConfig.id);
      return true;
    }
    return false; // No record to delete
  } catch (error) {
    console.error('[Setup API] Error deleting setup config:', error);
    throw error;
  }
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
  window.SetupAPI = {
    checkUserHasManageOrgPermission,
    checkSetupModuleExists,
    getSetupConfig,
    saveSetupConfig,
    getCredentials,
    deleteSetupConfig
  };
}
