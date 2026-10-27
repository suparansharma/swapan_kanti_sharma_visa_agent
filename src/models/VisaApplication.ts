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
  costAmount?: number; // ভিসা প্রসেসিং খরচ (VisaCost থেকে)
  profitAmount?: number; // এজেন্সির লাভ (totalAmount - costAmount)
  feeStatus: "paid" | "partial" | "pending";
  notes?: string;
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
    costAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    profitAmount: {
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

// Pre-save hook to ensure dueAmount and profitAmount are correctly calculated
VisaApplicationSchema.pre("save", function () {
  this.dueAmount = Math.max(0, (this.totalAmount || 0) - (this.paidAmount || 0));
  if (this.totalAmount && !this.feeAmount) {
    this.feeAmount = this.totalAmount;
  }
  if (this.costAmount !== undefined && this.costAmount > 0) {
    this.profitAmount = Math.max(0, (this.totalAmount || 0) - (this.costAmount || 0));
  }
});

// Search indexes for rapid lookup by trackingId or passportNumber
VisaApplicationSchema.index({ trackingId: 1 });
VisaApplicationSchema.index({ passportNumber: 1 });

if (mongoose.models.VisaApplication) {
  delete (mongoose.models as Record<string, unknown>).VisaApplication;
}

const VisaApplication: Model<IVisaApplication> =
  mongoose.models.VisaApplication ||
  mongoose.model<IVisaApplication>("VisaApplication", VisaApplicationSchema);

export default VisaApplication;
