import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPassportEntry extends Document {
  entryNumber: string;
  name: string;
  mobile: string;
  email?: string;
  nid: string;
  birthDate: string;
  passportType: string;
  totalAmount: number; // কত টাকা নিবে তার কাছে
  paidAmount: number; // সে কত টাকা দিছে
  dueAmount: number; // বকেয়া টাকা
  onlineTrackId?: string; // Online Track ID (e.g. OID / Application Tracking ID)
  status:
    | "submitted"
    | "biometric_pending"
    | "police_verification"
    | "ready_for_pickup"
    | "delivered";
  receivedDate?: string; // রিসিভ তারিখ / Received Date
  receivedBy?: string; // রিসিভ করেছেন যিনি (Received By)
  receivedByEmployeeId?: string; // Employee ID of receiver
  deliveryDate?: Date;
  notes?: string;
  applicationCategory?: "individual" | "family_group"; // আবেদনের ধরন
  isFamilyHead?: boolean; // পরিবার প্রধান কিনা
  familyGroupId?: string; // ফ্যামিলি গ্রুপ আইডি (e.g. FAM-PS-001)
  familyHeadEntryNumber?: string; // পরিবার প্রধানের এন্ট্রি নম্বর (e.g. PS-001)
  familyHeadName?: string; // পরিবার প্রধানের নাম
  familyRelation?: string; // সম্পর্ক (যেমন: প্রধান, স্ত্রী, সন্তান)
  familyMemberCount?: number; // ফ্যামিলি প্যাকেজে মোট সদস্য সংখ্যা
  groupMembersSummary?: string; // সদস্য তালিকা সংক্ষেপ
  createdBy?: mongoose.Types.ObjectId;
  createdByName?: string;
  updatedBy?: mongoose.Types.ObjectId;
  updatedByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PassportEntrySchema = new Schema<IPassportEntry>(
  {
    entryNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    nid: {
      type: String,
      required: [true, "NID number is required"],
      trim: true,
    },
    birthDate: {
      type: String,
      required: [true, "Birth date is required"],
      trim: true,
    },
    passportType: {
      type: String,
      default: "e_passport_10y_48p",
    },
    totalAmount: {
      type: Number,
      required: [true, "Total agreed amount is required"],
      default: 0,
    },
    paidAmount: {
      type: Number,
      required: [true, "Paid amount is required"],
      default: 0,
    },
    dueAmount: {
      type: Number,
      default: 0,
    },
    onlineTrackId: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "submitted",
        "biometric_pending",
        "police_verification",
        "ready_for_pickup",
        "delivered",
      ],
      default: "submitted",
    },
    receivedDate: {
      type: String,
      default: "",
      trim: true,
    },
    receivedBy: {
      type: String,
      trim: true,
      default: "",
    },
    receivedByEmployeeId: {
      type: String,
      trim: true,
      default: "",
    },
    deliveryDate: {
      type: Date,
    },
    notes: {
      type: String,
      default: "",
    },
    applicationCategory: {
      type: String,
      enum: ["individual", "family_group"],
      default: "individual",
    },
    isFamilyHead: {
      type: Boolean,
      default: false,
    },
    familyGroupId: {
      type: String,
      trim: true,
      default: "",
    },
    familyHeadEntryNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    familyHeadName: {
      type: String,
      trim: true,
      default: "",
    },
    familyRelation: {
      type: String,
      trim: true,
      default: "",
    },
    familyMemberCount: {
      type: Number,
      default: 1,
    },
    groupMembersSummary: {
      type: String,
      default: "",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    createdByName: {
      type: String,
      trim: true,
      default: "",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    updatedByName: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to ensure dueAmount is correctly calculated
PassportEntrySchema.pre("save", function () {
  this.dueAmount = Math.max(0, (this.totalAmount || 0) - (this.paidAmount || 0));
});

PassportEntrySchema.index({ entryNumber: 1 });
PassportEntrySchema.index({ createdAt: -1 });
PassportEntrySchema.index({ nid: 1 });
PassportEntrySchema.index({ mobile: 1 });
PassportEntrySchema.index({ familyGroupId: 1 });
PassportEntrySchema.index({ familyHeadEntryNumber: 1 });

const PassportEntry: Model<IPassportEntry> =
  mongoose.models.PassportEntry ||
  mongoose.model<IPassportEntry>("PassportEntry", PassportEntrySchema);

export default PassportEntry;
