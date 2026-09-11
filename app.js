const questionBank = {
  "외대부고": {
    "자기소개서": ["자기소개서에서 가장 오래 고민했던 경험을 하나 골라, 그 경험이 본인을 어떻게 바꾸었는지 이야기해 볼까요?", "작성한 활동 중 다른 사람과 관점이 달랐던 순간이 있었나요? 그때 어떻게 대화했는지 설명해 주세요."],
    "지원 동기": ["외대부고의 환경에서 꼭 해보고 싶은 배움은 무엇이고, 왜 지금의 나에게 필요하다고 생각하나요?"],
    "학업 역량": ["스스로 부족하다고 느낀 과목을 만났을 때, 어떤 방법으로 공부 방식을 바꾸었나요?"],
    "인성·협업": ["함께하는 활동에서 내 의견보다 팀의 방향을 우선했던 경험이 있나요? 그 선택의 이유를 들려주세요."],
    "꼬리 질문": ["방금 말한 경험에서 가장 아쉬웠던 선택은 무엇이었고, 다시 한다면 어떻게 해보고 싶나요?"]
  },
  "동탄국제고": {
    "자기소개서": ["자기소개서 속 경험 가운데, 더 넓은 세계나 다른 문화에 대한 관심으로 이어진 이야기를 들려주세요.", "본인이 중요하게 생각하는 문제를 해결하기 위해 직접 찾아보고 행동한 경험이 있나요?"],
    "지원 동기": ["동탄국제고에서 배우고 싶은 점을 본인의 진로 관심과 연결해서 설명해 볼까요?"],
    "학업 역량": ["궁금증이 생겼을 때 교과서 밖의 자료를 찾아본 경험과, 그 과정에서 달라진 생각을 말해 주세요."],
    "인성·협업": ["나와 배경이나 생각이 다른 친구와 함께 목표를 이룬 경험이 있나요?"],
    "꼬리 질문": ["그 경험이 단순히 흥미로웠던 것을 넘어, 앞으로 어떤 행동으로 이어질 수 있을까요?"]
  },
  "수원외고": {
    "자기소개서": ["자기소개서에 쓴 활동 중, 언어 또는 소통의 중요성을 느낀 순간을 구체적으로 설명해 주세요.", "한 가지 관심사를 오래 이어 온 이유와 그 과정에서의 어려움을 들려주세요."],
    "지원 동기": ["수원외고에 지원한 이유를 ‘잘하는 것’과 ‘더 배우고 싶은 것’으로 나누어 설명해 볼까요?"],
    "학업 역량": ["스스로 세운 학습 목표를 끝까지 지키기 위해 어떤 습관을 만들었나요?"],
    "인성·협업": ["의견 차이 때문에 갈등이 생겼을 때, 상대를 이해하기 위해 했던 행동을 말해 주세요."],
    "꼬리 질문": ["그 일을 통해 알게 된 나의 강점은 무엇이며, 학교생활에서 어떻게 활용하고 싶나요?"]
  },
  "경기외고": {
    "자기소개서": ["자기소개서의 경험 중 가장 주도적으로 선택하고 행동한 일을 구체적으로 이야기해 주세요.", "처음에는 잘되지 않았지만 끝까지 해 본 경험이 있다면 과정 중심으로 들려주세요."],
    "지원 동기": ["경기외고에서의 배움이 본인의 진로 탐색에 어떤 도움이 될 것이라고 생각하나요?"],
    "학업 역량": ["공부하며 생긴 질문을 그냥 넘기지 않고 해결했던 경험을 말해 주세요."],
    "인성·협업": ["팀 활동에서 맡은 역할을 넘어 다른 친구를 도왔던 경험이 있나요?"],
    "꼬리 질문": ["그때의 어려움을 해결한 방식이 다른 상황에서도 통할까요? 이유를 말해 주세요."]
  }
};

