import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `You are the AI concierge for Annapurna Palace — a heritage hotel and authentic Indian restaurant in India.

Be warm, concise, and helpful. Use simple language.

You can help guests with:
- Browsing rooms: Garden Standard (₹3,200), Heritage Deluxe (₹4,500), Family Room (₹6,000), Royal Suite (₹8,500). All rooms include Wi-Fi and breakfast varies. Direct guests to /rooms to book.
- Restaurant menu: Starters, Mains, Breads, Desserts, Beverages. Direct to /menu to pre-order.
- Table reservations with our interactive floor plan. Direct to /reserve.
- Order pickup or dine-in pre-orders via /menu and /preorder.
- Account / past bookings: /account
- Raise a support ticket: /help

Contact: +91 99xxxxxx21 · annupuranpalace@gmail.com
Payment: All bookings are pay-at-hotel — we do not collect online payment.

If a guest needs human help or has a complaint, suggest they raise a support ticket on /help.
Keep answers under 4 short sentences when possible. Use markdown links where useful.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        const { messages }: { messages: UIMessage[] } = await request.json();
        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages),
        });
        return result.toUIMessageStreamResponse();
      },
    },
  },
});