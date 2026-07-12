import { PrismaClient, VehicleStatus, DriverStatus, TripStatus, MaintenanceStatus, ApprovalStatus } from "@prisma/client";

const prisma = new PrismaClient();

const CLERK_IDS = {
  fleetManager: "user_fleet_manager_ind",
  driverSandeep: "user_driver_sandeep",
  driverRajesh: "user_driver_rajesh",
  financialAnalyst: "user_fin_pooja",
  pendingDriver: "user_driver_vikram",
};

async function main() {
  console.log("Cleaning database but keeping active Admin users...");

  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.driverApplication.deleteMany();
  await prisma.roleRequest.deleteMany();
  await prisma.user.deleteMany({
    where: {
      role: { not: "Admin" }
    }
  });

  console.log("Seeding Indian operational users...");
  const fleetManager = await prisma.user.create({
    data: { id: CLERK_IDS.fleetManager, email: "anil@transitops.in", name: "Anil Mehta", role: "FleetManager", signupType: "OtherUser", signupStatus: "Approved" },
  });
  await prisma.user.create({
    data: { id: CLERK_IDS.driverSandeep, email: "sandeep@transitops.in", name: "Sandeep Sharma", role: "Driver", signupType: "Driver", signupStatus: "Approved" },
  });
  await prisma.user.create({
    data: { id: CLERK_IDS.driverRajesh, email: "rajesh@transitops.in", name: "Rajesh Kumar", role: "Driver", signupType: "Driver", signupStatus: "Approved" },
  });
  await prisma.user.create({
    data: { id: CLERK_IDS.financialAnalyst, email: "pooja@transitops.in", name: "Pooja Sharma", role: "FinancialAnalyst", signupType: "OtherUser", signupStatus: "Approved" },
  });
  const pendingDriverUser = await prisma.user.create({
    data: { id: CLERK_IDS.pendingDriver, email: "vikram@transitops.in", name: "Vikram Singh", role: "Pending", signupType: "Driver", signupStatus: "Pending" },
  });

  console.log("Seeding pending driver application for Vikram Singh...");
  await prisma.driverApplication.create({
    data: {
      userId: pendingDriverUser.id,
      hasHeavyVehiclePermit: true,
      yearsExperience: 8,
      licenseNumber: "MH-12-AB-2026-9999",
      licenseCategory: "HMV",
      licenseExpiryDate: new Date("2032-05-15"),
      contactNumber: "+91 99887 76655",
      status: ApprovalStatus.Pending,
    }
  });

  console.log("Seeding Indian commercial vehicles (historically available)...");
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  
  const veh1 = await prisma.vehicle.create({
    data: { registrationNumber: "MH-12-PQ-4567", nameModel: "Tata Ace", type: "Mini Truck", maxLoadCapacity: 850, acquisitionCost: 650000, status: VehicleStatus.Available, region: "West", createdAt: sixtyDaysAgo },
  });
  const veh2 = await prisma.vehicle.create({
    data: { registrationNumber: "DL-01-AB-1234", nameModel: "Mahindra Bolero Pik-Up", type: "Pickup", maxLoadCapacity: 1300, acquisitionCost: 850000, status: VehicleStatus.Available, region: "North", createdAt: sixtyDaysAgo },
  });
  const veh3 = await prisma.vehicle.create({
    data: { registrationNumber: "KA-03-XY-9876", nameModel: "Tata 407", type: "Light Truck", maxLoadCapacity: 2500, acquisitionCost: 1200000, status: VehicleStatus.OnTrip, region: "South", createdAt: sixtyDaysAgo },
  });
  const veh4 = await prisma.vehicle.create({
    data: { registrationNumber: "GJ-01-LM-8888", nameModel: "BharatBenz 1917R", type: "Heavy Truck", maxLoadCapacity: 10500, acquisitionCost: 2800000, status: VehicleStatus.Available, region: "West", createdAt: sixtyDaysAgo },
  });
  const veh5 = await prisma.vehicle.create({
    data: { registrationNumber: "HR-26-CZ-5555", nameModel: "Ashok Leyland Dost", type: "Pickup", maxLoadCapacity: 1250, acquisitionCost: 750000, status: VehicleStatus.InShop, region: "North", createdAt: sixtyDaysAgo },
  });

  console.log("Seeding Indian drivers...");
  const drv1 = await prisma.driver.create({
    data: { userId: CLERK_IDS.driverSandeep, name: "Sandeep Sharma", licenseNumber: "DL-1420210098765", licenseCategory: "LMV", licenseExpiryDate: new Date("2035-08-12"), contactNumber: "+91 98765 43210", hasHeavyVehiclePermit: false, yearsExperience: 6, status: DriverStatus.Available, createdAt: sixtyDaysAgo },
  });
  const drv2 = await prisma.driver.create({
    data: { userId: CLERK_IDS.driverRajesh, name: "Rajesh Kumar", licenseNumber: "MH-1220180012345", licenseCategory: "HMV", licenseExpiryDate: new Date("2033-11-20"), contactNumber: "+91 91234 56789", hasHeavyVehiclePermit: true, yearsExperience: 10, status: DriverStatus.Available, createdAt: sixtyDaysAgo },
  });
  const drv3 = await prisma.driver.create({
    data: { name: "Vijay Patil", licenseNumber: "MH-1420190054321", licenseCategory: "HMV", licenseExpiryDate: new Date("2034-01-15"), contactNumber: "+91 93456 78901", hasHeavyVehiclePermit: true, yearsExperience: 7, status: DriverStatus.OnTrip, createdAt: sixtyDaysAgo },
  });
  const drv4 = await prisma.driver.create({
    data: { name: "Amit Singh", licenseNumber: "DL-1320200067890", licenseCategory: "LMV", licenseExpiryDate: new Date("2031-06-30"), contactNumber: "+91 94567 89012", hasHeavyVehiclePermit: false, yearsExperience: 4, status: DriverStatus.Available, createdAt: sixtyDaysAgo },
  });
  const drv5 = await prisma.driver.create({
    data: { name: "Rahul Verma", licenseNumber: "HR-2620220034567", licenseCategory: "HMV", licenseExpiryDate: new Date("2036-02-28"), contactNumber: "+91 95678 90123", hasHeavyVehiclePermit: true, yearsExperience: 5, status: DriverStatus.OnTrip, createdAt: sixtyDaysAgo },
  });

  const now = new Date();
  const getPastDate = (daysAgo: number) => new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

  console.log("Seeding historical completed trips to build the 8-week utilization histogram...");
  // Structure:
  // Week 7 (i=7) ago: 1 trip -> 20%
  // Week 6 (i=6) ago: 3 trips -> 60%
  // Week 5 (i=5) ago: 2 trips -> 40%
  // Week 4 (i=4) ago: 4 trips -> 80%
  // Week 3 (i=3) ago: 5 trips -> 100%
  // Week 2 (i=2) ago: 4 trips -> 80%
  // Week 1 (i=1) ago: 3 trips -> 60%
  // Week 0 (current) ago: 2 completed + 2 dispatched + 1 draft -> 40% (active dispatches = 2/5)

  // Week 7 ago (Days 49-56 ago)
  await createHistoricalTrip("Pune", "Mumbai", veh1.id, drv1.id, 150, 150, 12, 1260, 340, 6500, getPastDate(52), fleetManager.id);

  // Week 6 ago (Days 42-49 ago)
  await createHistoricalTrip("Delhi", "Jaipur", veh2.id, drv2.id, 270, 270, 26, 2730, 480, 11500, getPastDate(45), fleetManager.id);
  await createHistoricalTrip("Mumbai", "Pune", veh5.id, drv3.id, 150, 152, 14, 1470, 340, 7000, getPastDate(44), fleetManager.id);
  await createHistoricalTrip("Delhi", "Gurgaon", veh1.id, drv1.id, 40, 42, 4, 420, 120, 2500, getPastDate(43), fleetManager.id);

  // Week 5 ago (Days 35-42 ago)
  await createHistoricalTrip("Chennai", "Bengaluru", veh3.id, drv3.id, 350, 350, 40, 4200, 650, 15000, getPastDate(38), fleetManager.id);
  await createHistoricalTrip("Noida", "Delhi", veh1.id, drv4.id, 45, 45, 5, 525, 100, 2200, getPastDate(37), fleetManager.id);

  // Week 4 ago (Days 28-35 ago)
  await createHistoricalTrip("Mumbai", "Pune", veh1.id, drv1.id, 150, 148, 11, 1155, 340, 6000, getPastDate(31), fleetManager.id);
  await createHistoricalTrip("Delhi", "Jaipur", veh2.id, drv2.id, 270, 272, 27, 2835, 480, 12000, getPastDate(32), fleetManager.id);
  await createHistoricalTrip("Bengaluru", "Chennai", veh3.id, drv3.id, 350, 348, 38, 3990, 650, 14500, getPastDate(30), fleetManager.id);
  await createHistoricalTrip("Surat", "Ahmedabad", veh4.id, drv4.id, 260, 260, 30, 3150, 400, 13000, getPastDate(29), fleetManager.id);

  // Week 3 ago (Days 21-28 ago)
  await createHistoricalTrip("Mumbai", "Nashik", veh1.id, drv1.id, 170, 172, 13, 1365, 240, 7500, getPastDate(24), fleetManager.id);
  await createHistoricalTrip("Jaipur", "Delhi", veh2.id, drv2.id, 270, 269, 25, 2625, 480, 11500, getPastDate(23), fleetManager.id);
  await createHistoricalTrip("Chennai", "Hyderabad", veh3.id, drv3.id, 630, 630, 75, 7875, 1120, 25000, getPastDate(25), fleetManager.id);
  await createHistoricalTrip("Vadodara", "Ahmedabad", veh4.id, drv4.id, 110, 112, 10, 1050, 200, 5000, getPastDate(26), fleetManager.id);
  await createHistoricalTrip("Pune", "Mumbai", veh5.id, drv5.id, 150, 150, 13, 1365, 340, 6500, getPastDate(22), fleetManager.id);

  // Week 2 ago (Days 14-21 ago)
  await createHistoricalTrip("Delhi", "Agra", veh2.id, drv2.id, 230, 230, 22, 2310, 380, 9500, getPastDate(17), fleetManager.id);
  await createHistoricalTrip("Bengaluru", "Chennai", veh3.id, drv3.id, 350, 352, 39, 4095, 650, 15500, getPastDate(16), fleetManager.id);
  await createHistoricalTrip("Ahmedabad", "Rajkot", veh4.id, drv4.id, 220, 220, 24, 2520, 350, 11000, getPastDate(18), fleetManager.id);
  await createHistoricalTrip("Pune", "Mumbai", veh5.id, drv1.id, 150, 148, 13, 1365, 340, 6200, getPastDate(15), fleetManager.id);

  // Week 1 ago (Days 7-14 ago)
  await createHistoricalTrip("Mumbai", "Pune", veh1.id, drv1.id, 150, 150, 12, 1260, 340, 6500, getPastDate(10), fleetManager.id);
  await createHistoricalTrip("Delhi", "Jaipur", veh2.id, drv2.id, 270, 268, 26, 2730, 480, 12000, getPastDate(11), fleetManager.id);
  await createHistoricalTrip("Bengaluru", "Mysore", veh3.id, drv3.id, 140, 142, 15, 1575, 200, 6000, getPastDate(9), fleetManager.id);

  // Week 0 (Current week completed trip)
  await createHistoricalTrip("Mumbai", "Pune", veh5.id, drv1.id, 150, 150, 12, 1260, 340, 6500, getPastDate(2), fleetManager.id);

  console.log("Seeding active dispatches...");
  // Dispatch 1: Bengaluru to Chennai
  await prisma.trip.create({
    data: {
      source: "Bengaluru",
      destination: "Chennai",
      vehicleId: veh3.id,
      driverId: drv3.id,
      cargoWeight: 2200,
      plannedDistance: 350,
      status: TripStatus.Dispatched,
      dispatchedAt: getPastDate(0.04), // ~1 hour ago
      createdAt: getPastDate(0.1),
      createdById: fleetManager.id,
    },
  });
  await prisma.vehicle.update({ where: { id: veh3.id }, data: { status: VehicleStatus.OnTrip } });
  await prisma.driver.update({ where: { id: drv3.id }, data: { status: DriverStatus.OnTrip } });

  // Dispatch 2: Delhi to Noida
  await prisma.trip.create({
    data: {
      source: "Delhi",
      destination: "Noida",
      vehicleId: veh2.id,
      driverId: drv5.id,
      cargoWeight: 900,
      plannedDistance: 45,
      status: TripStatus.Dispatched,
      dispatchedAt: getPastDate(0.02), // ~30 mins ago
      createdAt: getPastDate(0.05),
      createdById: fleetManager.id,
    },
  });
  await prisma.vehicle.update({ where: { id: veh2.id }, data: { status: VehicleStatus.OnTrip } });
  await prisma.driver.update({ where: { id: drv5.id }, data: { status: DriverStatus.OnTrip } });

  console.log("Seeding draft trip...");
  await prisma.trip.create({
    data: {
      source: "Ahmedabad",
      destination: "Vadodara",
      vehicleId: veh4.id,
      driverId: drv4.id,
      cargoWeight: 5000,
      plannedDistance: 110,
      status: TripStatus.Draft,
      createdAt: getPastDate(0.01),
      createdById: fleetManager.id,
    },
  });

  console.log("Seeding maintenance logs...");
  // Open log: Ashok Leyland Dost (Vehicle 5) is in the shop for suspension issues. Cost: ₹8500
  await prisma.maintenanceLog.create({
    data: {
      vehicleId: veh5.id,
      maintenanceType: "Suspension Repair",
      description: "Repairing rear leaf spring suspension and shock absorbers.",
      cost: 8500,
      status: MaintenanceStatus.Open,
      startDate: getPastDate(3),
      createdAt: getPastDate(3),
    },
  });
  // Closed log: Tata Ace (Vehicle 1) oil change. Cost: ₹2500
  await prisma.maintenanceLog.create({
    data: {
      vehicleId: veh1.id,
      maintenanceType: "Oil & Filter Change",
      description: "Scheduled engine oil replacement and filter change.",
      cost: 2500,
      status: MaintenanceStatus.Closed,
      startDate: getPastDate(15),
      endDate: getPastDate(15),
      createdAt: getPastDate(15),
    },
  });

  console.log("Seed complete.");
}

