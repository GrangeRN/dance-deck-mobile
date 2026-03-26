// DanceDeck AI Program Parser — Supabase Edge Function
// Takes a competition program (image base64 or text) and returns structured schedule entries
// Uses Claude API (claude-sonnet-4-5)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const SYSTEM_PROMPT = `You are DanceDeck's competition program parser. You extract structured schedule data from dance competition programs.

Given a competition program (photo or text), extract EVERY performance entry into a JSON array.

For each entry, extract:
- routine_title: The name of the routine/song (required)
- studio_name: The dance studio name (if shown)
- dance_style: Jazz, Lyrical, Contemporary, Ballet, Tap, Hip Hop, Musical Theater, Acro, etc.
- division: Competitive, Rising Star, Novice, Recreation, etc.
- age_group: Mini, Petite, Junior, Teen, Senior, etc.
- heat_number: The entry/heat number (integer, if shown)
- time_exact: Performance time in HH:MM:SS 24-hour format (if shown). Convert AM/PM to 24h.
- dancer_names: Array of dancer names (if listed)
- choreographer_name: Choreographer name (if listed)
- day_date: Date in YYYY-MM-DD format (if the program shows a date)
- stage_room: Stage or room name (if multi-stage competition)
- entry_type: "routine" for performances, "break" for intermissions, "ceremony" for awards ceremonies
- is_section_header: true if this is a section divider (e.g., "TEEN SOLOS" or "JUNIOR GROUP")
- is_title_contestant: true if marked as a title contestant

Rules:
- Extract ALL entries, not just a sample
- If times are estimated based on position (not printed), set time_is_estimated: true
- If you see section headers like "TEEN SOLOS", include them as entries with is_section_header: true
- For multi-day programs, include the day_date for each entry
- Studio names often appear after the routine title, sometimes in parentheses
- Dancer names may be listed below the routine title
- Heat/entry numbers are usually at the start of each line
- If no time is shown, estimate based on: first entry starts at the earliest time shown, each entry is ~2.5 minutes

Return ONLY valid JSON: { "entries": [...], "metadata": { "organization": "...", "event_name": "...", "day_date": "..." } }`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const { image_base64, image_media_type, text_content } = await req.json();

    if (!image_base64 && !text_content) {
      return new Response(JSON.stringify({ error: "Provide image_base64 or text_content" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Build Claude message content
    const content: any[] = [];

    if (image_base64) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: image_media_type || "image/jpeg",
          data: image_base64,
        },
      });
      content.push({
        type: "text",
        text: "Parse this competition program into structured schedule entries. Extract every single entry.",
      });
    } else {
      content.push({
        type: "text",
        text: `Parse this competition program text into structured schedule entries. Extract every single entry.\n\n${text_content}`,
      });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250514",
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: `Claude API error: ${err}` }), {
        status: 502,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const result = await response.json();
    const text = result.content?.[0]?.text || "";

    // Extract JSON from response (Claude may wrap it in markdown code blocks)
    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
    } catch {
      return new Response(JSON.stringify({ error: "Failed to parse AI response", raw: text }), {
        status: 422,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
