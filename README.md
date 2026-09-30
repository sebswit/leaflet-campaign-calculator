# Leaflet Campaign Calculator

A lightweight, modern web application built for UK marketing agencies to estimate leaflet campaign costs (Design, Print, and Door-to-Door Distribution).

---

## 🚀 How to Run Locally

Because this project is built with zero dependencies (pure HTML5, CSS3, and modern JavaScript), you can run it immediately without installing `node_modules`.

### Option 1: Open Directly in Browser
Simply double-click `index.html` or drag it into any modern web browser (Chrome, Edge, Safari, Firefox).

### Option 2: Using Local Python Server (Recommended)
Open PowerShell or Terminal in the project root:
```powershell
python -m http.server 8000
```
Then visit: [`http://localhost:8000`](http://localhost:8000)

---

## ⚙️ How to Edit Pricing Rates & Constants

All pricing rates, tiers, and campaign constants are centralized in **[`js/config.js`](js/config.js)**. 

### 1. Leaflet Design Prices
To change design service names or fees, edit the `designOptions` array:
```javascript
designOptions: [
  { id: 'supplied', title: 'Customer supplies print-ready artwork', price: 0 },
  { id: 'check',    title: 'Artwork check and print preparation',  price: 45 },
  { id: 'simple',   title: 'Simple design using customer materials', price: 99 },
  { id: 'campaign', title: 'Campaign Design',                      price: 149 }
]
```

### 2. Print Prices (Temporary Editable Prices)
To adjust the baseline printing production costs for standard quantities, update `presetPrices`:
```javascript
presetPrices: {
  500: 42.00,
  1000: 62.00,
  2500: 108.00,
  5000: 175.00
}
```
Custom quantities use the volume discount curve in `customUnitRates`.

### 3. Distribution Pricing (Progressive Tiered Model)
Distribution is priced progressively using brackets:
* **Up to 1,000 leaflets:** Minimum delivery charge of **£139.00**
* **1,001 to 2,500 leaflets:** **£119.00** per 1,000 for quantity above 1,000
* **2,501 to 5,000 leaflets:** **£99.00** per 1,000 for quantity above 2,500
* **5,001 to 10,000 leaflets:** **£85.00** per 1,000 for quantity above 5,000
* **Above 10,000 leaflets:** Automatically displays **"Request a quote"**

To update rates or thresholds, edit the clearly labelled `distribution` section in `js/config.js`:
```javascript
distribution: {
  baseThreshold: 1000,
  baseMinimumCharge: 139.00,
  tiers: [
    { from: 1000, to: 2500,  ratePerThousand: 119.00 },
    { from: 2500, to: 5000,  ratePerThousand: 99.00 },
    { from: 5000, to: 10000, ratePerThousand: 85.00 }
  ],
  maxAutomaticThreshold: 10000,
  customQuoteText: 'Request a quote'
}
```

### 4. UK VAT Rate
Standard UK VAT is configured as `0.20` (20%):
```javascript
vatRate: 0.20
```

---

## 💡 Features

- **Reactive Calculations**: Updates live as you click presets, change custom volume, switch design tiers, or toggle print/distribution services.
- **Ex. VAT by Default with Inc. VAT Toggle**: Toggle between Ex. VAT and Inc. 20% VAT in the top header.
- **📋 Quick Copy Quote**: One-click button copies a formatted, client-ready campaign breakdown directly to your clipboard.
- **🖨️ Print & PDF Ready**: Clean print stylesheet automatically hides controls and formats the estimate for PDF client proposals.
- **Cost per Leaflet Metric**: Shows unit economy (e.g. `10.7p per leaflet`).
- **Responsive Design**: Polished experience on mobile, tablet, and desktop.
