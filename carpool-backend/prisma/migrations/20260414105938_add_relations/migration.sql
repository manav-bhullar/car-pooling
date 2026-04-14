-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "totalDistanceKm" DOUBLE PRECISION NOT NULL,
    "estimatedEtaMinutes" INTEGER NOT NULL,
    "detourRatio" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripUser" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rideRequestId" TEXT NOT NULL,
    "fareShare" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TripUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripStop" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "stopOrder" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "rideRequestId" TEXT NOT NULL,
    "segmentDistKm" DOUBLE PRECISION NOT NULL,
    "activePassengersOnSegment" INTEGER NOT NULL,

    CONSTRAINT "TripStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchCycleLog" (
    "id" TEXT NOT NULL,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "triggerType" TEXT NOT NULL,
    "pendingCountStart" INTEGER NOT NULL,
    "tripsCreated" INTEGER NOT NULL,
    "usersMatched" INTEGER NOT NULL,
    "usersStillPending" INTEGER NOT NULL,
    "autoCancelledCount" INTEGER NOT NULL,
    "pairsRejectedDirection" INTEGER NOT NULL,
    "pairsRejectedDetour" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "errorMessage" TEXT,

    CONSTRAINT "MatchCycleLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TripUser_rideRequestId_key" ON "TripUser"("rideRequestId");

-- AddForeignKey
ALTER TABLE "TripUser" ADD CONSTRAINT "TripUser_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripStop" ADD CONSTRAINT "TripStop_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