const $ = (selector) => document.querySelector(selector);
let selectedTopic = "자기소개서";
let currentQuestion = "";
let timerId;
let seconds = 0;
let recognition;

function countText(input, display) { $(display).textContent = `${input.value.length} / ${input.maxLength}`; }
function formatTime(value) { return `${String(Math.floor(value / 60)).padStart(2,"0")}:${String(value % 60).padStart(2,"0")}`; }
function startTimer() { clearInterval(timerId); seconds = 0; $("#timer").textContent = formatTime(seconds); timerId = setInterval(() => { seconds += 1; $("#timer").textContent = formatTime(seconds); }, 1000); }
function randomQuestion() { const school = $("#school").value; const list = questionBank[school][selectedTopic]; return list[Math.floor(Math.random() * list.length)]; }
async function requestAi(action, answer = "") {
  const response = await fetch("/api/interview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, school: $("#school").value, topic: selectedTopic, introduction: $("#intro").value, answer, question: currentQuestion })
  });
  if (!response.ok) throw new Error("AI unavailable");
  return (await response.json()).result;
}
async function showQuestion() {
  currentQuestion = randomQuestion();
  $("#questionText").textContent = "LAMPAS AI 조교가 자기소개서를 읽고 질문을 준비하고 있어요…";
  $("#schoolBadge").textContent = $("#school").value; $("#topicBadge").textContent = selectedTopic;
  $("#answer").value = ""; countText($("#answer"), "#answerCount"); $("#feedback").classList.add("hidden"); $("#interviewRoom").classList.remove("hidden"); $("#interviewRoom").scrollIntoView({behavior:"smooth", block:"start"}); startTimer();
  try {
    const result = await requestAi("question");
    currentQuestion = result.question;
    $("#questionText").textContent = result.question;
    $(".question-note").textContent = result.question_tip;
  } catch (_) {
    $("#questionText").textContent = currentQuestion;
    $(".question-note").textContent = "현재는 데모 질문을 보여드려요. AI 연결 후에는 자기소개서 내용을 반영한 질문이 나옵니다.";
  }
}
function getFeedback(answer) {
  const length = answer.replace(/\s/g, "").length;
  const hasExample = /(때|하면서|경험|활동|과정|상황|친구|팀)/.test(answer);
  const hasReflection = /(배웠|느꼈|알게|깨달|바꾸|성장)/.test(answer);
  const strength = hasExample ? "실제 경험을 바탕으로 말해서, 답변이 훨씬 믿음직스럽게 들려요." : "답변의 중심 생각이 분명해서, 무엇을 말하고 싶은지 잘 전달돼요.";
  let improve = length < 90 ? "좋은 시작이에요. 다만 면접관이 장면을 떠올릴 수 있도록 ‘언제, 무엇을, 어떻게 했는지’를 한 문장 더 보태 보세요." : "답변의 흐름은 좋아요. 내가 직접 한 행동과 그 결과를 구분해서 말하면 더 또렷해집니다.";
  if (!hasReflection) improve += " 마지막에는 이 경험으로 무엇을 배웠는지도 덧붙여 보세요.";
  const tip = hasExample && hasReflection ? "‘상황 → 내가 한 행동 → 변화 또는 배운 점’ 순서로 한 번 더 정리해 말해보면 좋겠어요." : "‘처음에는 ○○한 상황이었고, 저는 △△했습니다. 그 결과 □□를 배웠습니다.’라는 뼈대를 활용해 보세요.";
  return {strength, improve, tip, followup: "그 경험에서 본인이 직접 내린 선택 하나를 골라, 왜 그렇게 판단했는지 조금 더 구체적으로 설명해 줄 수 있을까요?"};
}
function saveRecord(answer) { const records = JSON.parse(localStorage.getItem("lampas-demo-records") || "[]"); records.unshift({alias:$("#studentAlias").value.trim(), code:$("#studentCode").value.trim(), school:$("#school").value, topic:selectedTopic, question:currentQuestion, answer, date:new Date().toLocaleString("ko-KR")}); localStorage.setItem("lampas-demo-records", JSON.stringify(records.slice(0,10))); }
function renderRecords() { const records = JSON.parse(localStorage.getItem("lampas-demo-records") || "[]"); $("#demoRecord").innerHTML = records.length ? records.map(r => `<strong>${r.alias || "별명 없음"} · ${r.code || "번호 없음"}</strong><br>${r.school} · ${r.topic} · ${r.date}<br><span>${r.question}</span>`).join("<hr>") : "아직 이 기기에 저장된 연습 기록이 없습니다."; }

