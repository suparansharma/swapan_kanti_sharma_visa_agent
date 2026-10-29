import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import AccountTransaction from "@/models/AccountTransaction";
import PassportEntry from "@/models/PassportEntry";
import VisaApplication from "@/models/VisaApplication";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const authUser = await getAuthUser();

    const body = await request.json();
    const {
      type, // 'collection' | 'expense'
      referenceId,
      moduleType,
      applicantName,
      phone,
      serviceTitle,
      category,
      amount,
      paymentMethod,
      notes,
      date,
    } = body;

    if (!type || !["collection", "expense"].includes(type)) {
      return NextResponse.json(
        { error: "লেনদেনের ধরন (জমা বা খরচ) সিলেক্ট করুন।" },
        { status: 400 }
      );
    }

    if (!referenceId || !referenceId.trim()) {
      return NextResponse.json(
        { error: "পাসপোর্ট বা ভিসার ট্র্যাকিং নম্বর (Reference ID) প্রদান করুন।" },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: "সঠিক টাকার পরিমাণ প্রদান করুন (০ এর চেয়ে বেশি হতে হবে)।" },
        { status: 400 }
      );
    }

    const effectiveCategory =
      (category && category.trim()) ||
      (type === "collection" ? "বকেয়া আদায় / কিস্তি জমা" : "");

    if (!effectiveCategory) {
      return NextResponse.json(
        { error: "লেনদেনের খাত / বিষয় (Category) নির্বাচন করুন।" },
        { status: 400 }
      );
    }

    const refUpper = referenceId.trim().toUpperCase();

    // Generate next transaction number: TX-1001, TX-1002, ...
    let nextNum = 1001;
    const latestTx = await AccountTransaction.findOne({ transactionNumber: /^TX-\d+$/ })
      .sort({ createdAt: -1 })
      .select("transactionNumber")
      .lean();

    if (latestTx && latestTx.transactionNumber) {
      const match = latestTx.transactionNumber.match(/^TX-(\d+)$/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    } else {
      const count = await AccountTransaction.countDocuments();
      nextNum = 1001 + count;
    }

    let transactionNumber = `TX-${nextNum}`;
    while (await AccountTransaction.exists({ transactionNumber })) {
      nextNum += 1;
      transactionNumber = `TX-${nextNum}`;
    }

    let resolvedModuleType = moduleType || "other";
    if (resolvedModuleType === "other") {
      if (refUpper.startsWith("PS-")) resolvedModuleType = "passport";
      else if (refUpper.startsWith("VS-")) resolvedModuleType = "visa";
    }

    let relatedId = undefined;

    // If client is paying money (Collection), update the linked file's paid & due amounts!
    if (type === "collection") {
      if (resolvedModuleType === "passport" || refUpper.startsWith("PS-")) {
        let passportDoc = await PassportEntry.findOne({ entryNumber: refUpper });
        // If this is a family member (not head), redirect collection to family head document
        if (passportDoc && passportDoc.applicationCategory === "family_group" && !passportDoc.isFamilyHead && passportDoc.familyGroupId) {
          const headDoc = await PassportEntry.findOne({ familyGroupId: passportDoc.familyGroupId, isFamilyHead: true });
          if (headDoc) {
            passportDoc = headDoc;
          }
        }
        if (passportDoc) {
          relatedId = passportDoc._id;
          const newPaid = (passportDoc.paidAmount || 0) + numAmount;
          passportDoc.paidAmount = newPaid;
          passportDoc.dueAmount = Math.max(0, (passportDoc.totalAmount || 0) - newPaid);
          if (authUser?.name) {
            passportDoc.updatedByName = authUser.name;
          }
          await passportDoc.save();
        }
      } else if (resolvedModuleType === "visa" || refUpper.startsWith("VS-")) {
        let visaDoc = await VisaApplication.findOne({ trackingId: refUpper });
        // If this is a family member (not head), redirect collection to family head document
        if (visaDoc && visaDoc.applicationCategory === "family_group" && !visaDoc.isFamilyHead && visaDoc.familyGroupId) {
          const headDoc = await VisaApplication.findOne({ familyGroupId: visaDoc.familyGroupId, isFamilyHead: true });
          if (headDoc) {
            visaDoc = headDoc;
          }
        }
        if (visaDoc) {
          relatedId = visaDoc._id;
          const currentTotal = Number(visaDoc.totalAmount ?? visaDoc.feeAmount) || 0;
          const newPaid = (visaDoc.paidAmount || 0) + numAmount;
          visaDoc.paidAmount = newPaid;
          visaDoc.dueAmount = Math.max(0, currentTotal - newPaid);
          visaDoc.feeStatus = newPaid >= currentTotal ? "paid" : "partial";
          if (authUser?.name) {
            visaDoc.updatedByName = authUser.name;
          }
          await visaDoc.save();

          // Sync feeStatus to all family members so their status immediately reflects paid/partial
          if (visaDoc.familyGroupId) {
            await VisaApplication.updateMany(
              { familyGroupId: visaDoc.familyGroupId, isFamilyHead: false },
              { feeStatus: visaDoc.feeStatus }
            );
          }
        }
      }
    } else {
      // Expense: Still resolve related ID if file exists
      if (resolvedModuleType === "passport" || refUpper.startsWith("PS-")) {
        const pDoc = await PassportEntry.findOne({ entryNumber: refUpper }).select("_id").lean();
        if (pDoc) relatedId = pDoc._id;
      } else if (resolvedModuleType === "visa" || refUpper.startsWith("VS-")) {
        const vDoc = await VisaApplication.findOne({ trackingId: refUpper }).select("_id").lean();
        if (vDoc) relatedId = vDoc._id;
      }
    }

    const newTransaction = await AccountTransaction.create({
      transactionNumber,
      type,
      moduleType: resolvedModuleType,
      referenceId: refUpper,
      relatedId,
      applicantName: (applicantName || "গ্রাহক").trim(),
      phone: (phone || "").trim(),
      serviceTitle: (serviceTitle || "").trim(),
      category: effectiveCategory,
      amount: numAmount,
      paymentMethod: paymentMethod || "cash",
      notes: (notes || "").trim(),
      date: date ? new Date(date) : new Date(),
      createdBy: authUser?.userId ? (authUser.userId as any) : undefined,
      createdByName: authUser?.name || "সিস্টেম",
    });

    return NextResponse.json({
      success: true,
      message:
        type === "collection"
          ? "টাকা জমার হিসাব সফলভাবে এন্ট্রি হয়েছে।"
          : "ফাইল খরচের হিসাব সফলভাবে এন্ট্রি হয়েছে।",
      transaction: newTransaction,
    });
  } catch (error: unknown) {
    console.error("Error creating transaction in /api/accounts/transactions:", error);
    return NextResponse.json(
      { error: "হিসাব এন্ট্রি সংরক্ষণ করতে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
    }

    const tx = await AccountTransaction.findById(id);
    if (!tx) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // If it was a collection, revert the paid amount on the linked passport or visa record
    if (tx.type === "collection") {
      if (tx.moduleType === "passport" || tx.referenceId.startsWith("PS-")) {
        let passportDoc = await PassportEntry.findOne({ entryNumber: tx.referenceId });
        if (passportDoc && passportDoc.applicationCategory === "family_group" && !passportDoc.isFamilyHead && passportDoc.familyGroupId) {
          const headDoc = await PassportEntry.findOne({ familyGroupId: passportDoc.familyGroupId, isFamilyHead: true });
          if (headDoc) {
            passportDoc = headDoc;
          }
        }
        if (passportDoc) {
          const revertedPaid = Math.max(0, (passportDoc.paidAmount || 0) - tx.amount);
          passportDoc.paidAmount = revertedPaid;
          passportDoc.dueAmount = Math.max(0, (passportDoc.totalAmount || 0) - revertedPaid);
          await passportDoc.save();
        }
      } else if (tx.moduleType === "visa" || tx.referenceId.startsWith("VS-")) {
        const visaDoc = await VisaApplication.findOne({ trackingId: tx.referenceId });
        if (visaDoc) {
          const currentTotal = Number(visaDoc.totalAmount ?? visaDoc.feeAmount) || 0;
          const revertedPaid = Math.max(0, (visaDoc.paidAmount || 0) - tx.amount);
          visaDoc.paidAmount = revertedPaid;
          visaDoc.dueAmount = Math.max(0, currentTotal - revertedPaid);
          visaDoc.feeStatus = revertedPaid >= currentTotal ? "paid" : revertedPaid > 0 ? "partial" : "pending";
          await visaDoc.save();
        }
      }
    }

    await AccountTransaction.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "লেনদেনটি সফলভাবে মুছে ফেলা হয়েছে।",
    });
  } catch (error: unknown) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}
