import { db } from "@/lib/firebase"
import { doc, setDoc, Timestamp, serverTimestamp } from "firebase/firestore"

async function migrateToFirebase() {
  // Get data from localStorage
  const clients = JSON.parse(localStorage.getItem("clients") || "[]")
  const orders = JSON.parse(localStorage.getItem("orders") || "[]")
  const deposits = JSON.parse(localStorage.getItem("deposits") || "[]")
  const withdrawals = JSON.parse(localStorage.getItem("withdrawals") || "[]")
  const orderRequests = JSON.parse(localStorage.getItem("orderRequests") || "[]")

  // Migrate clients
  for (const client of clients) {
    await setDoc(doc(db, "clients", client.shopId), {
      clientName: client.clientName,
      agent: client.agent,
      kycDate: client.kycDate ? Timestamp.fromDate(new Date(client.kycDate)) : null,
      status: client.status,
      notes: client.notes || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  // Migrate orders
  for (const order of orders) {
    await setDoc(doc(db, "orders", order.orderId), {
      shopId: order.shopId,
      clientName: order.clientName,
      agent: order.agent,
      date: order.date ? Timestamp.fromDate(new Date(order.date)) : Timestamp.fromDate(new Date()),
      location: order.location,
      price: order.price,
      status: order.status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  // Migrate deposits
  for (const deposit of deposits) {
    await setDoc(doc(db, "deposits", deposit.depositId), {
      shopId: deposit.shopId,
      clientName: deposit.clientName,
      agent: deposit.agent,
      date: deposit.date ? Timestamp.fromDate(new Date(deposit.date)) : Timestamp.fromDate(new Date()),
      amount: deposit.amount,
      paymentMode: deposit.paymentMode,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  // Migrate withdrawals
  for (const withdrawal of withdrawals) {
    await setDoc(doc(db, "withdrawals", withdrawal.withdrawalId), {
      shopId: withdrawal.shopId,
      clientName: withdrawal.clientName,
      agent: withdrawal.agent,
      date: withdrawal.date ? Timestamp.fromDate(new Date(withdrawal.date)) : Timestamp.fromDate(new Date()),
      amount: withdrawal.amount,
      paymentMode: withdrawal.paymentMode,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  // Migrate order requests
  for (const request of orderRequests) {
    await setDoc(doc(db, "orderRequests", request.id), {
      shopId: request.shopId,
      clientName: request.clientName,
      agent: request.agent,
      date: request.date ? Timestamp.fromDate(new Date(request.date)) : Timestamp.fromDate(new Date()),
      location: request.location,
      price: request.price,
      status: request.status,
      remarks: request.remarks || "",
      createdAt: Timestamp.fromMillis(request.createdAt),
      updatedAt: serverTimestamp(),
    })
  }

  console.log("Migration completed successfully!")
}

export default migrateToFirebase
