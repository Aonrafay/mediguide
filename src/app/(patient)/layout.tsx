import PatientFooter from "@/components/patient/Footer";
import PatientHeader from "@/components/patient/Header";

// Patient pages read the session + live DB — allow blocking renders.
export const instant = false;

export default function PatientLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <PatientHeader />
      <div className="flex-1">{children}</div>
      <PatientFooter />
    </>
  );
}
