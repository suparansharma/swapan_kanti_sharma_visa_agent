import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPassportCost extends Document {
  passportType: string; // Key or ID (e.g. 5y_regular_21d)
  title: string; // Label (e.g. ৫ বছর মেয়াদী সাধারণ পাসপোর্ট (২১ কর্ম দিবস))
  govtFee: number; // সরকারি পাসপোর্ট ফি
  bankFee: number; // ব্যাংক চার্জ / ভ্যাট / চালান ফি
  processingFee: number; // অফিস ও প্রসেসিং খরচ
  otherFee: number; // অন্যান্য / যাতায়াত খরচ
  totalCost: number; // সর্বমোট খরচ = govtFee + bankFee + processingFee + otherFee
  clientFee?: number; // গ্রাহকের থেকে ধার্যকৃত স্ট্যান্ডার্ড ফি (ঐচ্ছিক)
  estimatedProfit?: number; // আনুমানিক লাভ (clientFee - totalCost)
  duration?: string; // সম্ভাব্য সময়কাল (যেমন: ২১ কর্মদিবস)
  validityYears?: number; // ৫ অথবা ১০
  pageCount?: number; // ৪৮ অথবা ৬৪
  description?: string; // নোট বা বিশেষ বিবরণ
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdByName?: string;
  updatedBy?: mongoose.Types.ObjectId;
  updatedByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PassportCostSchema = new Schema<IPassportCost>(
  {
    passportType: {
      type: String,
      required: [true, "Passport type key is required"],
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Passport type title is required"],
      trim: true,
    },
    govtFee: {
      type: Number,
      required: [true, "Government fee is required"],
      default: 0,
      min: 0,
    },
    bankFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    processingFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    otherFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCost: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    clientFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    estimatedProfit: {
      type: Number,
      default: 0,
    },
    duration: {
      type: String,
      trim: true,
      default: "২১ কর্মদিবস",
    },
    validityYears: {
      type: Number,
      default: 5,
    },
    pageCount: {
      type: Number,
      default: 48,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
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

// Pre-save hook to recalculate totalCost and estimatedProfit
PassportCostSchema.pre("save", function () {
  const g = Number(this.govtFee) || 0;
  const b = Number(this.bankFee) || 0;
  const p = Number(this.processingFee) || 0;
  const o = Number(this.otherFee) || 0;
  this.totalCost = Math.round(g + b + p + o);

  const c = Number(this.clientFee) || 0;
  if (c > 0) {
    this.estimatedProfit = Math.round(c - this.totalCost);
  } else {
    this.estimatedProfit = 0;
  }
});

PassportCostSchema.index({ passportType: 1 });

const PassportCost: Model<IPassportCost> =
  mongoose.models.PassportCost ||
  mongoose.model<IPassportCost>("PassportCost", PassportCostSchema);

export default PassportCost;
