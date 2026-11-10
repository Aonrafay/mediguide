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
    update: { role: "ADMIN", countryId: null },
    create: {
      name: "MediGuide Admin",
      email: "admin@mediguide.com",
      passwordHash,
      role: "ADMIN",
      countryId: null, // super admin — sees everything
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

  // ---------- Country admin (Pakistan) ----------
  const pakistan = await db.country.findUnique({ where: { name: "Pakistan" } });
  if (pakistan) {
    await db.user.upsert({
      where: { email: "pk-admin@mediguide.com" },
      update: { role: "ADMIN", countryId: pakistan.id },
      create: {
        name: "Pakistan Panel Admin",
        email: "pk-admin@mediguide.com",
        passwordHash,
        role: "ADMIN",
        countryId: pakistan.id,
      },
    });
  }

  // ---------- Department account (Lahore General Hospital) ----------
  const lhrHospital = await db.facility.findFirst({
    where: { name: "Lahore General Hospital" },
  });
  if (lhrHospital) {
    await db.user.upsert({
      where: { email: "lhg-dept@mediguide.com" },
      update: { role: "DEPARTMENT", facilityId: lhrHospital.id },
      create: {
        name: "Lahore General — Front Desk",
        email: "lhg-dept@mediguide.com",
        passwordHash: await bcrypt.hash("Dept@123", 10),
        role: "DEPARTMENT",
        facilityId: lhrHospital.id,
      },
    });
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

  // ---------- Demo approval-chain bookings ----------
  // One PENDING (awaiting admin) and one APPROVED (awaiting department) so
  // every queue state is visible in demos.
  const ahmedDoctor = await db.doctor.findFirst({
    where: { name: "Dr. Ahmed Hassan" },
  });
  const ayeshaPatient = await db.user.findUnique({
    where: { email: "ayesha@test.com" },
  });
  if (ahmedDoctor && ayeshaPatient) {
    // A PENDING booking 5 days out
    const future = new Date();
    future.setUTCDate(future.getUTCDate() + 5);
    const futureDate = new Date(
      Date.UTC(future.getUTCFullYear(), future.getUTCMonth(), future.getUTCDate())
    );
    await db.appointment.upsert({
      where: {
        doctorId_date_timeSlot_mode: {
          doctorId: ahmedDoctor.id,
          date: futureDate,
          timeSlot: "10:00",
          mode: "IN_PERSON",
        },
      },
      update: {},
      create: {
        patientId: ayeshaPatient.id,
        doctorId: ahmedDoctor.id,
        facilityId: ahmedDoctor.facilityId,
        date: futureDate,
        timeSlot: "10:00",
        mode: "IN_PERSON",
        status: "PENDING",
        notes: "First visit — chest discomfort on stairs.",
      },
    });

    // An APPROVED booking 3 days out (in Lahore General's department queue)
    const future2 = new Date();
    future2.setUTCDate(future2.getUTCDate() + 3);
    const futureDate2 = new Date(
      Date.UTC(future2.getUTCFullYear(), future2.getUTCMonth(), future2.getUTCDate())
    );
    await db.appointment.upsert({
      where: {
        doctorId_date_timeSlot_mode: {
          doctorId: ahmedDoctor.id,
          date: futureDate2,
          timeSlot: "11:00",
          mode: "IN_PERSON",
        },
      },
      update: { status: "APPROVED" },
      create: {
        patientId: ayeshaPatient.id,
        doctorId: ahmedDoctor.id,
        facilityId: ahmedDoctor.facilityId,
        date: futureDate2,
        timeSlot: "11:00",
        mode: "IN_PERSON",
        status: "APPROVED",
        notes: "Follow-up for blood pressure medication.",
        approvedAt: new Date(),
        sentToDepartmentAt: new Date(),
      },
    });
  }

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

  // ---------- Blog posts ----------
  const blogPosts = [
    {
      slug: "manage-diabetes-daily",
      title: "Managing Diabetes: 6 Simple Daily Habits",
      excerpt:
        "Small daily choices make a big difference for blood sugar control. Here are six habits endocrinologists recommend to every patient.",
      category: "General Health",
      tags: ["diabetes", "lifestyle", "blood sugar"],
      authorName: "Dr. Sana Iqbal",
      content:
        "Diabetes management can feel overwhelming, but it really comes down to a handful of consistent habits repeated every day.\n\nStart with regular meal times. Eating at roughly the same hours each day keeps blood sugar predictable and makes medication timing easier.\n\nWalk after meals. Even a 10–15 minute walk after lunch or dinner helps your muscles absorb glucose without extra insulin.\n\nCheck your feet weekly. Diabetes can reduce sensation in the feet, so small cuts can go unnoticed. A quick weekly check prevents big problems.\n\nKeep water nearby and skip sugary drinks — liquid sugar is the fastest way to spike your glucose.\n\nSleep 7–8 hours. Poor sleep raises insulin resistance, making the next day harder.\n\nFinally, keep every follow-up appointment. Doctors can only adjust your plan when they see your trends over time — book your next visit before leaving the clinic.",
    },
    {
      slug: "child-nutrition-basics",
      title: "Child Nutrition Basics Every Parent Should Know",
      excerpt:
        "Fussy eating, growth spurts and lunchbox battles — a pediatrician's practical guide to feeding children aged 2–12 without stress.",
      category: "Child Health",
      tags: ["children", "nutrition", "parenting"],
      authorName: "Dr. Fatima Khan",
      content:
        "Children do not need perfect meals — they need varied ones, offered calmly and repeatedly.\n\nFollow the plate rule: half vegetables and fruit, one quarter protein, one quarter grains. It works for toddlers and ten-year-olds alike.\n\nOffer a new food up to 15 times before deciding your child dislikes it. Taste buds change, and pressure-free repetition is how they learn to like vegetables.\n\nMilk is food, not a drink to sip all day. More than 500 ml a day can crowd out iron-rich foods and cause anemia.\n\nInvolve children in cooking. A child who washed the spinach is dramatically more likely to eat the spinach.\n\nAnd remember: growth is measured over months, not days. If your child is energetic and following their growth curve, an occasional skipped dinner is not a crisis.\n\nIf you notice persistent poor growth, fatigue or tummy pain, book a pediatric check-up rather than relying on supplements.",
    },
    {
      slug: "video-consultation-prepare",
      title: "How to Prepare for a Video Consultation",
      excerpt:
        "A two-minute checklist that makes your online doctor visit as useful as an in-person one — lighting, notes, medicines and more.",
      category: "Preventive Care",
      tags: ["telemedicine", "video", "checklist"],
      authorName: "MediGuide Team",
      content:
        "Video consultations save travel time and work brilliantly for follow-ups, rashes, reports and medication reviews. A little preparation makes them twice as effective.\n\nWrite down your three main questions before the call — it is easy to forget them on camera.\n\nSit near a window or lamp with light on your face, not behind you. Doctors rely on visuals more than people expect.\n\nKeep your medicines boxes beside you, not remembered from memory. Reading the actual label prevents dosing mistakes.\n\nHave recent lab reports or photos of the problem ready to share on screen.\n\nJoin five minutes early from a quiet place, with headphones if possible.\n\nOn MediGuide, your Join Call button appears in My Appointments as soon as the clinic confirms — no extra app needed.",
    },
    {
      slug: "seasonal-flu-guide",
      title: "Seasonal Flu: When to Rest at Home and When to See a Doctor",
      excerpt:
        "Most flu resolves with rest and fluids — but some warning signs need medical attention fast. Learn the difference.",
      category: "General Health",
      tags: ["flu", "fever", "when to see a doctor"],
      authorName: "Dr. Omar Sheikh",
      content:
        "Seasonal flu hits every household eventually. Most healthy adults recover in about a week with rest, fluids and simple fever control.\n\nSee a doctor promptly if breathing becomes difficult, fever returns after improving, you become confused, or you belong to a higher-risk group: over 65, pregnant, diabetic, asthmatic, or under 5 years old.\n\nAntibiotics do not treat flu — it is a virus. They only help when a bacterial complication appears, which your doctor can assess.\n\nAnnual flu vaccination remains the single best prevention, especially for the high-risk groups above.\n\nIf you are unsure whether your symptoms need attention, book a video consultation first — it often settles the question without a clinic trip.",
    },
    {
      slug: "mental-health-everyday",
      title: "Mental Health: 4 Small Practices With Big Effects",
      excerpt:
        "You do not need a retreat to protect your mental health. Four evidence-based micro-habits that fit any schedule.",
      category: "Mental Health",
      tags: ["mental health", "stress", "sleep"],
      authorName: "MediGuide Team",
      content:
        "Mental health is built (or eroded) in ordinary moments, not grand gestures.\n\nName what you feel. Putting a precise word on an emotion — annoyed, lonely, worried — measurably lowers its intensity.\n\nProtect one anchor habit: a fixed wake-up time. Irregular sleep is one of the strongest disruptors of mood.\n\nMove your body for 20 minutes most days. For mild low mood, regular walking compares surprisingly well with medication in several studies.\n\nKeep one social connection alive each week. A short call counts.\n\nAnd know when self-help is not enough: if low mood, anxiety or sleep problems persist for more than two weeks or affect your work and relationships, book an appointment with a physician or mental-health professional. Seeking help early is a strength, not a weakness.",
    },
    {
      slug: "first-aid-basics-home",
      title: "First-Aid Basics Every Home Should Know",
      excerpt:
        "Burns, cuts, choking and fainting — the correct first response for the four most common household emergencies.",
      category: "Preventive Care",
      tags: ["first aid", "safety", "emergency"],
      authorName: "Dr. Bilal Raza",
      content:
        "The first five minutes of an emergency matter more than the next five hours. Here is what actually helps.\n\nBurns: cool running water for 20 minutes. Never ice, never toothpaste. Cover loosely with a clean cloth and seek care for anything larger than the patient's palm.\n\nCuts: press firmly with a clean cloth for 10 uninterrupted minutes. Elevate. Seek care if the edges gape, bleeding soaks through, or the object was dirty and tetanus is not up to date.\n\nChoking (adult): encourage coughing first. If silent, give up to 5 back blows between the shoulder blades, then abdominal thrusts. Call emergency help.\n\nFainting: lay the person flat and raise the legs. Do not sit them up or give water until fully alert. If recovery is slow, or there was chest pain or a head injury first, arrange medical care immediately.\n\nConsider saving your nearest emergency department's number in your phone today — before you need it.",
    },
  ];

  for (const post of blogPosts) {
    await db.blogPost.upsert({
      where: { slug: post.slug },
      update: {},
      create: {
        ...post,
        tags: JSON.stringify(post.tags),
        isPublished: true,
        publishedAt: new Date(),
        coverImage: null,
      },
    });
  }

  // ---------- Partner services: packages, showcase client, social log ----------
  // audiences: HOSPITAL | CLINIC | LAB | PHARMACY (empty array = every provider type)
  const packageDefs = [
    {
      name: "Basic — Portfolio Page",
      tier: "BASIC",
      category: "PRESENCE",
      description: "A professional portfolio page on MediGuide showcasing your facility, team and services.",
      features: ["Rich portfolio page", "Photo gallery", "Services & hours section", "Doctor team section", "Patient reviews display"],
      platforms: ["website"],
      audiences: ["HOSPITAL", "CLINIC", "LAB", "PHARMACY"],
      priceLabel: "Rs 8,000 / year",
      sortOrder: 1,
    },
    {
      name: "Pro — Page + Social Setup",
      tier: "PRO",
      category: "MARKETING",
      description: "Portfolio page plus professional setup of your Instagram, LinkedIn, X and Facebook pages.",
      features: ["Everything in Basic", "4 social pages created & branded", "Profile & cover design", "Bio and contact links", "First 3 posts published"],
      platforms: ["instagram", "linkedin", "x", "facebook", "website"],
      audiences: ["HOSPITAL", "CLINIC", "LAB", "PHARMACY"],
      priceLabel: "Rs 15,000 / 3 months",
      sortOrder: 2,
    },
    {
      name: "Premium — Full Monthly Handling",
      tier: "PREMIUM",
      category: "MARKETING",
      description: "We run your pages for you: content calendar, posts every week, replies and monthly growth report.",
      features: ["Everything in Pro", "Weekly posts on all platforms", "Content calendar & planning", "Comment & message handling", "Monthly performance report"],
      platforms: ["instagram", "linkedin", "x", "facebook", "website"],
      audiences: ["HOSPITAL", "CLINIC", "LAB", "PHARMACY"],
      priceLabel: "Rs 25,000 / month",
      sortOrder: 3,
    },
    {
      name: "Website + Online Booking",
      tier: "PRO",
      category: "OPERATIONS",
      description: "Your own website with online appointment booking wired straight into MediGuide.",
      features: ["Custom website & domain setup", "Online appointment booking", "Doctor profile & timing pages", "Contact forms & directions", "Mobile-friendly design"],
      platforms: ["website"],
      audiences: ["HOSPITAL", "CLINIC", "LAB"],
      priceLabel: "Rs 30,000 / one-time",
      sortOrder: 4,
    },
    {
      name: "Google Business + Local SEO",
      tier: "BASIC",
      category: "MARKETING",
      description: "Get found on Google Maps and Search — verified business profile, photos, reviews and local SEO.",
      features: ["Google Business Profile setup & verification", "Photos, timing & service listings", "Review collection setup", "Local keyword optimization", "Monthly insights report"],
      platforms: ["website"],
      audiences: ["HOSPITAL", "CLINIC", "LAB", "PHARMACY"],
      priceLabel: "Rs 6,000 / setup",
      sortOrder: 5,
    },
    {
      name: "Content Creation Pack",
      tier: "PRO",
      category: "MARKETING",
      description: "A steady content engine: photo/video shoots at your premises plus designed posts every week.",
      features: ["Monthly photo & video shoot", "12 designed posts per month", "Health-day & offer creatives", "Short patient-awareness videos", "Captions in EN + UR/AR"],
      platforms: ["instagram", "linkedin", "x", "facebook"],
      audiences: ["HOSPITAL", "CLINIC", "LAB", "PHARMACY"],
      priceLabel: "Rs 12,000 / month",
      sortOrder: 6,
    },
    {
      name: "WhatsApp Business Setup",
      tier: "BASIC",
      category: "OPERATIONS",
      description: "Turn WhatsApp into your front desk: catalog, auto-replies and inquiry handling.",
      features: ["WhatsApp Business setup", "Service/product catalog", "Auto-replies & greeting flows", "Click-to-chat link on portfolio", "Staff quick-reply templates"],
      platforms: ["website"],
      audiences: ["HOSPITAL", "CLINIC", "LAB", "PHARMACY"],
      priceLabel: "Rs 5,000 / setup",
      sortOrder: 7,
    },
    {
      name: "Digital Ad Campaigns",
      tier: "CUSTOM",
      category: "ADS",
      description: "Targeted Meta & Google ads to bring new patients through your door — managed end to end.",
      features: ["Facebook & Instagram ad management", "Google Search ads campaign", "Audience & area targeting", "Budget management & reporting", "Weekly performance summary"],
      platforms: ["instagram", "facebook", "website"],
      audiences: ["HOSPITAL", "CLINIC", "LAB", "PHARMACY"],
      priceLabel: "Rs 10,000 / month + ad spend",
      sortOrder: 8,
    },
    {
      name: "Online Medicine Ordering",
      tier: "PRO",
      category: "OPERATIONS",
      description: "Sell medicines online: full product catalog, WhatsApp ordering and home delivery.",
      features: ["Medicine catalog (300+ items)", "WhatsApp order taking", "Home delivery coordination", "Refill reminders for patients", "Discount & offer banners"],
      platforms: ["instagram", "facebook", "website"],
      audiences: ["PHARMACY"],
      priceLabel: "Rs 20,000 / setup",
      sortOrder: 9,
    },
    {
      name: "Lab Test Booking + Home Sampling",
      tier: "PRO",
      category: "OPERATIONS",
      description: "Publish your test menu online, take bookings and schedule home sample collection.",
      features: ["Online test menu & price list", "Home sample collection slots", "WhatsApp report delivery", "Health package promotions", "Corporate tie-up page"],
      platforms: ["instagram", "facebook", "website"],
      audiences: ["LAB"],
      priceLabel: "Rs 20,000 / setup",
      sortOrder: 10,
    },
  ];
  const packageMap = new Map<string, string>();
  for (const pkg of packageDefs) {
    const data = {
      ...pkg,
      features: JSON.stringify(pkg.features),
      platforms: JSON.stringify(pkg.platforms),
      audiences: JSON.stringify(pkg.audiences),
    };
    const created = await db.servicePackage.upsert({
      where: { name: pkg.name },
      // refresh definition fields on re-seed (copy changes show up without a wipe)
      update: data,
      create: data,
    });
    // Key by name — tiers repeat across targeted packages (e.g. two PRO packs).
    packageMap.set(pkg.name, created.id);
  }

  // Showcase client: Lahore General Hospital becomes a PRO portfolio client
  const showcase = await db.facility.findFirst({
    where: { name: "Lahore General Hospital" },
  });
  if (showcase) {
    await db.facility.update({
      where: { id: showcase.id },
      data: {
        planTier: "PRO",
        portfolioTagline: "Advanced cardiac and general care in the heart of Lahore — trusted by families for over 25 years.",
        portfolioServices: JSON.stringify([
          "Cardiology & Heart Screenings",
          "Pediatric Care & Vaccination",
          "Orthopedic Surgery & Physiotherapy",
          "24/7 Emergency Department",
        ]),
        openingHours: "Mon–Sat 9:00–21:00 · Emergency 24/7",
        socials: JSON.stringify({
          instagram: "https://instagram.com/lahoregeneral",
          linkedin: "https://linkedin.com/company/lahoregeneral",
          x: "https://x.com/lahoregeneral",
          facebook: "https://facebook.com/lahoregeneral",
          website: "https://lahoregeneral.example.com",
        }),
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800",
          "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800",
          "https://images.unsplash.com/photo-1516574187841-cb20cc0fef98?w=800",
        ]),
      },
    });

    const clientService = await db.clientService.upsert({
      where: { facilityId: showcase.id },
      update: {},
      create: {
        facilityId: showcase.id,
        planTier: "PRO",
        platforms: JSON.stringify(["instagram", "linkedin", "x", "facebook"]),
        monthlyFee: 15000,
      },
    });

    const posts = [
      { platform: "instagram", content: "❤️ Free heart-screening camp this Sunday at Lahore General Hospital. Walk in between 9am–2pm — no appointment needed!", status: "POSTED", url: "https://instagram.com/p/demo1" },
      { platform: "facebook", content: "Meet Dr. Ahmed Hassan — 14 years of cardiology experience, now booking both in-person and video consultations through MediGuide.", status: "POSTED", url: "https://facebook.com/lahoregeneral/posts/2" },
      { platform: "linkedin", content: "Proud moment: our cardiology team completed 500+ successful procedures this year. Read the full story on our page.", status: "PLANNED" },
      { platform: "x", content: "Flu season is here 🤧 Rest, fluids, and when to see a doctor — full guide on our MediGuide portfolio page.", status: "PLANNED" },
    ];
    for (const post of posts) {
      const existing = await db.socialPost.findFirst({
        where: { clientServiceId: clientService.id, content: post.content },
      });
      if (!existing) {
        await db.socialPost.create({
          data: {
            clientServiceId: clientService.id,
            platform: post.platform,
            content: post.content,
            status: post.status,
            postedAt: post.status === "POSTED" ? new Date() : null,
            postUrl: post.url ?? null,
          },
        });
      }
    }
  }

  // Demo service requests (matches the contact inbox story):
  // one clinic + one pharmacy so both business types are visible in demos.
  await db.serviceRequest.upsert({
    where: { id: "demo-request" },
    update: { businessType: "CLINIC", packageId: packageMap.get("Premium — Full Monthly Handling") ?? null },
    create: {
      id: "demo-request",
      businessName: "City Care Dental — Multan Branch",
      businessType: "CLINIC",
      contactPerson: "Dr. Kamran Ali",
      email: "kamran@clinic.com",
      phone: "+92 300 1234567",
      packageId: packageMap.get("Premium — Full Monthly Handling") ?? null,
      message: "We want the full monthly handling — Instagram and Facebook mainly, plus a portfolio page showing our implant work.",
      status: "NEW",
    },
  });

  await db.serviceRequest.upsert({
    where: { id: "demo-request-pharmacy" },
    update: { businessType: "PHARMACY", packageId: packageMap.get("Online Medicine Ordering") ?? null },
    create: {
      id: "demo-request-pharmacy",
      businessName: "Sehat Pharmacy — Johar Town",
      businessType: "PHARMACY",
      contactPerson: "Hamza Sheikh",
      email: "hamza@pharmacy.com",
      phone: "+92 301 9876543",
      packageId: packageMap.get("Online Medicine Ordering") ?? null,
      message: "We want online medicine ordering with WhatsApp orders and a Google Maps listing so nearby patients can find us.",
      status: "NEW",
    },
  });

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
