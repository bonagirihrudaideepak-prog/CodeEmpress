import { streamText } from "ai";
import { withProviderFallback, pickModel } from "./client";

interface ChatContext {
  userName: string;
  currentRole?: string;
  targetRole?: string;
  skills: Array<{ name: string; level: string }>;
  weakAreas: string[];
  currentRoadmap?: string;
  recentActivity: string[];
}

export function buildSystemPrompt(context: ChatContext): string {
  return `You are Codempress AI Mentor — a friendly, knowledgeable, and honest 
  career coach for software developers.

  USER CONTEXT:
  - Name: ${context.userName}
  - Current Role: ${context.currentRole || "Not specified"}
  - Target Role: ${context.targetRole || "Not specified"}
  - Skills: ${context.skills.map((s) => `${s.name} (${s.level})`).join(", ") || "None tracked yet"}
  - Weak Areas: ${context.weakAreas.join(", ") || "None identified"}
  - Current Roadmap: ${context.currentRoadmap || "None active"}
  - Recent Activity: ${context.recentActivity.join("; ") || "No recent activity"}

  YOUR BEHAVIOR:
  1. Always reference the user's specific context when giving advice
  2. Be encouraging but honest — don't sugarcoat gaps
  3. Give specific, actionable recommendations (not generic advice)
  4. When asked about learning, suggest specific topics from their roadmap
  5. When asked about career, reference their target role and current gaps
  6. Keep responses concise unless the user asks for detail
  7. Use markdown formatting for clarity
  8. If you don't know something, say so — don't hallucinate

  You can help with:
  - Learning path guidance
  - Resume and portfolio feedback
  - Technical concept explanations
  - Interview preparation
  - Career strategy and job search
  - Debugging and code review (when code is shared)
  - Motivation and accountability`;
}

export async function chatStream(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  context: ChatContext
): Promise<AsyncIterable<string>> {
  if (!hasAnyProvider()) {
    return streamFallback(messages, context);
  }
  try {
    const { result } = await withProviderFallback("fast", async (model) => {
      const res = await streamText({
        model,
        system: buildSystemPrompt(context),
        messages,
        temperature: 0.7,
        maxOutputTokens: 1000,
      });
      // textStream is an AsyncIterable<string>; wrap in an async function so it is
      // consumed lazily as an async generator (avoiding extra await semantics).
      return (async function* () {
        for await (const chunk of res.textStream) {
          yield chunk;
        }
      })();
    });
    return result;
  } catch (e) {
    // All providers failed (bad key / offline). Degrade to the offline responder
    // so the chat never hard-fails.
    console.warn("[ai] all providers failed in chat; using offline responder", e);
    return streamFallback(messages, context);
  }
}

function hasAnyProvider(): boolean {
  return pickModel("fast") != null;
}

// Deterministic, context-aware offline responder so the chat works without an
// OpenAI key. Streams back a helpful, persona-consistent reply. When a real key
// is configured, streamText (above) is used instead.
async function* streamFallback(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  context: ChatContext
): AsyncIterable<string> {
  const last = messages[messages.length - 1]?.content.toLowerCase() || "";
  const text = fallbackReply(last, context);
  // chunk into ~24-char tokens to simulate streaming
  for (let i = 0; i < text.length; i += 24) {
    yield text.slice(i, i + 24);
    await new Promise((r) => setTimeout(r, 12));
  }
}

function fallbackReply(last: string, ctx: ChatContext): string {
  const name = ctx.userName || "Developer";
  const role = ctx.targetRole || ctx.currentRole || "developer";
  const skills = ctx.skills.length
    ? ctx.skills.map((s) => `${s.name} (${s.level})`).join(", ")
    : "build up your core skills";

  if (/resume|cv|portfolio/.test(last)) {
    return `Here's targeted advice on your **resume**, ${name}:\n\n- Lead with **impact and metrics**. Quantify results (e.g. "cut load time 40%").\n- Put a **target-role summary** at the top: "${role} with …".\n- Your current tracked skills: ${skills}.\n\n${
      ctx.weakAreas.length
        ? `Also strengthen these gaps the AI flagged: ${ctx.weakAreas.join(", ")}.`
        : "Skills sections benefit from ATS keywords matching job descriptions."
    }\n\nWant me to rewrite one bullet, or build a portfolio project?`;
  }

  if (/roadmap|learn|study|path|plan|beginner/.test(last)) {
    return `Great question, ${name}. For a **${role}** path, I'd structure it as:\n\n1. **Fundamentals** — core language + tooling.\n2. **Build** — a few portfolio projects per skill.\n3. **Deepen** — architecture, testing, performance.\n4. **Interview** — revision + mock questions.\n\nYour current tracked skills: ${skills}. ${
      ctx.currentRoadmap
        ? `You already have a roadmap: **${ctx.currentRoadmap}** — let's start there.`
        : "Tell me your target role and I'll draft a roadmap."
    }`;
  }

  if (/interview|job|career|hire|apply/.test(last)) {
    return `Career strategy for you, ${name}: aiming for **${role}**.\n\n- Practice **behavioral** + **technical** rounds (STAR for stories, live coding).\n- Keep a portfolio with 2–3 polished, documented projects.\n- Apply with tailored resumes + a short outreach note.\n\nI can run a mock interview question right now — just ask.`;
  }

  if (/debug|bug|error|fix|code|issue|not working/.test(last)) {
    return `Let's debug it together, ${name}. Share the code and the exact error, and I'll walk through it.\n\nWhen you paste it, I'll check for:\n- Syntax/typos and undefined values\n- Type mismatches and logic errors\n- Edge cases and error handling\n\nPaste your snippet and I'll give you a line-by-line breakdown.`;
  }

  if (/hi|hello|hey|thanks|thank/.test(last)) {
    return `Hey ${name}! 👋 I'm your Codempress AI mentor.\n\nI can help you with **${role}** learning paths, resume/portfolio feedback, code debugging, interview prep, and career strategy.\n\nYou're tracking these skills: ${skills}. What do you want to tackle first?`;
  }

  // default
  return `Happy to help with your **${role}** journey, ${name}.\n\nCurrent context I have on you:\n- Skills: ${skills}\n${
    ctx.weakAreas.length ? `- Weak areas: ${ctx.weakAreas.join(", ")}` : ""
  }\n\nI can help with:\n- **Learning** — a roadmap or explanation\n- **Career** — resume, portfolio, interview prep\n- **Code** — debug or review a snippet\n\nWhat would you like to work on?`;
}
