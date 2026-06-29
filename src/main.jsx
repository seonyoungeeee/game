import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const popupTemplates = [
  {
    title: "시스템 오류",
    body: "퇴근.exe가 응답하지 않습니다.",
    button: "확인",
    type: "error",
  },
  {
    title: "회의 요청",
    body: "오후 5:58 긴급 회의가 생성되었습니다.",
    button: "불참",
    type: "meeting",
  },
  {
    title: "수정 요청",
    body: "최종_진짜최종_수정본.pptx를 다시 확인하세요.",
    button: "닫기",
    type: "work",
  },
  {
    title: "팀장님",
    body: "혹시 지금 통화 가능하세요?",
    button: "읽씹",
    type: "message",
  },
  {
    title: "프린터 오류",
    body: "용지가 걸렸습니다. 아무도 고치지 않았습니다.",
    button: "못 본 척",
    type: "printer",
  },
];

const workCards = [
  "보고서",
  "회의록",
  "자료취합",
  "피드백 반영",
  "메일 확인",
  "최종본 수정",
  "긴급 공유",
  "내일 할 일",
  "파일 정리",
  "캡처 요청",
];

function beep(type = "click") {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const frequencies = {
      click: 520,
      error: 180,
      success: 720,
      warning: 320,
    };

    osc.frequency.value = frequencies[type] || 440;
    osc.type = "square";
    gain.gain.value = 0.035;

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch {
    // 브라우저가 오디오를 막으면 조용히 무시
  }
}

function ProgressBar({ value }) {
  return (
    <div className="progress-wrap">
      <div className="progress-bar" style={{ width: `${clamp(value, 0, 100)}%` }} />
    </div>
  );
}

function WindowFrame({ title, children, className = "", onClose }) {
  return (
    <div className={`win-window ${className}`}>
      <div className="title-bar">
        <span>{title}</span>
        <div className="title-buttons">
          <button aria-label="minimize">_</button>
          <button aria-label="maximize">□</button>
          <button aria-label="close" onClick={onClose}>
            X
          </button>
        </div>
      </div>
      <div className="window-body">{children}</div>
    </div>
  );
}

function Popup({ popup, onClose }) {
  return (
    <div
      className="popup"
      style={{
        left: `${popup.x}%`,
        top: `${popup.y}%`,
      }}
    >
      <WindowFrame title={popup.title} onClose={onClose}>
        <div className="popup-content">
          <div className="warning-icon">!</div>
          <p>{popup.body}</p>
        </div>
        <div className="popup-actions">
          <button className="win-button" onClick={onClose}>
            {popup.button}
          </button>
        </div>
      </WindowFrame>
    </div>
  );
}

function TermsWindow({ checks, setChecks, onAccept, onClose }) {
  const allChecked = checks.every(Boolean);

  const toggleCheck = (index) => {
    beep("click");

    setChecks((prev) => {
      const next = [...prev];
      next[index] = !next[index];

      if (index === 0 && next[index]) next[2] = false;
      if (index === 1 && next[index]) next[3] = false;
      if (index === 2 && next[index]) next[0] = false;

      return next;
    });
  };

  return (
    <div className="terms-window">
      <WindowFrame title="퇴근 약관" onClose={onClose}>
        <p className="small-text">
          퇴근 절차 진행을 위해 아래 항목에 동의해 주십시오.
        </p>

        <div className="checkbox-list">
          <label>
            <input type="checkbox" checked={checks[0]} onChange={() => toggleCheck(0)} />
            오늘 업무를 모두 완료했습니다.
          </label>

          <label>
            <input type="checkbox" checked={checks[1]} onChange={() => toggleCheck(1)} />
            내일의 나에게 미루지 않습니다.
          </label>

          <label>
            <input type="checkbox" checked={checks[2]} onChange={() => toggleCheck(2)} />
            퇴근 후 업무 연락을 확인하지 않습니다.
          </label>

          <label>
            <input type="checkbox" checked={checks[3]} onChange={() => toggleCheck(3)} />
            갑작스러운 회의에 흔들리지 않습니다.
          </label>
        </div>

        <div className="popup-actions">
          <button className="win-button" disabled={!allChecked} onClick={onAccept}>
            동의하고 퇴근하기
          </button>
          <button className="win-button" onClick={onClose}>
            취소
          </button>
        </div>

        {!allChecked && (
          <p className="hint-text">
            ※ 일부 체크박스는 서로를 질투합니다.
          </p>
        )}
      </WindowFrame>
    </div>
  );
}

function CopyWindow({ copyProgress }) {
  return (
    <div className="copy-window">
      <WindowFrame title="퇴근 준비 중...">
        <p>퇴근.exe를 실행하는 중입니다.</p>
        <ProgressBar value={copyProgress} />
        <p className="small-text">
          {copyProgress < 99
            ? `완료율: ${copyProgress}%`
            : "99% 완료 - 남은 시간: 알 수 없음"}
        </p>
        <button className="win-button disabled-look">취소</button>
      </WindowFrame>
    </div>
  );
}

