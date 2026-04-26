export function formatDisplayDate(value, fallback = "No date") {
  if (!value) return fallback;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getReceiptMeta(txn = {}) {
  return {
    receiptDate: txn.receipt_date || txn.payment_date || txn.paymentDate || txn.createdAt || null,
    receiptNumber: txn.receipt_no || txn.invoice_number || txn.invoiceNumber || txn.payment_id || txn.paymentId || "-",
    installmentNumber: txn.inst_no || txn.installment_number || txn.installmentNumber || "-",
    goldRate: txn.gold_rate || txn.goldRateAtPayment || txn.goldRate || 0,
    grams: txn.grams || txn.gold_weight || txn.goldWeight || txn.totalGoldWeight || 0,
  };
}
