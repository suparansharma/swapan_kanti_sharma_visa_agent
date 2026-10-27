import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVisaCost extends Document {
  country: string; // e.g. "India", "Saudi Arabia", "Canada", etc.
  visaType: string; // e.g. "tourist_visa", "medical_visa", "business_visa", etc.
  title: string; // e.g. "ভারত ট্যুরিস্ট ভিসা (IVAC প্রসেসিং)"
  embassyFee: number; // সরকারি ভিসা বা এম্বাসি ফি
  vfsCharge: number; // ভিএফএস / আইভিএসি / এপয়েন্টমেন্ট চার্জ
  processingFee: number; // ফাইল প্রসেসিং ও অফিস সার্ভিস চার্জ
  otherFee: number; // অন্যান্য / ইনস্যুরেন্স / নোটারি / ব্যাংক চার্জ
  totalCost: number; // সর্বমোট খরচ = embassyFee + vfsCharge + processingFee + otherFee
  clientFee?: number; // গ্রাহকের থেকে ধার্যকৃত স্ট্যান্ডার্ড রেট (ঐচ্ছিক)
  estimatedProfit?: number; // এজেন্সির আনুমানিক লাভ (clientFee - totalCost)
  duration?: string; // সম্ভাব্য সময়সীমা (যেমন: ৭-১০ কর্মদিবস)
  validity?: string; // ভিসার মেয়াদ (যেমন: ৩ মাস, ৬ মাস, ১ বছর, ৫ বছর)
  entryType?: string; // "Single Entry", "Multiple Entry", "Double Entry"
  description?: string; // বিবরণ বা শর্তাবলি
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdByName?: string;
  updatedBy?: mongoose.Types.ObjectId;
  updatedByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VisaCostSchema = new Schema<IVisaCost>(
  {
    country: {
      type: String,
      required: [true, "Destination country is required"],
      trim: true,
      default: "India",
    },
    visaType: {
      type: String,
      required: [true, "Visa type is required"],
      trim: true,
      default: "tourist_visa",
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    embassyFee: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    vfsCharge: {
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
      default: "৭-১০ কর্মদিবস",
    },
    validity: {
      type: String,
      trim: true,
      default: "১ বছর",
    },
    entryType: {
      type: String,
      trim: true,
      default: "Multiple Entry",
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

// Pre-save hook to calculate totalCost and estimatedProfit
VisaCostSchema.pre("save", function () {
  const e = Number(this.embassyFee) || 0;
  const v = Number(this.vfsCharge) || 0;
  const p = Number(this.processingFee) || 0;
  const o = Number(this.otherFee) || 0;
  this.totalCost = Math.round(e + v + p + o);

  const c = Number(this.clientFee) || 0;
  if (c > 0) {
    this.estimatedProfit = Math.round(c - this.totalCost);
  } else {
    this.estimatedProfit = 0;
  }
});

VisaCostSchema.index({ country: 1, visaType: 1 });

if (mongoose.models.VisaCost) {
  delete (mongoose.models as Record<string, unknown>).VisaCost;
}

const VisaCost: Model<IVisaCost> =
  mongoose.models.VisaCost ||
  mongoose.model<IVisaCost>("VisaCost", VisaCostSchema);

export default VisaCost;
