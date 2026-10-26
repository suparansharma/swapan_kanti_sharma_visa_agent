import mongoose, { Schema, Document } from "mongoose";

export interface IEmployee extends Document {
  employeeId: string;
  name: string;
  phone: string;
  email?: string;
  department: string;
  designation: string;
  joiningDate?: string;
  salary?: number;
  status: "active" | "inactive" | "on_leave";
  address?: string;
  emergencyContact?: string;
  notes?: string;
  userId?: mongoose.Types.ObjectId;
  hasLoginAccount?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, "Employee name is required"],
      trim: true,
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
      default: "",
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    designation: {
      type: String,
      required: [true, "Designation is required"],
      trim: true,
    },
    joiningDate: {
      type: String,
      trim: true,
      default: "",
    },
    salary: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "on_leave"],
      default: "active",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    emergencyContact: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    hasLoginAccount: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

EmployeeSchema.index({ employeeId: 1 });
EmployeeSchema.index({ name: 1 });
EmployeeSchema.index({ phone: 1 });

export default mongoose.models.Employee ||
  mongoose.model<IEmployee>("Employee", EmployeeSchema);
