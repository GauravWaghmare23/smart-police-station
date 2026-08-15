// Seed script for Smart Police Station – Nagpur synthetic demo data
//
// SYNTHETIC HACKATHON DEMO DATA ONLY.
// These incidents, locations, names, counts and hotspot patterns do not represent
// actual Nagpur crime statistics or real incidents.

import { connectDB } from '../config/database.js';
import User from '../models/User.js';
import PoliceStation from '../models/PoliceStation.js';
import PoliceOfficer from '../models/PoliceOfficer.js';
import Complaint from '../models/Complaint.js';
import FIR from '../models/FIR.js';
import SOS from '../models/SOS.js';

import {
  ROLES,
  USER_STATUS,
  DUTY_STATUS,
  OFFICER_RANKS,
  CRIME_TYPES,
  COMPLAINT_PRIORITY,
  COMPLAINT_STATUS,
  FIR_STATUS,
  SOS_STATUS
} from '../utils/constants.js';

import { generateUniqueId } from '../utils/generateId.js';


// ============================================================
// HELPERS
// ============================================================

const randomOffset = (base, range = 0.01) => {
  return base + (Math.random() - 0.5) * range;
};

const randomPhone = (prefix = '98811') => {
  return `${prefix}${String(Math.floor(10000 + Math.random() * 90000)).slice(0, 5)}`;
};

const randomItem = (items) => {
  return items[Math.floor(Math.random() * items.length)];
};


// ============================================================
// VALIDATE CONSTANTS BEFORE SEEDING
// ============================================================

const validateSeedConstants = () => {
  const requiredCrimeTypes = [
    'THEFT',
    'ASSAULT',
    'FRAUD',
    'CYBER_CRIME',
    'VANDALISM',
    'TRAFFIC',
    'HARASSMENT',
    'MISSING_PERSON',
    'OTHER'
  ];

  const requiredComplaintStatuses = [
    'SUBMITTED',
    'UNDER_REVIEW',
    'ASSIGNED',
    'INVESTIGATION',
    'FIR_REGISTERED',
    'RESOLVED',
    'REJECTED'
  ];

  const requiredFIRStatuses = [
    'REGISTERED',
    'UNDER_INVESTIGATION',
    'CLOSED'
  ];

  const requiredSOSStatuses = [
    'ACTIVE',
    'ACKNOWLEDGED',
    'DISPATCHED',
    'RESOLVED',
    'ESCALATED'
  ];

  for (const key of requiredCrimeTypes) {
    if (!CRIME_TYPES[key]) {
      throw new Error(
        `Missing CRIME_TYPES.${key} in constants.js`
      );
    }
  }

  for (const key of requiredComplaintStatuses) {
    if (!COMPLAINT_STATUS[key]) {
      throw new Error(
        `Missing COMPLAINT_STATUS.${key} in constants.js`
      );
    }
  }

  for (const key of requiredFIRStatuses) {
    if (!FIR_STATUS[key]) {
      throw new Error(
        `Missing FIR_STATUS.${key} in constants.js`
      );
    }
  }

  for (const key of requiredSOSStatuses) {
    if (!SOS_STATUS[key]) {
      throw new Error(
        `Missing SOS_STATUS.${key} in constants.js`
      );
    }
  }

  console.log('Seed constants validated successfully.');
};


// ============================================================
// MAIN SEED FUNCTION
// ============================================================

