/* MediGuide — Neon/Postgres audit + backup snapshot (temp tooling, deleted after use) */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const TABLES = [
  "User", "Country", "City", "FacilityType", "Facility", "Specialty",
  "Doctor", "Availability", "Appointment", "Review", "Favourite",
  "Notification", "BlogPost", "Language", "ContentTranslation",
  "ServicePackage", "ServiceRequest", "ClientService", "SocialPost",
  "ContactMessage", "Session",
];

const EXPECTED = {
  User: 8, Country: 6, City: 19, FacilityType: 4, Facility: 5, Specialty: 10,
  Doctor: 10, Availability: 84, Appointment: 2, Review: 4, Language: 6,
  ServicePackage: 10, ServiceRequest: 2, ClientService: 1, SocialPost: 4,
  BlogPost: 6,
};

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const info = await client.query(
    "SELECT current_database() db, current_setting('TimeZone') tz, version() v"
  );
  console.log("== SERVER ==");
  console.log("db:", info.rows[0].db, "| tz:", info.rows[0].tz);
  console.log("version:", info.rows[0].v.split(",")[0]);

  // Row counts per table + expected comparison
  console.log("\n== ROW COUNTS (expected vs actual) ==");
  const counts = {};
  for (const t of TABLES) {
    try {
      const r = await client.query(`SELECT COUNT(*)::int c FROM "${t}"`);
      counts[t] = r.rows[0].c;
      const exp = EXPECTED[t];
      const flag = exp == null ? "" : exp === r.rows[0].c ? " OK" : ` !! expected ${exp}`;
      console.log(`${t.padEnd(20)} ${String(r.rows[0].c).padStart(4)}${flag}`);
    } catch {
      console.log(`${t.padEnd(20)}  (missing)`);
    }
  }

  // Indexes
  console.log("\n== INDEXES ==");
  const idx = await client.query(
    `SELECT tablename, indexname, indexdef FROM pg_indexes
     WHERE schemaname='public' ORDER BY tablename, indexname`
  );
  const byTable = {};
  for (const row of idx.rows) (byTable[row.tablename] ||= []).push(row.indexname);
  for (const t of TABLES)
    console.log(`${t}: ${(byTable[t] || []).length} indexes`);

  // Orphan / referential checks
  console.log("\n== REFERENTIAL INTEGRITY (orphans should all be 0) ==");
  const orphans = [
    ['Appointment.patient', `SELECT COUNT(*)::int c FROM "Appointment" a LEFT JOIN "User" u ON u.id=a."patientId" WHERE u.id IS NULL`],
    ['Appointment.doctor', `SELECT COUNT(*)::int c FROM "Appointment" a LEFT JOIN "Doctor" d ON d.id=a."doctorId" WHERE d.id IS NULL`],
    ['Appointment.facility', `SELECT COUNT(*)::int c FROM "Appointment" a LEFT JOIN "Facility" f ON f.id=a."facilityId" WHERE f.id IS NULL`],
    ['Availability.doctor', `SELECT COUNT(*)::int c FROM "Availability" a LEFT JOIN "Doctor" d ON d.id=a."doctorId" WHERE d.id IS NULL`],
    ['Review.doctor', `SELECT COUNT(*)::int c FROM "Review" r LEFT JOIN "Doctor" d ON d.id=r."doctorId" WHERE d.id IS NULL`],
    ['Notification.user', `SELECT COUNT(*)::int c FROM "Notification" n LEFT JOIN "User" u ON u.id=n."userId" WHERE u.id IS NULL`],
    ['ClientService.facility', `SELECT COUNT(*)::int c FROM "ClientService" cs LEFT JOIN "Facility" f ON f.id=cs."facilityId" WHERE f.id IS NULL`],
    ['ServiceRequest.package', `SELECT COUNT(*)::int c FROM "ServiceRequest" r LEFT JOIN "ServicePackage" p ON p.id=r."packageId" WHERE r."packageId" IS NOT NULL AND p.id IS NULL`],
    ['Doctor.facility', `SELECT COUNT(*)::int c FROM "Doctor" d LEFT JOIN "Facility" f ON f.id=d."facilityId" WHERE f.id IS NULL`],
    ['City.country', `SELECT COUNT(*)::int c FROM "City" c LEFT JOIN "Country" k ON k.id=c."countryId" WHERE k.id IS NULL`],
  ];
  for (const [label, sql] of orphans) {
    const r = await client.query(sql);
    console.log(`${label.padEnd(26)} orphans: ${r.rows[0].c}`);
  }

  // Uniqueness sanity
  console.log("\n== UNIQUE CONSTRAINTS (spot checks) ==");
  const uniq = [
    ['User.email unique', `SELECT COUNT(*)::int c FROM (SELECT email FROM "User" GROUP BY email HAVING COUNT(*)>1) x`],
    ['Doctor slot uniqueness', `SELECT COUNT(*)::int c FROM (SELECT "doctorId", date, "timeSlot", mode FROM "Appointment" GROUP BY 1,2,3,4 HAVING COUNT(*)>1) x`],
    ['ServicePackage.name unique', `SELECT COUNT(*)::int c FROM (SELECT name FROM "ServicePackage" GROUP BY name HAVING COUNT(*)>1) x`],
    ['Language.code unique', `SELECT COUNT(*)::int c FROM (SELECT code FROM "Language" GROUP BY code HAVING COUNT(*)>1) x`],
    ['ContentTranslation rows complete', `SELECT COUNT(*)::int c FROM "ContentTranslation"`],
  ];
  for (const [label, sql] of uniq) {
    const r = await client.query(sql);
    console.log(`${label.padEnd(32)} duplicates: ${r.rows[0].c}`);
  }

  // Sizes
  console.log("\n== TABLE SIZES (top 8) ==");
  const sizes = await client.query(
    `SELECT relname, pg_total_relation_size(c.oid)::int sz
     FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
     WHERE n.nspname='public' AND relkind='r'
     ORDER BY sz DESC LIMIT 8`
  );
  for (const r of sizes.rows) console.log(`${r.relname.padEnd(22)} ${(r.sz / 1024).toFixed(1)} KB`);

  // Appointment demo states
  console.log("\n== APPOINTMENT STATES ==");
  const st = await client.query(
    `SELECT status, mode, COUNT(*)::int c FROM "Appointment" GROUP BY status, mode ORDER BY status`
  );
  for (const r of st.rows) console.log(`${r.status.padEnd(10)} ${r.mode.padEnd(10)} ${r.c}`);

  // Backup snapshot -> local JSON
  const backup = {};
  for (const t of TABLES) {
    if (counts[t] == null) continue;
    try {
      const r = await client.query(`SELECT * FROM "${t}"`);
      backup[t] = r.rows;
    } catch (e) { backup[t] = { error: String(e) }; }
  }
  const out = path.join(
    process.env.OC_TEMP || "C:\\Users\\Aon-PC\\AppData\\Local\\Temp\\opencode",
    `neon-backup-${new Date().toISOString().slice(0, 10)}.json`
  );
  fs.writeFileSync(out, JSON.stringify({ takenAt: new Date().toISOString(), counts, data: backup }));
  console.log("\n== BACKUP ==");
  console.log("saved:", out, `(${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);

  await client.end();
}

main().catch((e) => { console.error("AUDIT FAILED:", e.message); process.exit(1); });
