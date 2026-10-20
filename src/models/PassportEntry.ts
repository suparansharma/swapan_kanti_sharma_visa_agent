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
  status:
    | "submitted"
    | "biometric_pending"
    | "police_verification"
    | "ready_for_pickup"
    | "delivered";
  deliveryDate?: Date;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
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
    deliveryDate: {
      type: Date,
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
PassportEntrySchema.pre("save", function () {
  this.dueAmount = Math.max(0, (this.totalAmount || 0) - (this.paidAmount || 0));
});

PassportEntrySchema.index({ entryNumber: 1 });
PassportEntrySchema.index({ nid: 1 });
PassportEntrySchema.index({ mobile: 1 });

const PassportEntry: Model<IPassportEntry> =
  mongoose.models.PassportEntry ||
  mongoose.model<IPassportEntry>("PassportEntry", PassportEntrySchema);

export default PassportEntry;
