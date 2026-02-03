/**
 * Tenant Creation Wizard With Credentials - For Logged-In Users
 * Follows Angular tenant-creation-form-with-credentials API flow
 * 
 * Dependencies:
 * - OAUTH_CONFIG (global)
 * - Stripe.js library (loaded via CDN)
 * - stripeService (from tenant-wizard.js or shared instance)
 */

// Reuse StripeService from tenant-wizard.js if available, otherwise create new instance
let stripeServiceWithCredentials;
if (typeof window.stripeService !== 'undefined') {
  stripeServiceWithCredentials = window.stripeService;
} else {
  // Stripe Service for PCI-compliant payment processing
  class StripeService {
    constructor() {
      this.stripe = null;
      this.elements = null;
      this.cardElement = null;
      this.stripePublicKey = null;
    }

    async initialize(stripePublicKey) {
      if (!stripePublicKey) {
        console.warn('⚠️ Stripe public key not provided. Stripe Elements will not work.');
        return false;
      }

      try {
        if (typeof Stripe === 'undefined') {
          console.error('❌ Stripe.js not loaded. Make sure https://js.stripe.com/v3/ is included.');
          return false;
        }

        this.stripePublicKey = stripePublicKey;
        this.stripe = Stripe(stripePublicKey);
        
        this.elements = this.stripe.elements({
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#ff6b35',
              colorBackground: '#ffffff',
              colorText: '#30313d',
              colorDanger: '#df1b41',
              fontFamily: 'system-ui, sans-serif',
              spacingUnit: '4px',
              borderRadius: '4px',
            },
          },
        });

        console.log('✅ Stripe initialized successfully');
        return true;
      } catch (error) {
        console.error('❌ Error initializing Stripe:', error);
        return false;
      }
    }

    async createCardElement(containerId) {
      if (!this.elements) {
        console.error('❌ Stripe Elements not initialized. Call initialize() first.');
        return null;
      }

      try {
        const container = document.getElementById(containerId);
        if (!container) {
          console.error(`❌ Container element not found: #${containerId}`);
          return null;
        }

        this.cardElement = this.elements.create('card', {
          style: {
            base: {
              fontSize: '16px',
              color: '#30313d',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
            invalid: {
              color: '#df1b41',
              iconColor: '#df1b41',
            },
          },
        });

        this.cardElement.mount(`#${containerId}`);
        
        this.cardElement.on('change', (event) => {
          const errorElement = document.getElementById(`${containerId}-error`);
          if (errorElement) {
            if (event.error) {
              errorElement.textContent = event.error.message;
              errorElement.style.display = 'block';
            } else {
              errorElement.textContent = '';
              errorElement.style.display = 'none';
            }
          }
        });

        console.log('✅ Stripe card element created and mounted');
        return this.cardElement;
      } catch (error) {
        console.error('❌ Error creating card element:', error);
        return null;
      }
    }

    async createPaymentMethod(billingDetails) {
      if (!this.stripe || !this.cardElement) {
        return { paymentMethodId: null, error: { message: 'Stripe not initialized or card element not created' } };
      }

      try {
        const { paymentMethod, error } = await this.stripe.createPaymentMethod({
          type: 'card',
          card: this.cardElement,
          billing_details: billingDetails,
        });

        if (error) {
          return { paymentMethodId: null, error };
        }

        if (!paymentMethod) {
          return { paymentMethodId: null, error: { message: 'Failed to create payment method' } };
        }

        console.log('✅ Payment method created:', paymentMethod.id);
        return { paymentMethodId: paymentMethod.id };
      } catch (error) {
        console.error('❌ Error creating payment method:', error);
        return { paymentMethodId: null, error };
      }
    }

    unmountCardElement() {
      if (this.cardElement) {
        this.cardElement.unmount();
        this.cardElement = null;
        console.log('✅ Stripe card element unmounted');
      }
    }

    destroy() {
      this.unmountCardElement();
      this.elements = null;
      this.stripe = null;
      this.stripePublicKey = null;
    }
  }
  stripeServiceWithCredentials = new StripeService();
}

// Tenant Creation Wizard With Credentials - For Logged-In Users
class TenantCreationWizardWithCredentials {
  constructor() {
    this.state = {
      currentStep: 0,
      // User info (from authenticated account)
      account: null,
      accountId: null,
      customerId: null,
      openId: null,
      accessToken: null,
      settings: null,
      // Step 1: Tenant Info (NO email/password)
      tenantName: '',
      tenantDomain: '',
      region: '',
      // Step 2: Subscription
      selectedPrice: null,
      currency: null,
      priceTab: 'month',
      prices: [],
      monthlyPrices: [],
      yearlyPrices: [],
      usersPrices: [],
      monthlyUsersPrices: [],
      yearlyUsersPrices: [],
      totalAdminUsers: 0,
      dictionary: null,
      dictionaryPrices: [],
      databaseRegions: [],
      currencies: [],
      // Step 3: Payment
      cardElement: null,
      billingAddress: null,
      cardholderName: '',
      selectedPaymentMethod: null,
      paymentMethods: [],
      paymentMethodToken: null,
      stripePublicKey: null,
      hasDefaultPaymentMethod: false, // Track if user has default payment method
      // Process tracking
      processSteps: [],
      // Skip steps flag
      skipPayment: false, // Set to true if user has default payment method (skip payment step only)
      // UI State
      loading: false,
      error: null,
      validationError: null
    };
  }

