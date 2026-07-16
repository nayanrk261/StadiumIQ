import { Zone, VenueInfo, CrowdAlert, Incident } from './db.js';

export const mockZones = [
  { zoneId: 'gate-a', name: 'Gate A (North Entrance)', capacity: 8000, currentCount: 1200, status: 'Normal', category: 'Gate' },
  { zoneId: 'gate-b', name: 'Gate B (North-East Entrance)', capacity: 8000, currentCount: 6800, status: 'Warning', category: 'Gate' },
  { zoneId: 'gate-c', name: 'Gate C (East Entrance)', capacity: 6000, currentCount: 950, status: 'Normal', category: 'Gate' },
  { zoneId: 'gate-d', name: 'Gate D (South-East Entrance)', capacity: 6000, currentCount: 4800, status: 'Warning', category: 'Gate' },
  { zoneId: 'gate-e', name: 'Gate E (South Entrance)', capacity: 8000, currentCount: 1400, status: 'Normal', category: 'Gate' },
  { zoneId: 'gate-f', name: 'Gate F (South-West Entrance)', capacity: 8000, currentCount: 7400, status: 'Danger', category: 'Gate' },
  { zoneId: 'gate-g', name: 'Gate G (West Entrance)', capacity: 6000, currentCount: 1100, status: 'Normal', category: 'Gate' },
  { zoneId: 'gate-h', name: 'Gate H (North-West Entrance)', capacity: 6000, currentCount: 3100, status: 'Normal', category: 'Gate' },
  
  { zoneId: 'concourse-l1-east', name: 'Concourse Level 1 East', capacity: 15000, currentCount: 9500, status: 'Normal', category: 'Concourse' },
  { zoneId: 'concourse-l1-west', name: 'Concourse Level 1 West', capacity: 15000, currentCount: 13500, status: 'Warning', category: 'Concourse' },
  { zoneId: 'concourse-l2-north', name: 'Concourse Level 2 North', capacity: 12000, currentCount: 4500, status: 'Normal', category: 'Concourse' },
  { zoneId: 'concourse-l2-south', name: 'Concourse Level 2 South', capacity: 12000, currentCount: 10800, status: 'Warning', category: 'Concourse' },
  
  { zoneId: 'section-101-104', name: 'Sections 101-104 (Lower Tier)', capacity: 4500, currentCount: 1800, status: 'Normal', category: 'Section' },
  { zoneId: 'section-105-108', name: 'Sections 105-108 (Lower Tier)', capacity: 4500, currentCount: 4200, status: 'Warning', category: 'Section' },
  { zoneId: 'section-109-112', name: 'Sections 109-112 (Lower Tier)', capacity: 4500, currentCount: 3100, status: 'Normal', category: 'Section' },
  { zoneId: 'section-113-116', name: 'Sections 113-116 (Lower Tier)', capacity: 4500, currentCount: 4400, status: 'Danger', category: 'Section' },
  
  { zoneId: 'section-201-206', name: 'Sections 201-206 (Upper Tier)', capacity: 5000, currentCount: 2200, status: 'Normal', category: 'Section' },
  { zoneId: 'section-207-212', name: 'Sections 207-212 (Upper Tier)', capacity: 5000, currentCount: 4950, status: 'Danger', category: 'Section' },

  { zoneId: 'food-stall-east', name: 'Concourse East Food Court', capacity: 2500, currentCount: 1200, status: 'Normal', category: 'FoodStall' },
  { zoneId: 'food-stall-west', name: 'Concourse West Food Court', capacity: 2500, currentCount: 2350, status: 'Warning', category: 'FoodStall' },
  { zoneId: 'merch-megastore', name: 'World Cup Merch Megastore', capacity: 1800, currentCount: 1720, status: 'Danger', category: 'FoodStall' }
];

export const mockVenueInfo = [
  {
    type: 'schedule',
    data: {
      stadium: 'MetLife Stadium, NYNJ / FIFA World Cup 2026 Host Venue',
      matches: [
        { matchId: 'm1', teams: 'Mexico vs Argentina', date: '2026-06-18', time: '18:00 Local', gatesOpen: '15:00', type: 'Group Stage' },
        { matchId: 'm2', teams: 'USA vs England', date: '2026-06-21', time: '20:00 Local', gatesOpen: '17:00', type: 'Group Stage' },
        { matchId: 'm3', teams: 'Canada vs Spain', date: '2026-06-25', time: '16:00 Local', gatesOpen: '13:00', type: 'Group Stage' },
        { matchId: 'm4', teams: 'Round of 16 Match', date: '2026-06-30', time: '19:00 Local', gatesOpen: '16:00', type: 'Knockout' },
        { matchId: 'm5', teams: 'FIFA World Cup 2026 Final', date: '2026-07-19', time: '19:00 Local', gatesOpen: '15:00', type: 'Final' }
      ]
    }
  },
  {
    type: 'gates',
    data: {
      rules: [
        { topic: 'Banned Items', info: 'Bags larger than A4 size, umbrellas, selfie sticks, laser pointers, outside food and drinks, glass containers.' },
        { topic: 'Security Scan', info: 'Every attendee must pass through metal detectors. Keep digital ticket barcode ready on your mobile device.' },
        { topic: 'Re-entry', info: 'Re-entry is strictly prohibited once your mobile ticket is scanned.' }
      ],
      gateAssignments: [
        { name: 'Gate A & H', sections: 'Sections 101-105, 201-205' },
        { name: 'Gate B & C', sections: 'Sections 106-110, 206-210' },
        { name: 'Gate D & E', sections: 'Sections 111-115, 211-215' },
        { name: 'Gate F & G', sections: 'Sections 116-120, 216-220' }
      ]
    }
  },
  {
    type: 'amenities',
    data: {
      restrooms: [
        { location: 'Concourse Level 1 East (near Section 106)', accessible: true },
        { location: 'Concourse Level 1 West (near Section 118)', accessible: true },
        { location: 'Concourse Level 2 North (near Section 203)', accessible: false },
        { location: 'Concourse Level 2 South (near Section 215)', accessible: true }
      ],
      firstAid: [
        { location: 'Medical Clinic 1: Gate A Entrance (Level 0)', equipment: 'Full Trauma Response' },
        { location: 'Medical Clinic 2: Concourse West Level 1 (near Section 112)', equipment: 'Basic First Aid & Defibrillator' }
      ],
      foodCourts: [
        { name: 'East Food Court', styles: 'International, Halal, Mexican Tacos, Beverages' },
        { name: 'West Food Court', styles: 'Burgers, Hot Dogs, Pizza, Vegan selections, Sodas' }
      ]
    }
  }
];

export async function seedDatabase() {
  console.log(' [36m[Seed] Seeding database collections... [0m');
  
  await Zone.deleteMany({});
  await VenueInfo.deleteMany({});
  await CrowdAlert.deleteMany({});
  await Incident.deleteMany({});

  for (const zoneData of mockZones) {
    await Zone.create(zoneData);
  }

  for (const infoData of mockVenueInfo) {
    await VenueInfo.create(infoData);
  }

  console.log(' [32m[Seed] Database seeded successfully! [0m');
}
