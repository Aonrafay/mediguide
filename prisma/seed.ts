/**
 * MediGuide seed script — populates the database with an admin account and
 * realistic demo data for development and the viva demo.
 *
 * Run: npx tsx prisma/seed.ts
 */
import bcrypt from "bcryptjs";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const db = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding MediGuide…");

  // ---------- Users ----------
  const passwordHash = await bcrypt.hash("Admin@123", 10);
  await db.user.upsert({
    where: { email: "admin@mediguide.com" },
    update: { role: "ADMIN" },
    create: {
      name: "MediGuide Admin",
      email: "admin@mediguide.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  const patientHash = await bcrypt.hash("Patient@123", 10);
  await db.user.upsert({
    where: { email: "patient@mediguide.com" },
    update: { role: "PATIENT" },
    create: {
      name: "Demo Patient",
      email: "patient@mediguide.com",
      passwordHash: patientHash,
      role: "PATIENT",
    },
  });

  // ---------- Facility types ----------
  const facilityTypes = [
    { name: "Hospital", icon: "🏥" },
    { name: "Clinic", icon: "🩺" },
    { name: "Medical Complex", icon: "🏢" },
    { name: "Lab", icon: "🔬" },
  ];
  for (const t of facilityTypes) {
    await db.facilityType.upsert({ where: { name: t.name }, update: {}, create: t });
  }
  const typeMap = new Map(
    (await db.facilityType.findMany()).map((t) => [t.name, t.id])
  );

  // ---------- Specialties ----------
  const specialties = [
    { name: "Cardiology", icon: "❤️" },
    { name: "Dermatology", icon: "🧴" },
    { name: "Dental Care", icon: "🦷" },
    { name: "ENT", icon: "👂" },
    { name: "General Medicine", icon: "🩹" },
    { name: "Gynecology", icon: "🤰" },
    { name: "Neurology", icon: "🧠" },
    { name: "Ophthalmology", icon: "👁️" },
    { name: "Orthopedics", icon: "🦴" },
    { name: "Pediatrics", icon: "🧒" },
  ];
  for (const s of specialties) {
    await db.specialty.upsert({ where: { name: s.name }, update: {}, create: s });
  }
  const specialtyMap = new Map(
    (await db.specialty.findMany()).map((s) => [s.name, s.id])
  );

  // ---------- Countries & cities ----------
  const geo: Record<string, string[]> = {
    Pakistan: ["Lahore", "Karachi", "Islamabad", "Multan"],
    "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah"],
    "Saudi Arabia": ["Riyadh", "Jeddah", "Makkah"],
    Turkey: ["Istanbul", "Ankara", "Izmir"],
    Malaysia: ["Kuala Lumpur", "Penang", "Johor Bahru"],
    India: ["Delhi", "Mumbai", "Bangalore"],
  };

  for (const [countryName, cityNames] of Object.entries(geo)) {
    const country = await db.country.upsert({
      where: { name: countryName },
      update: {},
      create: { name: countryName, code: countryName.slice(0, 2).toUpperCase() },
    });
    for (const cityName of cityNames) {
      await db.city.upsert({
        where: { countryId_name: { countryId: country.id, name: cityName } },
        update: {},
        create: { name: cityName, countryId: country.id },
      });
    }
  }

  // ---------- Facilities & doctors (demo: Lahore, Karachi, Dubai, Istanbul) ----------
  type FacilitySeed = {
    name: string;
    city: string;
    type: string;
    doctors: {
      name: string;
      specialty: string;
      qualification: string;
      experienceYears: number;
      inPersonFee: number;
      videoFee: number | null;
      gender: "MALE" | "FEMALE";
    }[];
  };

  const facilitySeeds: FacilitySeed[] = [
    {
      name: "Lahore General Hospital",
      city: "Lahore",
      type: "Hospital",
      doctors: [
        { name: "Dr. Ahmed Hassan", specialty: "Cardiology", qualification: "MBBS, FCPS (Cardiology)", experienceYears: 14, inPersonFee: 2500, videoFee: 1800, gender: "MALE" },
        { name: "Dr. Fatima Khan", specialty: "Pediatrics", qualification: "MBBS, MCPS (Pediatrics)", experienceYears: 9, inPersonFee: 1800, videoFee: 1200, gender: "FEMALE" },
        { name: "Dr. Bilal Raza", specialty: "Orthopedics", qualification: "MBBS, MS (Ortho)", experienceYears: 11, inPersonFee: 2200, videoFee: null, gender: "MALE" },
      ],
    },
    {
      name: "City Care Clinic",
      city: "Lahore",
      type: "Clinic",
      doctors: [
        { name: "Dr. Ayesha Malik", specialty: "Dermatology", qualification: "MBBS, MCPS (Derm)", experienceYears: 7, inPersonFee: 2000, videoFee: 1500, gender: "FEMALE" },
        { name: "Dr. Usman Tariq", specialty: "Dental Care", qualification: "BDS, MDS", experienceYears: 8, inPersonFee: 1500, videoFee: null, gender: "MALE" },
      ],
    },
    {
      name: "Shifa Medical Complex",
      city: "Karachi",
      type: "Medical Complex",
      doctors: [
        { name: "Dr. Sana Iqbal", specialty: "Neurology", qualification: "MBBS, FCPS (Neuro)", experienceYears: 12, inPersonFee: 3000, videoFee: 2200, gender: "FEMALE" },
        { name: "Dr. Omar Sheikh", specialty: "General Medicine", qualification: "MBBS", experienceYears: 5, inPersonFee: 1200, videoFee: 900, gender: "MALE" },
      ],
    },
    {
      name: "Marina Health Hospital",
      city: "Dubai",
      type: "Hospital",
      doctors: [
        { name: "Dr. Layla Al-Mansoori", specialty: "Gynecology", qualification: "MBBS, DGO", experienceYears: 13, inPersonFee: 350, videoFee: 250, gender: "FEMALE" },
        { name: "Dr. Khalid Al-Farsi", specialty: "ENT", qualification: "MBBS, MS (ENT)", experienceYears: 10, inPersonFee: 300, videoFee: 200, gender: "MALE" },
      ],
    },
    {
      name: "Bosphorus Medical Center",
      city: "Istanbul",
      type: "Medical Complex",
      doctors: [
        { name: "Dr. Emre Yılmaz", specialty: "Ophthalmology", qualification: "MD, PhD (Ophthal)", experienceYears: 15, inPersonFee: 800, videoFee: 600, gender: "MALE" },
      ],
    },
  ];

  for (const seed of facilitySeeds) {
    const city = await db.city.findFirst({
      where: { name: seed.city },
      include: { country: true },
    });
    if (!city) continue;

    const facility = await db.facility.upsert({
      where: { id: "never" },
      update: {},
      create: {
        name: seed.name,
        address: `${seed.name}, ${seed.city}, ${city.country.name}`,
        description: `${seed.type} providing quality healthcare in ${seed.city}.`,
        phone: "+92-300-0000000",
        email: `info@${seed.name.toLowerCase().replace(/[^a-z]+/g, "")}.com`,
        cityId: city.id,
        typeId: typeMap.get(seed.type)!,
        isVerified: true,
      },
    });

    for (const doc of seed.doctors) {
      // Avoid duplicates on re-seed
      const existing = await db.doctor.findFirst({
        where: { name: doc.name, facilityId: facility.id },
      });
      if (existing) continue;

      const doctor = await db.doctor.create({
        data: {
          facilityId: facility.id,
          specialtyId: specialtyMap.get(doc.specialty)!,
          name: doc.name,
          gender: doc.gender,
          qualification: doc.qualification,
          experienceYears: doc.experienceYears,
          inPersonFee: doc.inPersonFee,
          videoFee: doc.videoFee,
          offersVideo: doc.videoFee != null,
          about: `${doc.name} specializes in ${doc.specialty} with ${doc.experienceYears} years of experience.`,
          languages: JSON.stringify(["English", "Urdu"]),
        },
      });

      // Availability: Mon–Sat mornings in-person, evenings video where offered
      for (const day of [1, 2, 3, 4, 5, 6]) {
        await db.availability.create({
          data: {
            doctorId: doctor.id,
            dayOfWeek: day,
            startTime: "09:00",
            endTime: "14:00",
            slotDurationMin: 30,
            mode: "IN_PERSON",
          },
        });
        if (doc.videoFee != null && day % 2 === 1) {
          await db.availability.create({
            data: {
              doctorId: doctor.id,
              dayOfWeek: day,
              startTime: "17:00",
              endTime: "20:00",
              slotDurationMin: 30,
              mode: "VIDEO",
            },
          });
        }
      }
    }
  }

  // ---------- Languages ----------
  const langs = [
    { code: "en", name: "English", nativeName: "English", direction: "ltr", isDefault: true },
    { code: "ar", name: "Arabic", nativeName: "العربية", direction: "rtl" },
    { code: "ur", name: "Urdu", nativeName: "اردو", direction: "rtl" },
    { code: "tr", name: "Turkish", nativeName: "Türkçe", direction: "ltr" },
    { code: "hi", name: "Hindi", nativeName: "हिन्दी", direction: "ltr" },
    { code: "fr", name: "French", nativeName: "Français", direction: "ltr" },
  ];
  for (const l of langs) {
    await db.language.upsert({ where: { code: l.code }, update: {}, create: l });
  }

  const counts = {
    users: await db.user.count(),
    countries: await db.country.count(),
    cities: await db.city.count(),
    facilityTypes: await db.facilityType.count(),
    facilities: await db.facility.count(),
    specialties: await db.specialty.count(),
    doctors: await db.doctor.count(),
    availability: await db.availability.count(),
    languages: await db.language.count(),
  };
  console.log("✅ Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
