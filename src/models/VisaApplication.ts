import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVisaApplication extends Document {
  trackingId: string;
  applicantName: string;
  passportNumber: string;
  phone: string;
  email?: string;
  destinationCountry: string;
  visaType?: string;
  serviceType: string;
  status: string;
  applicationDate: Date;
  estimatedDelivery?: Date;
  feeAmount: number;
  totalAmount: number; // কত টাকা নিবে তার কাছে
  paidAmount: number;  // সে কত টাকা দিছে
  dueAmount: number;   // বকেয়া টাকা
  feeStatus: "paid" | "partial" | "pending";
  receivedDate?: string; // রিসিভ তারিখ / Received Date
  receivedBy?: string; // রিসিভ করেছেন যিনি (Received By Employee Name)
  receivedByEmployeeId?: string; // রিসিভকারী কর্মীর আইডি
  notes?: string;
  applicationCategory?: "individual" | "family_group"; // আবেদনের ধরন
  isFamilyHead?: boolean; // পরিবার প্রধান কিনা
  familyGroupId?: string; // ফ্যামিলি গ্রুপ আইডি (e.g. FAM-001)
  familyHeadTrackingId?: string; // পরিবার প্রধানের ট্র্যাকিং আইডি
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

const VisaApplicationSchema = new Schema<IVisaApplication>(
  {
    trackingId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    applicantName: {
      type: String,
      required: [true, "Applicant name is required"],
      trim: true,
    },
    passportNumber: {
      type: String,
      required: [true, "Passport number is required"],
      trim: true,
      uppercase: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    destinationCountry: {
      type: String,
      default: "India",
      trim: true,
    },
    visaType: {
      type: String,
      trim: true,
      default: "",
    },
    serviceType: {
      type: String,
      default: "tourist_visa",
    },
    status: {
      type: String,
      default: "submitted",
    },
    applicationDate: {
      type: Date,
      default: Date.now,
    },
    estimatedDelivery: {
      type: Date,
    },
    feeAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    dueAmount: {
      type: Number,
      default: 0,
    },
    feeStatus: {
      type: String,
      enum: ["paid", "partial", "pending"],
      default: "pending",
    },
    receivedDate: {
      type: String,
      default: "",
      trim: true,
    },
    receivedBy: {
      type: String,
      default: "",
      trim: true,
    },
    receivedByEmployeeId: {
      type: String,
      default: "",
      trim: true,
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
    familyHeadTrackingId: {
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
      default: "",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    updatedByName: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to ensure dueAmount is correctly calculated
VisaApplicationSchema.pre("save", function () {
  this.dueAmount = Math.max(0, (this.totalAmount || 0) - (this.paidAmount || 0));
  if (this.totalAmount && !this.feeAmount) {
    this.feeAmount = this.totalAmount;
  }
});

// Search indexes for rapid lookup by trackingId, passport, and filters
VisaApplicationSchema.index({ trackingId: 1 });
VisaApplicationSchema.index({ createdAt: -1 });
VisaApplicationSchema.index({ passportNumber: 1 });
VisaApplicationSchema.index({ familyGroupId: 1 });
VisaApplicationSchema.index({ familyHeadTrackingId: 1 });
VisaApplicationSchema.index({ status: 1, createdAt: -1 });
VisaApplicationSchema.index({ applicationCategory: 1, createdAt: -1 });
VisaApplicationSchema.index({ applicantName: 1 });
VisaApplicationSchema.index({ phone: 1 });

const VisaApplication: Model<IVisaApplication> =
  mongoose.models.VisaApplication ||
  mongoose.model<IVisaApplication>("VisaApplication", VisaApplicationSchema);

export default VisaApplication;
