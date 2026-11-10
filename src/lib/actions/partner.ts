"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminScope } from "@/lib/adminScope";
import { notifyAdmins } from "@/lib/notifications";
import { db } from "@/lib/db";

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function friendlyError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

async function run(path: string, mutate: () => Promise<unknown>) {
  let error: string | undefined;
  const result = await (async () => {
    try {
      return await mutate();
    } catch (caught) {
      return friendlyError(caught);
    }
  })();
  if (typeof result === "string") error = result;
  revalidatePath(path);
  redirect(error ? `${path}?error=${encodeURIComponent(error)}` : path);
}

/* --------------------------- public request form --------------------------- */

export type ServiceRequestState = { error?: string; success?: string };

const BUSINESS_TYPES = ["HOSPITAL", "CLINIC", "LAB", "PHARMACY"] as const;

export async function submitServiceRequest(
  _prev: ServiceRequestState,
  formData: FormData
): Promise<ServiceRequestState> {
  const businessName = str(formData, "businessName");
  const rawBusinessType = str(formData, "businessType").toUpperCase();
  const businessType = (BUSINESS_TYPES as readonly string[]).includes(rawBusinessType)
    ? rawBusinessType
    : "";
  const contactPerson = str(formData, "contactPerson");
  const email = str(formData, "email").toLowerCase();
  const phone = str(formData, "phone");
  const facilityId = str(formData, "facilityId");
  const packageId = str(formData, "packageId");
  const message = str(formData, "message");

  if (!businessName || !contactPerson || !email) {
    return { error: "Business name, contact person and email are required." };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  try {
    await db.serviceRequest.create({
      data: {
        businessName,
        businessType,
        contactPerson,
        email,
        phone: phone || null,
        facilityId: facilityId || null,
        packageId: packageId || null,
        message: message || null,
      },
    });
  } catch {
    return { error: "Could not submit your request — try again." };
  }

  const typeLabel =
    businessType === "HOSPITAL"
      ? "hospital"
      : businessType === "LAB"
        ? "lab"
        : businessType === "PHARMACY"
          ? "pharmacy"
          : businessType === "CLINIC"
            ? "clinic"
            : "provider";
  await notifyAdmins(
    "New service request 💼",
    `${businessName} (${contactPerson}) — a ${typeLabel} — requested digital services.`
  );

  revalidatePath("/admin/requests");
  return {
    success:
      "✅ Request received! Our partnerships team will contact you within 1–2 working days.",
  };
}

/* ------------------------------ admin actions ------------------------------ */

export async function setServiceRequestStatus(formData: FormData) {
  await requireAdminScope({ superOnly: true });
  const id = str(formData, "id");
  const status = str(formData, "status"); // CONTACTED | REJECTED

  await run("/admin/requests", () =>
    db.serviceRequest.update({ where: { id }, data: { status } })
  );
}

/** Activate a request: mark ACTIVE + create ClientService + set facility plan. */
export async function activateServiceRequest(formData: FormData) {
  await requireAdminScope({ superOnly: true });
  const id = str(formData, "id");
  const planTier = str(formData, "planTier") || "BASIC";
  const monthlyFee = Number(str(formData, "monthlyFee") || "0");

  await run("/admin/requests", async () => {
    const request = await db.serviceRequest.findUnique({
      where: { id },
      include: { package: true },
    });
    if (!request) return "Request not found.";

    let facilityId = request.facilityId;
    // If the request has no linked facility yet, create one in the first city.
    // Facility type follows the requested business type where a directory type
    // exists (pharmacies aren't a directory type yet — fall back to Clinic).
    if (!facilityId) {
      const city = await db.city.findFirst({ orderBy: { name: "asc" } });
      const preferredTypeName =
        request.businessType === "HOSPITAL"
          ? "Hospital"
          : request.businessType === "LAB"
            ? "Lab"
            : "Clinic";
      let type = await db.facilityType.findFirst({
        where: { name: preferredTypeName },
      });
      if (!type) {
        type = await db.facilityType.findFirst({ where: { name: "Clinic" } });
      }
      if (!city || !type) return "No city/type found to create a facility.";
      const facility = await db.facility.create({
        data: {
          name: request.businessName,
          address: `${request.businessName}, ${city.name}`,
          email: request.email,
          phone: request.phone,
          cityId: city.id,
          typeId: type.id,
          isVerified: false,
        },
      });
      facilityId = facility.id;
    }

    const platforms =
      request.package?.platforms ??
      '["instagram","linkedin","x","facebook","website"]';

    await db.clientService.upsert({
      where: { facilityId },
      update: {
        planTier,
        platforms,
        monthlyFee: monthlyFee || request.package?.priceLabel
          ? monthlyFee
          : 0,
        isActive: true,
        requestId: request.id,
      },
      create: {
        facilityId,
        requestId: request.id,
        planTier,
        platforms,
        monthlyFee,
      },
    });
    await db.facility.update({
      where: { id: facilityId },
      data: { planTier },
    });
    await db.serviceRequest.update({
      where: { id },
      data: { status: "ACTIVE", facilityId },
    });
  });
}

/** Edit an active client engagement (plan, platforms, fee, active flag). */
export async function updateClientService(formData: FormData) {
  await requireAdminScope({ superOnly: true });
  const id = str(formData, "id");
  const planTier = str(formData, "planTier") || "BASIC";
  const monthlyFee = Number(str(formData, "monthlyFee") || "0");
  const isActive = str(formData, "isActive") === "on";
  const platforms = formData
    .getAll("platforms")
    .map((p) => String(p))
    .filter(Boolean);

  await run("/admin/clients", async () => {
    const client = await db.clientService.update({
      where: { id },
      data: { planTier, monthlyFee, isActive, platforms: JSON.stringify(platforms) },
    });
    await db.facility.update({
      where: { id: client.facilityId },
      data: { planTier: isActive ? planTier : "NONE" },
    });
  });
}

/* ------------------------------ social post log ---------------------------- */

export async function addSocialPost(formData: FormData) {
  await requireAdminScope({ superOnly: true });
  const clientServiceId = str(formData, "clientServiceId");
  const platform = str(formData, "platform") || "instagram";
  const content = str(formData, "content");
  const scheduledFor = str(formData, "scheduledFor");

  await run(`/admin/social/${clientServiceId}`, async () => {
    if (!content) return "Post content is required.";
    await db.socialPost.create({
      data: {
        clientServiceId,
        platform,
        content,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      },
    });
  });
}

export async function markPostPosted(formData: FormData) {
  await requireAdminScope({ superOnly: true });
  const id = str(formData, "id");
  const postUrl = str(formData, "postUrl");
  const clientServiceId = str(formData, "clientServiceId");

  await run(`/admin/social/${clientServiceId}`, () =>
    db.socialPost.update({
      where: { id },
      data: { status: "POSTED", postedAt: new Date(), postUrl: postUrl || null },
    })
  );
}

export async function deleteSocialPost(formData: FormData) {
  await requireAdminScope({ superOnly: true });
  const id = str(formData, "id");
  const clientServiceId = str(formData, "clientServiceId");

  await run(`/admin/social/${clientServiceId}`, () =>
    db.socialPost.delete({ where: { id } })
  );
}

/* ---------------------------- portfolio editor ----------------------------- */

const SOCIAL_FIELDS = ["instagram", "x", "linkedin", "facebook", "website"] as const;

export async function savePortfolio(formData: FormData) {
  const facilityId = str(formData, "facilityId");
  const tagline = str(formData, "tagline");
  const services = str(formData, "services")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const openingHours = str(formData, "openingHours");
  const planTier = str(formData, "planTier") || "NONE";
  const gallery = str(formData, "gallery")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const socials: Record<string, string> = {};
  for (const field of SOCIAL_FIELDS) {
    const value = str(formData, `social_${field}`);
    if (value) socials[field] = value;
  }

  // Scope check: super admin, or the country admin whose panel contains the facility
  const scope = await getAdminScopeForPortfolio();
  if (!scope) redirect("/admin/login");

  await run("/admin/facilities", async () => {
    // Country admins can only touch facilities inside their panel
    if (scope.type === "COUNTRY") {
      const facility = await db.facility.findUnique({
        where: { id: facilityId },
        select: { city: { select: { countryId: true } } },
      });
      if (facility?.city.countryId !== scope.countryId) {
        return "This facility belongs to another country.";
      }
    }
    await db.facility.update({
      where: { id: facilityId },
      data: {
        portfolioTagline: tagline || null,
        portfolioServices: JSON.stringify(services),
        openingHours: openingHours || null,
        planTier: planTier as "NONE",
        images: JSON.stringify(gallery),
        socials: JSON.stringify(socials),
      },
    });
  });
}

/** Portfolio editing is allowed for super admin and the facility's country admin. */
async function getAdminScopeForPortfolio() {
  const ctx = await import("@/lib/adminContext").then((m) => m.getAdminContext());
  if (!ctx) return null;
  if (ctx.mode === "COUNTRY") {
    return {
      type: "COUNTRY" as const,
      countryId: ctx.countryId,
      countryName: ctx.countryName,
      countryCode: ctx.countryCode,
    };
  }
  return { type: "SUPER" as const };
}
