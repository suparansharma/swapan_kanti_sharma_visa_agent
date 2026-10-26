import mongoose, { Schema, Document } from "mongoose";

export interface IDesignation extends Document {
  title: string;
  department?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DesignationSchema = new Schema<IDesignation>(
  {
    title: {
      type: String,
      required: [true, "Designation title is required"],
      trim: true,
      unique: true,
    },
    department: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Designation ||
  mongoose.model<IDesignation>("Designation", DesignationSchema);