const seedData = async () => {
  await connectDB();

  try {
    validateSeedConstants();

    // ========================================================
    // CLEAN EXISTING OPERATIONAL DATA
    // ========================================================

    console.log(
      'Cleaning up existing operational data for clean seed...'
    );

    await Complaint.deleteMany({});
    await FIR.deleteMany({});
    await SOS.deleteMany({});
    await PoliceOfficer.deleteMany({});
    await PoliceStation.deleteMany({});

    // Keep CONTROL_ROOM_ADMIN
    await User.deleteMany({
      role: { $ne: ROLES.CONTROL_ROOM_ADMIN }
    });

    // ========================================================
    // POLICE STATIONS
    // ========================================================

    console.log('Seeding Nagpur Police Stations...');

    const stationsData = [
      {
        name: 'Sitabuldi Police Station',
        stationCode: 'SIT-NGP',
        address: 'Sitabuldi, Nagpur, Maharashtra',
        phone: '0712-2540001',
        location: {
          latitude: 21.1443,
          longitude: 79.08034
        }
      },

      {
        name: 'Ajni Police Station',
        stationCode: 'AJN-NGP',
        address: 'Ajni, Nagpur, Maharashtra',
        phone: '0712-2540002',
        location: {
          latitude: 21.12303,
          longitude: 79.09748
        }
      },

      {
        name: 'Ambazari Police Station',
        stationCode: 'AMB-NGP',
        address: 'Ambazari, Nagpur, Maharashtra',
        phone: '0712-2540003',
        location: {
          latitude: 21.14859,
          longitude: 79.05538
        }
      },

      {
        name: 'Dhantoli Police Station',
        stationCode: 'DHA-NGP',
        address: 'Dhantoli, Nagpur, Maharashtra',
        phone: '0712-2540004',
        location: {
          latitude: 21.13739,
          longitude: 79.08536
        }
      },

      {
        name: 'Ganeshpeth Police Station',
        stationCode: 'GAN-NGP',
        address: 'Ganeshpeth, Nagpur, Maharashtra',
        phone: '0712-2540005',
        location: {
          latitude: 21.14271,
          longitude: 79.10080
        }
      },

      {
        name: 'Nandanvan Police Station',
        stationCode: 'NAN-NGP',
        address: 'Nandanvan, Nagpur, Maharashtra',
        phone: '0712-2540006',
        location: {
          latitude: 21.13691,
          longitude: 79.12206
        }
      },

      {
        name: 'Sadar Police Station',
        stationCode: 'SAD-NGP',
        address: 'Sadar, Nagpur, Maharashtra',
        phone: '0712-2540007',
        location: {
          latitude: 21.16303,
          longitude: 79.07954
        }
      },

      {
        name: 'Rana Pratap Nagar Police Station',
        stationCode: 'RPN-NGP',
        address: 'Rana Pratap Nagar, Nagpur, Maharashtra',
        phone: '0712-2540008',
        location: {
          latitude: 21.11554,
          longitude: 79.03983
        }
      },

      {
        name: 'Lakadganj Police Station',
        stationCode: 'LAK-NGP',
        address: 'Lakadganj, Nagpur, Maharashtra',
        phone: '0712-2540009',
        location: {
          latitude: 21.15406,
          longitude: 79.12104
        }
      }
    ];

    const stations = await PoliceStation.insertMany(
      stationsData
    );

    console.log(
      `${stations.length} police stations seeded.`
    );


    // ========================================================
    // OFFICERS
    // ========================================================

    console.log('Seeding officers...');

    const officerMap = {};

    const createOfficer = async (
      name,
      email,
      phone,
      badgeNumber,
      rank,
      role,
      station,
      dutyStatus = DUTY_STATUS.AVAILABLE
    ) => {
      const user = await User.create({
        name,
        email,
        phone,
        password: 'password123',
        role,
        status: USER_STATUS.ACTIVE
      });

      const officer = await PoliceOfficer.create({
        userId: user._id,
        stationId: station._id,
        badgeNumber,
        rank,
        role,
        dutyStatus,

        currentLocation: {
          latitude: randomOffset(
            station.location.latitude,
            0.008
          ),

          longitude: randomOffset(
            station.location.longitude,
            0.008
          )
        },

        lastLocationUpdate: new Date()
      });

      return {
        user,
        officer
      };
    };


    for (let i = 0; i < stations.length; i++) {
      const station = stations[i];

      const shortName = station.name
        .replace(' Police Station', '')
        .replace(/\s+/g, '')
        .toLowerCase();

      const index = i + 1;

      // ------------------------------
      // Station Head
      // ------------------------------

      const head = await createOfficer(
        `Inspector Head ${index}`,
        `${shortName}.head@smartpolice.local`,
        `98765${String(40000 + index).slice(-5)}`,
        `BADGE${String(index).padStart(2, '0')}01`,
        OFFICER_RANKS.INSPECTOR,
        ROLES.STATION_HEAD,
        station,
        DUTY_STATUS.ON_DUTY
      );


      // ------------------------------
      // Investigating Officer
      // ------------------------------

      const inv = await createOfficer(
        `Sub-Inspector Investigator ${index}`,
        `${shortName}.inv@smartpolice.local`,
        `98765${String(41000 + index).slice(-5)}`,
        `BADGE${String(index).padStart(2, '0')}02`,
        OFFICER_RANKS.SUB_INSPECTOR,
        ROLES.INVESTIGATING_OFFICER,
        station,
        DUTY_STATUS.AVAILABLE
      );


      // ------------------------------
      // Field Officer 1
      // ------------------------------

      const field1 = await createOfficer(
        `Constable Field ${index}A`,
        `${shortName}.field1@smartpolice.local`,
        `98765${String(42000 + index).slice(-5)}`,
        `BADGE${String(index).padStart(2, '0')}03`,
        OFFICER_RANKS.CONSTABLE,
        ROLES.FIELD_OFFICER,
        station,
        DUTY_STATUS.AVAILABLE
      );


      // ------------------------------
      // Field Officer 2
      // ------------------------------

      const field2 = await createOfficer(
        `Constable Field ${index}B`,
        `${shortName}.field2@smartpolice.local`,
        `98765${String(43000 + index).slice(-5)}`,
        `BADGE${String(index).padStart(2, '0')}04`,
        OFFICER_RANKS.CONSTABLE,
        ROLES.FIELD_OFFICER,
        station,
        i % 3 === 0
          ? DUTY_STATUS.BUSY
          : DUTY_STATUS.AVAILABLE
      );


      // Save Station Head

      station.stationHeadId = head.user._id;

      await station.save();


      officerMap[station.stationCode] = {
        head,
        inv,
        field1,
        field2
      };
    }

    console.log(
      `${stations.length * 4} officers seeded.`
    );


    // ========================================================
    // CITIZENS
    // ========================================================

    console.log('Seeding citizens...');

    const citizenNames = [
      ['Ramesh Kumar', 'ramesh.kumar'],
      ['Anjali Deshmukh', 'anjali.deshmukh'],
      ['Vikram Singh', 'vikram.singh'],
      ['Neha Patel', 'neha.patel'],
      ['Arjun Rao', 'arjun.rao'],
      ['Priya Sharma', 'priya.sharma'],
      ['Aakash Verma', 'aakash.verma'],
      ['Sneha Joshi', 'sneha.joshi'],
      ['Rahul Mehta', 'rahul.mehta'],
      ['Kavita Patil', 'kavita.patil']
    ];

    const citizens = [];

    for (const [name, username] of citizenNames) {
      const citizen = await User.create({
        name,

        email: `${username}@smartpolice.local`,

        phone: randomPhone(),

        password: 'password123',

        role: ROLES.CITIZEN,

        status: USER_STATUS.ACTIVE
      });

      citizens.push(citizen);
    }

    console.log(
      `${citizens.length} citizens seeded.`
    );


    // ========================================================
    // COMPLAINTS
    // ========================================================

    console.log('Seeding complaints...');

    const stationMap = {};

    stations.forEach((station) => {
      stationMap[station.stationCode] = station;
    });


    // Crime distribution intentionally varies by area.
    //
    // This is SYNTHETIC DEMO DATA.
    //
    // Higher density:
    // Sitabuldi
    // Ganeshpeth
    //
    // Medium:
    // Nandanvan
    // Lakadganj
    //
    // Lower:
    // Ajni
    // Dhantoli
    // Sadar
    //
    // Very low:
    // Ambazari
    // Rana Pratap Nagar

    const stationComplaintPlan = {

      'SIT-NGP': {
        total: 10,

        types: [
          CRIME_TYPES.THEFT,
          CRIME_TYPES.ASSAULT,
          CRIME_TYPES.FRAUD,
          CRIME_TYPES.CYBER_CRIME
        ]
      },

      'GAN-NGP': {
        total: 7,

        types: [
          CRIME_TYPES.THEFT,
          CRIME_TYPES.FRAUD,
          CRIME_TYPES.CYBER_CRIME
        ]
      },

      'NAN-NGP': {
        total: 5,

        types: [
          CRIME_TYPES.THEFT,
          CRIME_TYPES.VANDALISM,
          CRIME_TYPES.FRAUD
        ]
      },

      'AJN-NGP': {
        total: 4,

        types: [
          CRIME_TYPES.THEFT,
          CRIME_TYPES.TRAFFIC
        ]
      },

      'LAK-NGP': {
        total: 4,

        types: [
          CRIME_TYPES.THEFT,
          CRIME_TYPES.ASSAULT,
          CRIME_TYPES.VANDALISM
        ]
      },

      'DHA-NGP': {
        total: 3,

        types: [
          CRIME_TYPES.TRAFFIC,
          CRIME_TYPES.THEFT
        ]
      },

      'SAD-NGP': {
        total: 3,

        types: [
          CRIME_TYPES.THEFT,
          CRIME_TYPES.ASSAULT
        ]
      },

      'AMB-NGP': {
        total: 2,

        types: [
          CRIME_TYPES.FRAUD,
          CRIME_TYPES.THEFT
        ]
      },

      'RPN-NGP': {
        total: 2,

        types: [
          CRIME_TYPES.OTHER,
          CRIME_TYPES.VANDALISM
        ]
      }
    };


    // Number of unresolved/active-like complaints.
    //
    // Since COMPLAINT_STATUS.ACTIVE does NOT exist,
    // we use:
    //
    // SUBMITTED
    // UNDER_REVIEW
    // ASSIGNED
    // INVESTIGATION
    // FIR_REGISTERED
    //
    // as unresolved operational statuses.

    const activeCounts = {
      'SIT-NGP': 7,
      'GAN-NGP': 4,
      'NAN-NGP': 2,
      'AJN-NGP': 1,
      'LAK-NGP': 3,
      'DHA-NGP': 1,
      'SAD-NGP': 1,
      'AMB-NGP': 0,
      'RPN-NGP': 0
    };


    // Number of complaints that should have FIRs.
    const firCounts = {
      'SIT-NGP': 5,
      'GAN-NGP': 3,
      'NAN-NGP': 2,
      'AJN-NGP': 1,
      'SAD-NGP': 1,
      'LAK-NGP': 2
    };


    // Priority distribution for better dashboard/AI demo.
    const stationPriority = {
      'SIT-NGP': COMPLAINT_PRIORITY.HIGH,
      'GAN-NGP': COMPLAINT_PRIORITY.HIGH,
      'NAN-NGP': COMPLAINT_PRIORITY.MEDIUM,
      'LAK-NGP': COMPLAINT_PRIORITY.HIGH,
      'AJN-NGP': COMPLAINT_PRIORITY.LOW,
      'DHA-NGP': COMPLAINT_PRIORITY.LOW,
      'SAD-NGP': COMPLAINT_PRIORITY.MEDIUM,
      'AMB-NGP': COMPLAINT_PRIORITY.LOW,
      'RPN-NGP': COMPLAINT_PRIORITY.LOW
    };


    const complaintsData = [];


    for (const [code, plan] of Object.entries(
      stationComplaintPlan
    )) {

      const station = stationMap[code];

      if (!station) {
        throw new Error(
          `Station ${code} not found in stationMap`
        );
      }


      const total = plan.total;

      const activeCount = activeCounts[code] ?? 0;

      const firCount = firCounts[code] ?? 0;

      const priority =
        stationPriority[code] ??
        COMPLAINT_PRIORITY.MEDIUM;


      for (let i = 0; i < total; i++) {

        const citizen =
          citizens[i % citizens.length];


        const crimeType =
          plan.types[i % plan.types.length];


        if (!crimeType) {
          throw new Error(
            `Invalid crime type generated for ${station.name}, complaint index ${i}`
          );
        }


        // ----------------------------------------------------
        // Determine complaint status
        // ----------------------------------------------------

        let status;

        if (i < firCount) {

          // Complaints linked to FIRs should explicitly
          // have FIR_REGISTERED status.

          status =
            COMPLAINT_STATUS.FIR_REGISTERED;

        } else if (i < activeCount) {

          const unresolvedStatuses = [
            COMPLAINT_STATUS.SUBMITTED,
            COMPLAINT_STATUS.UNDER_REVIEW,
            COMPLAINT_STATUS.ASSIGNED,
            COMPLAINT_STATUS.INVESTIGATION
          ];

          status =
            unresolvedStatuses[
              (i - firCount) %
              unresolvedStatuses.length
            ];

        } else {

          status =
            COMPLAINT_STATUS.RESOLVED;
        }


        // ----------------------------------------------------
        // Generate location around station
        // ----------------------------------------------------

        const latitude = randomOffset(
          station.location.latitude,
          0.012
        );

        const longitude = randomOffset(
          station.location.longitude,
          0.012
        );


        complaintsData.push({

          complaintId:
            generateUniqueId('CMP'),

          citizenId:
            citizen._id,

          crimeType,

          title:
            `${crimeType} incident near ${station.name}`,

          description:
            `Synthetic hackathon demo complaint for ${crimeType} reported in the ${station.name} operational area.`,

          location: {
            latitude,
            longitude,
            address:
              `${station.name} Area, Nagpur, Maharashtra`
          },

          policeStationId:
            station._id,

          assignedOfficerId:
            officerMap[code].inv.user._id,

          status,

          priority
        });
      }
    }


    // --------------------------------------------------------
    // Insert complaints
    // --------------------------------------------------------

    const createdComplaints =
      await Complaint.insertMany(
        complaintsData
      );

    console.log(
      `${createdComplaints.length} complaints seeded.`
    );


    // ========================================================
    // FIRs
    // ========================================================

    console.log('Seeding FIRs...');

    const firPlans = {
      'SIT-NGP': 5,
      'GAN-NGP': 3,
      'NAN-NGP': 2,
      'AJN-NGP': 1,
      'SAD-NGP': 1,
      'LAK-NGP': 2
    };


    const firs = [];

    let firCounter = 1;


    for (const [code, count] of Object.entries(
      firPlans
    )) {

      const station =
        stationMap[code];


      const relatedComplaints =
        createdComplaints
          .filter(
            (complaint) =>
              complaint.policeStationId.toString() ===
              station._id.toString()
          )
          .slice(0, count);


      for (const complaint of relatedComplaints) {

        firs.push({

          firNumber:
            `FIR-2026-${String(firCounter).padStart(4, '0')}`,

          complaintId:
            complaint._id,

          citizenId:
            complaint.citizenId,

          policeStationId:
            station._id,

          investigatingOfficerId:
            officerMap[code].inv.user._id,

          crimeType:
            complaint.crimeType,

          description:
            complaint.description,

          status:
            FIR_STATUS.UNDER_INVESTIGATION,

          registeredAt:
            new Date(
              Date.now() -
              Math.floor(Math.random() * 5 + 1) *
              24 *
              60 *
              60 *
              1000
            )
        });

        firCounter++;
      }
    }


    if (firs.length > 0) {

      await FIR.insertMany(firs);

    }

    console.log(
      `${firs.length} FIRs seeded.`
    );


    // ========================================================
    // SOS
    // ========================================================

    console.log('Seeding SOS records...');

    const sosData = [];

    const sosStations = [
      'SIT-NGP',
      'AJN-NGP',
      'GAN-NGP',
      'NAN-NGP',
      'LAK-NGP'
    ];


    let sosCounter = 0;


    for (const code of sosStations) {

      const station =
        stationMap[code];

      const officers =
        officerMap[code];


      // ------------------------------------------------------
      // Active SOS
      // ------------------------------------------------------

      const activeCitizen =
        citizens[
          sosCounter %
          citizens.length
        ];


      sosData.push({

        sosId:
          generateUniqueId('SOS'),

        citizenId:
          activeCitizen._id,

        location: {

          latitude:
            randomOffset(
              station.location.latitude,
              0.006
            ),

          longitude:
            randomOffset(
              station.location.longitude,
              0.006
            ),

          address:
            `${station.name} vicinity, Nagpur`
        },

        nearestStationId:
          station._id,

        assignedOfficerId:
          officers.field1.user._id,

        status:
          SOS_STATUS.ACTIVE,

        reportedAt:
          new Date()
      });


      // ------------------------------------------------------
      // Resolved SOS
      // ------------------------------------------------------

      const resolvedCitizen =
        citizens[
          (sosCounter + 1) %
          citizens.length
        ];


      sosData.push({

        sosId:
          generateUniqueId('SOS'),

        citizenId:
          resolvedCitizen._id,

        location: {

          latitude:
            randomOffset(
              station.location.latitude,
              0.006
            ),

          longitude:
            randomOffset(
              station.location.longitude,
              0.006
            ),

          address:
            `${station.name} vicinity, Nagpur`
        },

        nearestStationId:
          station._id,

        assignedOfficerId:
          officers.field1.user._id,

        status:
          SOS_STATUS.RESOLVED,

        reportedAt:
          new Date(
            Date.now() -
            2 *
            60 *
            60 *
            1000
          ),

        resolvedAt:
          new Date(
            Date.now() -
            1 *
            60 *
            60 *
            1000
          )
      });


      sosCounter++;
    }


    await SOS.insertMany(
      sosData
    );


    console.log(
      `${sosData.length} SOS records seeded.`
    );


    // ========================================================
    // FINAL SUMMARY
    // ========================================================

    console.log('');
    console.log('==============================================');
    console.log('NAGPUR DEMO DATABASE SEEDED SUCCESSFULLY');
    console.log('==============================================');
    console.log('');
    console.log(`Police Stations : ${stations.length}`);
    console.log(`Officers        : ${stations.length * 4}`);
    console.log(`Citizens        : ${citizens.length}`);
    console.log(`Complaints      : ${createdComplaints.length}`);
    console.log(`FIRs            : ${firs.length}`);
    console.log(`SOS Records     : ${sosData.length}`);
    console.log('');
    console.log('Synthetic hotspot distribution:');
    console.log('  HIGH       -> Sitabuldi');
    console.log('  HIGH       -> Ganeshpeth');
    console.log('  MEDIUM     -> Nandanvan');
    console.log('  HIGH       -> Lakadganj');
    console.log('  LOW        -> Ajni');
    console.log('  LOW        -> Dhantoli');
    console.log('  MEDIUM     -> Sadar');
    console.log('  LOW        -> Ambazari');
    console.log('  LOW        -> Rana Pratap Nagar');
    console.log('');
    console.log(
      'NOTE: Hotspot severity is NOT hardcoded into the database.'
    );
    console.log(
      'The existing hotspot/geospatial logic should derive density from complaint locations.'
    );
    console.log('');
    console.log(
      'All crime data is synthetic hackathon demo data.'
    );
    console.log('');

    process.exit(0);

  } catch (error) {

    console.error(
      'Error seeding database:',
      error
    );

    process.exit(1);
  }
};


// ============================================================
// START
// ============================================================

seedData();