async function createHistoricalTrip(
  source: string,
  destination: string,
  vehicleId: number,
  driverId: number,
  plannedDistance: number,
  actualDistance: number,
  liters: number,
  fuelCost: number,
  tollCost: number,
  revenue: number,
  date: Date,
  createdById: string
) {
  const trip = await prisma.trip.create({
    data: {
      source,
      destination,
      vehicleId,
      driverId,
      cargoWeight: 800,
      plannedDistance,
      actualDistance,
      fuelConsumed: liters,
      revenue,
      status: TripStatus.Completed,
      dispatchedAt: date,
      completedAt: date,
      createdAt: date,
      createdById,
    },
  });

  // Fuel Log
  await prisma.fuelLog.create({
    data: {
      vehicleId,
      tripId: trip.id,
      liters,
      cost: fuelCost,
      logDate: date,
      odometerReading: 12000 + plannedDistance,
      createdAt: date,
    },
  });

  // Toll Expense
  await prisma.expense.create({
    data: {
      vehicleId,
      tripId: trip.id,
      expenseType: "Toll",
      amount: tollCost,
      expenseDate: date,
      description: `Toll charges for ${source} to ${destination} trip`,
      createdAt: date,
    },
  });

  // Update vehicle odometer
  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      odometer: { increment: actualDistance }
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });