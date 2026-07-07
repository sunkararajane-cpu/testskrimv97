const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockPayment = async (amount: number, purpose: string) => {
  console.log(`[MOCK PAYMENT] Initiating payment for $${amount/100} (${purpose})`);
  await delay(1500); // Simulate razorpay UI load + user action
  
  // 90% success rate for mock mode
  if (Math.random() > 0.1) {
    console.log(`[MOCK PAYMENT] SUCCESS`);
    return { success: true, transactionId: `mock_txn_${Date.now()}` };
  } else {
    console.log(`[MOCK PAYMENT] FAILED (User Cancelled)`);
    return { success: false, error: "User cancelled payment" };
  }
};