  extractOpenIdFromToken(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub; // OpenID is typically in 'sub' claim
    } catch (error) {
      console.error('Failed to extract OpenID from token:', error);
      return null;
    }
  }

  async init(accessToken) {
    if (!accessToken) {
      throw new Error('Access token is required for logged-in user wizard');
    }

    this.state.accessToken = accessToken;
    this.state.openId = this.extractOpenIdFromToken(accessToken);

    try {
      this.state.loading = true;
      this.render(); // Show loading state
      
      console.log('🔄 Phase 1: Loading initial data...');
      
      // Phase 1: Load initial data following Angular flow
      console.log('📡 [1/6] Loading account and settings...');
      await this.loadAccountAndSettings();
      console.log('✅ Account and settings loaded');
      
      console.log('📡 [2/6] Loading dictionary...');
      await this.loadDictionary();
      console.log('✅ Dictionary loaded');
      
      console.log('📡 [3/6] Loading prices...');
      await this.loadPrices();
      console.log('✅ Prices loaded');
      
      console.log('📡 [4/6] Loading regions and currencies...');
      await this.loadRegions();
      await this.loadCurrencies();
      console.log('✅ Regions and currencies loaded');
      
      // Load customer and payment methods if customerId exists
      console.log(`🔍 Checking customerId: ${this.state.customerId}`);
      if (this.state.customerId) {
        console.log('📡 [5/6] Loading customer details...');
        await this.loadCustomer();
        console.log('✅ Customer details loaded');
        
        console.log('📡 [6/6] Loading payment methods...');
        await this.loadPaymentMethods();
        console.log('✅ Payment methods loaded');
        
        // Check if user has default payment method - if yes, skip payment step only
        if (this.state.hasDefaultPaymentMethod && this.state.selectedPaymentMethod) {
          console.log('💳 Default payment method found - skipping payment step only');
          this.state.skipPayment = true;
        }
      } else {
        console.log('ℹ️ No customerId found in account - skipping customer and payment method loading');
        console.log('  Account object:', this.state.account);
      }
      
      console.log('📡 Loading Stripe public key...');
      await this.loadStripePublicKey();
      console.log('✅ Stripe public key loaded');
      
      console.log('✅ Phase 1 complete - all initial data loaded');
      this.state.loading = false;
      
      // Render wizard
      this.render();
    } catch (error) {
      console.error('❌ Error initializing wizard:', error);
      this.state.loading = false;
      this.state.error = error.message || 'Failed to initialize wizard';
      this.render();
      throw error;
    }
  }

  async loadAccountAndSettings() {
    try {
      const isSandbox = OAUTH_CONFIG.audience.includes('sbx');
      const userApi = isSandbox
        ? 'https://api-sbx.sidedrawersbx.com/api/v1/users'
        : 'https://api.sidedrawer.com/api/v1/users';

      // GET /accounts/open-id/{openId} - REQUIRES access token
      if (!this.state.openId) {
        throw new Error('OpenID is required to load account');
      }
      
      console.log(`  → GET ${userApi}/accounts/open-id/${this.state.openId}`);
      const accountResponse = await fetch(`${userApi}/accounts/open-id/${this.state.openId}`, {
        headers: {
          'Authorization': `Bearer ${this.state.accessToken}`,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        }
      });

      if (accountResponse.ok) {
        const account = await accountResponse.json();
        this.state.account = account;
        this.state.accountId = account.id;
        this.state.customerId = account.customerId || account.customer_id || null;
        console.log(`  ✓ Account loaded: ${account.username || account.email || 'N/A'} (ID: ${account.id}, CustomerID: ${this.state.customerId || 'none'})`);
        
        // Debug: Log account object to see all fields
        if (!this.state.customerId) {
          console.log('  🔍 Account object keys:', Object.keys(account));
          console.log('  🔍 Account object:', JSON.stringify(account, null, 2));
        }

        // GET /accounts/account-id/{accountId}/settings
        if (this.state.accountId) {
          console.log(`  → GET ${userApi}/accounts/account-id/${this.state.accountId}/settings`);
          const settingsResponse = await fetch(`${userApi}/accounts/account-id/${this.state.accountId}/settings`, {
            headers: {
              'Authorization': `Bearer ${this.state.accessToken}`,
              'Content-Type': 'application/json',
              'accept': 'application/json'
            }
          });

          if (settingsResponse.ok) {
            this.state.settings = await settingsResponse.json();
            console.log(`  ✓ Settings loaded (locale: ${this.state.settings?.preferredLanguage || 'default'})`);
          } else {
            console.warn(`  ⚠ Settings not found (${settingsResponse.status}), using defaults`);
            // Set default settings if not found
            this.state.settings = { preferredLanguage: 'en-CA' };
          }
        }
      } else {
        // If account doesn't exist, extract info from token and create minimal account object
        console.warn(`  ⚠ Account not found (${accountResponse.status}), extracting info from token`);
        try {
          const tokenPayload = JSON.parse(atob(this.state.accessToken.split('.')[1]));
          console.log('  🔍 Token payload fields:', Object.keys(tokenPayload));
          
          // Try multiple possible email fields
          const email = tokenPayload.email || 
                       tokenPayload['https://sidedrawer.com/email'] || 
                       tokenPayload['https://sidedrawer.com/user_metadata']?.email ||
                       tokenPayload['https://sidedrawer.com/app_metadata']?.email ||
                       tokenPayload.sub?.includes('@') ? tokenPayload.sub : '';
          
          // Try multiple possible name fields
          const firstName = tokenPayload.given_name || 
                           tokenPayload['https://sidedrawer.com/firstName'] ||
                           tokenPayload['https://sidedrawer.com/user_metadata']?.firstName ||
                           tokenPayload.name?.split(' ')[0] || '';
          const lastName = tokenPayload.family_name || 
                          tokenPayload['https://sidedrawer.com/lastName'] ||
                          tokenPayload['https://sidedrawer.com/user_metadata']?.lastName ||
                          tokenPayload.name?.split(' ').slice(1).join(' ') || '';
          
          this.state.account = {
            id: null,
            openId: this.state.openId,
            username: email || this.state.openId,
            email: email || '',
            firstName: firstName,
            lastName: lastName,
            customerId: null
          };
          this.state.settings = { preferredLanguage: 'en-CA' };
          console.log(`  ✓ Using token info: ${email || this.state.openId} (${firstName} ${lastName})`);
        } catch (tokenError) {
          console.error('  ✗ Failed to extract info from token:', tokenError);
          // Create minimal account with just openId
          this.state.account = {
            id: null,
            openId: this.state.openId,
            username: this.state.openId,
            email: '',
            firstName: '',
            lastName: '',
            customerId: null
          };
          this.state.settings = { preferredLanguage: 'en-CA' };
          console.log(`  ⚠ Using minimal account info (openId only): ${this.state.openId}`);
        }
      }
    } catch (error) {
      console.error('❌ Error loading account:', error);
      throw error;
    }
  }

  async loadDictionary() {
    try {
      const isSandbox = OAUTH_CONFIG.audience.includes('sbx');
      const localeId = this.state.settings?.preferredLanguage || 'en-CA';
      const apiUrl = isSandbox
        ? `https://api-sbx.sidedrawersbx.com/api/v1/configs/content/dictionaries/console_20210501/locale/${localeId}`
        : `https://api.sidedrawer.com/api/v1/configs/content/dictionaries/console_20210501/locale/${localeId}`;

      console.log(`  → GET ${apiUrl}`);
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        this.state.dictionary = data;
        this.state.databaseRegions = data.collections?.databaseregions || [];
        const rawCurrencies = data.collections?.currencies || [];
        this.state.currencies = Array.isArray(rawCurrencies) 
          ? rawCurrencies.filter(c => c && c.enabled === true && c.currency) 
          : [];
        if (data.collections?.prices) {
          this.state.dictionaryPrices = data.collections.prices;
        }
        console.log(`  ✓ Dictionary loaded (${this.state.databaseRegions.length} regions, ${this.state.currencies.length} currencies)`);
      } else {
        console.error(`  ✗ Failed to load dictionary: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to load dictionary: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error loading dictionary:', error);
      throw error;
    }
  }

  async loadPrices() {
    try {
      const isSandbox = OAUTH_CONFIG.audience.includes('sbx');
      const apiUrl = isSandbox
        ? 'https://api-sbx.sidedrawersbx.com/api/v1/subscriptions/prices'
        : 'https://api.sidedrawer.com/api/v1/subscriptions/prices';

      const headers = {
        'Content-Type': 'application/json'
      };
      if (this.state.accessToken) {
        headers['Authorization'] = `Bearer ${this.state.accessToken}`;
      }

      console.log(`  → GET ${apiUrl}`);
      const response = await fetch(apiUrl, { headers });
      if (response.ok) {
        const prices = await response.json();
        this.state.prices = Array.isArray(prices) ? prices.filter(p => p.active === true) : [];
        console.log(`  ✓ Prices loaded (${this.state.prices.length} active prices)`);
        if (this.state.currency) {
          this.updatePriceLists();
        }
      } else {
        console.error(`  ✗ Failed to load prices: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to load prices: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error loading prices:', error);
      throw error;
    }
  }

  async loadRegions() {
    if (this.state.databaseRegions.length > 0) {
      if (!this.state.region && this.state.databaseRegions.length > 0) {
        this.state.region = this.state.databaseRegions[0].countrycode;
      }
    }
  }

  async loadCurrencies() {
    if (this.state.currencies.length > 0 && !this.state.currency) {
      const validCurrencies = this.state.currencies.filter(c => c && c.currency && c.enabled);
      
      if (validCurrencies.length > 0) {
        const usdCurrency = validCurrencies.find(c => c.currency && c.currency.toLowerCase() === 'usd');
        this.state.currency = usdCurrency 
          ? usdCurrency.currency.toLowerCase() 
          : validCurrencies[0].currency.toLowerCase();
        
        if (this.state.prices.length > 0) {
          this.updatePriceLists();
        }
      }
    }
  }

  async loadCustomer() {
    if (!this.state.customerId) return;

    try {
      const isSandbox = OAUTH_CONFIG.audience.includes('sbx');
      const apiUrl = isSandbox
        ? `https://api-sbx.sidedrawersbx.com/api/v1/subscriptions/customers/customer-id/${this.state.customerId}`
        : `https://api.sidedrawer.com/api/v1/subscriptions/customers/customer-id/${this.state.customerId}`;

      console.log(`  → GET ${apiUrl}`);
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${this.state.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const customer = await response.json();
        console.log(`  ✓ Customer loaded (ID: ${customer.id}, currency: ${customer?.currency || 'none'})`);
        if (customer?.currency && !this.state.currency) {
          this.state.currency = customer.currency.toLowerCase();
          this.updatePriceLists();
        }
      } else {
        console.warn(`  ⚠ Failed to load customer: ${response.status} ${response.statusText} (may not exist yet)`);
      }
    } catch (error) {
      console.error('❌ Error loading customer:', error);
      // Don't throw - customer might not exist yet
    }
  }

  async loadPaymentMethods() {
    if (!this.state.customerId) return;

    try {
      const isSandbox = OAUTH_CONFIG.audience.includes('sbx');
      const apiUrl = isSandbox
        ? `https://api-sbx.sidedrawersbx.com/api/v1/subscriptions/customers/customer-id/${this.state.customerId}/payment-methods`
        : `https://api.sidedrawer.com/api/v1/subscriptions/customers/customer-id/${this.state.customerId}/payment-methods`;

      console.log(`  → GET ${apiUrl}`);
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${this.state.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const paymentMethods = await response.json();
        this.state.paymentMethods = Array.isArray(paymentMethods) 
          ? paymentMethods.map(pm => ({ ...pm, isDefault: pm.default }))
          : [];
        
        console.log(`  ✓ Payment methods loaded (${this.state.paymentMethods.length} methods)`);
        
        // Set default payment method if available
        const defaultPm = this.state.paymentMethods.find(pm => pm.isDefault || pm.default);
        if (defaultPm) {
          this.state.selectedPaymentMethod = defaultPm;
          this.state.hasDefaultPaymentMethod = true;
          console.log(`  💳 Default payment method found: ${defaultPm.card?.brand || 'card'} •••• ${defaultPm.card?.last4 || ''}`);
        } else {
          console.log(`  ℹ️ No default payment method found`);
        }
      } else {
        console.warn(`  ⚠ Failed to load payment methods: ${response.status} ${response.statusText} (may not exist yet)`);
      }
    } catch (error) {
      console.error('❌ Error loading payment methods:', error);
      // Don't throw - payment methods might not exist yet
    }
  }

  async loadStripePublicKey() {
    try {
      const isSandbox = OAUTH_CONFIG.audience.includes('sbx');
      // Try subscription API endpoint first
      const subscriptionApi = isSandbox
        ? 'https://api-sbx.sidedrawersbx.com/api/v1/subscriptions'
        : 'https://api.sidedrawer.com/api/v1/subscriptions';
      
      try {
        console.log(`  → GET ${subscriptionApi}/subscriptions/public-key`);
        const response = await fetch(`${subscriptionApi}/subscriptions/public-key`, {
          headers: {
            'Authorization': `Bearer ${this.state.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          this.state.stripePublicKey = data.publicKey || data.stripePublicKey || data.key || null;
          console.log(`  ✓ Stripe public key loaded from API`);
        } else {
          console.warn(`  ⚠ Stripe public key endpoint failed (${response.status}), using fallback`);
          this.state.stripePublicKey = 'pk_test_DJsfKIOeJStMWElaD8bLc17E';
        }
      } catch (e) {
        console.warn(`  ⚠ Stripe public key fetch error, using fallback:`, e);
        this.state.stripePublicKey = 'pk_test_DJsfKIOeJStMWElaD8bLc17E';
      }
    } catch (error) {
      console.warn(`  ⚠ Stripe public key error, using fallback:`, error);
      this.state.stripePublicKey = 'pk_test_DJsfKIOeJStMWElaD8bLc17E';
    }
  }

  updatePriceLists() {
    const currency = this.state.currency;
    if (!currency) {
      this.state.monthlyPrices = [];
      this.state.yearlyPrices = [];
      this.state.monthlyUsersPrices = [];
      this.state.yearlyUsersPrices = [];
      return;
    }

    const prosPrices = this.state.prices.filter(p => {
      if (!p.active) return false;
      if (!p.metadata) return false;
      return p.metadata['product.audience'] === 'pros';
    });

    const usersPrices = this.state.prices.filter(p => {
      if (!p.active) return false;
      if (!p.metadata) return false;
      return p.metadata['product.audience'] === 'users';
    });
    this.state.usersPrices = usersPrices;

    this.state.monthlyPrices = prosPrices.filter(
      p => p.interval === 'month' && 
           p.currency && p.currency.toLowerCase() === currency.toLowerCase()
    );

    const yearlyProsPrices = prosPrices.filter(
      p => p.interval === 'year' && 
           p.currency && p.currency.toLowerCase() === currency.toLowerCase()
    );

    this.state.monthlyUsersPrices = usersPrices.filter(
      p => p.interval === 'month' && 
           p.currency && p.currency.toLowerCase() === currency.toLowerCase()
    );

    this.state.yearlyUsersPrices = usersPrices.filter(
      p => p.interval === 'year' && 
           p.currency && p.currency.toLowerCase() === currency.toLowerCase()
    );

    if (yearlyProsPrices.length === 0) {
      const retailPrices = this.state.prices.filter(p => {
        if (!p.active) return false;
        if (!p.metadata) return false;
        return p.metadata['product.audience'] === 'retail';
      });
      
      this.state.yearlyPrices = retailPrices.filter(
        p => p.interval === 'year' && 
             p.currency && p.currency.toLowerCase() === currency.toLowerCase()
      );
    } else {
      this.state.yearlyPrices = yearlyProsPrices;
    }
  }

  render() {
    let wizardContainer = document.getElementById('tenant-wizard');
    if (!wizardContainer) {
      wizardContainer = document.createElement('div');
      wizardContainer.id = 'tenant-wizard';
      wizardContainer.style.display = 'none';
      const container = document.querySelector('.container');
      if (container) {
        container.appendChild(wizardContainer);
      } else {
        document.body.appendChild(wizardContainer);
      }
    }

    const appContent = document.getElementById('app-content');
    if (appContent) {
      appContent.style.display = 'none';
    }
    wizardContainer.style.display = 'block';

    wizardContainer.innerHTML = `
      <div class="tenant-wizard">
        <div class="wizard-header">
          <h1>${this.getDictionaryValue('tenantsetup_formtitle') || 'Create Your Business Account'}</h1>
          <p>${this.getDictionaryValue('tenantsetup_formdescription') || 'Set up your SideDrawer account in a few simple steps'}</p>
        </div>

        <div class="wizard-stepper">
          <div class="wizard-step ${this.state.currentStep === 0 ? 'active' : this.state.currentStep > 0 ? 'completed' : ''}">
            <div class="wizard-step-circle">${this.state.currentStep > 0 ? '✓' : '1'}</div>
            <div class="wizard-step-label">${this.getDictionaryValue('tenantsetupname_steptitle') || 'Business Info'}</div>
          </div>
          <div class="wizard-step ${this.state.currentStep === 1 ? 'active' : this.state.currentStep > 1 ? 'completed' : ''}">
            <div class="wizard-step-circle">${this.state.currentStep > 1 ? '✓' : '2'}</div>
            <div class="wizard-step-label">${this.getDictionaryValue('tenantsetupsubscription_steptitle') || 'Subscription'}</div>
          </div>
          ${!this.state.skipPayment ? `
          <div class="wizard-step ${this.state.currentStep === 2 ? 'active' : this.state.currentStep > 2 ? 'completed' : ''}">
            <div class="wizard-step-circle">${this.state.currentStep > 2 ? '✓' : '3'}</div>
            <div class="wizard-step-label">${this.getDictionaryValue('tenantsetuppayment_steptitle') || 'Payment'}</div>
          </div>
          ` : ''}
          <div class="wizard-step ${this.state.currentStep === (this.state.skipPayment ? 2 : 3) ? 'active' : this.state.currentStep > (this.state.skipPayment ? 2 : 3) ? 'completed' : ''}">
            <div class="wizard-step-circle">${this.state.currentStep > (this.state.skipPayment ? 2 : 3) ? '✓' : (this.state.skipPayment ? '3' : '4')}</div>
            <div class="wizard-step-label">${this.getDictionaryValue('tenantsignupsummary_steptitle') || 'Summary'}</div>
          </div>
        </div>

        <div class="wizard-content">
          ${this.renderStep()}
        </div>

        <div class="wizard-footer">
          ${this.state.currentStep > 0 ? `<button class="btn" onclick="tenantWizardWithCredentials.previousStep()">${this.getDictionaryValue('globalparams_back') || 'Back'}</button>` : '<div></div>'}
          <button class="btn btn-success" ${this.state.loading ? 'disabled' : ''} id="wizard-next-button">
            ${(this.state.skipPayment && this.state.currentStep === 2) || (!this.state.skipPayment && this.state.currentStep === 3)
              ? (this.getDictionaryValue('tenantsetuppayment_primarybutton') || 'Create Account')
              : (this.getDictionaryValue('globalparams_next') || 'Next')}
          </button>
        </div>
      </div>
    `;

    this.attachListeners();
  }

  renderStep() {
    if (this.state.currentStep === 0) {
      return this.renderStep1();
    } else if (this.state.currentStep === 1) {
      // Always show subscription step
      return this.renderStep2();
    } else if (this.state.skipPayment) {
      // Skip payment step, go directly to summary
      if (this.state.currentStep === 2) {
        return this.renderStep4();
      }
    } else {
      // Normal flow with payment step
      if (this.state.currentStep === 2) {
        return this.renderStep3();
      } else if (this.state.currentStep === 3) {
        return this.renderStep4();
      }
    }
    return '';
  }

  renderStep1() {
    const dict = this.state.dictionary || {};
    
    return `
      ${this.state.validationError ? `<div class="validation-error">${this.state.validationError}</div>` : ''}
      
      <div class="wizard-form-group">
        <label class="wizard-form-label">${dict.tenantsetupname_tenantname || 'Business Name'}</label>
        <input 
          type="text" 
          class="wizard-form-input" 
          id="tenant-name-input"
          placeholder="${dict.tenantsetupname_tenantnameplaceholder || 'Enter your business name'}"
          value="${this.state.tenantName || ''}"
        />
        <div class="wizard-form-error" id="tenant-name-error"></div>
      </div>

      <div class="wizard-form-group">
        <label class="wizard-form-label">${dict.tenantsetupname_tenantsubdomain || 'Domain'}</label>
        <div class="domain-input-wrapper">
          <input 
            type="text" 
            class="wizard-form-input domain-input-flex" 
            id="tenant-domain-input"
            placeholder="${dict.tenantsetupname_tenantsubdomainplaceholder || 'your-domain'}"
            value="${this.state.tenantDomain || ''}"
          />
          <span class="domain-suffix">.sidedrawer.com</span>
        </div>
        <div class="wizard-form-error" id="tenant-domain-error"></div>
      </div>

      <div class="wizard-form-group">
        <label class="wizard-form-label">${dict.tenantsetupname_tenantregion || 'Region'}</label>
        <select class="wizard-form-select" id="region-select">
          <option value="">${dict.tenantsetupname_tenantregionplaceholder || 'Select region'}</option>
          ${this.state.databaseRegions.map(region => `
            <option value="${region.countrycode}" ${this.state.region === region.countrycode ? 'selected' : ''}>
              ${this.getCountryName(region.countrycode)}
            </option>
          `).join('')}
        </select>
        <div class="wizard-form-error" id="region-error"></div>
      </div>
    `;
  }

  renderStep2() {
    const dict = this.state.dictionary || {};
    this.updatePriceLists();
    const usersPricesToShow = this.state.priceTab === 'month' ? this.state.monthlyUsersPrices : this.state.yearlyUsersPrices;
    const availableCurrencies = this.state.currencies.filter(c => c && c.currency && c.enabled);
    
    return `
      ${this.state.validationError ? `<div class="validation-error">${this.state.validationError}</div>` : ''}
      
      <p class="mb-24 text-gray">${dict.tenantsignupsubscription_description || dict.tenantsetupsubscription_description || 'Select your subscription plan'}</p>
      
      <div class="tenant-creation-form-price-section">
        <div class="tenant-creation-form-price-section-currency">
          <h4>${dict.tenantsignupsubscription_selectcurrency || dict.tenantsetupsubscription_selectcurrency || 'Currency'}</h4>
          <div class="toggle-button-group">
            ${availableCurrencies.map(currency => `
              <button
                class="toggle-button ${this.state.currency && this.state.currency.toLowerCase() === currency.currency.toLowerCase() ? 'active' : ''}"
                onclick="tenantWizardWithCredentials.selectCurrency('${currency.currency}')"
              >
                ${currency.symbol} ${currency.isoLabel}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="tenant-creation-form-price-section-currency">
          <h4>${dict.tenantsignupsubscription_selectfrequency || dict.tenantsetupsubscription_selectfrequency || 'Frequency'}</h4>
          <div class="toggle-button-group">
            <button
              class="toggle-button ${this.state.priceTab === 'month' ? 'active' : ''}"
              onclick="tenantWizardWithCredentials.setPriceTab('month')"
            >
              ${dict.tenantsignupsubscription_monthlytab || dict.subscription_monthly || 'Monthly'}
            </button>
            <button
              class="toggle-button ${this.state.priceTab === 'year' ? 'active' : ''}"
              onclick="tenantWizardWithCredentials.setPriceTab('year')"
            >
              ${dict.tenantsignupsubscription_yearlytab || dict.subscription_yearly || 'Yearly'}
            </button>
          </div>
        </div>

        <form class="tenant-creation-form-price-section-users" onsubmit="return false;">
          <h4>${dict.tenantsignupsubscription_selectusers || 'Total Admin Users'}</h4>
          <input
            type="number"
            id="total-admin-users-input"
            class="wizard-form-input"
            placeholder="${dict.tenantsignupsubscription_userslabel || 'Number of users'}"
            value="${this.state.totalAdminUsers || ''}"
            min="0"
          />
          <div class="wizard-form-error" id="users-error"></div>
        </form>

        <div class="tenant-creation-form-price-section-price">
          <h4>${dict.tenantsignupsubscription_selectprice || 'Plan preference'}</h4>
          <div class="tenant-creation-form-price-section-price-list">
            ${usersPricesToShow.length > 0 ? usersPricesToShow.map(price => {
              const dictPrice = this.getDictionaryPrice(price.id);
              if (!dictPrice) return '';
              
              const isSelected = this.state.selectedPrice?.id === price.id;
              const currencyObj = this.state.currencies.find(c => c && c.currency && c.currency.toLowerCase() === price.currency?.toLowerCase());
              const currencySymbol = currencyObj?.symbol || (price.currency === 'usd' ? '$' : price.currency === 'cad' ? 'C$' : '');
              const amount = price.tiers && price.tiers.length > 0 ? price.tiers[0].flat_amount : price.amount;
              const formattedAmount = (amount / 100).toFixed(2);
              const listPrice = dictPrice.listPricePerUnit ? (dictPrice.listPricePerUnit / 100).toFixed(2) : null;
              
              return `
                <div 
                  class="app-tenant-creation-form-price-card ${isSelected ? 'selected' : ''}"
                  onclick="tenantWizardWithCredentials.selectPrice('${price.id}')"
                >
                  <div class="selectable-price-card ${isSelected ? 'active' : ''}">
                    <div class="selectable-price-card-content">
                      <div class="selectable-price-card-name">${dictPrice.name}</div>
                      <div class="selectable-price-card-price">
                        ${listPrice ? `<span class="strikethrough">${currencySymbol}${listPrice}</span>` : ''}
                        <span>${currencySymbol}${formattedAmount}</span>
                        <span class="selectable-price-card-currency">${currencyObj?.isoLabel || price.currency?.toUpperCase() || ''}</span>
                        <span class="selectable-price-card-unit">/${price.interval === 'month' ? 'user/month' : 'user/year'}</span>
                      </div>
                    </div>
                    ${isSelected ? '<div class="selectable-price-card-checkmark">✓</div>' : ''}
                  </div>
                </div>
              `;
            }).filter(html => html !== '').join('') : ''}
          </div>
        </div>
      </div>
    `;
  }

  renderStep3() {
    const dict = this.state.dictionary || {};
    
    return `
      ${this.state.validationError ? `<div class="validation-error">${this.state.validationError}</div>` : ''}
      
      ${this.state.paymentMethods.length > 0 ? `
        <div class="mb-24">
          <label class="wizard-form-label">${dict.paymentdetails_selectpaymentmethod || 'Select Payment Method'}</label>
          ${this.state.paymentMethods.map(pm => `
            <div 
              class="price-card payment-method-card ${this.state.selectedPaymentMethod?.id === pm.id ? 'selected' : ''}"
              onclick="tenantWizardWithCredentials.selectPaymentMethod('${pm.id}')"
            >
              <div class="payment-method-info">
                <div>
                  <strong>${pm.card?.brand || (dict.paymentdetails_card || 'Card')} •••• ${pm.card?.last4 || ''}</strong>
                  <div class="payment-method-details">${dict.paymentdetails_expires || 'Expires'} ${pm.card?.expMonth}/${pm.card?.expYear}</div>
                </div>
                ${this.state.selectedPaymentMethod?.id === pm.id ? '<span>✓</span>' : ''}
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="mb-24">
        <label class="wizard-form-label">${dict.paymentdetails_addnewcard || 'Add New Payment Method'}</label>
        
        ${this.state.stripePublicKey ? `
          <div class="stripe-card-element-container">
            <div id="card-element"></div>
            <div id="card-element-error" class="stripe-error"></div>
          </div>
        ` : `
          <div class="validation-error">
            ${dict.paymentdetails_stripenotconfigured || 'Stripe is not configured. Please contact support.'}
          </div>
        `}

        <div class="wizard-form-group wizard-form-group-spaced">
          <label class="wizard-form-label">${dict.paymentdetails_addnewcardname || 'Cardholder Name'}</label>
          <input 
            type="text" 
            class="wizard-form-input" 
            id="cardholder-name-input"
            placeholder="${dict.paymentdetails_addnewcardnameplaceholder || 'John Doe'}"
            value="${this.state.cardholderName || ''}"
          />
        </div>

        <div class="billing-address-section">
          <label class="wizard-form-label">${dict.paymentdetails_addnewcardbillingaddress || 'Billing Address'}</label>
          <button class="btn btn-full-width" onclick="tenantWizardWithCredentials.showBillingAddressDialog()">
            ${this.state.billingAddress 
              ? (dict.paymentdetails_updatebillingaddress || 'Update Billing Address')
              : (dict.paymentdetails_addbillingaddress || 'Add Billing Address')}
          </button>
          ${this.state.billingAddress ? `
            <div class="billing-address-display">
              ${this.state.billingAddress.line1}<br>
              ${this.state.billingAddress.city}, ${this.state.billingAddress.state} ${this.state.billingAddress.postalCode}<br>
              ${this.state.billingAddress.country}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderStep4() {
    const dict = this.state.dictionary || {};
    
    if (!this.state.selectedPrice) {
      return `<div class="validation-error">No subscription plan selected. Please go back and select a plan.</div>`;
    }
    
    const dictPrice = this.getDictionaryPrice(this.state.selectedPrice.id);
    const currencyObj = this.state.currencies.find(c => c && c.currency && c.currency.toLowerCase() === this.state.selectedPrice.currency?.toLowerCase());
    const currencySymbol = currencyObj?.symbol || (this.state.selectedPrice.currency === 'usd' ? '$' : this.state.selectedPrice.currency === 'cad' ? 'C$' : '');
    const currencyLabel = currencyObj?.isoLabel || this.state.selectedPrice.currency?.toUpperCase() || '';
    
    const pricePerUnit = dictPrice ? (dictPrice.pricePerUnit / 100) : ((this.state.selectedPrice.tiers && this.state.selectedPrice.tiers.length > 0 ? this.state.selectedPrice.tiers[0].flat_amount : this.state.selectedPrice.amount) / 100);
    const listPricePerUnit = dictPrice?.listPricePerUnit ? (dictPrice.listPricePerUnit / 100) : null;
    const users = this.state.totalAdminUsers || 0;
    const isYearly = this.state.selectedPrice.interval === 'year';
    const total = isYearly ? pricePerUnit * users * 12 : pricePerUnit * users;
    
    // Show loading/progress if tenant creation is in progress
    if (this.state.loading) {
      const processStepsHtml = this.state.processSteps.map(step => {
        let statusIcon = '○';
        let statusClass = 'pending';
        if (step.status === 'success') {
          statusIcon = '✓';
          statusClass = 'success';
        } else if (step.status === 'processing') {
          statusIcon = '⟳';
          statusClass = 'processing';
        } else if (step.status === 'error') {
          statusIcon = '✗';
          statusClass = 'error';
        }
        return `
          <div class="process-step ${statusClass}">
            <span class="process-step-icon">${statusIcon}</span>
            <span class="process-step-label">${this.getProcessStepLabel(step.key)}</span>
          </div>
        `;
      }).join('');
      
      return `
        <div class="tenant-creation-form-price-selected-resume">
          <div class="process-progress">
            <h3>Creating your account...</h3>
            <div class="process-steps">
              ${processStepsHtml}
            </div>
            ${this.state.validationError ? `<div class="validation-error mt-20">${this.state.validationError}</div>` : ''}
          </div>
        </div>
      `;
    }
    
    // Show payment method info if payment step was skipped
    const paymentMethodInfo = this.state.skipPayment && this.state.selectedPaymentMethod ? `
      <div class="mb-24">
        <h4>${dict.paymentdetails_selectpaymentmethod || 'Payment Method'}</h4>
        <div class="payment-method-display">
          <strong>${this.state.selectedPaymentMethod.card?.brand || (dict.paymentdetails_card || 'Card')} •••• ${this.state.selectedPaymentMethod.card?.last4 || ''}</strong>
          <div class="payment-method-details">${dict.paymentdetails_expires || 'Expires'} ${this.state.selectedPaymentMethod.card?.expMonth}/${this.state.selectedPaymentMethod.card?.expYear}</div>
        </div>
      </div>
    ` : '';
    
    return `
      ${this.state.validationError ? `<div class="validation-error">${this.state.validationError}</div>` : ''}
      ${paymentMethodInfo}
      <div class="tenant-creation-form-price-selected-resume">
        <div class="tenant-creation-form-price-selected-resume-title">
          <h2>${dictPrice?.name || this.state.selectedPrice.id}</h2>
        </div>
        <p class="tenant-creation-form-price-selected-price">
          ${listPricePerUnit ? `<span class="tenant-creation-form-price-selected-list-price">${currencySymbol}${listPricePerUnit.toFixed(2)}</span>` : ''}
          <span>${currencySymbol}${pricePerUnit.toFixed(2)}</span>
          <span class="tenant-creation-form-price-selected-price">${currencyLabel}</span>
          <span class="tenant-creation-form-price-selected-description">/${isYearly ? 'user/year' : 'user/month'}</span>
        </p>
        <hr class="hr-separator" />
        <h3 class="tenant-creation-form-price-selected-resume-section-title">
          ${dict.tenantsignupsummary_tabletitle?.replace('[[frequency]]', isYearly ? (dict.tenantsignupsubscription_yearlytab || 'yearly').toLowerCase() : (dict.tenantsignupsubscription_monthlytab || 'monthly').toLowerCase()) || 'Recurring ' + (isYearly ? 'yearly' : 'monthly') + ' cost'}
        </h3>
        <div class="tenant-creation-form-price-selected-resume-section-line">
          <span class="tenant-creation-form-price-selected-resume-section-line-title">Subscription</span>
          <span class="tenant-creation-form-price-selected-resume-section-line-amount">
            ${currencySymbol}${total.toFixed(2)} ${currencyLabel}
          </span>
          <p class="tenant-creation-form-price-selected-resume-section-line-description">
            ${currencySymbol}${pricePerUnit.toFixed(2)} ${currencyLabel} x ${users} users${isYearly ? ' x 12' : ''}
          </p>
        </div>
        <hr class="hr-separator" />
        <div class="tenant-creation-form-price-selected-total-section-line">
          <span class="tenant-creation-form-price-selected-total-section-line-title">
            ${dict.tenantsignupsummary_tabletotallabel || "Today's total"}
          </span>
          <span class="tenant-creation-form-price-selected-total-section-line-amount">
            ${currencySymbol}${total.toFixed(2)} ${currencyLabel}
          </span>
        </div>
      </div>
    `;
  }

  getProcessStepLabel(stepKey) {
    const labels = {
      'customerId': 'Creating customer account',
      'paymentMethod': 'Setting up payment method',
      'createTenant': 'Creating tenant',
      'refreshToken': 'Refreshing authentication',
      'createSubscription': 'Creating subscription',
      'getSubscriptionLicenses': 'Getting licenses',
      'assignLicenseToTenantOwner': 'Assigning license',
      'setDefaultParamsForBranding': 'Configuring branding',
      'syncTenantMessages': 'Syncing messages',
      'createOwnerSideDrawer': 'Creating owner account',
      'createSupportInvitation': 'Setting up support',
      'assignRoleToSupportInvitation': 'Assigning support role',
      'createSideDrawerForSupport': 'Creating support account'
    };
    return labels[stepKey] || stepKey;
  }

  // Continue with remaining methods (attachListeners, validateStep1, nextStep, previousStep, etc.)
  // These will be similar to existing wizard but adapted for logged-in flow
  
  async attachListeners() {
    // Step 1 listeners (no email/password)
    if (this.state.currentStep === 0) {
      const nameInput = document.getElementById('tenant-name-input');
      const domainInput = document.getElementById('tenant-domain-input');
      const regionSelect = document.getElementById('region-select');

      if (nameInput) {
        nameInput.addEventListener('input', (e) => {
          this.state.tenantName = e.target.value;
          this.clearError('tenant-name-error');
        });
        nameInput.addEventListener('blur', () => this.validateStep1());
      }

      if (domainInput) {
        domainInput.addEventListener('input', (e) => {
          this.state.tenantDomain = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
          e.target.value = this.state.tenantDomain;
          this.clearError('tenant-domain-error');
        });
        domainInput.addEventListener('blur', () => {
          this.validateStep1();
          this.checkDomainAvailability();
        });
      }

      if (regionSelect) {
        regionSelect.addEventListener('change', (e) => {
          this.state.region = e.target.value;
          this.clearError('region-error');
        });
      }
    }

    // Step 2 listeners
    if (this.state.currentStep === 1) {
      const usersInput = document.getElementById('total-admin-users-input');
      if (usersInput) {
        usersInput.addEventListener('input', (e) => {
          const value = parseInt(e.target.value, 10) || 0;
          this.state.totalAdminUsers = value;
          this.clearError('users-error');
        });
        usersInput.addEventListener('blur', () => {
          if (this.state.selectedPrice) {
            const minUsers = parseInt(this.state.selectedPrice.metadata?.['product.startingUsers'] || '0', 10);
            if (this.state.totalAdminUsers < minUsers) {
              this.state.totalAdminUsers = minUsers;
              usersInput.value = minUsers;
            }
          }
        });
      }
    }

    // Step 3 listeners - Initialize Stripe Elements
    if (this.state.currentStep === 2) {
      const cardholderNameInput = document.getElementById('cardholder-name-input');
      if (cardholderNameInput) {
        cardholderNameInput.addEventListener('input', (e) => {
          this.state.cardholderName = e.target.value;
          this.clearValidationError();
        });
      }

      if (this.state.stripePublicKey) {
        setTimeout(async () => {
          try {
            const initialized = await stripeServiceWithCredentials.initialize(this.state.stripePublicKey);
            if (initialized) {
              await stripeServiceWithCredentials.createCardElement('card-element');
            }
          } catch (error) {
            const errorElement = document.getElementById('card-element-error');
            if (errorElement) {
              errorElement.textContent = 'Failed to initialize payment form. Please refresh the page.';
              errorElement.style.display = 'block';
            }
          }
        }, 300);
      }
    }

    // Attach click listener to next button (always, not just summary step)
    const nextButton = document.getElementById('wizard-next-button');
    if (nextButton) {
      // Remove any existing listeners by cloning the button
      const newButton = nextButton.cloneNode(true);
      nextButton.parentNode.replaceChild(newButton, nextButton);
      
      newButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.state.loading) return; // Prevent clicks while loading
        if (window.tenantWizardWithCredentials) {
          window.tenantWizardWithCredentials.nextStep();
        }
      });
    }
  }

  validateStep1() {
    let isValid = true;
    this.state.validationError = null;
    const dict = this.state.dictionary || {};

    // Business name validation
    if (!this.state.tenantName || this.state.tenantName.trim().length === 0) {
      this.showError('tenant-name-error', dict.globalparams_mandatoryfield || 'Business name is required');
      isValid = false;
    }

    // Domain validation
    if (!this.state.tenantDomain || this.state.tenantDomain.trim().length === 0) {
      this.showError('tenant-domain-error', dict.globalparams_mandatoryfield || 'Domain is required');
      isValid = false;
    } else if (!/^[a-z0-9-]+$/.test(this.state.tenantDomain)) {
      this.showError('tenant-domain-error', dict.tenantsetupname_tenantsubdomaininvalid || 'Domain can only contain lowercase letters, numbers, and hyphens');
      isValid = false;
    }

    // Region validation
    if (!this.state.region) {
      this.showError('region-error', dict.globalparams_mandatoryfield || 'Region is required');
      isValid = false;
    }

    return isValid;
  }

  async checkDomainAvailability() {
    if (!this.state.tenantDomain) return;

    try {
      const isSandbox = OAUTH_CONFIG.audience.includes('sbx');
      const tenantApi = isSandbox
        ? 'https://tenants-gateway-api-sbx.sidedrawersbx.com/api/v1/tenants/'
        : 'https://tenants-gateway-api.sidedrawer.com/api/v1/tenants/';

      const headers = { 'Content-Type': 'application/json' };
      if (this.state.accessToken) {
        headers['Authorization'] = `Bearer ${this.state.accessToken}`;
      }

      const response = await fetch(`${tenantApi}tenant/branding/brand-code/${this.state.tenantDomain}`, { headers });

      if (response.ok) {
        const brand = await response.json();
        if (brand.brandCode !== 'sidedrawer' || this.state.tenantDomain === 'sidedrawer') {
          const dict = this.state.dictionary || {};
          this.showError('tenant-domain-error', dict.tenantsetupname_tenantsubdomaintaken || 'Domain is already taken');
        }
      } else if (response.status === 404) {
        this.clearError('tenant-domain-error');
      }
    } catch (error) {
      console.error('❌ Error checking domain:', error);
    }
  }

  async nextStep() {
    const dict = this.state.dictionary || {};
    
    if (this.state.currentStep === 0) {
      // Step 1: Validate business info
      if (!this.validateStep1()) {
        this.state.validationError = dict.globalparams_fillrequiredfields || 'Please fill in all required fields';
        this.render();
        return;
      }
      
      // Always go to subscription step
      this.state.currentStep = 1;
    } else if (this.state.currentStep === 1) {
      // Step 2: Subscription (always shown)
      if (!this.state.selectedPrice) {
        this.state.validationError = dict.tenantsetupsubscription_selectplan || 'Please select a subscription plan';
        this.render();
        return;
      }
      if (!this.state.totalAdminUsers || this.state.totalAdminUsers < 1) {
        this.state.validationError = dict.tenantsignupsubscription_usersrequired || 'Please enter the number of admin users';
        this.render();
        return;
      }
      
      // If payment step is skipped, go directly to summary
      if (this.state.skipPayment) {
        this.state.currentStep = 2; // Summary step
      } else {
        this.state.currentStep = 2; // Payment step
      }
      this.render();
      this.attachListeners();
    } else if (this.state.currentStep === 2 && !this.state.skipPayment) {
      // Step 3: Payment (only if not skipped)
      if (!this.state.selectedPaymentMethod && !this.state.stripePublicKey) {
        this.state.validationError = dict.paymentdetails_selectpaymentmethod || 'Please select or add a payment method';
        this.render();
        return;
      }
      
      if (!this.state.selectedPaymentMethod && this.state.stripePublicKey && stripeServiceWithCredentials.cardElement) {
        const cardholderName = document.getElementById('cardholder-name-input')?.value;
        if (!cardholderName) {
          this.state.validationError = dict.paymentdetails_addnewcardname || 'Cardholder name is required';
          this.render();
          return;
        }
        
        if (!this.state.billingAddress) {
          this.state.validationError = dict.paymentdetails_addnewcardbillingaddress || 'Billing address is required';
          this.render();
          return;
        }
        
        const { paymentMethodId: pmId, error } = await stripeServiceWithCredentials.createPaymentMethod({
          name: cardholderName,
          address: {
            line1: this.state.billingAddress.line1,
            city: this.state.billingAddress.city,
            state: this.state.billingAddress.state,
            postal_code: this.state.billingAddress.postalCode,
            country: this.state.billingAddress.country
          }
        });
        
        if (error || !pmId) {
          this.state.validationError = error?.message || 'Failed to create payment method';
          this.render();
          return;
        }
        
        this.state.paymentMethodToken = pmId;
      }
      
      this.state.currentStep = 3; // Summary step
      this.render();
      this.attachListeners();
    } else if ((this.state.skipPayment && this.state.currentStep === 2) || 
               (!this.state.skipPayment && this.state.currentStep === 3)) {
      // Final step: create tenant using Angular API flow
      try {
        await this.createTenant();
      } catch (error) {
        console.error('❌ Error in nextStep:', error);
        const dict = this.state.dictionary || {};
        this.state.validationError = error.message || (dict.globalparams_error || 'Failed to create account');
        this.render();
      }
      return;
    }

    this.state.validationError = null;
    this.render();
  }

  previousStep() {
    if (this.state.currentStep > 0) {
      // If skipping payment and on summary (step 2), go back to subscription (step 1)
      if (this.state.skipPayment && this.state.currentStep === 2) {
        this.state.currentStep = 1;
      } else {
        this.state.currentStep--;
      }
      this.state.validationError = null;
      this.render();
    }
  }

  selectPrice(priceId) {
    const price = this.state.prices.find(p => p.id === priceId);
    if (price) {
      this.state.selectedPrice = price;
      this.state.validationError = null;
      
      const minUsers = parseInt(price.metadata?.['product.startingUsers'] || '0', 10);
      if (this.state.totalAdminUsers < minUsers) {
        this.state.totalAdminUsers = minUsers;
      }
      
      this.render();
      this.attachListeners();
    }
  }

  selectCurrency(currencyCode) {
    this.state.currency = currencyCode;
    this.state.selectedPrice = null;
    this.updatePriceLists();
    this.render();
    this.attachListeners();
  }

  setPriceTab(tab) {
    this.state.priceTab = tab;
    this.updatePriceLists();
    this.render();
    this.attachListeners();
  }

  selectPaymentMethod(paymentMethodId) {
    const pm = this.state.paymentMethods.find(p => p.id === paymentMethodId);
    if (pm) {
      this.state.selectedPaymentMethod = pm;
      this.render();
    }
  }

  showBillingAddressDialog() {
    const dict = this.state.dictionary || {};
    const currentAddress = this.state.billingAddress || {};

    const modalHtml = `
      <div class="modal-overlay" id="billing-address-modal-overlay">
        <div class="modal-dialog modal-dialog-large">
          <div class="modal-header">
            <h3 class="modal-title">${dict.paymentdetails_addnewcardbillingaddress || 'Billing Address'}</h3>
            <button class="modal-close" onclick="tenantWizardWithCredentials.closeBillingAddressModal()">×</button>
          </div>
          <div class="modal-body">
            <form class="billing-address-form" id="billing-address-form" onsubmit="event.preventDefault(); tenantWizardWithCredentials.saveBillingAddress();">
              <div class="wizard-form-group">
                <label class="wizard-form-label">Street Address</label>
                <input type="text" class="wizard-form-input" id="billing-line1" placeholder="${dict.paymentdetails_billingaddressline1 || 'Street address'}" value="${currentAddress.line1 || ''}" required />
              </div>
              <div class="wizard-form-group">
                <label class="wizard-form-label">City</label>
                <input type="text" class="wizard-form-input" id="billing-city" placeholder="${dict.paymentdetails_billingaddresscity || 'City'}" value="${currentAddress.city || ''}" required />
              </div>
              <div class="wizard-form-group">
                <label class="wizard-form-label">State/Province</label>
                <input type="text" class="wizard-form-input" id="billing-state" placeholder="${dict.paymentdetails_billingaddressstate || 'State/Province'}" value="${currentAddress.state || ''}" required />
              </div>
              <div class="wizard-form-group">
                <label class="wizard-form-label">Postal Code</label>
                <input type="text" class="wizard-form-input" id="billing-postal" placeholder="${dict.paymentdetails_billingaddresspostal || 'Postal Code'}" value="${currentAddress.postalCode || ''}" required />
              </div>
              <div class="wizard-form-group">
                <label class="wizard-form-label">Country</label>
                <select class="wizard-form-input country-select" id="billing-country" required>
                  <option value="">${dict.paymentdetails_billingaddresscountry || 'Select Country'}</option>
                  ${this.getCountryOptions().map(country => `
                    <option value="${country.code}" ${currentAddress.country === country.code ? 'selected' : ''}>
                      ${country.code} ${country.name}
                    </option>
                  `).join('')}
                </select>
              </div>
              <div class="wizard-footer modal-footer-spaced">
                <button type="button" class="btn" onclick="tenantWizardWithCredentials.closeBillingAddressModal()">${dict.globalparams_cancel || 'Cancel'}</button>
                <button type="submit" class="btn btn-success">${dict.globalparams_save || 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    const existingModal = document.getElementById('billing-address-modal-overlay');
    if (existingModal) {
      existingModal.remove();
    }

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('billing-address-modal-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'billing-address-modal-overlay') {
        this.closeBillingAddressModal();
      }
    });
  }

  closeBillingAddressModal() {
    const modal = document.getElementById('billing-address-modal-overlay');
    if (modal) {
      modal.remove();
    }
  }

  saveBillingAddress() {
    const line1 = document.getElementById('billing-line1')?.value;
    const city = document.getElementById('billing-city')?.value;
    const state = document.getElementById('billing-state')?.value;
    const postalCode = document.getElementById('billing-postal')?.value;
    const country = document.getElementById('billing-country')?.value;

    if (line1 && city && state && postalCode && country) {
      const cardholderNameInput = document.getElementById('cardholder-name-input');
      if (cardholderNameInput) {
        this.state.cardholderName = cardholderNameInput.value;
      }

      this.state.billingAddress = { line1, city, state, postalCode, country };
      this.closeBillingAddressModal();
      
      const billingAddressSection = document.querySelector('.billing-address-section');
      if (billingAddressSection) {
        const addressDisplay = billingAddressSection.querySelector('.billing-address-display');
        if (addressDisplay) {
          addressDisplay.innerHTML = `
            ${this.state.billingAddress.line1}<br>
            ${this.state.billingAddress.city}, ${this.state.billingAddress.state} ${this.state.billingAddress.postalCode}<br>
            ${this.state.billingAddress.country}
          `;
        } else {
          const displayDiv = document.createElement('div');
          displayDiv.className = 'billing-address-display';
          displayDiv.innerHTML = `
            ${this.state.billingAddress.line1}<br>
            ${this.state.billingAddress.city}, ${this.state.billingAddress.state} ${this.state.billingAddress.postalCode}<br>
            ${this.state.billingAddress.country}
          `;
          billingAddressSection.appendChild(displayDiv);
        }
        
        const updateButton = billingAddressSection.querySelector('button');
        if (updateButton) {
          const dict = this.state.dictionary || {};
          updateButton.textContent = dict.paymentdetails_updatebillingaddress || 'Update Billing Address';
        }
      }
    }
  }

  async createTenant() {
    // This will implement the full Angular API flow
    // For now, placeholder - will be implemented in next step
    this.state.loading = true;
    this.state.validationError = null;
    this.render();

    try {
      await this.createTenantWithAngularFlow();
    } catch (error) {
      console.error('❌ Error creating tenant:', error);
      this.state.loading = false;
      this.state.validationError = error.message || 'Failed to create tenant';
      this.render();
    }
  }

  async createTenantWithAngularFlow() {
    // Phase 2: Sequential API calls following Angular flow
    const isSandbox = OAUTH_CONFIG.audience.includes('sbx');
      const userApi = isSandbox
        ? 'https://api-sbx.sidedrawersbx.com/api/v1/users'
        : 'https://api.sidedrawer.com/api/v1/users';
    const subscriptionApi = isSandbox
      ? 'https://api-sbx.sidedrawersbx.com/api/v1/subscriptions'
      : 'https://api.sidedrawer.com/api/v1/subscriptions';
    const tenantApi = isSandbox
      ? 'https://tenants-gateway-api-sbx.sidedrawersbx.com/api/v1/tenants'
      : 'https://tenants-gateway-api.sidedrawer.com/api/v1/tenants';

    const headers = {
      'Authorization': `Bearer ${this.state.accessToken}`,
      'Content-Type': 'application/json'
    };

    try {
      let customerId = this.state.customerId;
      let paymentMethodId = this.state.selectedPaymentMethod?.id || this.state.paymentMethodToken;

      // Step 1: Create customer ID if needed
      if (!customerId) {
        this.updateProcessStep('customerId', 'processing');
        const cardholderName = document.getElementById('cardholder-name-input')?.value || this.state.account?.firstName || 'User';
        const createCustomerResponse = await fetch(`${subscriptionApi}/customers`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ name: cardholderName })
        });

        if (!createCustomerResponse.ok) {
          throw new Error('Failed to create customer ID');
        }

        const customerData = await createCustomerResponse.json();
        customerId = customerData.id;
        this.state.customerId = customerId;
        this.updateProcessStep('customerId', 'success');
      }

      // Step 2: Create payment method if needed
      if (!paymentMethodId && this.state.stripePublicKey) {
        this.updateProcessStep('paymentMethod', 'processing');
        
        if (!stripeServiceWithCredentials.cardElement) {
          await stripeServiceWithCredentials.initialize(this.state.stripePublicKey);
          await stripeServiceWithCredentials.createCardElement('card-element');
        }

        const cardholderName = document.getElementById('cardholder-name-input')?.value;
        if (!cardholderName || !this.state.billingAddress) {
          throw new Error('Payment method details incomplete');
        }

        const { paymentMethodId: pmId, error } = await stripeServiceWithCredentials.createPaymentMethod({
          name: cardholderName,
          address: {
            line1: this.state.billingAddress.line1,
            city: this.state.billingAddress.city,
            state: this.state.billingAddress.state,
            postal_code: this.state.billingAddress.postalCode,
            country: this.state.billingAddress.country
          }
        });

        if (error || !pmId) {
          throw new Error(error?.message || 'Failed to create payment method');
        }

        paymentMethodId = pmId;
        this.updateProcessStep('paymentMethod', 'success');
      }

      if (!paymentMethodId) {
        throw new Error('Payment method is required');
      }

      // Step 3: Create tenant using signup endpoint (replaces all subsequent steps)
      this.updateProcessStep('createTenant', 'processing');
      const tenantApiBase = isSandbox
        ? 'https://api-sbx.sidedrawersbx.com/api/v1/tenants'
        : 'https://api.sidedrawer.com/api/v1/tenants';
      
      // Validate required fields
      if (!this.state.selectedPrice?.id) {
        throw new Error('No subscription plan selected');
      }
      if (!paymentMethodId) {
        throw new Error('Payment method is required');
      }
      
      const signupResponse = await fetch(`${tenantApiBase}/tenant/signup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.state.accessToken}`,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          tenantName: this.state.tenantName,
          brandCode: this.state.tenantDomain,
          region: this.state.region,
          startingSideDrawers: this.state.totalAdminUsers || 1,
          identityProvider: 'auth0',
          priceId: this.state.selectedPrice.id,
          paymentMethodId: paymentMethodId
        })
      });

      if (!signupResponse.ok) {
        const errorData = await signupResponse.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to create tenant');
      }

      const tenant = await signupResponse.json();
      this.updateProcessStep('createTenant', 'success');

      // All steps completed successfully
      this.state.loading = false;
      this.showSuccess(tenant);
    } catch (error) {
      console.error('❌ Error in tenant creation flow:', error);
      this.state.loading = false;
      
      // Update the failed step status
      const lastStep = this.state.processSteps[this.state.processSteps.length - 1];
      if (lastStep && lastStep.status === 'processing') {
        lastStep.status = 'error';
      }
      
      // Extract error message
      let errorMessage = 'Failed to create tenant';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response) {
        try {
          const errorData = await error.response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
        }
      }
      
      this.state.validationError = errorMessage;
      this.render();
      throw error;
    }
  }

  updateProcessStep(stepKey, status) {
    // Track process steps for UI display
    const step = this.state.processSteps.find(s => s.key === stepKey);
    if (step) {
      step.status = status;
    } else {
      this.state.processSteps.push({ key: stepKey, status });
    }
    // Re-render to show progress (always render when loading to show progress)
    if (this.state.loading) {
      this.render();
    }
  }

  getSubscriptionTypeFromPrice(price) {
    // Determine subscription type from price metadata
    if (!price || !price.metadata) return 'users';
    const audience = price.metadata['product.audience'];
    if (audience === 'users') return 'users';
    if (audience === 'pros' || audience === 'retail') return 'sidedrawers';
    return 'users'; // default
  }

  async showSuccess(tenant = null) {
    const wizardContainer = document.getElementById('tenant-wizard');
    wizardContainer.innerHTML = `
      <div class="tenant-wizard">
        <div class="success-animation">
          <div class="success-icon">✓</div>
          <h2>Account Created Successfully!</h2>
          <p class="success-text">
            Your SideDrawer account has been created.
          </p>
          <button class="btn btn-success mt-24" id="wizard-continue-btn">
            Continue
          </button>
        </div>
      </div>
    `;

    // Check if credentials need to be configured
    // Only show setup modal if:
    // 1. User has admin permissions
    // 2. Credentials don't exist in custom module
    // 3. Tenant was created successfully
    if (tenant && tenant.id) {
      try {
        // Check permissions
        let hasPermission = false;
        if (window.SetupAPI && typeof window.SetupAPI.checkUserHasManageOrgPermission === 'function') {
          hasPermission = await window.SetupAPI.checkUserHasManageOrgPermission();
        }

        if (hasPermission) {
          // Check if credentials exist
          let existingConfig = null;
          if (window.SetupAPI && typeof window.SetupAPI.getSetupConfig === 'function') {
            existingConfig = await window.SetupAPI.getSetupConfig();
          }

          // If no credentials, open setup modal with tenant ID pre-filled
          if (!existingConfig || !existingConfig.clientId) {
            console.log('[Tenant Wizard] No credentials found, opening setup modal with tenant ID:', tenant.id);
            
            // Wait a moment for UI to render, then open modal
            setTimeout(async () => {
              if (window.setupModal && typeof window.setupModal.open === 'function') {
                await window.setupModal.open({ preFillTenantId: tenant.id });
              } else if (window.auth && typeof window.auth.showSetupModal === 'function') {
                await window.auth.showSetupModal({ preFillTenantId: tenant.id });
              } else {
                console.warn('[Tenant Wizard] Setup modal not available');
              }
            }, 500);
            
            // Update continue button to reload after setup
            const continueBtn = document.getElementById('wizard-continue-btn');
            if (continueBtn) {
              continueBtn.textContent = 'Continue (after setup)';
              continueBtn.onclick = () => {
                window.location.reload();
              };
            }
            return; // Don't show regular continue button yet
          }
        }
      } catch (error) {
        console.error('[Tenant Wizard] Error checking credentials:', error);
      }
    }

    // Regular continue button (credentials already exist or user doesn't have permissions)
    const continueBtn = document.getElementById('wizard-continue-btn');
    if (continueBtn) {
      continueBtn.onclick = () => {
        window.location.reload();
      };
    }
  }

  // Helper methods
  getCountryName(countryCode) {
    const countries = {
      'US': 'United States',
      'CA': 'Canada',
      'GB': 'United Kingdom',
      'AU': 'Australia'
    };
    return countries[countryCode] || countryCode;
  }

  getDictionaryPrice(priceId) {
    if (!this.state.dictionary?.collections?.prices) return null;
    return this.state.dictionary.collections.prices.find(p => p.stripePriceId === priceId);
  }

  getDictionaryValue(key) {
    if (!this.state.dictionary) return null;
    return this.state.dictionary[key] || null;
  }

  getCountryOptions() {
    return [
      { code: 'AR', name: 'Argentina' },
      { code: 'AU', name: 'Australia' },
      { code: 'AT', name: 'Austria' },
      { code: 'BE', name: 'Belgium' },
      { code: 'BR', name: 'Brazil' },
      { code: 'CA', name: 'Canada' },
      { code: 'CL', name: 'Chile' },
      { code: 'CN', name: 'China' },
      { code: 'CO', name: 'Colombia' },
      { code: 'CR', name: 'Costa Rica' },
      { code: 'DK', name: 'Denmark' },
      { code: 'FI', name: 'Finland' },
      { code: 'FR', name: 'France' },
      { code: 'DE', name: 'Germany' },
      { code: 'GR', name: 'Greece' },
      { code: 'GT', name: 'Guatemala' },
      { code: 'HN', name: 'Honduras' },
      { code: 'HK', name: 'Hong Kong' },
      { code: 'IN', name: 'India' },
      { code: 'IE', name: 'Ireland' },
      { code: 'IT', name: 'Italy' },
      { code: 'JP', name: 'Japan' },
      { code: 'MX', name: 'Mexico' },
      { code: 'NL', name: 'Netherlands' },
      { code: 'NZ', name: 'New Zealand' },
      { code: 'NO', name: 'Norway' },
      { code: 'PA', name: 'Panama' },
      { code: 'PE', name: 'Peru' },
      { code: 'PH', name: 'Philippines' },
      { code: 'PL', name: 'Poland' },
      { code: 'PT', name: 'Portugal' },
      { code: 'PR', name: 'Puerto Rico' },
      { code: 'SG', name: 'Singapore' },
      { code: 'ZA', name: 'South Africa' },
      { code: 'ES', name: 'Spain' },
      { code: 'SE', name: 'Sweden' },
      { code: 'CH', name: 'Switzerland' },
      { code: 'TW', name: 'Taiwan' },
      { code: 'GB', name: 'United Kingdom' },
      { code: 'US', name: 'United States' },
      { code: 'UY', name: 'Uruguay' },
      { code: 'VE', name: 'Venezuela' }
    ].sort((a, b) => a.name.localeCompare(b.name));
  }

  showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = message;
      element.classList.add('show');
    }
  }

  clearError(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = '';
      element.classList.remove('show');
    }
  }

  clearValidationError() {
    this.state.validationError = null;
    const errorElement = document.querySelector('.validation-error');
    if (errorElement) {
      errorElement.remove();
    }
  }
}

// Initialize tenant creation wizard with credentials
const tenantWizardWithCredentials = new TenantCreationWizardWithCredentials();

// Expose to window for onclick handlers
window.tenantWizardWithCredentials = tenantWizardWithCredentials;

if (typeof tenantWizardWithCredentials === 'undefined') {
  console.error('❌ Failed to initialize TenantCreationWizardWithCredentials');
} else {
  console.log('✅ TenantCreationWizardWithCredentials initialized');
}

