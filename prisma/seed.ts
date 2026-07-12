import { PrismaClient, VehicleStatus, DriverStatus, TripStatus, MaintenanceStatus } from "@prisma/client";

const prisma = new PrismaClient();

const CLERK_IDS = {
  fleetManager: "user_fleet_manager",
  driver: "user_driver",
  safetyOfficer: "user_safety_officer",
  financialAnalyst: "user_financial_analyst",
};

async function main() {
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  const fleetManager = await prisma.user.create({
    data: { id: CLERK_IDS.fleetManager, email: "fleet@transitops.dev", name: "Faye Fleet", role: "FleetManager" },
  });
  await prisma.user.create({
    data: { id: CLERK_IDS.driver, email: "driver@transitops.dev", name: "Alex Driver", role: "Driver" },
  });
  await prisma.user.create({
    data: { id: CLERK_IDS.safetyOfficer, email: "safety@transitops.dev", name: "Sam Safety", role: "SafetyOfficer" },
  });
  await prisma.user.create({
    data: { id: CLERK_IDS.financialAnalyst, email: "fin@transitops.dev", name: "Fin Analyst", role: "FinancialAnalyst" },
  });

  const van05 = await prisma.vehicle.create({
    data: {
      registrationNumber: "VAN-05",
      nameModel: "Ford Transit",
      type: "Van",
      maxLoadCapacity: 500,
      acquisitionCost: 28000,
      status: VehicleStatus.Available,
      region: "West",
    },
  });
  const truck12 = await prisma.vehicle.create({
    data: {
      registrationNumber: "TRK-12",
      nameModel: "Isuzu NPR",
      type: "Truck",
      maxLoadCapacity: 3000,
      acquisitionCost: 55000,
      status: VehicleStatus.Available,
      region: "East",
    },
  });
  await prisma.vehicle.create({
    data: {
      registrationNumber: "VAN-09",
      nameModel: "Mercedes Sprinter",
      type: "Van",
      maxLoadCapacity: 800,
      acquisitionCost: 32000,
      status: VehicleStatus.InShop,
      region: "West",
    },
  });
  await prisma.vehicle.create({
    data: {
      registrationNumber: "TRK-01",
      nameModel: "Volvo FH",
      type: "Truck",
      maxLoadCapacity: 5000,
      acquisitionCost: 90000,
      status: VehicleStatus.Retired,
      region: "North",
    },
  });
  const van21 = await prisma.vehicle.create({
    data: {
      registrationNumber: "VAN-21",
      nameModel: "Ford Transit",
      type: "Van",
      maxLoadCapacity: 500,
      acquisitionCost: 28000,
      status: VehicleStatus.Available,
      region: "South",
    },
  });

  const alex = await prisma.driver.create({
    data: {
      userId: CLERK_IDS.driver,
      name: "Alex Driver",
      licenseNumber: "LIC-1001",
      licenseCategory: "B",
      licenseExpiryDate: new Date("2027-01-01"),
      contactNumber: "555-0100",
      status: DriverStatus.Available,
    },
  });
  await prisma.driver.create({
    data: {
      name: "Jordan Lee",
      licenseNumber: "LIC-1002",
      licenseCategory: "C",
      licenseExpiryDate: new Date("2024-06-01"),
      contactNumber: "555-0101",
      status: DriverStatus.Available,
    },
  });
  await prisma.driver.create({
    data: {
      name: "Priya Shah",
      licenseNumber: "LIC-1003",
      licenseCategory: "B",
      licenseExpiryDate: new Date("2027-01-01"),
      contactNumber: "555-0102",
      status: DriverStatus.Suspended,
    },
  });
  const morgan = await prisma.driver.create({
    data: {
      name: "Morgan Diaz",
      licenseNumber: "LIC-1004",
      licenseCategory: "C",
      licenseExpiryDate: new Date("2027-06-01"),
      contactNumber: "555-0103",
      status: DriverStatus.Available,
    },
  });

  await prisma.trip.create({
    data: {
      source: "Warehouse A",
      destination: "Depot B",
      vehicleId: van05.id,
      driverId: alex.id,
      cargoWeight: 450,
      plannedDistance: 120,
      status: TripStatus.Draft,
      createdById: fleetManager.id,
    },
  });
  await prisma.trip.create({
    data: {
      source: "Port",
      destination: "Warehouse C",
      vehicleId: truck12.id,
      driverId: morgan.id,
      cargoWeight: 2200,
      plannedDistance: 340,
      status: TripStatus.Dispatched,
      dispatchedAt: new Date(),
      createdById: fleetManager.id,
    },
  });
  await prisma.vehicle.update({ where: { id: truck12.id }, data: { status: VehicleStatus.OnTrip } });
  await prisma.driver.update({ where: { id: morgan.id }, data: { status: DriverStatus.OnTrip } });

  const completedTrip = await prisma.trip.create({
    data: {
      source: "Depot B",
      destination: "Warehouse A",
      vehicleId: van21.id,
      driverId: alex.id,
      cargoWeight: 300,
      plannedDistance: 90,
      actualDistance: 92,
      fuelConsumed: 10,
      revenue: 140,
      status: TripStatus.Completed,
      dispatchedAt: new Date(),
      completedAt: new Date(),
      createdById: fleetManager.id,
    },
  });

  await prisma.fuelLog.create({
    data: { vehicleId: van21.id, tripId: completedTrip.id, liters: 10, cost: 18.5, logDate: new Date(), odometerReading: 15200 },
  });
  await prisma.expense.create({
    data: { vehicleId: van21.id, tripId: completedTrip.id, expenseType: "Toll", amount: 12, expenseDate: new Date() },
  });
  await prisma.maintenanceLog.create({
    data: { vehicleId: van05.id, maintenanceType: "Oil Change", cost: 85, status: MaintenanceStatus.Open, startDate: new Date() },
  });

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });