// Firestore Seed Script — Populates services, projects, testimonials collections
// with data from the existing frontend website.
//
// HOW TO USE:
// 1. Open admin.html?seed=1 in browser, log in as admin
// 2. The script runs automatically after auth succeeds
// 3. Wait for "Seed complete!" message in console (F12)
// 4. Navigate to Services/Projects/Testimonials to see the data

import { db } from "./firebase-config.js";
import {
  collection, addDoc, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ─────────────────────────────────────────────────────────────────────────
// SERVICES DATA (from services.html)
// ─────────────────────────────────────────────────────────────────────────
const SERVICES = [
  {
    title: "Pressure Vessels & Heat Exchangers",
    slug: "pressure-vessels-heat-exchangers",
    category: "Pressure & Heat Transfer",
    summary: "ASME and IBR-compliant pressure vessels, shell & tube and plate heat exchangers, calandrias, and calciners engineered for demanding process conditions.",
    description: "ASME and IBR-compliant pressure vessels, shell & tube and plate heat exchangers, calandrias, and calciners engineered for demanding process conditions.",
    image: "img/manufacturing/service-pressure-vessel.jpg",
    features: [],
    is_featured: true,
    order: 1
  },
  {
    title: "Industrial Drying & Heating Systems",
    slug: "industrial-drying-heating-systems",
    category: "Drying & Heating",
    summary: "Rotary, paddle, sludge, spray, and drum dryers plus air pre-heaters and evaporation systems for efficient solid and thermal processing.",
    description: "Rotary, paddle, sludge, spray, and drum dryers plus air pre-heaters and evaporation systems for efficient solid and thermal processing.",
    image: "img/manufacturing/service-dryer.jpg",
    features: [],
    is_featured: true,
    order: 2
  },
  {
    title: "Reactors, Columns & Storage Tanks",
    slug: "reactors-columns-storage-tanks",
    category: "Reactors & Columns",
    summary: "Custom reactors, distillation columns, cladded vessels, and storage tanks fabricated in SS, duplex, and exotic alloys for chemical and pharma processes.",
    description: "Custom reactors, distillation columns, cladded vessels, and storage tanks fabricated in SS, duplex, and exotic alloys for chemical and pharma processes.",
    image: "img/manufacturing/service-reactor.jpg",
    features: [],
    is_featured: true,
    order: 3
  },
  {
    title: "Skid Packages & Process Piping",
    slug: "skid-packages-process-piping",
    category: "Modular Systems",
    summary: "Pre-engineered modular skids, process and pressure piping, sterile piping, and structural engineering for fast-track plant installations.",
    description: "Pre-engineered modular skids, process and pressure piping, sterile piping, and structural engineering for fast-track plant installations.",
    image: "img/manufacturing/service-skid.jpg",
    features: [],
    is_featured: false,
    order: 4
  },
  {
    title: "Turnkey Project Execution",
    slug: "turnkey-project-execution",
    category: "Turnkey Projects",
    summary: "End-to-end project delivery covering design, manufacturing, supply, erection, and commissioning for large-scale industrial installations.",
    description: "End-to-end project delivery covering design, manufacturing, supply, erection, and commissioning for large-scale industrial installations.",
    image: "img/manufacturing/service-heat-exchanger.jpg",
    features: [],
    is_featured: true,
    order: 5
  },
  {
    title: "Maintenance & Revamping",
    slug: "maintenance-revamping",
    category: "Maintenance",
    summary: "Annual maintenance contracts, plant shutdowns, relocations, and revamping services that keep your facility running at peak efficiency.",
    description: "Annual maintenance contracts, plant shutdowns, relocations, and revamping services that keep your facility running at peak efficiency.",
    image: "img/manufacturing/service-maintenance.jpg",
    features: [],
    is_featured: false,
    order: 6
  }
];

// ─────────────────────────────────────────────────────────────────────────
// TESTIMONIALS DATA (from index.html)
// ─────────────────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    author_name: "Rajesh Menon",
    author_role: "Plant Head, Chemicals",
    author_company: "",
    author_image: "67512b0c631970a86b689dc8/avatar-anonymous.svg",
    body: "HI-NOVA APEX delivered our paddle dryer system on schedule and to exact specification. Their engineering team understood our process requirements and the build quality was excellent.",
    rating: 5,
    is_featured: true,
    order: 1
  },
  {
    author_name: "Anita Deshpande",
    author_role: "Project Manager, Pharma",
    author_company: "",
    author_image: "67512b0c631970a86b689dc8/avatar-anonymous.svg",
    body: "We trusted HI-NOVA with SS316L reactors for a pharmaceutical project. The fabrication, documentation, and IBR compliance were handled professionally from start to commissioning.",
    rating: 5,
    is_featured: true,
    order: 2
  },
  {
    author_name: "Sanjay Kulkarni",
    author_role: "Engineering Lead, Refinery",
    author_company: "",
    author_image: "67512b0c631970a86b689dc8/avatar-anonymous.svg",
    body: "From heat exchangers to skid-mounted piping, HI-NOVA APEX has been a dependable partner for our refinery projects. Their turnkey execution saved us significant downtime.",
    rating: 5,
    is_featured: true,
    order: 3
  }
];

