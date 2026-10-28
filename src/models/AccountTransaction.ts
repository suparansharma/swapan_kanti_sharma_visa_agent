import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAccountTransaction extends Document {
  transactionNumber: string; // e.g. TX-1001
  type: "collection" | "expense"; // collection = টাকা জমা/আদায়, expense = ফাইল খরচ
  moduleType: "passport" | "visa" | "other";
  referenceId: string; // e.g. "PS-001" or "VS-001"
  relatedId?: mongoose.Types.ObjectId;
  applicantName: string;
  phone?: string;
  serviceTitle?: string;
  category: string; // e.g. "বকেয়া আদায়", "এম্বাসি ফি", "মেডিকেল ফি", "পুলিশ ভেরিফিকেশন", "বায়োমেট্রিক ফি", "অন্যান্য"
  amount: number;
  paymentMethod: "cash" | "bank" | "bkash" | "nagad" | "other";
  notes?: string;
  date: Date;
  createdBy?: mongoose.Types.ObjectId;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AccountTransactionSchema = new Schema<IAccountTransaction>(
  {
    transactionNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ["collection", "expense"],
      required: true,
    },
    moduleType: {
      type: String,
      enum: ["passport", "visa", "other"],
      default: "other",
    },
    referenceId: {
      type: String,
      required: [true, "Tracking number / Reference ID is required"],
      trim: true,
      uppercase: true,
    },
    relatedId: {
      type: Schema.Types.ObjectId,
    },
    applicantName: {
      type: String,
      required: [true, "Applicant name is required"],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    serviceTitle: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be a positive number"],
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank", "bkash", "nagad", "other"],
      default: "cash",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    createdByName: {
      type: String,
      default: "সিস্টেম",
    },
  },
  {
    timestamps: true,
  }
);

AccountTransactionSchema.index({ referenceId: 1 });
AccountTransactionSchema.index({ type: 1 });
AccountTransactionSchema.index({ date: -1 });
AccountTransactionSchema.index({ createdAt: -1 });

if (mongoose.models.AccountTransaction) {
  delete (mongoose.models as Record<string, unknown>).AccountTransaction;
}

const AccountTransaction: Model<IAccountTransaction> =
  mongoose.models.AccountTransaction ||
  mongoose.model<IAccountTransaction>("AccountTransaction", AccountTransactionSchema);

export default AccountTransaction;
