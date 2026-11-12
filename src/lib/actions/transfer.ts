"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { notify, notifyAdmins } from "@/lib/notifications";
import { formatDateUTC } from "@/lib/utils";

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

const ACTIVE_STATUSES = ["NEW", "ACCEPTED"];

export type TransferState = { error?: string; success?: string };

/* ------------------------- patient: create transfer ----------------------- */

export async function createHistoryTransfer(
  _prev: TransferState,
  formData: FormData
): Promise<TransferState> {
  const session = await getSession();
  if (!session || session.role !== "PATIENT") {
    return { error: "Please sign in as a patient to transfer history." };
  }

  const sourceFacilityId = str(formData, "sourceFacilityId");
  const targetFacilityId = str(formData, "targetFacilityId");
  const note = str(formData, "note");
  const appointmentIds = formData
    .getAll("appointmentIds")
    .map((v) => String(v))
    .filter(Boolean);

  if (!targetFacilityId) return { error: "Choose a destination facility." };
  if (sourceFacilityId && sourceFacilityId === targetFacilityId) {
    return { error: "Source and destination facility must be different." };
  }
  if (appointmentIds.length === 0) {
    return { error: "Select at least one record to share." };
  }

  const [target, source, appointments] = await Promise.all([
    db.facility.findUnique({
      where: { id: targetFacilityId },
      include: { departmentUsers: { where: { role: "DEPARTMENT" }, select: { id: true } } },
    }),
    sourceFacilityId
      ? db.facility.findUnique({ where: { id: sourceFacilityId } })
      : Promise.resolve(null),
    db.appointment.findMany({
      where: { id: { in: appointmentIds }, patientId: session.userId },
    }),
  ]);

  if (!target || !target.isActive) return { error: "Destination facility not found." };
  if (target.departmentUsers.length === 0) {
    return { error: "That facility cannot receive records yet — no department account." };
  }
  if (sourceFacilityId && !source) return { error: "Source facility not found." };
  if (appointments.length !== appointmentIds.length) {
    return { error: "Some selected records do not belong to your account." };
  }

  // One active transfer per (patient, target) keeps the flow clean.
  const existing = await db.historyTransfer.findFirst({
    where: { patientId: session.userId, targetFacilityId, status: { in: ACTIVE_STATUSES } },
  });
  if (existing) {
    return { error: "You already have an active transfer to this facility." };
  }

  const transfer = await db.historyTransfer.create({
    data: {
      patientId: session.userId,
      sourceFacilityId: sourceFacilityId || null,
      targetFacilityId,
      note: note || null,
      items: {
        create: appointmentIds.map((appointmentId) => ({ appointmentId })),
      },
    },
  });

  const count = appointments.length;
  for (const deptUser of target.departmentUsers) {
    await notify(
      deptUser.id,
      "Patient history transfer request 📂",
      `${session.name} wants to share ${count} medical record${count === 1 ? "" : "s"} with ${target.name}. Review it in Booking Requests.`
    );
  }
  await notifyAdmins(
    "History transfer requested",
    `${session.name} requested a history transfer to ${target.name} (${count} record${count === 1 ? "" : "s"}).`
  );

  revalidatePath("/account/transfer");
  revalidatePath("/department");
  return {
    success:
      "✅ Transfer request sent! The destination facility will accept or decline it — you can revoke access anytime after acceptance.",
  };
}

/* ------------------ department: accept or decline transfer ----------------- */

export async function respondHistoryTransfer(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "DEPARTMENT") redirect("/login?next=/department");

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { facilityId: true, facility: { select: { name: true } } },
  });
  if (!user?.facilityId) redirect("/");

  const id = str(formData, "id");
  const decision = str(formData, "decision"); // accept | decline
  const reason = str(formData, "reason");

  const transfer = await db.historyTransfer.findUnique({
    where: { id },
    include: {
      patient: { select: { id: true, name: true } },
      items: { include: { appointment: { include: { doctor: { select: { name: true } } } } } },
    },
  });

  if (!transfer || transfer.targetFacilityId !== user.facilityId) {
    redirect("/department?error=" + encodeURIComponent("Transfer request not found."));
  }
  if (transfer.status !== "NEW") {
    redirect("/department?error=" + encodeURIComponent("This request was already handled."));
  }
  if (decision === "decline" && !reason) {
    redirect("/department?error=" + encodeURIComponent("Please write a short reason to decline."));
  }

  const recordSummary =
    transfer.items[0]?.appointment.doctor.name ?? "medical records";

  if (decision === "accept") {
    await db.historyTransfer.update({
      where: { id },
      data: { status: "ACCEPTED", decidedAt: new Date() },
    });
    await notify(
      transfer.patient.id,
      "History transfer accepted ✅",
      `${user.facility?.name} accepted your medical history (${transfer.items.length} record${transfer.items.length === 1 ? "" : "s"}). Their team can now view it.`
    );
    await notifyAdmins(
      "History transfer accepted",
      `${user.facility?.name} accepted ${transfer.patient.name}'s history transfer (${recordSummary}).`
    );
  } else {
    await db.historyTransfer.update({
      where: { id },
      data: { status: "DECLINED", declineReason: reason, decidedAt: new Date() },
    });
    await notify(
      transfer.patient.id,
      "History transfer declined ↩️",
      `${user.facility?.name} declined your transfer request. Reason: ${reason}`
    );
    await notifyAdmins(
      "History transfer declined",
      `${user.facility?.name} declined ${transfer.patient.name}'s history transfer. Reason: ${reason}`
    );
  }

  revalidatePath("/department");
  revalidatePath("/department/records");
  revalidatePath("/account/transfer");
  redirect("/department");
}

/* --------------------- patient: cancel a pending request ------------------- */

export async function cancelHistoryTransfer(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "PATIENT") redirect("/login?next=/account/transfer");

  const id = str(formData, "id");
  const transfer = await db.historyTransfer.findUnique({ where: { id } });
  if (transfer && transfer.patientId === session.userId && transfer.status === "NEW") {
    await db.historyTransfer.update({ where: { id }, data: { status: "CANCELLED" } });
    await notifyAdmins(
      "History transfer cancelled",
      `${session.name} cancelled a history transfer request.`
    );
  }
  revalidatePath("/account/transfer");
  redirect("/account/transfer");
}

/* ---------------- patient: revoke accepted sharing access ------------------ */

export async function revokeHistoryTransfer(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "PATIENT") redirect("/login?next=/account/transfer");

  const id = str(formData, "id");
  const transfer = await db.historyTransfer.findUnique({
    where: { id },
    include: { targetFacility: { select: { name: true } } },
  });
  if (transfer && transfer.patientId === session.userId && transfer.status === "ACCEPTED") {
    await db.historyTransfer.update({
      where: { id },
      data: { status: "REVOKED", decidedAt: new Date() },
    });
    const deptUsers = await db.user.findMany({
      where: { role: "DEPARTMENT", facilityId: transfer.targetFacilityId },
      select: { id: true },
    });
    for (const deptUser of deptUsers) {
      await notify(
        deptUser.id,
        "Patient revoked history access ⛔",
        `${session.name} revoked your facility's access to their shared medical history.`
      );
    }
    await notifyAdmins(
      "History transfer revoked",
      `${session.name} revoked the history transfer to ${transfer.targetFacility.name}.`
    );
  }
  revalidatePath("/account/transfer");
  revalidatePath("/department/records");
  redirect("/account/transfer");
}
