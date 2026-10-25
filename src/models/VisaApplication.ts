import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVisaApplication extends Document {
  trackingId: string;
  applicantName: string;
  passportNumber: string;
  phone: string;
  email?: string;
  destinationCountry: string;
  serviceType:
    | "passport_new"
    | "passport_renewal"
    | "tourist_visa"
    | "student_visa"
    | "work_permit"
    | "business_visa"
    | "medical_visa"
    | "medical_attendant";
  status:
    | "submitted"
    | "document_verification"
    | "embassy_processing"
    | "biometric_pending"
    | "approved"
    | "ready_for_pickup"
    | "delivered";
  applicationDate: Date;
  estimatedDelivery?: Date;
  feeAmount: number;
  totalAmount: number; // কত টাকা নিবে তার কাছে
  paidAmount: number;  // সে কত টাকা দিছে
  dueAmount: number;   // বকেয়া টাকা
  feeStatus: "paid" | "partial" | "pending";
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
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
      required: [true, "Destination country is required"],
      trim: true,
    },
    serviceType: {
      type: String,
      enum: [
        "passport_new",
        "passport_renewal",
        "tourist_visa",
        "student_visa",
        "work_permit",
        "business_visa",
        "medical_visa",
        "medical_attendant",
      ],
      default: "tourist_visa",
    },
    status: {
      type: String,
      enum: [
        "submitted",
        "document_verification",
        "embassy_processing",
        "biometric_pending",
        "approved",
        "ready_for_pickup",
        "delivered",
      ],
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
    notes: {
      type: String,
      default: "",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
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

// Search indexes for rapid lookup by trackingId or passportNumber
VisaApplicationSchema.index({ trackingId: 1 });
VisaApplicationSchema.index({ passportNumber: 1 });

const VisaApplication: Model<IVisaApplication> =
  mongoose.models.VisaApplication ||
  mongoose.model<IVisaApplication>("VisaApplication", VisaApplicationSchema);

export default VisaApplication;