function Ending({ status, progress, mental, onRestart }) {
  const success = status === "success";

  return (
    <div className="ending-screen">
      <WindowFrame title={success ? "시스템 메시지" : "시스템 오류"}>
        <div className="ending-content">
          <h1>{success ? "이제 회사를 나가도 안전합니다." : "퇴근.exe가 응답하지 않습니다."}</h1>

          <p>
            {success
              ? "퇴근 절차가 정상적으로 완료되었습니다."
              : "퇴근 권한을 확보하지 못했습니다. 야근 모드로 전환합니다."}
          </p>

          <div className="ending-stats">
            <p>퇴근 진행률: {progress}%</p>
            <p>멘탈 잔량: {mental}%</p>
            <p>
              오늘의 등급:{" "}
              {success && mental > 60
                ? "칼퇴의 지배자"
                : success && mental > 25
                ? "생존형 직장인"
                : success
                ? "껍데기만 퇴근"
                : mental <= 0
                ? "멘탈 퇴근"
                : "야근 확정"}
            </p>
          </div>

          <button className="win-button primary" onClick={onRestart}>
            다시 출근하기
          </button>
        </div>
      </WindowFrame>
    </div>
  );
}

function App() {
  const gameAreaRef = useRef(null);

  const [gameState, setGameState] = useState("ready");
  const [timeLeft, setTimeLeft] = useState(60);
  const [mental, setMental] = useState(100);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(1);
  const [buttonPos, setButtonPos] = useState({ x: 47, y: 56 });
  const [popups, setPopups] = useState([]);
  const [cards, setCards] = useState([]);
  const [logs, setLogs] = useState(["퇴근관리시스템 98이 실행되었습니다."]);
  const [showTerms, setShowTerms] = useState(false);
  const [checks, setChecks] = useState([false, false, false, false]);
  const [copyProgress, setCopyProgress] = useState(0);
  const [showCopy, setShowCopy] = useState(false);
  const [finalConfirm, setFinalConfirm] = useState(false);
  const [ending, setEnding] = useState(null);

  const stageName = useMemo(() => {
    if (stage === 1) return "1단계: 퇴근 버튼 활성화";
    if (stage === 2) return "2단계: 퇴근 약관 동의";
    if (stage === 3) return "3단계: 팝업 지옥";
    if (stage === 4) return "4단계: 진짜 버튼 찾기";
    return "5단계: 시스템 종료";
  }, [stage]);

  const addLog = (text) => {
    setLogs((prev) => [`${new Date().toLocaleTimeString("ko-KR", { hour12: false })}  ${text}`, ...prev].slice(0, 8));
  };

  const resetGame = () => {
    setGameState("ready");
    setTimeLeft(60);
    setMental(100);
    setProgress(0);
    setStage(1);
    setButtonPos({ x: 47, y: 56 });
    setPopups([]);
    setCards([]);
    setLogs(["퇴근관리시스템 98이 실행되었습니다."]);
    setShowTerms(false);
    setChecks([false, false, false, false]);
    setCopyProgress(0);
    setShowCopy(false);
    setFinalConfirm(false);
    setEnding(null);
  };

  const startGame = () => {
    beep("success");
    resetGame();
    setGameState("playing");
    addLog("퇴근 절차를 시작합니다.");
  };

  const spawnPopup = () => {
    const template = popupTemplates[randomBetween(0, popupTemplates.length - 1)];
    const newPopup = {
      id: crypto.randomUUID(),
      ...template,
      x: randomBetween(22, 63),
      y: randomBetween(18, 62),
    };

    setPopups((prev) => [...prev, newPopup].slice(-4));
    addLog(`${template.title} 창이 열렸습니다.`);
    beep("error");
  };

  const spawnCard = () => {
    const label = workCards[randomBetween(0, workCards.length - 1)];
    const newCard = {
      id: crypto.randomUUID(),
      label,
      x: randomBetween(12, 78),
      y: randomBetween(20, 73),
      rotate: randomBetween(-8, 8),
    };

    setCards((prev) => [...prev, newCard].slice(-10));
  };

  const moveButton = () => {
    const x = randomBetween(18, 76);
    const y = randomBetween(30, 76);
    setButtonPos({ x, y });
  };

  const handleButtonMouseEnter = () => {
    if (gameState !== "playing") return;

    if (progress >= 15) {
      moveButton();
      if (Math.random() > 0.55) {
        addLog("퇴근 버튼이 회피 기동을 시작했습니다.");
      }
    }
  };

  const handleLeaveClick = () => {
    if (gameState !== "playing") return;

    beep("click");

    if (stage === 2 && !showTerms) {
      setShowTerms(true);
      addLog("퇴근 약관 동의 창이 열렸습니다.");
      return;
    }

    if (stage === 5 && !finalConfirm) {
      setFinalConfirm(true);
      addLog("최종 퇴근 확인 창이 열렸습니다.");
      return;
    }

    const gain = stage >= 4 ? 9 : 12;
    const nextProgress = clamp(progress + gain, 0, 100);
    setProgress(nextProgress);
    addLog(`퇴근 버튼 클릭 성공. 진행률 +${gain}%`);

    if (Math.random() > 0.65) spawnPopup();
    if (Math.random() > 0.7) spawnCard();

    if (nextProgress >= 100) {
      setEnding("success");
      setGameState("ended");
      beep("success");
      addLog("퇴근 절차 완료.");
    }
  };

  const handleFakeClick = () => {
    beep("warning");
    setMental((prev) => clamp(prev - 10, 0, 100));
    setProgress((prev) => clamp(prev - 5, 0, 100));
    addLog("가짜 퇴근 버튼을 눌렀습니다. 추가 업무가 배정되었습니다.");
    spawnCard();
  };

  const handleOvertimeClick = () => {
    beep("error");
    setMental((prev) => clamp(prev - 15, 0, 100));
    setProgress((prev) => clamp(prev - 10, 0, 100));
    addLog("야근하기 버튼을 눌렀습니다. 손이 미끄러졌습니다.");
    spawnPopup();
  };

  const closePopup = (id) => {
    beep("click");
    setPopups((prev) => prev.filter((popup) => popup.id !== id));
    setMental((prev) => clamp(prev + 2, 0, 100));
    addLog("방해 창을 닫았습니다.");
  };

  const removeCard = (id) => {
    beep("click");
    setCards((prev) => prev.filter((card) => card.id !== id));
    addLog("업무 카드를 치웠습니다.");
  };

  const acceptTerms = () => {
    beep("success");
    setShowTerms(false);
    setProgress((prev) => clamp(prev + 18, 0, 100));
    setMental((prev) => clamp(prev - 5, 0, 100));
    addLog("퇴근 약관을 통과했습니다.");
  };

  const closeTerms = () => {
    beep("warning");
    setShowTerms(false);
    setMental((prev) => clamp(prev - 8, 0, 100));
    addLog("약관 창을 닫았습니다. 그러나 찝찝함이 남았습니다.");
  };

  const finalYes = () => {
    beep("success");
    setFinalConfirm(false);
    setProgress(100);
    setEnding("success");
    setGameState("ended");
    addLog("진짜 퇴근 버튼을 눌렀습니다.");
  };

  const finalNo = () => {
    beep("error");
    setFinalConfirm(false);
    setMental((prev) => clamp(prev - 20, 0, 100));
    addLog("퇴근하지 않기를 선택했습니다. 왜죠?");
  };

  useEffect(() => {
    if (gameState !== "playing") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setEnding("fail");
          setGameState("ended");
          beep("error");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== "playing") return;

    const eventTimer = setInterval(() => {
      if (Math.random() > 0.5) spawnPopup();
      if (Math.random() > 0.45) spawnCard();
      setMental((prev) => clamp(prev - randomBetween(1, 4), 0, 100));
    }, stage >= 3 ? 4500 : 6500);

    return () => clearInterval(eventTimer);
  }, [gameState, stage]);

  useEffect(() => {
    if (gameState !== "playing") return;

    if (progress >= 20 && stage < 2) {
      setStage(2);
      addLog("2단계 진입: 퇴근 약관이 활성화되었습니다.");
    }

    if (progress >= 45 && stage < 3) {
      setStage(3);
      setShowCopy(true);
      addLog("3단계 진입: 팝업 지옥이 시작되었습니다.");
    }

    if (progress >= 70 && stage < 4) {
      setStage(4);
      addLog("4단계 진입: 가짜 퇴근 버튼이 생성되었습니다.");
    }

    if (progress >= 90 && stage < 5) {
      setStage(5);
      addLog("5단계 진입: 시스템 종료 절차를 시작합니다.");
    }
  }, [progress, stage, gameState]);

  useEffect(() => {
    if (!showCopy || gameState !== "playing") return;

    const copyTimer = setInterval(() => {
      setCopyProgress((prev) => {
        if (prev >= 99) return 99;
        return clamp(prev + randomBetween(3, 8), 0, 99);
      });
    }, 700);

    return () => clearInterval(copyTimer);
  }, [showCopy, gameState]);

  useEffect(() => {
    if (mental <= 0 && gameState === "playing") {
      setEnding("fail");
      setGameState("ended");
      beep("error");
      addLog("멘탈이 0이 되었습니다.");
    }
  }, [mental, gameState]);

  return (
    <div className="desktop">
      <div className="desktop-icons">
        <div className="desktop-icon">
          <div className="icon-box">💾</div>
          <span>퇴근.exe</span>
        </div>
        <div className="desktop-icon">
          <div className="icon-box">📁</div>
          <span>최종본</span>
        </div>
        <div className="desktop-icon">
          <div className="icon-box">🗑️</div>
          <span>멘탈</span>
        </div>
      </div>

      {gameState === "ended" && (
        <Ending status={ending} progress={progress} mental={mental} onRestart={resetGame} />
      )}

      {gameState !== "ended" && (
        <main className="main-layout">
          <WindowFrame title="퇴근관리시스템 98" className="game-window">
            <div className="game-header">
              <div>
                <h1>퇴근하시겠습니까?</h1>
                <p>{gameState === "ready" ? "근무 시간이 종료되었습니다." : stageName}</p>
              </div>
              <div className="clock-box">
                <span>남은 시간</span>
                <strong>00:{String(timeLeft).padStart(2, "0")}</strong>
              </div>
            </div>

            {gameState === "ready" ? (
              <div className="ready-screen">
                <p>퇴근 절차를 시작하려면 아래 버튼을 누르십시오.</p>
                <p className="small-text">
                  주의: 본 시스템은 퇴근을 보장하지 않습니다.
                </p>
                <button className="win-button primary big" onClick={startGame}>
                  시작
                </button>
              </div>
            ) : (
              <>
                <div className="status-grid">
                  <div>
                    <div className="meter-label">
                      <span>퇴근 진행률</span>
                      <strong>{progress}%</strong>
                    </div>
                    <ProgressBar value={progress} />
                  </div>

                  <div>
                    <div className="meter-label">
                      <span>멘탈</span>
                      <strong>{mental}%</strong>
                    </div>
                    <ProgressBar value={mental} />
                  </div>
                </div>

                <div className="game-area" ref={gameAreaRef}>
                  <button
                    className="leave-button"
                    style={{
                      left: `${buttonPos.x}%`,
                      top: `${buttonPos.y}%`,
                    }}
                    onMouseEnter={handleButtonMouseEnter}
                    onClick={handleLeaveClick}
                  >
                    {stage >= 3 && Math.random() > 0.75 ? "정말요?" : "퇴근하기"}
                  </button>

                  {stage >= 4 && (
                    <>
                      <button className="fake-button fake-1" onClick={handleFakeClick}>
                        퇴근하기
                      </button>
                      <button className="fake-button fake-2" onClick={handleFakeClick}>
                        퇴근하기
                      </button>
                      <button className="fake-button fake-3" onClick={handleOvertimeClick}>
                        야근하기
                      </button>
                    </>
                  )}

                  {cards.map((card) => (
                    <button
                      key={card.id}
                      className="work-card"
                      style={{
                        left: `${card.x}%`,
                        top: `${card.y}%`,
                        transform: `rotate(${card.rotate}deg)`,
                      }}
                      onClick={() => removeCard(card.id)}
                    >
                      {card.label}
                    </button>
                  ))}
                </div>

                <div className="bottom-status">
                  상태: {stage >= 5 ? "시스템 종료 대기 중..." : "퇴근 절차 진행 중..."}
                </div>
              </>
            )}
          </WindowFrame>

          <WindowFrame title="이벤트 로그" className="log-window">
            <div className="log-list">
              {logs.map((log, index) => (
                <p key={`${log}-${index}`}>{log}</p>
              ))}
            </div>
          </WindowFrame>
        </main>
      )}

      {gameState === "playing" &&
        popups.map((popup) => (
          <Popup key={popup.id} popup={popup} onClose={() => closePopup(popup.id)} />
        ))}

      {gameState === "playing" && showTerms && (
        <TermsWindow
          checks={checks}
          setChecks={setChecks}
          onAccept={acceptTerms}
          onClose={closeTerms}
        />
      )}

      {gameState === "playing" && showCopy && <CopyWindow copyProgress={copyProgress} />}

      {gameState === "playing" && finalConfirm && (
        <div className="final-confirm">
          <WindowFrame title="최종 확인">
            <p>정말 정말 정말 퇴근하시겠습니까?</p>
            <p className="small-text">이 선택은 오늘의 업무에 큰 영향을 미칩니다.</p>
            <div className="popup-actions">
              <button className="win-button primary" onClick={finalYes}>
                예, 퇴근합니다
              </button>
              <button className="win-button danger" onClick={finalNo}>
                아니오
              </button>
            </div>
          </WindowFrame>
        </div>
      )}

      <div className="taskbar">
        <button className="start-button">시작</button>
        <div className="task-item">퇴근관리시스템 98</div>
        <div className="task-clock">
          {new Date().toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
