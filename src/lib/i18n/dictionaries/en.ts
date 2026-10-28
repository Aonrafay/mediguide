/** English — source of truth for UI strings. Keys use dot.notation. */
export const en: Record<string, string> = {
  // Header / nav
  "nav.findDoctors": "Find Doctors",
  "nav.myAppointments": "My Appointments",
  "nav.signIn": "Sign in",
  "nav.register": "Register",
  "nav.signOut": "Sign out",
  "nav.searchPlaceholder": "Search doctors, specialties…",
  "common.home": "Home",

  // Home
  "home.heroTitle": "Find the right care, anywhere",
  "home.heroSub":
    "Browse hospitals, clinics, medical complexes and labs across countries and cities — explore doctor profiles and book in-person or video consultations.",
  "home.searchPlaceholder": "Search a doctor, specialty… e.g. Cardiology",
  "home.search": "Search",
  "home.browseTitle": "Browse by country",
  "home.browseSub": "Choose a country, then a city, then the type of care you need.",
  "home.howTitle": "How MediGuide works",
  "home.s1t": "1. Choose your location",
  "home.s1d": "Pick your country and city — MediGuide narrows everything down for you.",
  "home.s2t": "2. Pick a facility",
  "home.s2d": "Compare hospitals, clinics, medical complexes and labs near you.",
  "home.s3t": "3. Meet your doctor",
  "home.s3d": "View profiles, check fees & timings, then book in-person or by video.",
  "home.featuredTitle": "Featured doctors",
  "home.featuredSub": "Offering video consultations 🎥",
  "home.viewAll": "View all →",
  "stat.countries": "Countries",
  "stat.cities": "Cities",
  "stat.facilities": "Facilities",
  "stat.doctors": "Doctors",

  // Country / city pages
  "cty.citiesIn": "{n} cities — choose a city to continue",
  "cty.facilitiesIn": "{n} facilities",
  "cty.browseType": "Browse by facility type",
  "cty.allFacilities": "All facilities",
  "cty.doctorsCount": "{n} doctors",
  "cty.noFacilities": "No facilities added in {city} yet.",
  "cty.available": "{n} available",
  "tpage.title": "{type} — {city}",
  "tpage.found": "{n} {type} facilities found",
  "tpage.none": "No {type} facilities in {city} yet.",

  // Facility page
  "facility.doctors": "Doctors ({n})",
  "facility.about": "About",
  "facility.contact": "Contact",
  "facility.openMaps": "🗺️ Open in Maps",
  "facility.verified": "✓ Verified",
  "facility.photos": "Photos",
  "facility.noDoctors": "No doctors listed at this facility yet.",

  // Doctor page
  "doctor.exp": "{n} years experience",
  "doctor.reviewsTitle": "Patient reviews ({n})",
  "doctor.noReviewsYet": "No reviews yet",
  "doctor.reviewGate":
    "💡 You can review this doctor after completing an appointment with them.",
  "doctor.bookTitle": "Book an appointment",
  "doctor.availability": "Availability",
  "doctor.feeInPerson": "🏥 In-person visit",
  "doctor.feeVideo": "🎥 Video consultation",
  "doctor.videoBadge": "🎥 Video consultations available",
  "doctor.thanks": "🙏 Thank you! Your review was submitted and will appear once approved.",

  // Cards
  "card.video": "🎥 Video",
  "card.yrs": "{n} yrs exp",
  "card.new": "New on MediGuide",
  "card.doctors": "👨‍⚕️ {n} doctors",
  "fav.add": "+ Favourite",
  "fav.remove": "❤️ Favourite",

  // Doctors directory
  "dir.title": "Find Doctors",
  "dir.found": "{n} doctor(s) found",
  "dir.for": "for “{q}”",
  "dir.allCountries": "All countries",
  "dir.allCities": "All cities",
  "dir.allSpecialties": "All specialties",
  "dir.sortRating": "Top rated",
  "dir.sortExperience": "Most experienced",
  "dir.sortFee": "Lowest fee",
  "dir.sortName": "Name (A–Z)",
  "dir.videoOnly": "🎥 Video only",
  "dir.apply": "Apply",
  "dir.clear": "Clear all",
  "dir.none": "No doctors match your filters — try clearing some.",

  // Booking page + widget
  "book.pageTitle": "Book — {name}",
  "bw.pickDate": "Pick a date",
  "bw.times": "Available times",
  "bw.notes": "Notes for the doctor (optional) — symptoms, questions…",
  "bw.confirm": "Confirm booking",
  "bw.signIn": "Sign in to book",
  "bw.noTimingsInPerson":
    "The doctor has no in-person timings on this day — try another date or mode.",
  "bw.noTimingsVideo":
    "The doctor has no video timings on this day — try another date or mode.",
  "bw.allBooked": "All slots are booked on this day.",
  "bw.pickFirst": "Pick a date first.",
  "bw.modeInPerson": "🏥 In-Person Visit",
  "bw.modeVideo": "🎥 Video Consultation",
  "bw.notAvailable": "Not available",

  // Account
  "acct.title": "My Appointments",
  "acct.welcome": "Welcome back, {name}",
  "acct.bookNew": "+ Book new appointment",
  "acct.upcoming": "Upcoming ({n})",
  "acct.history": "History",
  "acct.none": "No upcoming appointments —",
  "acct.findDoctor": "find a doctor",
  "acct.cancel": "Cancel appointment",
  "acct.viewDoctor": "View doctor",
  "acct.joinCall": "🎥 Join Call",
  "acct.joinHint": "Join button activates once the clinic confirms.",
  "acct.booked":
    "🎉 Appointment booked! You'll see it under Upcoming below. The clinic confirms shortly — video appointments show a Join Call button once confirmed.",
  "acct.favTitle": "❤️ My favourite doctors ({n})",
  "acct.notifications": "🔔 Notifications",

  // Notifications
  "notif.title": "Notifications",
  "notif.unread": "{n} unread",
  "notif.allCaughtUp": "All caught up ✅",
  "notif.markAll": "Mark all read",
  "notif.none": "No notifications yet — book an appointment to get started.",
  "notif.back": "← My Appointments",

  // Auth pages
  "auth.signInTitle": "Welcome back",
  "auth.signInSub": "Sign in to book appointments and manage your bookings",
  "auth.regTitle": "Create your account",
  "auth.regSub": "Book in-person and video appointments in minutes",
  "auth.newHere": "New to MediGuide?",
  "auth.createAccount": "Create an account",

  // Footer
  "footer.tagline":
    "Find the right care, anywhere. Hospitals, clinics, medical complexes and labs — with doctor profiles and in-person or video appointments.",
  "footer.explore": "Explore",
  "footer.browse": "Browse by Country",
  "footer.aboutTitle": "About",
  "footer.aboutText":
    "MediGuide is a Final Year Project demonstrating a global, multi-country healthcare directory with appointment booking.",
};
