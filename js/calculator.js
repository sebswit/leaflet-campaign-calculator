/**
 * Leaflet Campaign Calculator - Calculation Engine
 * 
 * Pure functions for calculating design, print, distribution, and VAT totals.
 */

const Calculator = {
  /**
   * Format numbers into British Pounds (£)
   * @param {number} amount
   * @param {number} [minimumFractionDigits=2]
   * @returns {string}
   */
  formatCurrency(amount, minimumFractionDigits = 2) {
    return new Intl.NumberFormat(CONFIG.currency.locale, {
      style: 'currency',
      currency: CONFIG.currency.code,
      minimumFractionDigits: minimumFractionDigits,
      maximumFractionDigits: 2
    }).format(amount);
  },

  /**
   * Format numbers with commas (e.g. 1,000)
   * @param {number} num
   * @returns {string}
   */
  formatNumber(num) {
    return new Intl.NumberFormat(CONFIG.currency.locale).format(num);
  },

  /**
   * Formats cost per leaflet (e.g., 14.2p or £1.25)
   * @param {number} total
   * @param {number} quantity
   * @returns {string}
   */
  formatUnitCost(total, quantity) {
    if (!quantity || quantity <= 0) return '£0.00';
    const unitPence = (total / quantity) * 100;
    if (unitPence < 100) {
      return `${unitPence.toFixed(1)}p`;
    }
    return Calculator.formatCurrency(total / quantity, 2);
  },

  /**
   * Get design option details and price by ID
   * @param {string} designId
   * @returns {{ id: string, title: string, price: number }}
   */
  getDesignDetails(designId) {
    const option = CONFIG.designOptions.find(opt => opt.id === designId);
    return option || CONFIG.designOptions[0];
  },

  /**
   * Calculate Design Cost
   * @param {string} designId
   * @returns {number}
   */
  calculateDesignCost(designId) {
    const design = this.getDesignDetails(designId);
    return design.price;
  },

  /**
   * Calculate Printing Cost
   * @param {number} quantity
   * @param {boolean} includePrinting
   * @returns {number}
   */
  calculatePrintingCost(quantity, includePrinting) {
    if (!includePrinting || quantity <= 0) {
      return 0;
    }

    const { presetPrices, customUnitRates } = CONFIG.printing;

    // Check if quantity matches an exact preset in the lookup table
    if (presetPrices[quantity] !== undefined) {
      return presetPrices[quantity];
    }

    // Custom quantity calculations using volume discount tiers
    if (quantity < 500) {
      return customUnitRates.below500MinCost;
    } else if (quantity < 1000) {
      return presetPrices[500] + (quantity - 500) * customUnitRates.rate500To1000;
    } else if (quantity < 2500) {
      return presetPrices[1000] + (quantity - 1000) * customUnitRates.rate1000To2500;
    } else if (quantity < 5000) {
      return presetPrices[2500] + (quantity - 2500) * customUnitRates.rate2500To5000;
    } else {
      return presetPrices[5000] + (quantity - 5000) * customUnitRates.rateAbove5000;
    }
  },

  /**
   * Calculate Distribution Cost using progressive tiered pricing
   * 
   * Tiers:
   * - Up to 1,000 leaflets: minimum delivery charge £139
   * - From 1,001 to 2,500 leaflets: charge £119 per 1,000 for quantity above 1,000
   * - From 2,501 to 5,000 leaflets: charge £99 per 1,000 for quantity above 2,500
   * - From 5,001 to 10,000 leaflets: charge £85 per 1,000 for quantity above 5,000
   * - Above 10,000 leaflets: display "Request a quote"
   * 
   * @param {number} quantity
   * @param {boolean} includeDistribution
   * @returns {{ cost: number|null, isCustomQuote: boolean, displayText: string }}
   */
  calculateDistributionCost(quantity, includeDistribution) {
    if (!includeDistribution || quantity <= 0) {
      return {
        cost: 0,
        isCustomQuote: false,
        displayText: '£0.00'
      };
    }

    const { baseThreshold, baseMinimumCharge, tiers, maxAutomaticThreshold, customQuoteText } = CONFIG.distribution;

    // Above 10,000 leaflets: display "Request a quote"
    if (quantity > maxAutomaticThreshold) {
      return {
        cost: null,
        isCustomQuote: true,
        displayText: customQuoteText
      };
    }

    // Up to 1,000 leaflets: minimum delivery charge
    let total = baseMinimumCharge;

    // Progressive tiers for quantity above 1,000
    if (quantity > baseThreshold) {
      for (const tier of tiers) {
        if (quantity > tier.from) {
          const qtyInTier = Math.min(quantity, tier.to) - tier.from;
          total += (qtyInTier / 1000) * tier.ratePerThousand;
        }
      }
    }

    return {
      cost: total,
      isCustomQuote: false,
      displayText: this.formatCurrency(total)
    };
  },

  /**
   * Calculate comprehensive campaign totals including VAT
   * @param {object} params
   * @param {number} params.quantity
   * @param {string} params.designId
   * @param {boolean} params.includePrinting
   * @param {boolean} params.includeDistribution
   * @param {boolean} params.includeVat
   * @returns {object}
   */
  calculateCampaignTotals(params) {
    const quantity = Math.max(0, parseInt(params.quantity, 10) || 0);
    const designCost = this.calculateDesignCost(params.designId);
    const printingCost = this.calculatePrintingCost(quantity, params.includePrinting);
    const distribution = this.calculateDistributionCost(quantity, params.includeDistribution);

    const isDistributionQuote = distribution.isCustomQuote;
    const distributionCost = distribution.cost !== null ? distribution.cost : 0;

    // Subtotal of fixed calculable items
    const subtotalExVat = designCost + printingCost + distributionCost;
    const vatAmount = subtotalExVat * CONFIG.vatRate;
    const totalIncVat = subtotalExVat + vatAmount;

    // Depending on user preference toggle, primary total displays ex-VAT or inc-VAT
    const activeTotal = params.includeVat ? totalIncVat : subtotalExVat;
    const costPerLeafletExVat = quantity > 0 ? subtotalExVat / quantity : 0;
    const costPerLeafletIncVat = quantity > 0 ? totalIncVat / quantity : 0;

    return {
      quantity,
      designCost,
      printingCost,
      distributionCost: distribution.cost,
      distribution,
      isDistributionQuote,
      subtotalExVat,
      vatAmount,
      totalIncVat,
      activeTotal,
      costPerLeafletExVat,
      costPerLeafletIncVat
    };
  }
};

// Freeze Calculator methods
Object.freeze(Calculator);
