"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, ListGroup, ListGroupItem, Form } from "react-bootstrap";
import { useSelector } from "react-redux";
import * as quizClient from "../../client";
import * as attemptClient from "./client";

export default function TakeQuiz() {
  console.log("=== COMPONENT RENDER START ===");

  // 1. GET PARAMS/ROUTER (always run)
  const { cid, qid } = useParams();
  const router = useRouter();
  console.log("=== PARAMS/ROUTER ===", { cid, qid });

  // 2. ALL useState (always run)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [quiz, setQuiz] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attempt, setAttempt] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [answers, setAnswers] = useState<any>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerExpired, setTimerExpired] = useState(false);
  console.log("=== ALL STATES INITIALIZED ===");
  console.log("quiz:", !!quiz, "attempt:", !!attempt, "currentQuestionIndex:", currentQuestionIndex);

  // 3. ALL useSelector (always run)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { currentUser } = useSelector((state: any) => state.accountReducer);
  console.log("=== SELECTOR RUN ===");
  console.log("currentUser exists:", !!currentUser);
  console.log("currentUser email:", currentUser?.email);

  // 4. ALL useRef (always run)
  const renderCount = useRef(0);
  renderCount.current++;
  console.log("=== RENDER COUNT:", renderCount.current, " ===");

  // 5. ALL useCallback (always run - in same order every time)
  const fetchQuiz = useCallback(async () => {
    console.log("=== FETCH QUIZ START ===");
    console.log("Quiz ID:", qid);
    try {
      const quizData = await quizClient.findQuizById(qid as string);
      console.log("=== QUIZ FETCHED ===", quizData);
      setQuiz(quizData);
    } catch (error) {
      console.error("=== FETCH QUIZ ERROR ===", error);
    }
  }, [qid]);

  const startAttempt = useCallback(async () => {
    console.log("=== START ATTEMPT ===");
    console.log("Quiz ID:", qid);
    console.log("Current user:", currentUser?._id);
    try {
      const newAttempt = await attemptClient.createAttempt(qid as string);
      console.log("=== ATTEMPT CREATED ===", newAttempt);
      setAttempt(newAttempt);
    } catch (error: unknown) {
      console.error("=== START ATTEMPT ERROR ===", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((error as any)?.response?.status === 403) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        alert((error as any).response.data?.message || "Cannot start quiz. Maximum attempts reached or quiz not available.");
        router.push(`/Courses/${cid}/Quizzes/${qid}`);
      }
    }
  }, [qid, router, cid, currentUser]);

  // Calculate score helper function
  const calculateScore = useCallback(() => {
    console.log("=== CALCULATE SCORE ===");
    const questions = quiz?.questions || [];
    console.log("Questions count:", questions.length);
    let totalScore = 0;
    let totalPoints = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    questions.forEach((question: any) => {
      const points = question.points || 0;
      totalPoints += points;
      const answer = answers[question._id];
      if (!answer) return;

      if (question.questionType === "Multiple Choice") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const correctOptionIndex = (question.options || []).findIndex(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (opt: any) => opt.isCorrect
        );
        const selectedIndex = typeof answer === "number" ? answer : -1;
        const pointsEarned = correctOptionIndex === selectedIndex ? points : 0;
        totalScore += pointsEarned;
        console.log(`Question ${question._id}: ${pointsEarned}/${points} points`);
      } else if (question.questionType === "True/False") {
        const pointsEarned = answer === question.correctAnswer ? points : 0;
        totalScore += pointsEarned;
        console.log(`Question ${question._id}: ${pointsEarned}/${points} points`);
      } else if (question.questionType === "Fill in the Blank") {
        let blankScore = 0;
        const pointsPerBlank = points / (question.blanks?.length || 1);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (question.blanks || []).forEach((blank: any, blankIndex: number) => {
          const userAnswer = (Array.isArray(answer) ? answer[blankIndex] : "")?.toLowerCase().trim() || "";
          const correctAnswers = (blank.correctAnswers || []).map((a: string) =>
            a.toLowerCase().trim()
          );
          if (correctAnswers.includes(userAnswer)) {
            blankScore += pointsPerBlank;
          }
        });
        totalScore += blankScore;
        console.log(`Question ${question._id}: ${blankScore}/${points} points`);
      }
    });

    console.log("=== SCORE CALCULATED ===", { score: totalScore, totalPoints });
    return { score: totalScore, totalPoints };
  }, [quiz, answers]);

  // Helper to format answers for saving/updating attempt
  const formatAnswersForSave = useCallback(() => {
    console.log("=== FORMAT ANSWERS FOR SAVE ===");
    const questions = quiz?.questions || [];
    const formatted = questions.map((question: any) => {
      const answer = answers[question._id];
      if (answer === undefined) {
        return {
          questionId: question._id,
          selectedOptions: [],
          trueFalseAnswer: undefined,
          fillInAnswers: [],
        };
      }

      if (question.questionType === "Multiple Choice") {
        return {
          questionId: question._id,
          selectedOptions: typeof answer === "number" ? [answer] : [],
          trueFalseAnswer: undefined,
          fillInAnswers: undefined,
        };
      }
      if (question.questionType === "True/False") {
        return {
          questionId: question._id,
          selectedOptions: undefined,
          trueFalseAnswer: typeof answer === "boolean" ? answer : undefined,
          fillInAnswers: undefined,
        };
      }
      if (question.questionType === "Fill in the Blank") {
        return {
          questionId: question._id,
          selectedOptions: undefined,
          trueFalseAnswer: undefined,
          fillInAnswers: Array.isArray(answer) ? answer : [],
        };
      }
      return { questionId: question._id };
    });
    console.log("=== FORMATTED ANSWERS ===", formatted);
    return formatted;
  }, [answers, quiz]);

  const handleSubmit = useCallback(async (skipConfirmation = false) => {
    console.log("=== HANDLE SUBMIT START ===");
    console.log("skipConfirmation:", skipConfirmation);
    if (!skipConfirmation && !globalThis.confirm("Are you sure you want to submit this quiz? You cannot change your answers after submitting.")) {
      console.log("=== SUBMIT CANCELLED BY USER ===");
      return;
    }
    
    try {
      console.log("=== CALCULATING SCORE FOR SUBMIT ===");
      const { score, totalPoints } = calculateScore();
      const questions = quiz?.questions || [];
      // Convert answers to the format expected by the backend
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formattedAnswers = questions.map((question: any) => {
        const answer = answers[question._id];
        if (!answer) {
          return {
            questionId: question._id,
            selectedOptions: [],
            trueFalseAnswer: undefined,
            fillInAnswers: [],
          };
        }

        if (question.questionType === "Multiple Choice") {
          return {
            questionId: question._id,
            selectedOptions: typeof answer === "number" ? [answer] : [],
            trueFalseAnswer: undefined,
            fillInAnswers: undefined,
          };
        } else if (question.questionType === "True/False") {
          return {
            questionId: question._id,
            selectedOptions: undefined,
            trueFalseAnswer: typeof answer === "boolean" ? answer : undefined,
            fillInAnswers: undefined,
          };
        } else if (question.questionType === "Fill in the Blank") {
          return {
            questionId: question._id,
            selectedOptions: undefined,
            trueFalseAnswer: undefined,
            fillInAnswers: Array.isArray(answer) ? answer : [],
          };
        }
        return { questionId: question._id };
      });

      console.log("=== SUBMITTING ATTEMPT ===");
      console.log("Attempt ID:", attempt._id);
      console.log("Score:", score, "Total Points:", totalPoints);
      await attemptClient.submitAttempt(attempt._id, formattedAnswers, score, totalPoints);
      console.log("=== SUBMIT SUCCESS - NAVIGATING TO RESULTS ===");
      router.push(`/Courses/${cid}/Quizzes/${qid}/Results`);
    } catch (error) {
      console.error("=== SUBMIT ERROR ===", error);
      alert("Error submitting quiz. Please try again.");
    }
  }, [quiz, answers, attempt, calculateScore, router, cid, qid]);

  console.log("=== ALL CALLBACKS DEFINED ===");

  // 6. ALL useEffect (always run - NEVER conditional)
  useEffect(() => {
    console.log("=== FETCH QUIZ EFFECT ===");
    fetchQuiz();
  }, [fetchQuiz]);

  useEffect(() => {
    console.log("=== START ATTEMPT EFFECT ===");
    console.log("currentUser:", !!currentUser);
    console.log("quiz:", !!quiz);
    console.log("attempt:", !!attempt);
    console.log("quiz.published:", quiz?.published);
    if (currentUser && quiz && !attempt && quiz.published) {
      console.log("=== CONDITIONS MET - STARTING ATTEMPT ===");
      startAttempt();
    } else {
      console.log("=== CONDITIONS NOT MET - SKIPPING ATTEMPT START ===");
    }
  }, [currentUser, quiz, attempt, startAttempt]);

  // Restore saved state from attempt (question index + answers)
  useEffect(() => {
    console.log("=== RESTORE SAVED STATE EFFECT ===");
    console.log("attempt:", !!attempt);
    if (attempt && attempt.currentQuestionIndex !== undefined) {
      console.log("=== RESTORING QUESTION INDEX ===", attempt.currentQuestionIndex);
      setCurrentQuestionIndex(attempt.currentQuestionIndex);
    }
    if (attempt && attempt.answers) {
      console.log("=== RESTORING ANSWERS ===", attempt.answers);
      const savedAnswers: Record<string, unknown> = {};
      attempt.answers.forEach((ans: any) => {
        if (ans.selectedOptions && ans.selectedOptions.length > 0) {
          savedAnswers[ans.questionId] = ans.selectedOptions[0];
        }
        if (ans.trueFalseAnswer !== undefined) {
          savedAnswers[ans.questionId] = ans.trueFalseAnswer;
        }
        if (ans.fillInAnswers) {
          savedAnswers[ans.questionId] = ans.fillInAnswers;
        }
      });
      setAnswers(savedAnswers);
    }
  }, [attempt]);

  // Compute and update time remaining (if quiz has a time limit)
  useEffect(() => {
    console.log("=== TIMER COUNTDOWN EFFECT ===");
    console.log("quiz:", !!quiz);
    console.log("attempt:", !!attempt);
    console.log("quiz.timeLimit:", quiz?.timeLimit);
    console.log("quiz.timeLimitMinutes:", quiz?.timeLimitMinutes);
    console.log("timeRemaining:", timeRemaining);
    
    if (!quiz || !attempt || !quiz.timeLimit || !quiz.timeLimitMinutes) {
      console.log("=== TIMER NOT ACTIVE - SKIPPING ===");
      return;
    }
    
    console.log("=== STARTING TIMER COUNTDOWN ===");
    const computeRemaining = () => {
      const startedAt = attempt.startedAt ? new Date(attempt.startedAt).getTime() : Date.now();
      const elapsedFromStart = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = quiz.timeLimitMinutes * 60 - elapsedFromStart;
      const clampedRemaining = Math.max(0, remaining);
      
      setTimeRemaining((prev) => {
        console.log("Timer tick, remaining:", clampedRemaining, "prev:", prev);
        
        if (clampedRemaining <= 0 && prev !== null && prev > 0) {
          console.log("!!! TIMER REACHED 0 - Setting timerExpired to true !!!");
          setTimerExpired(true);
          return 0;
        }
        
        return clampedRemaining;
      });
    };
    
    computeRemaining();
    const interval = setInterval(computeRemaining, 1000);
    return () => {
      console.log("=== CLEARING TIMER INTERVAL ===");
      clearInterval(interval);
    };
  }, [quiz, attempt, timeRemaining]);

  // Auto-save attempt state (answers, currentQuestionIndex, elapsedSeconds)
  useEffect(() => {
    console.log("=== AUTO-SAVE EFFECT ===");
    console.log("attempt:", !!attempt);
    console.log("quiz:", !!quiz);
    if (!attempt || !quiz) {
      console.log("=== AUTO-SAVE SKIPPED - Missing attempt or quiz ===");
      return;
    }
    console.log("=== PERFORMING AUTO-SAVE ===");
    const startedAt = attempt.startedAt ? new Date(attempt.startedAt).getTime() : Date.now();
    const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
    const payloadAnswers = formatAnswersForSave();
    console.log("Auto-saving:", {
      attemptId: attempt._id,
      currentQuestionIndex,
      elapsedSeconds,
      answersCount: payloadAnswers.length,
    });

    attemptClient
      .updateAttempt(attempt._id, {
        answers: payloadAnswers,
        currentQuestionIndex,
        elapsedSeconds,
      })
      .then(() => {
        console.log("=== AUTO-SAVE SUCCESS ===");
      })
      .catch((err) => {
        console.error("=== AUTO-SAVE ERROR ===", err);
      });
  }, [answers, currentQuestionIndex, attempt, quiz, formatAnswersForSave]);

  // Auto-submit when timer expires
  useEffect(() => {
    console.log("=== AUTO-SUBMIT EFFECT ===");
    console.log("timerExpired:", timerExpired);
    console.log("handleSubmit function:", typeof handleSubmit);

    if (timerExpired) {
      console.log("!!! TIME EXPIRED - TRIGGERING AUTO-SUBMIT !!!");
      handleSubmit(true);
    } else {
      console.log("Timer not expired, skipping auto-submit");
    }
  }, [timerExpired, handleSubmit]);

  console.log("=== ALL EFFECTS REGISTERED ===");

  // 7. EARLY RETURNS (after ALL hooks)
  console.log("=== CHECKING EARLY RETURNS ===");
  console.log("quiz exists?", !!quiz);
  console.log("attempt exists?", !!attempt);

  if (!quiz || !attempt) {
    console.log("RETURNING: Loading state (quiz:", !!quiz, "attempt:", !!attempt, ")");
    return <div>Loading...</div>;
  }

  // 8. RENDER LOGIC (after ALL hooks and early returns)
  console.log("=== RENDERING QUIZ ===");
  const questions = quiz?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  console.log("Questions count:", questions.length);
  console.log("Current question index:", currentQuestionIndex);
  console.log("Current question:", currentQuestion?.title);

  if (questions.length === 0) {
    console.log("RETURNING: No questions");
    return (
      <div>
        <h3>{quiz.title}</h3>
        <p>No questions in this quiz yet.</p>
      </div>
    );
  }

  const isResuming =
    (attempt?.currentQuestionIndex ?? 0) > 0 ||
    (attempt?.answers?.length ?? 0) > 0;
  console.log("Is resuming:", isResuming);

  const handleAnswerChange = (questionId: string, answer: unknown) => {
    console.log("=== ANSWER CHANGED ===");
    console.log("Question ID:", questionId);
    console.log("Answer:", answer);
    setAnswers((prev: any) => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    console.log("=== HANDLE NEXT ===");
    console.log("Current index:", currentQuestionIndex);
    console.log("Questions length:", questions.length);
    if (currentQuestionIndex < questions.length - 1) {
      const newIndex = currentQuestionIndex + 1;
      console.log("Moving to question:", newIndex);
      setCurrentQuestionIndex(newIndex);
    } else {
      console.log("Already at last question");
    }
  };

  const handlePrevious = () => {
    console.log("=== HANDLE PREVIOUS ===");
    console.log("Current index:", currentQuestionIndex);
    if (currentQuestionIndex > 0) {
      const newIndex = currentQuestionIndex - 1;
      console.log("Moving to question:", newIndex);
      setCurrentQuestionIndex(newIndex);
    } else {
      console.log("Already at first question");
    }
  };

  const handleJumpToQuestion = (index: number) => {
    console.log("=== HANDLE JUMP TO QUESTION ===");
    console.log("Jumping to index:", index);
    setCurrentQuestionIndex(index);
  };

  console.log("=== RENDERING QUIZ UI ===");

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>{quiz.title}</h3>
        {isResuming && (
          <div className="text-muted me-3">
            Resuming quiz from Question {currentQuestionIndex + 1}...
          </div>
        )}
        <Button
          variant="danger"
          onClick={() => {
            console.log("=== SUBMIT BUTTON CLICKED ===");
            handleSubmit(false);
          }}
        >
          Submit Quiz
        </Button>
      </div>

      {quiz.timeLimit && quiz.timeLimitMinutes && (
        <div className="mb-3">
          <strong>Time Remaining: </strong>
          {timeRemaining !== null
            ? `${Math.max(0, Math.floor(timeRemaining / 60))}m ${Math.max(
                0,
                timeRemaining % 60
              )}s`
            : "Calculating..."}
        </div>
      )}

      <div className="mb-3">
        <strong>
          Question {currentQuestionIndex + 1} of {questions.length}
        </strong>
      </div>

      {currentQuestion && (
        <div className="border p-4 rounded mb-3">
          <div className="mb-3">
            <strong>{currentQuestion.title || "Untitled Question"}</strong>
            <span className="ms-2 text-muted">
              ({currentQuestion.points} points)
            </span>
          </div>
          <div className="mb-3">
            <div
              dangerouslySetInnerHTML={{ __html: currentQuestion.question || "" }}
            />
          </div>

          {/* Multiple Choice */}
          {currentQuestion.questionType === "Multiple Choice" && (
            <div>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {currentQuestion.options?.map((option: any, index: number) => {
                const optionKey = `take-opt-${currentQuestion._id}-${index}-${String(option.text || "").substring(0, 10) || index}`;
                return (
                  <div key={optionKey} className="mb-2">
                    <Form.Check
                      type="radio"
                      id={`take-option-${currentQuestion._id}-${index}`}
                      name={`take-mc-${currentQuestion._id}`}
                      checked={answers[currentQuestion._id] === index}
                      onChange={() => {
                        console.log("=== MULTIPLE CHOICE OPTION CLICKED ===");
                        console.log("Question:", currentQuestion._id);
                        console.log("Option index:", index);
                        handleAnswerChange(currentQuestion._id, index);
                      }}
                      label={option.text}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* True/False */}
          {currentQuestion.questionType === "True/False" && (
            <div>
              <div className="mb-2">
                <Form.Check
                  type="radio"
                  id={`take-tf-true-${currentQuestion._id}`}
                  name={`take-tf-${currentQuestion._id}`}
                  checked={answers[currentQuestion._id] === true}
                  onChange={() => {
                    console.log("=== TRUE/FALSE TRUE CLICKED ===");
                    handleAnswerChange(currentQuestion._id, true);
                  }}
                  label="True"
                />
              </div>
              <div className="mb-2">
                <Form.Check
                  type="radio"
                  id={`take-tf-false-${currentQuestion._id}`}
                  name={`take-tf-${currentQuestion._id}`}
                  checked={answers[currentQuestion._id] === false}
                  onChange={() => {
                    console.log("=== TRUE/FALSE FALSE CLICKED ===");
                    handleAnswerChange(currentQuestion._id, false);
                  }}
                  label="False"
                />
              </div>
            </div>
          )}

          {/* Fill in the Blank */}
          {currentQuestion.questionType === "Fill in the Blank" && (
            <div>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {currentQuestion.blanks?.map((blank: any, blankIndex: number) => {
                const blankKey = `take-blank-${currentQuestion._id}-${blankIndex}-${String(blank.text || "").substring(0, 10) || blankIndex}`;
                return (
                  <div key={blankKey} className="mb-2">
                  <Form.Label htmlFor={`take-blank-${currentQuestion._id}-${blankIndex}`}>
                    {blank.text}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    id={`take-blank-${currentQuestion._id}-${blankIndex}`}
                    value={answers[currentQuestion._id]?.[blankIndex] || ""}
                    onChange={(e) => {
                      console.log("=== FILL IN BLANK CHANGED ===");
                      console.log("Question:", currentQuestion._id);
                      console.log("Blank index:", blankIndex);
                      console.log("Value:", e.target.value);
                      const currentAnswers = answers[currentQuestion._id] || [];
                      const newAnswers = [...currentAnswers];
                      newAnswers[blankIndex] = e.target.value;
                      handleAnswerChange(currentQuestion._id, newAnswers);
                    }}
                    placeholder="Enter your answer"
                  />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="d-flex justify-content-between mb-3">
        <Button
          variant="secondary"
          onClick={() => {
            console.log("=== PREVIOUS BUTTON CLICKED ===");
            handlePrevious();
          }}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            console.log("=== NEXT BUTTON CLICKED ===");
            handleNext();
          }}
          disabled={currentQuestionIndex === questions.length - 1}
        >
          Next
        </Button>
      </div>

      <div className="mt-4">
        <strong>Question Navigation:</strong>
        <ListGroup horizontal className="mt-2">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {questions.map((q: any, index: number) => (
            <ListGroupItem
              key={q._id}
              action
              active={index === currentQuestionIndex}
              onClick={() => {
                console.log("=== QUESTION NAVIGATION CLICKED ===");
                console.log("Jumping to question index:", index);
                handleJumpToQuestion(index);
              }}
              style={{ cursor: "pointer" }}
            >
              {index + 1}
            </ListGroupItem>
          ))}
        </ListGroup>
      </div>
    </div>
  );
}
