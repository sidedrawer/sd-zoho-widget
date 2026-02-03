/**
 * Setup Modal Component - Credential Configuration UI
 * 
 * Provides a modal interface for configuring SideDrawer widget credentials.
 * Only accessible to users with "Manage Organization" rights.
 * 
 * Dependencies:
 * - setup-api.js (SetupAPI)
 * - widget.html (SideDrawerAuth class)
 */

class SetupModal {
  constructor(authInstance) {
    this.auth = authInstance;
    this.modalElement = null;
    this.isOpen = false;
  }

  /**
   * Check if user has permission to access setup modal
   * Bypasses check in standalone mode (local development)
   * @returns {Promise<boolean>}
   */
  async checkPermission() {
    // Check if we're in standalone mode (local development)
    // In Zoho, widget runs in iframe (window.self !== window.top)
    // When running locally (npm start), window.self === window.top
    const isStandalone = window.self === window.top;
    
    if (isStandalone) {
      console.log('[Setup Modal] Standalone mode detected (local dev) - bypassing permission check');
      return true;
    }
    
    if (window.SetupAPI && typeof window.SetupAPI.checkUserHasManageOrgPermission === 'function') {
      return await window.SetupAPI.checkUserHasManageOrgPermission();
    }
    return false;
  }

  /**
   * Open setup modal
   * @param {Object} options - Options for modal
   * @param {string} [options.preFillTenantId] - Pre-fill tenant ID from tenant creation
   */
  async open(options = {}) {
    try {
      // Check permissions
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        this.showPermissionError();
        return;
      }

      // Load existing configuration
      let existingConfig = null;
      try {
        if (window.SetupAPI && typeof window.SetupAPI.getSetupConfig === 'function') {
          // Add timeout to prevent hanging
          const configPromise = window.SetupAPI.getSetupConfig();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Config load timeout')), 5000)
          );
          existingConfig = await Promise.race([configPromise, timeoutPromise]);
        }
      } catch (error) {
        console.warn('[Setup Modal] Error loading existing config:', error);
        // Continue with null config (will show empty form)
      }

      // Create modal HTML
      const modalHTML = this.createModalHTML(existingConfig, options.preFillTenantId);
      
      // Create modal element
      const modalDiv = document.createElement('div');
      modalDiv.id = 'setup-modal-overlay';
      modalDiv.className = 'modal-overlay';
      modalDiv.innerHTML = modalHTML;
      
      // Add to body
      document.body.appendChild(modalDiv);
      this.modalElement = modalDiv;
      this.isOpen = true;

