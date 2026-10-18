import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { loadCatalog } from "@/lib/server/catalog";
import { buildAnalysis } from "@/lib/engine/analysis";
import { generateAssistantReply, generatePreOnboardingReply } from "@/lib/engine/assistant";
import { getChatHistory, getDashboard, saveChatTurn } from "@/lib/server/students";
import type { StudentProfile } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ messages: [] });
  return NextResponse.json({ messages: await getChatHistory(user.id) });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { message?: string; profile?: StudentProfile };
    const message = body.message?.trim();
    if (!message) return NextResponse.json({ error: "Say something first." }, { status: 400 });
    if (message.length > 600) return NextResponse.json({ error: "Keep it under 600 characters." }, { status: 400 });

    const user = await getCurrentUser(request);
    const catalog = await loadCatalog();

    let context;
    if (user) {
      const dash = await getDashboard(user.id);
      if (dash) context = { profile: dash.profile, analysis: dash.analysis };
    }
    if (!context && body.profile?.targetRole) {
      context = { profile: body.profile, analysis: buildAnalysis(body.profile, catalog) };
    }

    const reply = context
      ? generateAssistantReply(message, context)
      : generatePreOnboardingReply(message);
    if (user) await saveChatTurn(user.id, message, reply);

    return NextResponse.json({
      message: { id: `m-${Date.now()}`, role: "assistant", content: reply.content, suggestions: reply.suggestions, createdAt: new Date().toISOString() },
    });
  } catch (error) {
    console.error("chat failed", error);
    return NextResponse.json({ error: "The assistant is taking a breather. Try again." }, { status: 500 });
  }
}
