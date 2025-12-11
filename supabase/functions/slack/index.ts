// supabase/functions/slack/index.ts

import { serve } from "https://deno.land/std@0.224.0/http/server.ts"

const allowedOrigins = [
  "http://localhost:5174",
  "http://localhost:5175",  
  "http://localhost:5173",   
  "https://platform.christmas",
  "https://devjwplat.github.io",
]

function corsHeaders(origin: string | null) {
  const isAllowed = origin && allowedOrigins.includes(origin)

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }
}

serve(async (req) => {
  const origin = req.headers.get("origin")

  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders(origin),
    })
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders(origin),
    })
  }

  try {
    const payload = await req.json().catch(() => null)

    if (!payload) {
      return new Response("Invalid JSON", {
        status: 400,
        headers: corsHeaders(origin),
      })
    }

    const webhook = Deno.env.get("SLACK_WEBHOOK_URL")
    if (!webhook) {
      console.error("SLACK_WEBHOOK_URL is missing")
      return new Response("Server misconfigured", {
        status: 500,
        headers: corsHeaders(origin),
      })
    }

    const slackRes = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const text = await slackRes.text()

    if (!slackRes.ok) {
      console.error("Slack error:", text)
      return new Response("Slack error: " + text, {
        status: 500,
        headers: corsHeaders(origin),
      })
    }

    return new Response("OK", {
      status: 200,
      headers: corsHeaders(origin),
    })
  } catch (err) {
    console.error("Function error:", err)
    return new Response("Internal error", {
      status: 500,
      headers: corsHeaders(origin),
    })
  }
})
