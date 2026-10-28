export type FaqItem = { q: string; a: string };
export type FaqCategory = { key: string; items: FaqItem[] };

/** Demo FAQ content — shown in an accordion on /faq. */
export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    key: "faq.catBooking",
    items: [
      {
        q: "How do I book an appointment?",
        a: "Open a doctor's profile, press “Book Appointment”, choose in-person or video, pick a date and a free time slot, then confirm. You'll see the booking under My Appointments.",
      },
      {
        q: "Can I cancel or reschedule?",
        a: "Yes — open My Appointments and press “Cancel appointment” any time before it is marked completed. To reschedule, simply book a new slot and cancel the old one.",
      },
      {
        q: "Why are some dates disabled?",
        a: "Date chips are only enabled on days where the doctor has published availability for the mode you selected (in-person or video).",
      },
      {
        q: "What do the appointment statuses mean?",
        a: "Pending = waiting for the clinic to confirm. Confirmed = your slot is reserved. Completed = the visit happened. Cancelled = the appointment is no longer active.",
      },
    ],
  },
  {
    key: "faq.catVideo",
    items: [
      {
        q: "How does a video consultation work?",
        a: "Once the clinic confirms your video appointment, a “🎥 Join Call” button appears in My Appointments. It opens a private Jitsi meeting room — no extra app or account needed.",
      },
      {
        q: "Is video consultation cheaper?",
        a: "Often yes — many doctors keep a separate, lower video fee. Both fees are shown on the doctor's profile and in the booking widget.",
      },
      {
        q: "Which devices work for video calls?",
        a: "Any device with a modern browser and camera: phone, tablet or laptop. Join from the link in your dashboard.",
      },
    ],
  },
  {
    key: "faq.catAccount",
    items: [
      {
        q: "Do I need an account to browse?",
        a: "No — browsing countries, cities, facilities and doctor profiles is open to everyone. You only need an account to book, review or save favourites.",
      },
      {
        q: "When can I leave a review?",
        a: "After you complete an appointment with a doctor, a star-review form unlocks on their profile. Reviews appear publicly once our team approves them.",
      },
      {
        q: "What are favourites for?",
        a: "Press the heart on any doctor to save them under “My favourite doctors” on your dashboard for quick access later.",
      },
    ],
  },
  {
    key: "faq.catClinics",
    items: [
      {
        q: "How can my clinic join MediGuide?",
        a: "Send us a message through the Contact page with your facility name, city and phone — our team will help you get listed and verified.",
      },
      {
        q: "Can doctors manage their own profiles?",
        a: "The doctor self-service portal (edit profile, timings, confirm appointments) is planned as future work. Today the admin team manages profiles and confirms appointments.",
      },
    ],
  },
];
