/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DentalService {
  id: string;
  name: string;
  category: 'preventive' | 'cosmetic' | 'restorative' | 'orthodontics' | 'surgical';
  duration: string;
  priceEstimate: string;
  shortDescription: string;
  detailedDescription: string;
  benefits: string[];
  recommendedInterval: string;
}

export interface DentalProduct {
  id: string;
  name: string;
  category: 'whitening' | 'brushes' | 'hygiene' | 'protection';
  price: number;
  rating: number;
  reviewsCount: number;
  description: string;
  highlights: string[];
  inStock: boolean;
  image: string;
}

export const CLINIC_INFO = {
  name: "Dr. James Qado Dental Clinic",
  doctorName: "Dr. James Qado, DDS",
  credentials: "Doctor of Dental Surgery (DDS) · AACD Fellow · 15+ Years Clinical Practice",
  tagline: "Gentle, Precision Dental Medicine & Aesthetic Dentistry",
  phone: "(555) 382-7236",
  emergencyPhone: "(555) 382-9911",
  email: "care@qadodental.com",
  address: "742 Medical Plaza Parkway, Suite 320",
  cityStateZip: "Denver, CO 80202",
  hours: [
    { days: "Monday – Thursday", time: "8:00 AM – 6:00 PM" },
    { days: "Friday", time: "8:00 AM – 4:00 PM" },
    { days: "Saturday", time: "9:00 AM – 2:00 PM (By Appointment)" },
    { days: "Sunday", time: "Emergency Call Service Only" }
  ],
  insuranceAccepted: [
    "Delta Dental Premier",
    "MetLife Dental",
    "Cigna Dental Health",
    "Guardian DentalGuard",
    "Aetna PPO",
    "CareCredit Financing (0% APR available)"
  ]
};

export const DENTAL_SERVICES: DentalService[] = [
  {
    id: "full-exam",
    name: "Full Exam",
    category: "preventive",
    duration: "30 min",
    priceEstimate: "$80",
    shortDescription: "Thorough visual examination, periodontal health check, and personalized oral health assessment with Dr. Qado.",
    detailedDescription: "A comprehensive clinical oral evaluation covering tooth structure, gums, bite alignment, soft tissue pathology, and an oral cancer screening. Dr. Qado reviews findings chairside with high-resolution intraoral cameras.",
    benefits: [
      "Chairside review with high-res intraoral camera",
      "Comprehensive periodontal pocket check",
      "Oral cancer screening included",
      "Transparent treatment roadmap with zero pressure"
    ],
    recommendedInterval: "Every 6 months"
  },
  {
    id: "dental-xrays",
    name: "Dental X-Rays",
    category: "preventive",
    duration: "15 min",
    priceEstimate: "$50",
    shortDescription: "Ultra-low dose digital radiography detecting hidden cavities, bone levels, and root health.",
    detailedDescription: "State-of-the-art digital bitewing and periapical radiographs that produce instant high-definition scans with up to 80% lower radiation than traditional film.",
    benefits: [
      "Ultra-low dose digital sensors",
      "Instant chairside screen display",
      "Detects interproximal micro-cavities",
      "Assesses underlying bone & root integrity"
    ],
    recommendedInterval: "Annually or as clinically indicated"
  },
  {
    id: "teeth-cleaning",
    name: "Teeth Cleaning",
    category: "preventive",
    duration: "45 min",
    priceEstimate: "$90",
    shortDescription: "Gentle ultrasonic plaque removal, thorough scaling, and enamel-smoothing polish.",
    detailedDescription: "A gentle professional dental prophylaxis utilizing warm piezoelectric scaling to eliminate tartar, plaque, and surface coffee/tea stains without abrasive scraping pressure.",
    benefits: [
      "Lukewarm piezoelectric ultrasonic scaling",
      "Removes stubborn calculus and stains",
      "Enamel-smoothing micro-polishing paste",
      "Leaves breath fresh and gums revitalized"
    ],
    recommendedInterval: "Every 6 months"
  },
  {
    id: "teeth-whitening",
    name: "Teeth Whitening",
    category: "cosmetic",
    duration: "60 min",
    priceEstimate: "$200",
    shortDescription: "Clinical-grade in-office light-activated whitening lifting shades quickly and safely.",
    detailedDescription: "Professional concentration whitening gel activated by gentle cold-LED illumination. Formulated with potassium nitrate to protect enamel and prevent tooth sensitivity while lifting deep stains.",
    benefits: [
      "Brightens teeth up to 6–8 shades in one visit",
      "Desensitizing barrier protects delicate gums",
      "Even, luminous, natural brightness",
      "Safe, enamel-tested dental formula"
    ],
    recommendedInterval: "Once a year or pre-special occasions"
  }
];

