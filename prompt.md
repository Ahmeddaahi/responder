Build a full-stack AI platform where users can create and manage their own AI Business Chat Agent that works on WhatsApp or Telegram.
Users choose one platform, select a plan (Free, Starter, Enterprise), upload their business data (PDFs, website link, or text), and instantly get an AI agent that answers customer questions automatically through the selected platform.

All backend and AI logic should run on Lovable Cloud, using Lovable AI functions for storage, logic, and chat response generation.

⚙️ Core Features
1. Authentication

Lovable Cloud Auth (email + password)

Dashboard access only after login

2. Platform Selection

In dashboard → two buttons: WhatsApp and Telegram

Once a platform is selected → show Pricing Page

After payment/subscription → unlock AI Agent Dashboard

3. Pricing Plans
Plan	Messages/Month	Description
Free	50	Basic test access
Starter	500	For small businesses
Enterprise	5000	For growing businesses

💰 Pricing logic:
Free = 0 ETB
Starter = $5/month
Enterprise = $25/month

📊 Dashboard (After Subscription)

Upload business PDFs

Add Website Links

Write Text Information
All of this data becomes the AI’s business knowledge.
Data should be stored in Lovable Cloud Storage and connected to the AI model context.

🤖 AI Agent Integration
🔹 Telegram Bot:

User enters Telegram Bot Token

System automatically sets webhook endpoint via Lovable Cloud backend

AI replies using Lovable AI chat model with user’s business context

🔹 WhatsApp Business:

User enters WhatsApp business number + Meta App ID + Token

Lovable Cloud generates and registers webhook callback URL automatically

Example webhook:
https://lovable.cloud/api/webhooks/whatsapp

Messages are sent through WhatsApp Business Cloud API

🧠 AI Model:

Use Gemini 2.5 Flash (via Lovable Cloud AI)

AI responds only based on the uploaded or written business knowledge

⚡ Message Flow:

Customer sends message (Telegram or WhatsApp)

Webhook triggers Lovable Cloud Function

Function retrieves business context

Gemini 2.5 Flash generates reply

Reply is sent back to customer instantly

🧰 Tech Stack

Frontend: Next.js + Tailwind CSS

Backend: Lovable Cloud Functions (Node.js)

Database & Storage: Lovable Cloud DB + File Storage

AI: Gemini 2.5 Flash via Lovable AI

Hosting:

Lovable Cloud (Backend + AI)

Vercel (Frontend deployment)

🧭 Pages to Build

/ – Landing page (Hero + "Get Started" button)

/auth – Login & Register page

/dashboard – Platform selection (WhatsApp / Telegram)

/pricing – Pricing plans (Free, Starter, Enterprise)

/agent – AI setup page (upload PDFs, add links, text)

/settings – API tokens, webhook info, usage stats

/admin – Admin overview (users, plans, usage, revenue)

🔐 Admin Features

View all users and their platform (Telegram/WhatsApp)

Monitor message count and plan usage

Change user plan manually if needed

🧠 AI Prompt Logic (Lovable Cloud Function Example)
import { ai, db, storage } from "lovable:cloud";

export default async function handleMessage(req) {
  const { userId, message, platform } = req.body;

  // Load user knowledge
  const knowledge = await db.table("knowledge").where({ userId }).get();

  // AI response
  const response = await ai.chat({
    model: "gemini-2.5-flash",
    context: knowledge.text,
    message,
  });

  // Send reply back to Telegram or WhatsApp
  if (platform === "telegram") {
    await sendTelegramMessage(userId, response);
  } else {
    await sendWhatsAppMessage(userId, response);
  }

  return response;
}

🚀 Goal

Generate a Lovable AI project that includes:

Dashboard UI

Pricing logic

WhatsApp + Telegram webhook setup

AI chat function

Admin management

Lovable Cloud integration (DB, Storage, AI, Auth)

✅ Deliverables

Working full-stack app

Frontend in Next.js + Tailwind

Backend and AI logic on Lovable Cloud

Connected Telegram + WhatsApp

AI answering based on business data

Free + Paid plans implemented