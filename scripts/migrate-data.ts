import { supabase } from "../lib/supabase"

async function migrateData() {
  // Get data from localStorage
  const clients = JSON.parse(localStorage.getItem("clients") || "[]")
  const orders = JSON.parse(localStorage.getItem("orders") || "[]")
  const deposits = JSON.parse(localStorage.getItem("deposits") || "[]")
  const withdrawals = JSON.parse(localStorage.getItem("withdrawals") || "[]")
  const orderRequests = JSON.parse(localStorage.getItem("orderRequests") || "[]")

  // Insert clients
  for (const client of clients) {
    await supabase.from("clients").insert({
      shop_id: client.shopId,
      client_name: client.clientName,
      agent: client.agent,
      kyc_date: client.kycDate,
      status: client.status,
      notes: client.notes,
    })
  }

  // Insert orders
  for (const order of orders) {
    await supabase.from("orders").insert({
      order_id: order.orderId,
      shop_id: order.shopId,
      client_name: order.clientName,
      agent: order.agent,
      date: order.date,
      location: order.location,
      price: order.price,
      status: order.status,
    })
  }

  // Insert deposits
  // Insert withdrawals
  // Insert order requests

  console.log("Migration completed")
}

// Run the migration
migrateData()
