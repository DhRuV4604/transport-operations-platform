import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * DAY);
const daysFromNow = (n: number) => new Date(now.getTime() + n * DAY);

async function main() {
  // wipe in FK-safe order
  await db.expense.deleteMany();
  await db.fuelLog.deleteMany();
  await db.maintenanceLog.deleteMany();
  await db.trip.deleteMany();
  await db.driver.deleteMany();
  await db.vehicle.deleteMany();
  await db.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  await db.user.createMany({
    data: [
      { email: "fleet@transitops.com", name: "Fiona Fleet", role: "FLEET_MANAGER", passwordHash },
      { email: "dispatch@transitops.com", name: "Devon Dispatch", role: "DISPATCHER", passwordHash },
      { email: "safety@transitops.com", name: "Sana Safety", role: "SAFETY_OFFICER", passwordHash },
      { email: "finance@transitops.com", name: "Farid Finance", role: "FINANCIAL_ANALYST", passwordHash },
    ],
  });

  const [
    truck1, truck2, van1, van2, van3, bike1, shopVan, retiredTruck,
    haulTruck1, haulTruck2, haulTruck3, haulVan,
  ] = await Promise.all(
    [
      { regNumber: "MH12-TRK-001", name: "Tata LPT 1613", type: "TRUCK", maxLoadKg: 9000, odometerKm: 84500, acquisitionCost: 2400000, status: "AVAILABLE", region: "WEST" },
      { regNumber: "GJ01-TRK-002", name: "Ashok Leyland Ecomet", type: "TRUCK", maxLoadKg: 7500, odometerKm: 61200, acquisitionCost: 2100000, status: "ON_TRIP", region: "WEST" },
      { regNumber: "MH12-VAN-001", name: "Mahindra Supro", type: "VAN", maxLoadKg: 900, odometerKm: 32100, acquisitionCost: 700000, status: "AVAILABLE", region: "WEST" },
      { regNumber: "DL08-VAN-002", name: "Maruti Eeco Cargo", type: "VAN", maxLoadKg: 500, odometerKm: 18400, acquisitionCost: 550000, status: "AVAILABLE", region: "NORTH" },
      { regNumber: "KA05-VAN-003", name: "Tata Ace Gold", type: "VAN", maxLoadKg: 750, odometerKm: 27650, acquisitionCost: 620000, status: "AVAILABLE", region: "SOUTH" },
      { regNumber: "KA05-BIK-001", name: "Hero Splendor Cargo", type: "BIKE", maxLoadKg: 40, odometerKm: 12800, acquisitionCost: 85000, status: "AVAILABLE", region: "SOUTH" },
      { regNumber: "DL08-VAN-004", name: "Force Traveller Cargo", type: "VAN", maxLoadKg: 1200, odometerKm: 45900, acquisitionCost: 950000, status: "IN_SHOP", region: "NORTH" },
      { regNumber: "MH12-TRK-000", name: "Eicher Pro 1110 (old)", type: "TRUCK", maxLoadKg: 6000, odometerKm: 245000, acquisitionCost: 1500000, status: "RETIRED", region: "WEST" },
      // Long-haul fleet currently on the road (drives the Live Map).
      { regNumber: "DL01-TRK-010", name: "BharatBenz 2823R", type: "TRUCK", maxLoadKg: 12000, odometerKm: 132000, acquisitionCost: 3200000, status: "ON_TRIP", region: "NORTH" },
      { regNumber: "MH14-TRK-011", name: "Tata Prima 3125", type: "TRUCK", maxLoadKg: 11000, odometerKm: 98000, acquisitionCost: 3400000, status: "ON_TRIP", region: "WEST" },
      { regNumber: "TN09-TRK-012", name: "Ashok Leyland 4220", type: "TRUCK", maxLoadKg: 13000, odometerKm: 76000, acquisitionCost: 3600000, status: "ON_TRIP", region: "SOUTH" },
      { regNumber: "WB02-VAN-013", name: "Tata Intra V30", type: "VAN", maxLoadKg: 1300, odometerKm: 41000, acquisitionCost: 780000, status: "ON_TRIP", region: "EAST" },
    ].map((data) => db.vehicle.create({ data }))
  );

  const [ravi, meera, john, priya, karan, expired, arjun, sunita, imran, deepa] = await Promise.all(
    [
      { name: "Ravi Kumar", licenseNumber: "MH12-2019-0011", licenseCategory: "HMV", licenseExpiry: daysFromNow(400), phone: "+91 98200 11001", safetyScore: 92, status: "AVAILABLE" },
      { name: "Meera Joshi", licenseNumber: "GJ01-2020-0202", licenseCategory: "HMV", licenseExpiry: daysFromNow(700), phone: "+91 98200 11002", safetyScore: 88, status: "ON_TRIP" },
      { name: "John Dsouza", licenseNumber: "KA05-2018-0303", licenseCategory: "LMV", licenseExpiry: daysFromNow(150), phone: "+91 98200 11003", safetyScore: 85, status: "AVAILABLE" },
      { name: "Priya Nair", licenseNumber: "DL08-2021-0404", licenseCategory: "LMV", licenseExpiry: daysFromNow(900), phone: "+91 98200 11004", safetyScore: 95, status: "OFF_DUTY" },
      { name: "Karan Singh", licenseNumber: "MH12-2017-0505", licenseCategory: "HMV", licenseExpiry: daysFromNow(60), phone: "+91 98200 11005", safetyScore: 45, status: "SUSPENDED" },
      { name: "Vikram Rao", licenseNumber: "KA05-2015-0606", licenseCategory: "LMV", licenseExpiry: daysAgo(30), phone: "+91 98200 11006", safetyScore: 78, status: "AVAILABLE" },
      { name: "Arjun Mehta", licenseNumber: "DL01-2019-0707", licenseCategory: "HMV", licenseExpiry: daysFromNow(500), phone: "+91 98200 11007", safetyScore: 90, status: "ON_TRIP" },
      { name: "Sunita Rao", licenseNumber: "MH14-2020-0808", licenseCategory: "HMV", licenseExpiry: daysFromNow(620), phone: "+91 98200 11008", safetyScore: 87, status: "ON_TRIP" },
      { name: "Imran Sheikh", licenseNumber: "TN09-2018-0909", licenseCategory: "HMV", licenseExpiry: daysFromNow(300), phone: "+91 98200 11009", safetyScore: 83, status: "ON_TRIP" },
      { name: "Deepa Iyer", licenseNumber: "WB02-2021-1010", licenseCategory: "LMV", licenseExpiry: daysFromNow(800), phone: "+91 98200 11010", safetyScore: 91, status: "ON_TRIP" },
    ].map((data) => db.driver.create({ data }))
  );
  void expired; // available but expired license — must never appear in dispatch pool

  // completed trips (with odometer + revenue), one dispatched matching ON_TRIP pair, one draft, one cancelled
  const t1 = await db.trip.create({
    data: {
      source: "Mumbai", destination: "Pune", vehicleId: truck1.id, driverId: ravi.id,
      cargoWeightKg: 6500, plannedDistanceKm: 150, revenue: 48000, status: "COMPLETED",
      startOdometerKm: 84190, endOdometerKm: 84345,
      dispatchedAt: daysAgo(9), completedAt: daysAgo(8), createdAt: daysAgo(10),
    },
  });
  const t2 = await db.trip.create({
    data: {
      source: "Pune", destination: "Nashik", vehicleId: truck1.id, driverId: ravi.id,
      cargoWeightKg: 5200, plannedDistanceKm: 210, revenue: 55000, status: "COMPLETED",
      startOdometerKm: 84345, endOdometerKm: 84500,
      dispatchedAt: daysAgo(5), completedAt: daysAgo(4), createdAt: daysAgo(6),
    },
  });
  const t3 = await db.trip.create({
    data: {
      source: "Bengaluru", destination: "Mysuru", vehicleId: van3.id, driverId: john.id,
      cargoWeightKg: 600, plannedDistanceKm: 145, revenue: 12000, status: "COMPLETED",
      startOdometerKm: 27500, endOdometerKm: 27650,
      dispatchedAt: daysAgo(3), completedAt: daysAgo(2), createdAt: daysAgo(3),
    },
  });
  await db.trip.create({
    data: {
      source: "Ahmedabad", destination: "Surat", vehicleId: truck2.id, driverId: meera.id,
      cargoWeightKg: 6800, plannedDistanceKm: 265, revenue: 60000, status: "DISPATCHED",
      startOdometerKm: 61200, dispatchedAt: daysAgo(1), createdAt: daysAgo(1),
    },
  });
  // Long-haul trips currently in transit — these populate the Live Map.
  await db.trip.create({
    data: {
      source: "Delhi", destination: "Bengaluru", vehicleId: haulTruck1.id, driverId: arjun.id,
      cargoWeightKg: 10500, plannedDistanceKm: 2150, revenue: 185000, status: "DISPATCHED",
      startOdometerKm: 132000, dispatchedAt: daysAgo(2), createdAt: daysAgo(2),
    },
  });
  await db.trip.create({
    data: {
      source: "Mumbai", destination: "Kolkata", vehicleId: haulTruck2.id, driverId: sunita.id,
      cargoWeightKg: 9800, plannedDistanceKm: 1960, revenue: 172000, status: "DISPATCHED",
      startOdometerKm: 98000, dispatchedAt: daysAgo(1.5), createdAt: daysAgo(2),
    },
  });
  await db.trip.create({
    data: {
      source: "Chennai", destination: "Hyderabad", vehicleId: haulTruck3.id, driverId: imran.id,
      cargoWeightKg: 12000, plannedDistanceKm: 630, revenue: 96000, status: "DISPATCHED",
      startOdometerKm: 76000, dispatchedAt: daysAgo(0.4), createdAt: daysAgo(1),
    },
  });
  await db.trip.create({
    data: {
      source: "Kolkata", destination: "Guwahati", vehicleId: haulVan.id, driverId: deepa.id,
      cargoWeightKg: 1100, plannedDistanceKm: 990, revenue: 64000, status: "DISPATCHED",
      startOdometerKm: 41000, dispatchedAt: daysAgo(0.8), createdAt: daysAgo(1),
    },
  });
  await db.trip.create({
    data: {
      source: "Delhi", destination: "Jaipur", vehicleId: van2.id, driverId: priya.id,
      cargoWeightKg: 350, plannedDistanceKm: 280, revenue: 15000, status: "DRAFT",
      createdAt: daysAgo(0.5),
    },
  });
  await db.trip.create({
    data: {
      source: "Mumbai", destination: "Nagpur", vehicleId: van1.id, driverId: ravi.id,
      cargoWeightKg: 700, plannedDistanceKm: 830, revenue: 0, status: "CANCELLED",
      createdAt: daysAgo(7),
    },
  });

  await db.maintenanceLog.createMany({
    data: [
      { vehicleId: shopVan.id, description: "Gearbox overhaul", serviceType: "REPAIR", cost: 28000, status: "OPEN", openedAt: daysAgo(2) },
      { vehicleId: truck1.id, description: "Oil change + filters", serviceType: "ROUTINE", cost: 6500, status: "CLOSED", openedAt: daysAgo(20), closedAt: daysAgo(19) },
      { vehicleId: van3.id, description: "Brake pad replacement", serviceType: "REPAIR", cost: 4200, status: "CLOSED", openedAt: daysAgo(15), closedAt: daysAgo(14) },
    ],
  });

  await db.fuelLog.createMany({
    data: [
      { vehicleId: truck1.id, tripId: t1.id, liters: 52, cost: 4940, date: daysAgo(8) },
      { vehicleId: truck1.id, tripId: t2.id, liters: 48, cost: 4560, date: daysAgo(4) },
      { vehicleId: van3.id, tripId: t3.id, liters: 14, cost: 1330, date: daysAgo(2) },
      { vehicleId: truck2.id, liters: 60, cost: 5700, date: daysAgo(1) },
      { vehicleId: van1.id, liters: 22, cost: 2090, date: daysAgo(6) },
      { vehicleId: van2.id, liters: 18, cost: 1710, date: daysAgo(5) },
      { vehicleId: bike1.id, liters: 6, cost: 630, date: daysAgo(3) },
      { vehicleId: shopVan.id, liters: 30, cost: 2850, date: daysAgo(10) },
    ],
  });

  await db.expense.createMany({
    data: [
      { vehicleId: truck1.id, tripId: t1.id, category: "TOLL", amount: 890, description: "Mumbai–Pune expressway toll", date: daysAgo(8) },
      { vehicleId: truck1.id, tripId: t2.id, category: "TOLL", amount: 620, description: "Pune–Nashik toll", date: daysAgo(4) },
      { vehicleId: van3.id, tripId: t3.id, category: "PARKING", amount: 150, description: "Overnight parking Mysuru", date: daysAgo(2) },
      { vehicleId: truck2.id, category: "TOLL", amount: 740, description: "NH48 toll", date: daysAgo(1) },
      { vehicleId: van1.id, category: "FINE", amount: 500, description: "No-parking zone fine", date: daysAgo(6) },
      { category: "OTHER", amount: 1200, description: "Warehouse loading charges", date: daysAgo(5) },
    ],
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
