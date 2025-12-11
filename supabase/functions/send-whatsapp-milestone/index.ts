import { serve } from "https://deno.land/std/http/server.ts"

serve(async (req) => {
  try {
    const body = await req.json()

    const webhook = Deno.env.get("SLACK_WEBHOOK_URL")
    if (!webhook) {
      return new Response("Missing Slack webhook URL", { status: 500 })
    }

    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    return new Response(await res.text(), { status: res.status })
  } catch (err) {
    return new Response("Error: " + err.message, { status: 500 })
  }
})


