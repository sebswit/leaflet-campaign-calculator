/**
 * Leaflet Campaign Calculator - Pricing Configuration
 * 
 * All pricing rates and campaign constants are stored here.
 * Agency team members can edit values in this file to update pricing.
 */

const CONFIG = {
  // Currency settings
  currency: {
    code: 'GBP',
    symbol: '£',
    locale: 'en-GB'
  },

  // UK Standard VAT Rate (20%)
  vatRate: 0.20,

  // Quantity preset options
  quantityPresets: [500, 1000, 2500, 5000],
  defaultQuantity: 1000,
  minCustomQuantity: 100,
  maxCustomQuantity: 250000,

  // Leaflet Design tiers
  designOptions: [
    {
      id: 'supplied',
      title: 'Customer supplies print-ready artwork',
      description: 'Client provides high-resolution, print-ready PDF with bleed & trim marks.',
      price: 0
    },
    {
      id: 'check',
      title: 'Artwork check and print preparation',
      description: 'Pre-flight file verification, resolution, bleed adjustment, and colour conversion.',
      price: 45
    },
    {
      id: 'simple',
      title: 'Simple design using customer materials',
      description: 'Clean layout creation using your supplied logo, images, and drafted text.',
      price: 99
    },
    {
      id: 'campaign',
      title: 'Campaign Design',
      description: 'Bespoke strategic marketing design, headline styling, and conversion layout.',
      price: 149
    }
  ],
  defaultDesignId: 'supplied',

  // Printing Configuration
  printing: {
    defaultIncluded: true,
    specificationNote: 'Standard A5, Double-Sided, 170gsm Silk Paper',
    
    // Baseline prices for standard preset quantities (temporary editable prices)
    presetPrices: {
      500: 42.00,
      1000: 62.00,
      2500: 108.00,
      5000: 175.00
    },

    // Tier-based pricing formula used for custom quantities
    // If a custom quantity is entered, calculate based on volume tier rates:
    customUnitRates: {
      below500MinCost: 42.00,       // Minimum print run cost
      rate500To1000: 0.040,         // £40 per additional 1,000 between 500 and 1,000
      rate1000To2500: 0.0307,       // £30.70 per additional 1,000 between 1,000 and 2,500
      rate2500To5000: 0.0268,       // £26.80 per additional 1,000 between 2,500 and 5,000
      rateAbove5000: 0.0220         // £22.00 per additional 1,000 above 5,000
    }
  },

  // =========================================================================
  // DISTRIBUTION PRICING CONSTANTS (Progressive Tiered Model)
  // Edit base delivery charge, tier brackets, rates, and quote thresholds here
  // =========================================================================
  distribution: {
    defaultIncluded: true,
    description: 'Targeted door-to-door delivery',

    // Up to 1,000 leaflets: minimum delivery charge
    baseThreshold: 1000,
    baseMinimumCharge: 139.00,

    // Progressive tiers: rate applied only to quantity within each bracket
    tiers: [
      {
        from: 1000,
        to: 2500,
        ratePerThousand: 119.00 // £119 per 1,000 for quantity above 1,000 up to 2,500
      },
      {
        from: 2500,
        to: 5000,
        ratePerThousand: 99.00  // £99 per 1,000 for quantity above 2,500 up to 5,000
      },
      {
        from: 5000,
        to: 10000,
        ratePerThousand: 85.00  // £85 per 1,000 for quantity above 5,000 up to 10,000
      }
    ],

    // Maximum automatic calculation limit; above this threshold prompt for quote
    maxAutomaticThreshold: 10000,
    customQuoteText: 'Request a quote'
  }
};

// Freeze configuration to prevent accidental runtime mutation
Object.freeze(CONFIG);