      // Setup event listeners
      this.setupEventListeners(existingConfig, options.preFillTenantId);
    } catch (error) {
      console.error('[Setup Modal] Error opening modal:', error);
      if (this.auth && typeof this.auth.showError === 'function') {
        this.auth.showError('Failed to open setup modal: ' + error.message);
      } else {
        alert('Failed to open setup modal: ' + error.message);
      }
    }
  }

  /**
   * Create modal HTML
   */
  createModalHTML(existingConfig, preFillTenantId) {
    const clientId = existingConfig?.clientId || '';
    const environment = existingConfig?.environment || 'sandbox';
    const redirectUri = existingConfig?.redirectUri || '';
    const tenantId = preFillTenantId || existingConfig?.tenantId || '';
    const brandCode = existingConfig?.brandCode || '';

    return `
      <div class="modal-content setup-modal">
        <div class="modal-header">
          <h2>⚙️ SideDrawer Widget Configuration</h2>
          <button class="modal-close" onclick="window.setupModal.close()">&times;</button>
        </div>
        <div class="modal-body">
          <p class="text-muted-sm" style="margin-bottom: 20px;">
            Configure SideDrawer widget credentials. These settings will be shared across all users in your Zoho instance.
          </p>
          
          <form id="setup-form">
            <div class="form-group">
              <label for="setup-client-id">
                Client ID <span class="required">*</span>
              </label>
              <input 
                type="text" 
                id="setup-client-id" 
                name="clientId" 
                value="${this.escapeHtml(clientId)}"
                placeholder="Enter OAuth Client ID"
                required
              />
              <small class="form-help">OAuth Client ID from SideDrawer (public identifier)</small>
            </div>

            <div class="form-group">
              <label for="setup-environment">
                Environment <span class="required">*</span>
              </label>
              <select id="setup-environment" name="environment" required>
                <option value="sandbox" ${environment === 'sandbox' ? 'selected' : ''}>Sandbox</option>
                <option value="production" ${environment === 'production' ? 'selected' : ''}>Production</option>
              </select>
              <small class="form-help">SideDrawer environment (sandbox or production)</small>
            </div>

            <div class="form-group">
              <label for="setup-redirect-uri">
                Redirect URI <span class="required">*</span>
              </label>
              <input 
                type="url" 
                id="setup-redirect-uri" 
                name="redirectUri" 
                value="${this.escapeHtml(redirectUri)}"
                placeholder="https://your-domain.com/oauth/callback"
                required
              />
              <small class="form-help">OAuth redirect URI (must match SideDrawer app configuration)</small>
            </div>

            <div class="form-group">
              <label for="setup-tenant-id">
                Tenant ID <span class="optional">(optional)</span>
              </label>
              <input 
                type="text" 
                id="setup-tenant-id" 
                name="tenantId" 
                value="${this.escapeHtml(tenantId)}"
                placeholder="Enter Tenant ID"
              />
              <small class="form-help">SideDrawer Tenant ID (can be set later)</small>
            </div>

            <div class="form-group">
              <label for="setup-brand-code">
                Brand Code <span class="optional">(optional)</span>
              </label>
              <input 
                type="text" 
                id="setup-brand-code" 
                name="brandCode" 
                value="${this.escapeHtml(brandCode)}"
                placeholder="Enter Brand Code"
              />
              <small class="form-help">SideDrawer Brand Code (optional)</small>
            </div>

            <div id="setup-error" class="error-message" style="display: none;"></div>
            <div id="setup-success" class="success-message" style="display: none;"></div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" onclick="window.setupModal.close()">Cancel</button>
          <button type="button" class="btn btn-primary" id="setup-save-btn" onclick="window.setupModal.save()">
            ${existingConfig ? 'Update Configuration' : 'Save Configuration'}
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners(existingConfig, preFillTenantId) {
    // Close on overlay click
    const overlay = document.getElementById('setup-modal-overlay');
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.close();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Pre-fill tenant ID if provided
    if (preFillTenantId) {
      const tenantIdInput = document.getElementById('setup-tenant-id');
      if (tenantIdInput) {
        tenantIdInput.value = preFillTenantId;
      }
    }
  }

  /**
   * Save configuration
   */
  async save() {
    // Check permissions again
    const hasPermission = await this.checkPermission();
    if (!hasPermission) {
      this.showError('Permission denied: Only users with "Manage Organization" rights can configure credentials.');
      return;
    }

    // Get form values
    const clientId = document.getElementById('setup-client-id').value.trim();
    const environment = document.getElementById('setup-environment').value;
    const redirectUri = document.getElementById('setup-redirect-uri').value.trim();
    const tenantId = document.getElementById('setup-tenant-id').value.trim();
    const brandCode = document.getElementById('setup-brand-code').value.trim();

    // Validate
    if (!clientId) {
      this.showError('Client ID is required');
      return;
    }
    if (!redirectUri) {
      this.showError('Redirect URI is required');
      return;
    }
    if (!['sandbox', 'production'].includes(environment)) {
      this.showError('Environment must be "sandbox" or "production"');
      return;
    }

    // Disable save button
    const saveBtn = document.getElementById('setup-save-btn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
    }

    try {
      // Save via SetupAPI
      if (!window.SetupAPI || typeof window.SetupAPI.saveSetupConfig !== 'function') {
        throw new Error('Setup API not available');
      }

      const config = {
        clientId,
        environment,
        redirectUri,
        tenantId: tenantId || null,
        brandCode: brandCode || null,
        isActive: true
      };

      await window.SetupAPI.saveSetupConfig(config);

      // Show success message
      this.showSuccess('Configuration saved successfully! Reloading widget...');

      // In standalone mode, also save to localStorage for persistence
      const isStandalone = window.self === window.top;
      if (isStandalone) {
        try {
          localStorage.setItem('sd_widget_setup_config', JSON.stringify(config));
          console.log('[Setup Modal] Also saved to localStorage for standalone mode');
        } catch (e) {
          console.warn('[Setup Modal] Failed to save to localStorage:', e);
        }
      }

      // Reload widget after short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('[Setup Modal] Error saving configuration:', error);
      this.showError(error.message || 'Failed to save configuration');
      
      // Re-enable save button
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = existingConfig ? 'Update Configuration' : 'Save Configuration';
      }
    }
  }

  /**
   * Close modal
   */
  close() {
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
    }
    this.isOpen = false;
  }

  /**
   * Show error message
   */
  showError(message) {
    const errorDiv = document.getElementById('setup-error');
    const successDiv = document.getElementById('setup-success');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
    }
    if (successDiv) {
      successDiv.style.display = 'none';
    }
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    const errorDiv = document.getElementById('setup-error');
    const successDiv = document.getElementById('setup-success');
    if (successDiv) {
      successDiv.textContent = message;
      successDiv.style.display = 'block';
    }
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
  }

  /**
   * Show permission error
   */
  showPermissionError() {
    if (this.auth) {
      this.auth.showError('Permission denied: Only users with "Manage Organization" rights can configure credentials.');
    } else {
      alert('Permission denied: Only users with "Manage Organization" rights can configure credentials.');
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export for use in widget.html
if (typeof window !== 'undefined') {
  window.SetupModal = SetupModal;
}
