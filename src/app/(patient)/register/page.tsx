import { redirect } from "next/navigation";

import RegisterForm from "@/components/auth/RegisterForm";
import { getSession } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";

export const metadata = { title: "Create account" };
export const instant = false;

export default async function RegisterPage({
  searchParams,
}: PageProps<"/register">) {
  const session = await getSession();
  if (session) redirect("/account");

  const { t } = await getI18n();
  const { next } = await searchParams;

  return (
    <main className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-3xl">
            🏥
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t("auth.regTitle")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t("auth.regSub")}</p>
        </div>

        <RegisterForm redirectTo={typeof next === "string" ? next : undefined} />
      </div>
    </main>
  );
}
