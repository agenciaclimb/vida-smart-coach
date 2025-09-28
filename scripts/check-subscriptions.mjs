import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltam SUPABASE_URL/VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(url, key);

const main = async () => {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("user_id, stripe_customer_id, stripe_subscription_id, status, current_period_end, trial_start, updated_at")
    .order("updated_at", { ascending: false })
    .limit(10);
  if (error) {
    console.error("SQL error:", error);
    process.exit(2);
  }
  const out = {
    checked_at: new Date().toISOString(),
    count: data?.length || 0,
    rows: data || []
  };
  fs.mkdirSync("./.audit", { recursive: true });
  fs.writeFileSync("./.audit/_p2_subscriptions_check.json", JSON.stringify(out, null, 2));
  console.log("OK - wrote .audit/_p2_subscriptions_check.json with", out.count, "rows");
};
main().catch((e) => {
  console.error(e);
  process.exit(3);
});
