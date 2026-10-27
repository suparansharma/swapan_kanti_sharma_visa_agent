export interface VisaStatusItem {
  value: string;
  label: string;
  bg: string;
  color: string;
  isMedicalOnly?: boolean;
}

// সাধারণ স্ট্যাটাস তালিকা (সবার জন্য প্রযোজ্য)
export const VISA_GENERAL_STATUSES: VisaStatusItem[] = [
  {
    value: "submitted",
    label: "আবেদন জমা",
    bg: "rgba(99, 102, 241, 0.15)",
    color: "#818cf8",
  },
  {
    value: "document_verification",
    label: "ডকুমেন্ট যাচাই",
    bg: "rgba(245, 158, 11, 0.15)",
    color: "#fbbf24",
  },
  {
    value: "visa_processing",
    label: "ভিসা প্রসেসিং",
    bg: "rgba(14, 165, 233, 0.15)",
    color: "#38bdf8",
  },
  {
    value: "ready_for_appointment",
    label: "এপয়েন্টমেন্টের জন্য প্রস্তুত",
    bg: "rgba(167, 139, 250, 0.15)",
    color: "#a78bfa",
  },
  {
    value: "appointment_slot_pending",
    label: "এপয়েন্টমেন্ট স্লট বাকি",
    bg: "rgba(244, 114, 182, 0.15)",
    color: "#f472b6",
  },
  {
    value: "appointment_slot_done",
    label: "এপয়েন্টমেন্ট স্লট ডান",
    bg: "rgba(45, 212, 191, 0.15)",
    color: "#2dd4bf",
  },
  {
    value: "ready_for_delivery",
    label: "ডেলিভারির জন্য প্রস্তুত",
    bg: "rgba(16, 185, 129, 0.18)",
    color: "#34d399",
  },
  {
    value: "delivery_completed",
    label: "ডেলিভারির সম্পুর্ন",
    bg: "rgba(59, 130, 246, 0.2)",
    color: "#60a5fa",
  },
];

// শুধু মেডিক্যাল সার্ভিস এবং মেডিক্যাল পেশেন্ট ভিসা টাইপের জন্য স্পেশাল স্ট্যাটাস
export const VISA_MEDICAL_STATUSES: VisaStatusItem[] = [
  {
    value: "dr_ayush_sent",
    label: "ড.. এপয়েন্টমেন্টে/আয়ুষ পাঠানো হয়েছে",
    bg: "rgba(192, 132, 252, 0.18)",
    color: "#c084fc",
    isMedicalOnly: true,
  },
  {
    value: "dr_ayush_done",
    label: "ড.. এপয়েন্টমেন্টে/আয়ুষ ডান",
    bg: "rgba(16, 185, 129, 0.18)",
    color: "#34d399",
    isMedicalOnly: true,
  },
  {
    value: "dr_ayush_not_received",
    label: "ড.. এপয়েন্টমেন্টে/আয়ুষ পায়নি",
    bg: "rgba(248, 113, 113, 0.18)",
    color: "#f87171",
    isMedicalOnly: true,
  },
  {
    value: "dr_appointment_received",
    label: "ড.. এপয়েন্টমেন্টে পেয়েছি",
    bg: "rgba(34, 197, 94, 0.18)",
    color: "#22c55e",
    isMedicalOnly: true,
  },
  {
    value: "ayush_letter_received",
    label: "আয়ুষ লেটার পেয়েছি",
    bg: "rgba(6, 182, 212, 0.18)",
    color: "#06b6d4",
    isMedicalOnly: true,
  },
  {
    value: "dr_appointment_not_received",
    label: "ড.. এপয়েন্টমেন্টে পায়নি",
    bg: "rgba(239, 68, 68, 0.18)",
    color: "#ef4444",
    isMedicalOnly: true,
  },
  {
    value: "ayush_letter_not_received",
    label: "আয়ুষ লেটার পায়নি",
    bg: "rgba(244, 63, 94, 0.18)",
    color: "#f43f5e",
    isMedicalOnly: true,
  },
];

export const ALL_VISA_STATUSES: VisaStatusItem[] = [
  ...VISA_GENERAL_STATUSES,
  ...VISA_MEDICAL_STATUSES,
];