$("#intro").addEventListener("input", e => countText(e.target,"#introCount"));
$("#answer").addEventListener("input", e => countText(e.target,"#answerCount"));
$("#topicGrid").addEventListener("click", e => { if (!e.target.matches(".topic")) return; document.querySelectorAll(".topic").forEach(b=>b.classList.remove("active")); e.target.classList.add("active"); selectedTopic=e.target.dataset.topic; });
$("#startButton").addEventListener("click", () => { if (!$("#studentAlias").value.trim() || !$("#studentCode").value.trim()) { alert("별명과 학원에서 안내받은 학생 번호를 입력해 주세요."); return; } if (!$("#consent").checked) { alert("연습 기록 안내를 확인한 뒤 시작해 주세요."); return; } showQuestion(); });
$("#feedbackButton").addEventListener("click", async () => { const answer = $("#answer").value.trim(); if (answer.length < 20) { alert("두세 문장 정도 답변을 적어 보면 더 좋은 피드백을 받을 수 있어요."); return; } clearInterval(timerId); let data; try { const result = await requestAi("feedback", answer); data = { strength: result.strengths.join(" "), improve: result.improvements.join(" "), tip: result.one_sentence_tip, followup: result.follow_up_question }; } catch (_) { data = getFeedback(answer); } $("#strengthText").textContent=data.strength; $("#improveText").textContent=data.improve; $("#tipText").textContent=data.tip; $("#followupText").textContent=data.followup; saveRecord(answer); $("#feedback").classList.remove("hidden"); $("#feedback").scrollIntoView({behavior:"smooth",block:"start"}); });
$("#nextButton").addEventListener("click", showQuestion);
$("#retryButton").addEventListener("click", () => { $("#feedback").classList.add("hidden"); $("#answer").focus(); startTimer(); });
$("#resetButton").addEventListener("click", () => { clearInterval(timerId); $("#interviewRoom").classList.add("hidden"); $("#feedback").classList.add("hidden"); $("#setupCard").scrollIntoView({behavior:"smooth"}); });
$("#teacherButton").addEventListener("click", () => { renderRecords(); $("#teacherDialog").showModal(); });
$("#dialogClose").addEventListener("click", () => $("#teacherDialog").close());
$("#clearRecords").addEventListener("click", () => { localStorage.removeItem("lampas-demo-records"); renderRecords(); });
$("#voiceButton").addEventListener("click", () => { const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SpeechRecognition) { $("#voiceStatus").textContent="이 브라우저에서는 음성 인식이 지원되지 않아요. 텍스트로 답해 주세요."; return; } if (recognition) { recognition.stop(); return; } recognition = new SpeechRecognition(); recognition.lang="ko-KR"; recognition.continuous=false; recognition.interimResults=true; $("#voiceStatus").textContent="듣고 있어요. 천천히 말해 주세요…"; recognition.onresult = e => { const text=[...e.results].map(r=>r[0].transcript).join(""); $("#answer").value=text; countText($("#answer"),"#answerCount"); }; recognition.onerror=()=>$("#voiceStatus").textContent="음성을 인식하지 못했어요. 텍스트로 이어서 적어 주세요."; recognition.onend=()=>{recognition=null;$("#voiceStatus").textContent="음성 입력이 끝났어요. 내용을 확인해 주세요."}; recognition.start(); });
