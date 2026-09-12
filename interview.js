const { getInstructions } = require("../prompts/lampas-interview-prompt");

const questionSchema = {
  type: "object", additionalProperties: false,
  properties: {
    question: { type: "string" },
    question_tip: { type: "string" },
    source_mode: { type: "string", enum: ["school_profile", "general"] }
  }, required: ["question", "question_tip", "source_mode"]
};

const feedbackSchema = {
  type: "object", additionalProperties: false,
  properties: {
    strengths: { type: "array", items: { type: "string" }, maxItems: 2 },
    improvements: { type: "array", items: { type: "string" }, maxItems: 2 },
    one_sentence_tip: { type: "string" },
    follow_up_question: { type: "string" }
  }, required: ["strengths", "improvements", "one_sentence_tip", "follow_up_question"]
};

function clean(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST 요청만 가능합니다." });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "AI 연결 준비 중입니다. 현재는 데모 피드백을 보여드려요." });

  const action = clean(req.body?.action, 20);
  const school = clean(req.body?.school, 40);
  const topic = clean(req.body?.topic, 40);
  const introduction = clean(req.body?.introduction, 3000);
  const answer = clean(req.body?.answer, 2200);
  if (!school || !introduction || !["question", "feedback"].includes(action)) return res.status(400).json({ error: "지원 학교와 자기소개서 내용을 확인해 주세요." });
  if (action === "feedback" && !answer) return res.status(400).json({ error: "피드백을 위한 답변이 없습니다." });

  const userContext = action === "question"
    ? `학생 정보\n지원 학교: ${school}\n연습 주제: ${topic}\n자기소개서 또는 경험:\n${introduction}\n\n이 내용에 근거한 연습 면접 질문 한 개를 만드세요.`
    : `학생 정보\n지원 학교: ${school}\n연습 주제: ${topic}\n자기소개서 또는 경험:\n${introduction}\n\n면접 질문:\n${clean(req.body?.question, 700)}\n\n학생 답변:\n${answer}\n\n이 답변에만 근거해 짧고 구체적인 피드백을 제공하세요.`;

  const schema = action === "question" ? questionSchema : feedbackSchema;
  const requestBody = {
    model: process.env.OPENAI_MODEL || "gpt-5-mini",
    instructions: getInstructions(school),
    input: [{ role: "user", content: [{ type: "input_text", text: userContext }] }],
    text: { format: { type: "json_schema", name: action === "question" ? "interview_question" : "interview_feedback", strict: true, schema } },
    max_output_tokens: action === "question" ? 300 : 650
  };

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
      const details = await response.text();
      console.error("OpenAI API error", response.status, details);
      return res.status(502).json({ error: "AI 응답을 가져오지 못했습니다. 잠시 뒤 다시 시도해 주세요." });
    }
    const data = await response.json();
    const outputItem = Array.isArray(data.output)
      ? data.output.flatMap((item) => Array.isArray(item.content) ? item.content : []).find((item) => item.type === "output_text")
      : null;
    const rawOutput = typeof data.output_text === "string"
      ? data.output_text.trim()
      : typeof outputItem?.text === "string" ? outputItem.text.trim() : "";
    if (!rawOutput) {
      console.error("OpenAI response did not include output_text", JSON.stringify({ status: data.status, incomplete_details: data.incomplete_details }));
      return res.status(502).json({ error: "AI가 완성된 답변을 반환하지 않았습니다. 잠시 뒤 다시 시도해 주세요." });
    }
    const jsonText = rawOutput.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
    try {
      return res.status(200).json({ result: JSON.parse(jsonText) });
    } catch (parseError) {
      console.error("Could not parse OpenAI JSON output", parseError.message, rawOutput.slice(0, 500));
      return res.status(502).json({ error: "AI 답변 형식을 읽지 못했습니다. 잠시 뒤 다시 시도해 주세요." });
    }
  } catch (error) {
    console.error("Interview function error", error);
    return res.status(500).json({ error: "AI 연결 중 오류가 발생했습니다." });
  }
};