/**
 * শর্ত পরীক্ষা:
 * শুধু সার্ভিস ধরন মেডিক্যাল এবং ভিসা টাইপ মেডিক্যাল পেশেন্ট হলে ট্রু (true) রিটার্ন করবে।
 */
export function isMedicalPatient(
  serviceType?: string | null,
  visaType?: string | null
): boolean {
  if (!serviceType) return false;
  const s = serviceType.toLowerCase().trim();

  // সার্ভিস ধরন অবশ্যই মেডিকেল হতে হবে
  const isMedService =
    s === "medical_visa" ||
    s === "medical" ||
    s === "medical_patient" ||
    s.includes("মেডিকেল");

  if (!isMedService) return false;

  // যদি সার্ভিস ধরন এটেন্ডেন্ট হয় তবে পেশেন্ট নয়
  if (
    s === "medical_attendant" ||
    s.includes("attendant") ||
    s.includes("এটেন্ডেন্ট")
  ) {
    return false;
  }

  // ভিসা টাইপ চেক
  if (!visaType || visaType.trim() === "") {
    // সার্ভিস মেডিকেল ভিসা থাকলে ডিফল্টভাবে পেশেন্ট হিসেবে গণ্য
    return true;
  }

  const v = visaType.toLowerCase().trim();

  // ভিসা টাইপে এটেন্ডেন্ট থাকলে তা পেশেন্ট নয়
  if (
    v.includes("m2") ||
    v.includes("m4") ||
    v.includes("attendant") ||
    v.includes("এটেন্ডেন্ট")
  ) {
    return false;
  }

  return true;
}

/**
 * সার্ভিস ধরন ও ভিসা টাইপের ওপর ভিত্তি করে অনুমোদনযোগ্য স্ট্যাটাস তালিকা রিটার্ন করে
 */
export function getAvailableVisaStatuses(
  serviceType?: string | null,
  visaType?: string | null,
  currentStatus?: string | null
): VisaStatusItem[] {
  const isMed = isMedicalPatient(serviceType, visaType);
  if (isMed) {
    return ALL_VISA_STATUSES;
  }

  // যদি বর্তমান স্ট্যাটাস ইতোমধ্যে কোনো মেডিক্যাল স্ট্যাটাসে থেকে থাকে, তাহলে ড্রপডাউনে সেটি দেখতে পাওয়ার সুযোগ রাখা যাতে ব্রেক না করে
  if (currentStatus) {
    const medItem = VISA_MEDICAL_STATUSES.find((m) => m.value === currentStatus);
    if (medItem) {
      return [...VISA_GENERAL_STATUSES, medItem];
    }
  }

  return VISA_GENERAL_STATUSES;
}

/**
 * স্ট্যাটাসের কালার ও বাংলা লেবেল রিটার্ন করে
 */
export function getVisaStatusBadge(status: string): {
  label: string;
  bg: string;
  color: string;
} {
  const found = ALL_VISA_STATUSES.find((item) => item.value === status);
  if (found) {
    return { label: found.label, bg: found.bg, color: found.color };
  }

  // পূর্ববর্তী ভার্সনের স্ট্যাটাসের জন্য ব্যাকওয়ার্ড কম্প্যাটিবিলিটি
  switch (status) {
    case "embassy_processing":
      return {
        label: "ভিসা প্রসেসিং",
        bg: "rgba(14, 165, 233, 0.15)",
        color: "#38bdf8",
      };
    case "biometric_pending":
      return {
        label: "এপয়েন্টমেন্ট স্লট বাকি",
        bg: "rgba(244, 114, 182, 0.15)",
        color: "#f472b6",
      };
    case "approved":
      return {
        label: "ভিসা অনুমোদিত",
        bg: "rgba(16, 185, 129, 0.2)",
        color: "#34d399",
      };
    case "ready_for_pickup":
      return {
        label: "ডেলিভারির জন্য প্রস্তুত",
        bg: "rgba(16, 185, 129, 0.25)",
        color: "#10b981",
      };
    case "delivered":
      return {
        label: "ডেলিভারির সম্পুর্ন",
        bg: "rgba(59, 130, 246, 0.2)",
        color: "#60a5fa",
      };
    default:
      return {
        label: status || "অজানা",
        bg: "rgba(255, 255, 255, 0.1)",
        color: "#ffffff",
      };
  }
}
