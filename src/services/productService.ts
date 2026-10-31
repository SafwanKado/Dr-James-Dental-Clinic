/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DentalProduct } from '../utils/constants';

export const CLINIC_PRODUCTS: DentalProduct[] = [
  {
    id: "prod-whitening-gel",
    name: "Professional Whitening Gel",
    category: "whitening",
    price: 25.00,
    rating: 4.9,
    reviewsCount: 142,
    description: "Prescription-strength whitening gel formulated with potassium nitrate to brighten enamel without thermal sensitivity. Perfect for take-home trays or touch-ups.",
    highlights: [
      "Exact cash price: $25.00",
      "Visibly lifts coffee, wine, and tobacco stains",
      "Enamel-safe desensitizing formulation",
      "Attaches directly to your visit for clinic pickup"
    ],
    inStock: true,
    image: "/src/assets/images/oral_care_products_1793477298218.jpg"
  },
  {
    id: "prod-electric-toothbrush",
    name: "Sonic Electric Toothbrush",
    category: "brushes",
    price: 50.00,
    rating: 4.8,
    reviewsCount: 198,
    description: "Clinic-calibrated sonic motor providing 38,000 gentle micro-vibrations per minute with soft DuPont bristles and built-in 2-minute quadrant timer.",
    highlights: [
      "Exact cash price: $50.00",
      "Gentle on sensitive gingival margins",
      "45-day battery life per USB charge",
      "Includes 2 replaceable precision brush heads"
    ],
    inStock: true,
    image: "/src/assets/images/oral_care_products_1793477298218.jpg"
  },
  {
    id: "prod-sensitivity-toothpaste",
    name: "Sensitivity Toothpaste",
    category: "hygiene",
    price: 12.00,
    rating: 5.0,
    reviewsCount: 230,
    description: "Biomimetic hydroxyapatite formula that seals open dentin tubules to provide instant relief from cold and hot beverages while restoring enamel minerals.",
    highlights: [
      "Exact cash price: $12.00",
      "Relieves exposed nerve sensitivity",
      "Zero SLS, artificial abrasives, or parabens",
      "Refreshing organic peppermint essence"
    ],
    inStock: true,
    image: "/src/assets/images/oral_care_products_1793477298218.jpg"
  },
  {
    id: "prod-antiseptic-rinse",
    name: "Clinical Oral Antiseptic Rinse",
    category: "hygiene",
    price: 15.00,
    rating: 4.7,
    reviewsCount: 84,
    description: "Alcohol-free antimicrobial mouthwash formulated to soothe irritated gums, neutralize volatile sulfur compounds, and promote post-procedure tissue healing.",
    highlights: [
      "Exact cash price: $15.00",
      "Zero burn, zero dry mouth alcohol formula",
      "Protects against plaque bacteria for 12 hours",
      "Approved for post-cleaning recovery"
    ],
    inStock: true,
    image: "/src/assets/images/oral_care_products_1793477298218.jpg"
  },
  {
    id: "prod-silk-floss",
    name: "Expanding Interdental Silk Floss (Pack of 3)",
    category: "hygiene",
    price: 8.00,
    rating: 4.8,
    reviewsCount: 112,
    description: "Natural organic silk fibers coated in coconut wax that expand gently between contacts to sweep out interproximal plaque without fraying or shredding.",
    highlights: [
      "Exact cash price: $8.00",
      "Biodegradable pure silk strands",
      "Infused with natural antiseptic tea tree & mint",
      "Includes 3 pocket spools (90 meters total)"
    ],
    inStock: true,
    image: "/src/assets/images/oral_care_products_1793477298218.jpg"
  },
  {
    id: "prod-nightguard",
    name: "Bruxism Night Guard (Comfort Fit)",
    category: "protection",
    price: 150.00,
    rating: 4.9,
    reviewsCount: 76,
    description: "Dual-layer thermo-adaptive night guard protecting enamel from nocturnal grinding, morning jaw tension, and micro-fractures.",
    highlights: [
      "Exact cash price: $150.00",
      "Soft shock-absorbent inner cushion",
      "Rigid outer bite plate for clenching resistance",
      "Includes sanitizing bath case"
    ],
    inStock: true,
    image: "/src/assets/images/oral_care_products_1793477298218.jpg"
  }
];

