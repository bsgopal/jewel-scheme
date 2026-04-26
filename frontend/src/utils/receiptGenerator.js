import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";
import jsPDF from "jspdf";
import { formatDisplayDate, getReceiptMeta } from "./formatters";

export async function generateReceiptPDF(txn) {
  const { receiptDate, receiptNumber, installmentNumber, goldRate, grams } = getReceiptMeta(txn);
  const doc = new jsPDF();

  doc.text("Gold Scheme Receipt", 20, 20);
  doc.text(`Plan: ${txn.plan_name || txn.scheme_name || "Gold Plan"}`, 20, 35);
  doc.text(`Installment: ${installmentNumber}`, 20, 45);
  doc.text(`Amount: Rs ${txn.amount}`, 20, 55);
  doc.text(`Gold Rate: Rs ${goldRate}`, 20, 65);
  doc.text(`Grams: ${Number(grams || 0).toFixed(3)}`, 20, 75);
  doc.text(`Date: ${formatDisplayDate(receiptDate)}`, 20, 85);

  const fileName = `Receipt_${receiptNumber}.pdf`;

  if (!Capacitor.isNativePlatform()) {
    doc.save(fileName);
    return;
  }

  const pdfBase64 = doc.output("datauristring").split(",")[1];
  const savedFile = await Filesystem.writeFile({
    path: fileName,
    data: pdfBase64,
    directory: Directory.Documents,
    encoding: Encoding.BASE64,
  });

  try {
    await Share.share({
      title: "Receipt",
      text: "Gold Scheme Receipt",
      url: savedFile.uri,
      dialogTitle: "Open or Share Receipt",
    });
  } catch (error) {
    if (!String(error?.message || "").includes("user gesture")) {
      throw error;
    }
  }
}
