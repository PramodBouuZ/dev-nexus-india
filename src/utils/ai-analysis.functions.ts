import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(4000),
});

const ALLOWED_DEV_TYPES = [
  "frontend",
  "backend",
  "fullstack",
  "mobile",
  "devops",
  "data",
  "ai_ml",
  "designer",
  "other",
] as const;

export const analyzeProjectRequirement = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return {
        ok: false as const,
        error: "AI service not configured",
      };
    }

    const systemPrompt = `You are an expert tech recruiter assistant in India. Given a project title and description, return concise, realistic suggestions:
- Tech stack required (5-10 items)
- Estimated budget range in INR (min and max)
- Recommended developer type (one of: frontend, backend, fullstack, mobile, devops, data, ai_ml, designer, other)
- Approximate timeline in weeks
Be realistic for the Indian freelance market. Use conservative estimates.`;

    try {
      const resp = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: `Title: ${data.title}\n\nDescription:\n${data.description}`,
              },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "suggest_requirements",
                  description: "Return structured project suggestions",
                  parameters: {
                    type: "object",
                    properties: {
                      tech_stack: {
                        type: "array",
                        items: { type: "string" },
                      },
                      budget_min_inr: { type: "number" },
                      budget_max_inr: { type: "number" },
                      developer_type: {
                        type: "string",
                        enum: [...ALLOWED_DEV_TYPES],
                      },
                      timeline: { type: "string" },
                      reasoning: { type: "string" },
                    },
                    required: [
                      "tech_stack",
                      "budget_min_inr",
                      "budget_max_inr",
                      "developer_type",
                      "timeline",
                      "reasoning",
                    ],
                    additionalProperties: false,
                  },
                },
              },
            ],
            tool_choice: {
              type: "function",
              function: { name: "suggest_requirements" },
            },
          }),
        },
      );

      if (resp.status === 429) {
        return { ok: false as const, error: "AI is rate-limited. Try again in a minute." };
      }
      if (resp.status === 402) {
        return { ok: false as const, error: "AI credits exhausted. Add funds in Settings." };
      }
      if (!resp.ok) {
        const txt = await resp.text();
        console.error("AI gateway error", resp.status, txt);
        return { ok: false as const, error: "AI service error" };
      }

      const json = await resp.json();
      const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
      const args = toolCall?.function?.arguments;
      if (!args) {
        return { ok: false as const, error: "No suggestions returned" };
      }
      const parsed = JSON.parse(args);
      return { ok: true as const, suggestions: parsed };
    } catch (err) {
      console.error("AI analysis failed", err);
      return { ok: false as const, error: "AI analysis failed" };
    }
  });
