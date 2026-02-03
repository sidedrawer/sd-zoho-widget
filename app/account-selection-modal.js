/**
 * Account Selection Modal Component
 * 
 * Shows a choice screen when logged-in users need to set up their SideDrawer integration.
 * Both options converge at the setup modal for credential configuration.
 * 
 * Dependencies:
 * - widget.html (SideDrawerAuth class)
 * - setup-modal.js (SetupModal)
 * - tenant-wizard-with-credentials.js (for tenant creation)
 */

class AccountSelectionModal {
  constructor(authInstance) {
    this.auth = authInstance;
    this.modalElement = null;
    this.isOpen = false;
  }

  /**
   * Open account selection modal
   */
  async open() {
    // Create modal HTML
    const modalHTML = this.createModalHTML();
    
    // Create modal element
    const modalDiv = document.createElement('div');
    modalDiv.id = 'account-selection-modal-overlay';
    modalDiv.className = 'modal-overlay';
    modalDiv.innerHTML = modalHTML;
    
    // Add to body
    document.body.appendChild(modalDiv);
    this.modalElement = modalDiv;
    this.isOpen = true;

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Create modal HTML
   */
  createModalHTML() {
    return `
      <div class="modal-content account-selection-modal">
        <div class="modal-header">
          <h2>Choose Your Setup Option</h2>
          <button class="modal-close" onclick="window.accountSelectionModal.close()">&times;</button>
        </div>
        <div class="modal-body">
          <p class="text-muted-sm" style="margin-bottom: 24px; text-align: center;">
            Both options will lead you to the same configuration screen where you'll enter your credentials.
          </p>
          
          <div class="account-selection-cards">
            <!-- Create New Account Card -->
            <div class="account-selection-card" onclick="window.accountSelectionModal.selectCreateNew()">
              <div class="account-selection-card-icon">✨</div>
              <h3>Create New Business Account</h3>
              <p class="account-selection-card-description">
                Create a new SideDrawer tenant for your business. You'll set up billing, domain, and other details first, then configure credentials.
              </p>
              <div class="account-selection-card-steps">
                <div class="step-item">
                  <span class="step-number">1</span>
                  <span class="step-text">Create tenant</span>
                </div>
                <div class="step-arrow">→</div>
                <div class="step-item">
                  <span class="step-number">2</span>
                  <span class="step-text">Configure credentials</span>
                </div>
              </div>
              <button class="btn btn-primary account-selection-card-button">
                Create New Account
              </button>
            </div>

            <!-- Use Existing Account Card -->
            <div class="account-selection-card" onclick="window.accountSelectionModal.selectUseExisting()">
              <div class="account-selection-card-icon">⚙️</div>
              <h3>Use Existing Account</h3>
              <p class="account-selection-card-description">
                Already have a SideDrawer account? Enter your existing credentials to connect immediately.
              </p>
              <div class="account-selection-card-steps">
                <div class="step-item">
                  <span class="step-number">—</span>
                  <span class="step-text">Skip tenant creation</span>
                </div>
                <div class="step-arrow">→</div>
                <div class="step-item">
                  <span class="step-number">1</span>
                  <span class="step-text">Configure credentials</span>
                </div>
              </div>
              <button class="btn btn-outline account-selection-card-button">
                Use Existing Account
              </button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" onclick="window.accountSelectionModal.close()">Cancel</button>
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Close on overlay click
    const overlay = document.getElementById('account-selection-modal-overlay');
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
  }

  /**
   * Handle "Create New Account" selection
   */
  async selectCreateNew() {
    try {
      this.close();
      
      // Show tenant creation wizard directly
      // After tenant creation, setup modal will open automatically (already implemented in tenant-wizard-with-credentials.js)
      if (this.auth && typeof this.auth.showTenantCreationWizard === 'function') {
        await this.auth.showTenantCreationWizard();
      } else if (this.auth && typeof this.auth.showTenantCreationFlowDirect === 'function') {
        await this.auth.showTenantCreationFlowDirect();
      } else {
        // Fallback - this shouldn't happen but handle gracefully
        console.error('[Account Selection] Tenant creation wizard not available');
        if (this.auth && typeof this.auth.showError === 'function') {
          this.auth.showError('Tenant creation wizard is not available. Please refresh the page.');
        } else {
          alert('Tenant creation wizard is not available. Please refresh the page.');
        }
      }
    } catch (error) {
      console.error('[Account Selection] Error in selectCreateNew:', error);
      if (this.auth && typeof this.auth.showError === 'function') {
        this.auth.showError('Failed to start tenant creation: ' + error.message);
      }
    }
  }

  /**
   * Handle "Use Existing Account" selection
   */
  async selectUseExisting() {
    try {
      this.close();
      
      // Open setup modal directly (convergence point)
      if (this.auth && typeof this.auth.showSetupModal === 'function') {
        await this.auth.showSetupModal({
          source: 'existing_account' // Indicate this is from existing account flow
        });
      } else {
        console.error('[Account Selection] Setup modal not available');
        if (this.auth && typeof this.auth.showError === 'function') {
          this.auth.showError('Setup modal is not available. Please refresh the page.');
        } else {
          alert('Setup modal is not available. Please refresh the page.');
        }
      }
    } catch (error) {
      console.error('[Account Selection] Error in selectUseExisting:', error);
      if (this.auth && typeof this.auth.showError === 'function') {
        this.auth.showError('Failed to open setup modal: ' + error.message);
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
}

// Export for use in widget.html
if (typeof window !== 'undefined') {
  window.AccountSelectionModal = AccountSelectionModal;
}
