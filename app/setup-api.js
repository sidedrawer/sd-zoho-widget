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
  // Bypass permission check in standalone mode (local development)
  if (isStandaloneMode()) {
    console.log('[Setup API] Standalone mode detected - bypassing permission check');
    return true;
  }
  
  try {
    const user = await ZOHO.CRM.CONFIG.getCurrentUser();
    const userData = user?.users?.[0];
    
    if (!userData) {
      console.warn('[Setup API] No user data found');
      return false;
    }
    
    // Check multiple indicators of admin status
    const role = userData.role?.name || '';
    const roleId = userData.role?.id || '';
    const isAdminFlag = userData.admin === true;
    const profile = userData.profile?.name || '';
    
    // Administrator role check
    const isAdmin = 
      role.toLowerCase() === 'administrator' || 
      roleId === 'ADMIN' ||
      isAdminFlag ||
      profile.toLowerCase().includes('admin') ||
      profile.toLowerCase().includes('manager');
    
    console.log('[Setup API] Permission check - Role:', role, 'Profile:', profile, 'Is Admin:', isAdmin);
    return isAdmin;
  } catch (error) {
    console.warn('[Setup API] Could not verify permissions:', error);
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

// Export functions for use in other modules
if (typeof window !== 'undefined') {
  window.SetupAPI = {
    checkUserHasManageOrgPermission,
    checkSetupModuleExists,
    getSetupConfig,
    saveSetupConfig,
    getCredentials
  };
}
