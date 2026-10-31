import { redirect } from "next/navigation";

// Countries are managed on the Admin Home (country cards) since Phase 10.
export const instant = false;

export default function CountriesRedirectPage() {
  redirect("/admin");
}
