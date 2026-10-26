import mongoose, { Schema, Document } from "mongoose";

export interface IDepartment extends Document {
  name: string;
  code?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Department ||
  mongoose.model<IDepartment>("Department", DepartmentSchema);