// ─────────────────────────────────────────────────────────────────────────
// PROJECTS DATA (from projects.html + index.html showcase)
// ─────────────────────────────────────────────────────────────────────────
const PROJECTS = [
  {
    title: "Metal Production",
    slug: "metal-production",
    category: "Process Equipment",
    client: "",
    location: "",
    year: "",
    summary: "Complete process equipment installation for metal production facility.",
    description: "Design, fabrication, and installation of process equipment including pressure vessels, heat exchangers, and piping systems for a metal production facility.",
    image: "67512b0c631970a86b689e0a/6763e5627b847d57c22393c0_project-img-01.jpg",
    gallery: [],
    is_featured: true,
    order: 1
  },
  {
    title: "Manufacturing",
    slug: "manufacturing",
    category: "Heavy Fabrication",
    client: "",
    location: "",
    year: "",
    summary: "Heavy fabrication project for industrial manufacturing facility.",
    description: "Heavy fabrication and assembly of structural and process components for an industrial manufacturing facility.",
    image: "67512b0c631970a86b689e0a/6763e57182f8fe13c7d4bbd8_project-img-02.jpg",
    gallery: [],
    is_featured: true,
    order: 2
  },
  {
    title: "Energy Power Project",
    slug: "energy-power-project",
    category: "Thermal Systems",
    client: "",
    location: "",
    year: "",
    summary: "Thermal systems design and installation for power generation.",
    description: "Engineering and execution of thermal systems including boilers, heat exchangers, and piping for a power generation project.",
    image: "67512b0c631970a86b689e0a/6763e581b78254d8de5d2c74_project-img-03.jpg",
    gallery: [],
    is_featured: true,
    order: 3
  },
  {
    title: "Factory Remodeling",
    slug: "factory-remodeling",
    category: "Modular Skids",
    client: "",
    location: "",
    year: "",
    summary: "Modular skid packages for factory remodeling project.",
    description: "Design and supply of pre-engineered modular skid packages for a factory remodeling project.",
    image: "67512b0c631970a86b689e0a/6763e58f9cd0a3e0d991fbda_project-img-04.jpg",
    gallery: [],
    is_featured: false,
    order: 4
  },
  {
    title: "Warehouse Support",
    slug: "warehouse-support",
    category: "Project Execution",
    client: "",
    location: "",
    year: "",
    summary: "Structural and process support systems for warehouse facility.",
    description: "Complete project execution including structural engineering, process piping, and equipment installation for a warehouse support facility.",
    image: "67512b0c631970a86b689e0a/6760f71bd10487514f7e6d11_port-08.jpg",
    gallery: [],
    is_featured: false,
    order: 5
  },
  {
    title: "Finishing & Coating",
    slug: "finishing-coating",
    category: "Drying & Solid Processing",
    client: "",
    location: "",
    year: "",
    summary: "Drying and coating systems for finishing line.",
    description: "Engineering and supply of drying and coating equipment for an industrial finishing and coating line.",
    image: "67512b0c631970a86b689e0a/6763e5baf5e766a22f5b0b39_project-img-07.jpg",
    gallery: [],
    is_featured: false,
    order: 6
  },
  {
    title: "Chemical Refinery",
    slug: "chemical-refinery",
    category: "Process Equipment",
    client: "",
    location: "",
    year: "",
    summary: "Process equipment for chemical refinery operations.",
    description: "Design, fabrication, and installation of process equipment for a chemical refinery.",
    image: "67512b0c631970a86b689e0a/6763e5ae545d4034af000de4_project-img-06.jpg",
    gallery: [],
    is_featured: true,
    order: 7
  },
  {
    title: "Thermal Processing",
    slug: "thermal-processing",
    category: "Thermal Systems",
    client: "",
    location: "",
    year: "",
    summary: "Thermal processing systems for industrial applications.",
    description: "Engineering and execution of thermal processing systems including furnaces, ovens, and heat treatment equipment.",
    image: "67512b0c631970a86b689e0a/6763e59da0e4de8b4c4cfc9d_project-img-05.jpg",
    gallery: [],
    is_featured: false,
    order: 8
  },
  {
    title: "VA Tech Wabag -- Process Skids",
    slug: "va-tech-wabag-process-skids",
    category: "Oil & Gas / Desalination",
    client: "VA Tech Wabag",
    location: "",
    year: "",
    summary: "16 process skids with piping, valves & instruments, 20,000 inch-dia process piping, 8 storage tanks and 100 SS piping spools.",
    description: "Design, fabrication, and supply of 16 process skids with complete piping, valves, and instruments. Included 20,000 inch-diameter process piping, 8 storage tanks, and 100 SS piping spools for a desalination project.",
    image: "67512b0c631970a86b689e0a/6763dc88e56d6870c57c4559_project-img-001.jpg",
    gallery: [],
    is_featured: true,
    order: 9
  },
  {
    title: "Thermax -- 300 TPH Boiler Project",
    slug: "thermax-300-tph-boiler-project",
    category: "Power",
    client: "Thermax",
    location: "Mithapur",
    year: "",
    summary: "4 pressure sand filter vessels & 4 activated carbon filter vessels for the 300 TPH boiler & turbine generator project at Mithapur.",
    description: "Fabrication and supply of 4 pressure sand filter vessels and 4 activated carbon filter vessels for the 300 TPH boiler and turbine generator project at Mithapur.",
    image: "67512b0c631970a86b689e0a/6763dc94a00cc2543f78e360_project-img-002.jpg",
    gallery: [],
    is_featured: true,
    order: 10
  },
  {
    title: "Olon API India -- SS316L Reactors",
    slug: "olon-api-india-ss316l-reactors",
    category: "Pharmaceutical",
    client: "Olon API India",
    location: "Mahad",
    year: "",
    summary: "2KL, 4KL & 6KL SS316L reactors with interconnecting site piping at Mahad.",
    description: "Design, fabrication, and installation of 2KL, 4KL, and 6KL SS316L reactors with interconnecting site piping for pharmaceutical manufacturing at Mahad.",
    image: "67512b0c631970a86b689e0a/6763dcb19c81e80aad55612b_project-img-003.jpg",
    gallery: [],
    is_featured: true,
    order: 11
  }
];

