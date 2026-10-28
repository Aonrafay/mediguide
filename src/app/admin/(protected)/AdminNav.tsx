"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/countries", label: "Countries", icon: "🌍" },
  { href: "/admin/cities", label: "Cities", icon: "🏙️" },
  { href: "/admin/facility-types", label: "Facility Types", icon: "🏥" },
  { href: "/admin/facilities", label: "Facilities", icon: "🏢" },
  { href: "/admin/specialties", label: "Specialties", icon: "🩺" },
  { href: "/admin/doctors", label: "Doctors", icon: "👨‍⚕️" },
  { href: "/admin/appointments", label: "Appointments", icon: "📅" },
  { href: "/admin/reviews", label: "Reviews", icon: "⭐" },
  { href: "/admin/users", label: "Users", icon: "👥" },
  { href: "/admin/languages", label: "Languages", icon: "🌐" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
      {links.map((link) => {
        const active =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-teal-600 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span>{link.icon}</span>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
