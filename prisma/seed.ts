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
  const geo: Record<string, { code: string; cities: string[] }> = {
    Pakistan: { code: "PK", cities: ["Lahore", "Karachi", "Islamabad", "Multan"] },
    "United Arab Emirates": { code: "AE", cities: ["Dubai", "Abu Dhabi", "Sharjah"] },
    "Saudi Arabia": { code: "SA", cities: ["Riyadh", "Jeddah", "Makkah"] },
    Turkey: { code: "TR", cities: ["Istanbul", "Ankara", "Izmir"] },
    Malaysia: { code: "MY", cities: ["Kuala Lumpur", "Penang", "Johor Bahru"] },
    India: { code: "IN", cities: ["Delhi", "Mumbai", "Bangalore"] },
  };

  for (const [countryName, { code, cities: cityNames }] of Object.entries(geo)) {
    const country = await db.country.upsert({
      where: { name: countryName },
      update: { code }, // fixes codes on re-seed
      create: { name: countryName, code },
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

    // Deduplicate by name+city so re-seeding doesn't create copies
    const existingFacility = await db.facility.findFirst({
      where: { name: seed.name, cityId: city.id },
    });
    const facilityData = {
      name: seed.name,
      address: `${seed.name}, ${seed.city}, ${city.country.name}`,
      description: `${seed.type} providing quality healthcare in ${seed.city}.`,
      phone: "+92-300-0000000",
      email: `info@${seed.name.toLowerCase().replace(/[^a-z]+/g, "")}.com`,
      cityId: city.id,
      typeId: typeMap.get(seed.type)!,
      isVerified: true,
    };
    const facility = existingFacility
      ? await db.facility.update({ where: { id: existingFacility.id }, data: facilityData })
      : await db.facility.create({ data: facilityData });

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

  // ---------- Demo reviews (make doctor pages look alive) ----------
  const reviewerHash = await bcrypt.hash("Patient@123", 10);
  const reviewers = [
    { name: "Ali Raza", email: "ali@example.com" },
    { name: "Sara Ahmed", email: "sara@example.com" },
    { name: "Bilal Hussain", email: "bilal@example.com" },
  ];
  const reviewerIds: string[] = [];
  for (const reviewer of reviewers) {
    const user = await db.user.upsert({
      where: { email: reviewer.email },
      update: {},
      create: { name: reviewer.name, email: reviewer.email, passwordHash: reviewerHash, role: "PATIENT" },
    });
    reviewerIds.push(user.id);
  }

  async function addReview(doctorName: string, patientIdx: number, rating: number, comment: string) {
    const doctor = await db.doctor.findFirst({ where: { name: doctorName } });
    if (!doctor) return;
    const patientId = reviewerIds[patientIdx]!;
    await db.review.upsert({
      where: { patientId_doctorId: { patientId, doctorId: doctor.id } },
      update: { rating, comment, isApproved: true },
      create: { patientId, doctorId: doctor.id, rating, comment, isApproved: true },
    });
    // Recompute denormalized rating
    const agg = await db.review.aggregate({
      where: { doctorId: doctor.id, isApproved: true },
      _avg: { rating: true },
      _count: true,
    });
    await db.doctor.update({
      where: { id: doctor.id },
      data: {
        rating: agg._avg.rating ?? 0,
        reviewCount: agg._count,
      },
    });
  }

  await addReview("Dr. Ahmed Hassan", 0, 5, "Very professional and explained everything clearly. Highly recommended!");
  await addReview("Dr. Ahmed Hassan", 1, 4, "Great cardiologist, a bit of waiting time but worth it.");
  await addReview("Dr. Sana Iqbal", 2, 5, "The video consultation was smooth and she was very attentive.");
  await addReview("Dr. Ayesha Malik", 0, 4, "Fixed my skin issue quickly. Friendly staff too.");

  // ---------- Content translations (Arabic + Urdu names) ----------
  // entityType -> entityId lookup helpers use the maps built above.
  const countryRows = await db.country.findMany();
  const cityRows = await db.city.findMany({ include: { country: true } });
  const specialtyRows = await db.specialty.findMany();
  const typeRows2 = await db.facilityType.findMany();

  const translations: {
    entityType: string;
    match: string;
    languageCode: string;
    value: string;
  }[] = [
    // Countries (AR + UR)
    { entityType: "Country", match: "Pakistan", languageCode: "ar", value: "باكستان" },
    { entityType: "Country", match: "Pakistan", languageCode: "ur", value: "پاکستان" },
    { entityType: "Country", match: "United Arab Emirates", languageCode: "ar", value: "الإمارات العربية المتحدة" },
    { entityType: "Country", match: "United Arab Emirates", languageCode: "ur", value: "متحدہ عرب امارات" },
    { entityType: "Country", match: "Saudi Arabia", languageCode: "ar", value: "السعودية" },
    { entityType: "Country", match: "Saudi Arabia", languageCode: "ur", value: "سعودی عرب" },
    { entityType: "Country", match: "Turkey", languageCode: "ar", value: "تركيا" },
    { entityType: "Country", match: "Turkey", languageCode: "ur", value: "ترکی" },
    { entityType: "Country", match: "Malaysia", languageCode: "ar", value: "ماليزيا" },
    { entityType: "Country", match: "Malaysia", languageCode: "ur", value: "ملائیشیا" },
    { entityType: "Country", match: "India", languageCode: "ar", value: "الهند" },
    { entityType: "Country", match: "India", languageCode: "ur", value: "بھارت" },

    // Facility types (AR + UR)
    { entityType: "FacilityType", match: "Hospital", languageCode: "ar", value: "مستشفى" },
    { entityType: "FacilityType", match: "Hospital", languageCode: "ur", value: "ہسپتال" },
    { entityType: "FacilityType", match: "Clinic", languageCode: "ar", value: "عيادة" },
    { entityType: "FacilityType", match: "Clinic", languageCode: "ur", value: "کلینک" },
    { entityType: "FacilityType", match: "Medical Complex", languageCode: "ar", value: "مجمع طبي" },
    { entityType: "FacilityType", match: "Medical Complex", languageCode: "ur", value: "میڈیکل کمپلیکس" },
    { entityType: "FacilityType", match: "Lab", languageCode: "ar", value: "مختبر" },
    { entityType: "FacilityType", match: "Lab", languageCode: "ur", value: "لیبارٹری" },

    // Specialties (AR)
    { entityType: "Specialty", match: "Cardiology", languageCode: "ar", value: "أمراض القلب" },
    { entityType: "Specialty", match: "Dermatology", languageCode: "ar", value: "الجلدية" },
    { entityType: "Specialty", match: "Dental Care", languageCode: "ar", value: "طب الأسنان" },
    { entityType: "Specialty", match: "ENT", languageCode: "ar", value: "الأنف والأذن والحنجرة" },
    { entityType: "Specialty", match: "General Medicine", languageCode: "ar", value: "الطب العام" },
    { entityType: "Specialty", match: "Gynecology", languageCode: "ar", value: "النساء والتوليد" },
    { entityType: "Specialty", match: "Neurology", languageCode: "ar", value: "الأعصاب" },
    { entityType: "Specialty", match: "Ophthalmology", languageCode: "ar", value: "طب العيون" },
    { entityType: "Specialty", match: "Orthopedics", languageCode: "ar", value: "العظام" },
    { entityType: "Specialty", match: "Pediatrics", languageCode: "ar", value: "طب الأطفال" },

    // Specialties (UR)
    { entityType: "Specialty", match: "Cardiology", languageCode: "ur", value: "کارڈیالوجی" },
    { entityType: "Specialty", match: "Dermatology", languageCode: "ur", value: "امراض جلد" },
    { entityType: "Specialty", match: "Dental Care", languageCode: "ur", value: "ڈینٹل کیئر" },
    { entityType: "Specialty", match: "ENT", languageCode: "ur", value: "کان ناک گلا" },
    { entityType: "Specialty", match: "General Medicine", languageCode: "ur", value: "جنرل میڈیسن" },
    { entityType: "Specialty", match: "Gynecology", languageCode: "ur", value: "نسائیات" },
    { entityType: "Specialty", match: "Neurology", languageCode: "ur", value: "اعصاب" },
    { entityType: "Specialty", match: "Ophthalmology", languageCode: "ur", value: "امراض چشم" },
    { entityType: "Specialty", match: "Orthopedics", languageCode: "ur", value: "ہڈیاں" },
    { entityType: "Specialty", match: "Pediatrics", languageCode: "ur", value: "امراض اطفال" },

    // Cities (AR)
    { entityType: "City", match: "Lahore", languageCode: "ar", value: "لاهور" },
    { entityType: "City", match: "Karachi", languageCode: "ar", value: "كراچي" },
    { entityType: "City", match: "Islamabad", languageCode: "ar", value: "إسلام آباد" },
    { entityType: "City", match: "Multan", languageCode: "ar", value: "ملتان" },
    { entityType: "City", match: "Dubai", languageCode: "ar", value: "دبي" },
    { entityType: "City", match: "Abu Dhabi", languageCode: "ar", value: "أبوظبي" },
    { entityType: "City", match: "Sharjah", languageCode: "ar", value: "الشارقة" },
    { entityType: "City", match: "Riyadh", languageCode: "ar", value: "الرياض" },
    { entityType: "City", match: "Jeddah", languageCode: "ar", value: "جدة" },
    { entityType: "City", match: "Makkah", languageCode: "ar", value: "مكة" },
    { entityType: "City", match: "Istanbul", languageCode: "ar", value: "إستنبول" },
    { entityType: "City", match: "Ankara", languageCode: "ar", value: "أنقرة" },
    { entityType: "City", match: "Izmir", languageCode: "ar", value: "إزمير" },

    // Cities (UR)
    { entityType: "City", match: "Lahore", languageCode: "ur", value: "لاہور" },
    { entityType: "City", match: "Karachi", languageCode: "ur", value: "کراچی" },
    { entityType: "City", match: "Islamabad", languageCode: "ur", value: "اسلام آباد" },
    { entityType: "City", match: "Multan", languageCode: "ur", value: "ملتان" },
    { entityType: "City", match: "Dubai", languageCode: "ur", value: "دبئی" },
    { entityType: "City", match: "Abu Dhabi", languageCode: "ur", value: "ابوظہبی" },
    { entityType: "City", match: "Sharjah", languageCode: "ur", value: "شارجہ" },
    { entityType: "City", match: "Riyadh", languageCode: "ur", value: "ریاض" },
    { entityType: "City", match: "Jeddah", languageCode: "ur", value: "جدہ" },
    { entityType: "City", match: "Makkah", languageCode: "ur", value: "مکہ" },
    { entityType: "City", match: "Istanbul", languageCode: "ur", value: "استنبول" },
    { entityType: "City", match: "Ankara", languageCode: "ur", value: "انقرہ" },
    { entityType: "City", match: "Izmir", languageCode: "ur", value: "ازمیر" },
  ];

  for (const entry of translations) {
    let entityId: string | undefined;
    if (entry.entityType === "Country")
      entityId = countryRows.find((c) => c.name === entry.match)?.id;
    else if (entry.entityType === "City")
      entityId = cityRows.find((c) => c.name === entry.match)?.id;
    else if (entry.entityType === "Specialty")
      entityId = specialtyRows.find((s) => s.name === entry.match)?.id;
    else if (entry.entityType === "FacilityType")
      entityId = typeRows2.find((t) => t.name === entry.match)?.id;
    if (!entityId) continue;

    await db.contentTranslation.upsert({
      where: {
        entityType_entityId_languageCode_field: {
          entityType: entry.entityType,
          entityId,
          languageCode: entry.languageCode,
          field: "name",
        },
      },
      update: { value: entry.value },
      create: {
        entityType: entry.entityType,
        entityId,
        languageCode: entry.languageCode,
        field: "name",
        value: entry.value,
      },
    });
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