// ─────────────────────────────────────────────────────────────────────────
// SEED FUNCTION
// ─────────────────────────────────────────────────────────────────────────
async function seedCollection(name, items) {
  const existing = await getDocs(collection(db, name));
  if (!existing.empty) {
    console.log('⏭️  ' + name + ': already has ' + existing.size + ' documents, skipping.');
    return { added: 0, skipped: existing.size };
  }

  let added = 0;
  for (const item of items) {
    await addDoc(collection(db, name), item);
    added++;
  }
  console.log('✅ ' + name + ': added ' + added + ' documents.');
  return { added: added, skipped: 0 };
}

// ─────────────────────────────────────────────────────────────────────────
// RUN (only when loaded via admin.html?seed=1)
// ─────────────────────────────────────────────────────────────────────────
if (window.location.search.includes('seed=1')) {
  console.log('🌱 Seed script loaded. Running in 3 seconds (waiting for auth)...');

  setTimeout(async function () {
    console.log('🌱 Starting Firestore seed...\n');

    try {
      const results = {};
      results.services = await seedCollection('services', SERVICES);
      results.projects = await seedCollection('projects', PROJECTS);
      results.testimonials = await seedCollection('testimonials', TESTIMONIALS);

      console.log('\n📊 Summary:');
      console.log('   Services:      ' + results.services.added + ' added, ' + results.services.skipped + ' skipped');
      console.log('   Projects:      ' + results.projects.added + ' added, ' + results.projects.skipped + ' skipped');
      console.log('   Testimonials:  ' + results.testimonials.added + ' added, ' + results.testimonials.skipped + ' skipped');
      console.log('\n🎉 Seed complete! Navigate to Services/Projects/Testimonials in the admin panel.');
    } catch (err) {
      console.error('❌ Seed failed:', err);
      console.error('Make sure you are logged in as admin@hinovaapex.com');
    }
  }, 3000);
}
