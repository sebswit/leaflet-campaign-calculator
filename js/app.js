/**
 * Leaflet Campaign Calculator - Application Controller
 * 
 * Handles UI event bindings, state management, reactive recalculations,
 * VAT toggle switching, and email-ready clipboard formatting.
 */

(function () {
  'use strict';

  // Application State
  const state = {
    quantity: CONFIG.defaultQuantity,
    isCustomQuantity: false,
    designId: CONFIG.defaultDesignId,
    includePrinting: CONFIG.printing.defaultIncluded,
    includeDistribution: CONFIG.distribution.defaultIncluded,
    includeVat: false // Default Ex. VAT per agency specifications
  };

  // DOM Elements Cache
  const DOM = {
    // VAT Switcher
    btnExVat: document.getElementById('btnExVat'),
    btnIncVat: document.getElementById('btnIncVat'),
    summaryVatModePill: document.getElementById('summaryVatModePill'),

    // Quantity Presets & Custom Input
    quantityPresets: document.querySelectorAll('.preset-btn'),
    customQuantityWrap: document.getElementById('customQuantityWrap'),
    customQuantityInput: document.getElementById('customQuantityInput'),

    // Design Container
    designOptionsContainer: document.getElementById('designOptionsContainer'),

    // Printing Controls
    togglePrinting: document.getElementById('togglePrinting'),
    printingStatusLabel: document.getElementById('printingStatusLabel'),
    printingFeatureCard: document.getElementById('printingFeatureCard'),
    cardPrintingCost: document.getElementById('cardPrintingCost'),

    // Distribution Controls
    toggleDistribution: document.getElementById('toggleDistribution'),
    distributionStatusLabel: document.getElementById('distributionStatusLabel'),
    distributionFeatureCard: document.getElementById('distributionFeatureCard'),
    cardDistributionCost: document.getElementById('cardDistributionCost'),
    distributionRateNote: document.getElementById('distributionRateNote'),

    // Summary Card Outputs
    summaryQtyPill: document.getElementById('summaryQtyPill'),
    itemDesignRow: document.getElementById('itemDesignRow'),
    summaryDesignName: document.getElementById('summaryDesignName'),
    summaryDesignCost: document.getElementById('summaryDesignCost'),

    itemPrintingRow: document.getElementById('itemPrintingRow'),
    summaryPrintingSub: document.getElementById('summaryPrintingSub'),
    summaryPrintingCost: document.getElementById('summaryPrintingCost'),

    itemDistributionRow: document.getElementById('itemDistributionRow'),
    summaryDistributionSub: document.getElementById('summaryDistributionSub'),
    summaryDistributionCost: document.getElementById('summaryDistributionCost'),

    summarySubtotalExVat: document.getElementById('summarySubtotalExVat'),
    summaryVatRow: document.getElementById('summaryVatRow'),
    summaryVatAmount: document.getElementById('summaryVatAmount'),

    primaryTotalLabel: document.getElementById('primaryTotalLabel'),
    primaryTotalAmount: document.getElementById('primaryTotalAmount'),
    summaryUnitCostBadge: document.getElementById('summaryUnitCostBadge'),
    totalSecondaryNote: document.getElementById('totalSecondaryNote'),

    // Buttons & Toast
    btnCopyQuote: document.getElementById('btnCopyQuote'),
    btnPrintQuote: document.getElementById('btnPrintQuote'),
    copyToast: document.getElementById('copyToast')
  };

  /**
   * Render Design Radio Cards dynamically from configuration
   */
  function renderDesignOptions() {
    DOM.designOptionsContainer.innerHTML = '';

    CONFIG.designOptions.forEach(option => {
      const card = document.createElement('div');
      card.className = `design-card ${option.id === state.designId ? 'active' : ''}`;
      card.setAttribute('role', 'radio');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-checked', option.id === state.designId ? 'true' : 'false');
      card.dataset.id = option.id;

      card.innerHTML = `
        <div class="design-card-top">
          <div class="design-radio-indicator"></div>
          <span class="design-price-tag">${Calculator.formatCurrency(option.price)}</span>
        </div>
        <div>
          <h3 class="design-title">${option.title}</h3>
          <p class="design-desc">${option.description}</p>
        </div>
      `;

      // Selection Handlers
      card.addEventListener('click', () => selectDesign(option.id));
      card.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          selectDesign(option.id);
        }
      });

      DOM.designOptionsContainer.appendChild(card);
    });
  }

  /**
   * Handle Design option selection
   * @param {string} designId
   */
  function selectDesign(designId) {
    state.designId = designId;

    // Update active classes and aria-checked
    const cards = DOM.designOptionsContainer.querySelectorAll('.design-card');
    cards.forEach(card => {
      const isActive = card.dataset.id === designId;
      card.classList.toggle('active', isActive);
      card.setAttribute('aria-checked', isActive ? 'true' : 'false');
    });

    updateCalculations();
  }

  /**
   * Handle Quantity Preset Selection
   * @param {string} value - Number or 'custom'
   */
  function selectQuantityPreset(value) {
    DOM.quantityPresets.forEach(btn => {
      const isMatch = btn.dataset.quantity === String(value);
      btn.classList.toggle('active', isMatch);
    });

    if (value === 'custom') {
      state.isCustomQuantity = true;
      DOM.customQuantityWrap.hidden = false;
      
      const customVal = parseInt(DOM.customQuantityInput.value, 10);
      if (customVal && customVal >= CONFIG.minCustomQuantity) {
        state.quantity = customVal;
      } else {
        // Default custom starting point if empty
        DOM.customQuantityInput.value = 3500;
        state.quantity = 3500;
      }
      DOM.customQuantityInput.focus();
    } else {
      state.isCustomQuantity = false;
      DOM.customQuantityWrap.hidden = true;
      state.quantity = parseInt(value, 10);
    }

    updateCalculations();
  }

  /**
   * Handle Custom Quantity Input changes
   */
  function onCustomQuantityInput() {
    let val = parseInt(DOM.customQuantityInput.value, 10);
    if (isNaN(val) || val < 0) {
      val = 0;
    }
    state.quantity = val;
    updateCalculations();
  }

  /**
   * Set VAT Mode (Ex. VAT vs Inc. 20% VAT)
   * @param {boolean} includeVat
   */
  function setVatMode(includeVat) {
    state.includeVat = includeVat;
    DOM.btnExVat.classList.toggle('active', !includeVat);
    DOM.btnExVat.setAttribute('aria-pressed', !includeVat);
    DOM.btnIncVat.classList.toggle('active', includeVat);
    DOM.btnIncVat.setAttribute('aria-pressed', includeVat);
    updateCalculations();
  }

  /**
   * Update all calculations and UI outputs reactively
   */
  function updateCalculations() {
    const totals = Calculator.calculateCampaignTotals({
      quantity: state.quantity,
      designId: state.designId,
      includePrinting: state.includePrinting,
      includeDistribution: state.includeDistribution,
      includeVat: state.includeVat
    });

    const design = Calculator.getDesignDetails(state.designId);
    const formattedQty = Calculator.formatNumber(totals.quantity);

    // 1. Update Feature Cards in Left Column
    DOM.cardPrintingCost.textContent = state.includePrinting 
      ? Calculator.formatCurrency(totals.printingCost) 
      : '£0.00';
    DOM.printingStatusLabel.textContent = state.includePrinting ? 'Included' : 'Excluded';
    DOM.printingStatusLabel.style.color = state.includePrinting ? 'var(--color-emerald)' : 'var(--color-text-muted)';
    DOM.printingFeatureCard.classList.toggle('disabled', !state.includePrinting);

    // Distribution Feature Card
    if (!state.includeDistribution) {
      DOM.cardDistributionCost.textContent = '£0.00';
      DOM.distributionStatusLabel.textContent = 'Excluded';
      DOM.distributionStatusLabel.style.color = 'var(--color-text-muted)';
      DOM.distributionFeatureCard.classList.add('disabled');
      DOM.distributionRateNote.textContent = 'Targeted household delivery opted out';
    } else if (totals.isDistributionQuote) {
      DOM.cardDistributionCost.textContent = CONFIG.distribution.customQuoteText;
      DOM.distributionStatusLabel.textContent = 'Included';
      DOM.distributionStatusLabel.style.color = 'var(--color-emerald)';
      DOM.distributionFeatureCard.classList.remove('disabled');
      DOM.distributionRateNote.textContent = 'Quantities above 10,000 require a bespoke delivery quote';
    } else {
      DOM.cardDistributionCost.textContent = Calculator.formatCurrency(totals.distributionCost);
      DOM.distributionStatusLabel.textContent = 'Included';
      DOM.distributionStatusLabel.style.color = 'var(--color-emerald)';
      DOM.distributionFeatureCard.classList.remove('disabled');
      if (totals.quantity <= CONFIG.distribution.baseThreshold) {
        DOM.distributionRateNote.textContent = `Minimum delivery charge £${CONFIG.distribution.baseMinimumCharge.toFixed(2)} up to 1,000 leaflets`;
      } else {
        DOM.distributionRateNote.textContent = 'Progressive tiered pricing (£139 base + bracket rates)';
      }
    }

    // 2. Summary Card Meta Pills
    DOM.summaryQtyPill.textContent = `${formattedQty} Leaflets`;
    DOM.summaryVatModePill.textContent = state.includeVat ? 'Figures Inc. 20% VAT' : 'Figures Ex. VAT';

    // 3. Line Items
    DOM.summaryDesignName.textContent = design.title;
    DOM.summaryDesignCost.textContent = Calculator.formatCurrency(totals.designCost);

    // Printing line
    DOM.itemPrintingRow.classList.toggle('excluded', !state.includePrinting);
    DOM.summaryPrintingSub.textContent = state.includePrinting
      ? `${formattedQty} copies (A5 Silk)`
      : 'Printing opted out';
    DOM.summaryPrintingCost.textContent = state.includePrinting
      ? Calculator.formatCurrency(totals.printingCost)
      : '£0.00';

    // Distribution line
    DOM.itemDistributionRow.classList.toggle('excluded', !state.includeDistribution);
    if (!state.includeDistribution) {
      DOM.summaryDistributionSub.textContent = 'Distribution opted out';
      DOM.summaryDistributionCost.textContent = '£0.00';
    } else if (totals.isDistributionQuote) {
      DOM.summaryDistributionSub.textContent = `${formattedQty} leaflets (Bespoke quote required)`;
      DOM.summaryDistributionCost.textContent = CONFIG.distribution.customQuoteText;
    } else {
      DOM.summaryDistributionSub.textContent = totals.quantity <= CONFIG.distribution.baseThreshold
        ? `${formattedQty} leaflets (Min. delivery charge)`
        : `${formattedQty} leaflets (Progressive delivery)`;
      DOM.summaryDistributionCost.textContent = Calculator.formatCurrency(totals.distributionCost);
    }

    // 4. Subtotals and VAT
    DOM.summarySubtotalExVat.textContent = Calculator.formatCurrency(totals.subtotalExVat);
    DOM.summaryVatAmount.textContent = Calculator.formatCurrency(totals.vatAmount);

    // 5. Highlight Total Box
    if (totals.isDistributionQuote) {
      if (state.includeVat) {
        DOM.primaryTotalLabel.textContent = 'Design & Print Total (Inc. 20% VAT)';
        DOM.primaryTotalAmount.textContent = `${Calculator.formatCurrency(totals.totalIncVat)}*`;
        DOM.summaryUnitCostBadge.textContent = 'Delivery Quote TBC';
        DOM.totalSecondaryNote.innerHTML = `*Excludes delivery. Distribution for ${formattedQty} leaflets requires a bespoke quote. (Net Ex. VAT: ${Calculator.formatCurrency(totals.subtotalExVat)})`;
      } else {
        DOM.primaryTotalLabel.textContent = 'Design & Print Total (Ex. VAT)';
        DOM.primaryTotalAmount.textContent = `${Calculator.formatCurrency(totals.subtotalExVat)}*`;
        DOM.summaryUnitCostBadge.textContent = 'Delivery Quote TBC';
        DOM.totalSecondaryNote.innerHTML = `*Excludes delivery. Distribution for ${formattedQty} leaflets requires a bespoke quote. (Total Inc. 20% VAT: ${Calculator.formatCurrency(totals.totalIncVat)})`;
      }
    } else {
      if (state.includeVat) {
        DOM.primaryTotalLabel.textContent = 'Total Campaign Investment (Inc. 20% VAT)';
        DOM.primaryTotalAmount.textContent = Calculator.formatCurrency(totals.totalIncVat);
        DOM.summaryUnitCostBadge.textContent = `${Calculator.formatUnitCost(totals.totalIncVat, totals.quantity)} / leaflet (Inc. VAT)`;
        DOM.totalSecondaryNote.innerHTML = `Net Total Ex. VAT: <strong>${Calculator.formatCurrency(totals.subtotalExVat)}</strong> (VAT: ${Calculator.formatCurrency(totals.vatAmount)})`;
      } else {
        DOM.primaryTotalLabel.textContent = 'Total Campaign Cost (Ex. VAT)';
        DOM.primaryTotalAmount.textContent = Calculator.formatCurrency(totals.subtotalExVat);
        DOM.summaryUnitCostBadge.textContent = `${Calculator.formatUnitCost(totals.subtotalExVat, totals.quantity)} / leaflet`;
        DOM.totalSecondaryNote.innerHTML = `Total Inc. 20% VAT: <strong>${Calculator.formatCurrency(totals.totalIncVat)}</strong> (VAT: ${Calculator.formatCurrency(totals.vatAmount)})`;
      }
    }
  }

  /**
   * Generate clean formatted plain text for client email estimates
   * @returns {string}
   */
  function generateQuoteText() {
    const totals = Calculator.calculateCampaignTotals({
      quantity: state.quantity,
      designId: state.designId,
      includePrinting: state.includePrinting,
      includeDistribution: state.includeDistribution,
      includeVat: state.includeVat
    });

    const design = Calculator.getDesignDetails(state.designId);
    const formattedQty = Calculator.formatNumber(totals.quantity);
    const currentDate = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    return [
      `==================================================`,
      `LEAFLET CAMPAIGN ESTIMATE`,
      `==================================================`,
      `Date: ${currentDate}`,
      `Campaign Quantity: ${formattedQty} leaflets`,
      ``,
      `CAMPAIGN SPECIFICATIONS & BREAKDOWN (Ex. VAT):`,
      `--------------------------------------------------`,
      `1. Design & Pre-Press:`,
      `   • ${design.title}`,
      `   • Cost: ${Calculator.formatCurrency(totals.designCost)}`,
      ``,
      `2. Print Production:`,
      `   • Status: ${state.includePrinting ? 'Included' : 'Excluded by client'}`,
      state.includePrinting ? `   • Spec: ${CONFIG.printing.specificationNote}` : null,
      state.includePrinting ? `   • Cost: ${Calculator.formatCurrency(totals.printingCost)}` : null,
      ``,
      `3. Door-to-Door Distribution:`,
      `   • Status: ${state.includeDistribution ? 'Included' : 'Excluded by client'}`,
      state.includeDistribution && totals.isDistributionQuote ? `   • Delivery: Bespoke quote required for ${formattedQty} leaflets` : null,
      state.includeDistribution && totals.isDistributionQuote ? `   • Cost: ${CONFIG.distribution.customQuoteText}` : null,
      state.includeDistribution && !totals.isDistributionQuote ? `   • Delivery: Progressive tiered pricing (${formattedQty} leaflets)` : null,
      state.includeDistribution && !totals.isDistributionQuote ? `   • Cost: ${Calculator.formatCurrency(totals.distributionCost)}` : null,
      `--------------------------------------------------`,
      totals.isDistributionQuote
        ? `Design & Print Subtotal (Ex. VAT): ${Calculator.formatCurrency(totals.subtotalExVat)}`
        : `Subtotal (Ex. VAT):          ${Calculator.formatCurrency(totals.subtotalExVat)}`,
      `UK VAT (20%):                 ${Calculator.formatCurrency(totals.vatAmount)}`,
      totals.isDistributionQuote
        ? `TOTAL DESIGN & PRINT (Inc. VAT):  ${Calculator.formatCurrency(totals.totalIncVat)}*`
        : `TOTAL INVESTMENT (Inc. VAT):  ${Calculator.formatCurrency(totals.totalIncVat)}`,
      ``,
      totals.isDistributionQuote
        ? `*Total excludes distribution. A bespoke delivery quote will be provided for ${formattedQty} leaflets.`
        : `Unit Cost: ${Calculator.formatUnitCost(totals.subtotalExVat, totals.quantity)} per leaflet (Ex. VAT)`,
      `==================================================`,
      `Quote valid for 30 days. Standard turnaround 3–5 working days.`
    ].filter(line => line !== null).join('\n');
  }

  /**
   * Copy quote text to clipboard with modern fallback & animated toast
   */
  async function copyQuoteToClipboard() {
    const text = generateQuoteText();

    let success = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch (err) {
        success = copyFallback(text);
      }
    } else {
      success = copyFallback(text);
    }

    if (success) {
      showToast();
    } else {
      alert('Could not auto-copy to clipboard. Please use Print / PDF export.');
    }
  }

  /**
   * Fallback for older browsers or non-HTTPS contexts
   * @param {string} text
   * @returns {boolean}
   */
  function copyFallback(text) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const res = document.execCommand('copy');
      document.body.removeChild(textarea);
      return res;
    } catch (e) {
      return false;
    }
  }

  /**
   * Show animated toast notification
   */
  let toastTimeout = null;
  function showToast() {
    DOM.copyToast.hidden = false;
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      DOM.copyToast.hidden = true;
    }, 3200);
  }

  /**
   * Initialize event listeners
   */
  function initEvents() {
    // Quantity Presets
    DOM.quantityPresets.forEach(btn => {
      btn.addEventListener('click', () => {
        selectQuantityPreset(btn.dataset.quantity);
      });
    });

    // Custom Quantity Input
    DOM.customQuantityInput.addEventListener('input', onCustomQuantityInput);

    // Printing Toggle
    DOM.togglePrinting.addEventListener('change', (e) => {
      state.includePrinting = e.target.checked;
      updateCalculations();
    });

    // Distribution Toggle
    DOM.toggleDistribution.addEventListener('change', (e) => {
      state.includeDistribution = e.target.checked;
      updateCalculations();
    });

    // VAT Toggles
    DOM.btnExVat.addEventListener('click', () => setVatMode(false));
    DOM.btnIncVat.addEventListener('click', () => setVatMode(true));

    // Copy Quote Button
    DOM.btnCopyQuote.addEventListener('click', copyQuoteToClipboard);

    // Print / PDF Button
    DOM.btnPrintQuote.addEventListener('click', () => {
      window.print();
    });
  }

  /**
   * Bootstrap application
   */
  function init() {
    renderDesignOptions();
    initEvents();
    updateCalculations();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
