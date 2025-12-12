"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, ListGroup, ListGroupItem, Form } from "react-bootstrap";
import { useSelector } from "react-redux";
import * as quizClient from "../../client";
import * as attemptClient from "./client";

export default function TakeQuiz() {
  // 1. GET PARAMS/ROUTER (always run)
  const { cid, qid } = useParams();
  const router = useRouter();

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
  const [questionOrder, setQuestionOrder] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 3. ALL useSelector (always run)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { currentUser } = useSelector((state: any) => state.accountReducer);

  // 4. ALL useRef (always run)
  const hasAutoSubmitted = useRef(false);
  const questionOrderInitialized = useRef(false);

  // 5. ALL useCallback (always run - in same order every time)
  const fetchQuiz = useCallback(async () => {
    try {
      const quizData = await quizClient.findQuizById(qid as string);
      setQuiz(quizData);
    } catch (error) {
      console.error("Error fetching quiz:", error);
    }
  }, [qid]);

  const startAttempt = useCallback(async () => {
    try {
      const newAttempt = await attemptClient.createAttempt(qid as string);
      setAttempt(newAttempt);
      
      // If attempt has saved state, restore it
      if (newAttempt.questionOrder && newAttempt.questionOrder.length > 0) {
        setQuestionOrder(newAttempt.questionOrder);
        questionOrderInitialized.current = true;
      }
      if (newAttempt.currentQuestionIndex !== undefined) {
        setCurrentQuestionIndex(newAttempt.currentQuestionIndex);
      }
    } catch (error: unknown) {
      console.error("Error starting attempt:", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((error as any)?.response?.status === 403) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        alert((error as any).response.data?.message || "Cannot start quiz. Maximum attempts reached or quiz not available.");
        router.push(`/Courses/${cid}/Quizzes/${qid}`);
      }
    }
  }, [qid, router, cid]);

  // Calculate score helper function
  const calculateScore = useCallback(() => {
    const questions = quiz?.questions || [];
    let totalScore = 0;
    let totalPoints = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    questions.forEach((question: any) => {
      const points = question.points || 0;
      totalPoints += points;
      const answer = answers[question._id];
      if (answer === undefined || answer === null) return;

      if (question.questionType === "Multiple Choice") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const correctOptionIndex = (question.options || []).findIndex(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (opt: any) => opt.isCorrect
        );
        const selectedIndex = typeof answer === "number" ? answer : -1;
        const pointsEarned = correctOptionIndex === selectedIndex ? points : 0;
        totalScore += pointsEarned;
      } else if (question.questionType === "True/False") {
        const pointsEarned = answer === question.correctAnswer ? points : 0;
        totalScore += pointsEarned;
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
      }
    });

    return { score: totalScore, totalPoints };
  }, [quiz, answers]);

  // Helper to format answers for saving/updating attempt
  const formatAnswersForSave = useCallback(() => {
    const questions = quiz?.questions || [];
    const formatted = questions.map((question: any) => {
      const answer = answers[question._id];
      if (answer === undefined || answer === null) {
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
    return formatted;
  }, [answers, quiz]);

  const handleSubmit = useCallback(async (isAutoSubmit = false) => {
    // Prevent double submission
    if (isSubmitting) {
      console.log("Already submitting, ignoring duplicate call");
      return;
    }

    if (!isAutoSubmit && !globalThis.confirm("Are you sure you want to submit this quiz? You cannot change your answers after submitting.")) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { score, totalPoints } = calculateScore();
      const questions = quiz?.questions || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formattedAnswers = questions.map((question: any) => {
        const answer = answers[question._id];
        if (answer === undefined || answer === null) {
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

      await attemptClient.submitAttempt(attempt._id, formattedAnswers, score, totalPoints);
      
      // Mark as auto-submitted if timer expired
      if (isAutoSubmit) {
        hasAutoSubmitted.current = true;
      }
      
      // Navigate to results page
      router.push(`/Courses/${cid}/Quizzes/${qid}/Results`);
    } catch (error) {
      console.error("Submission failed:", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorMessage = (error as any)?.response?.data?.message || "Failed to submit quiz. Please try again.";
      alert(errorMessage);
      setIsSubmitting(false);
    }
  }, [quiz, answers, attempt, calculateScore, router, cid, qid, isSubmitting]);

  // 6. ALL useEffect (always run - NEVER conditional)
  
  // Fetch quiz data
  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  // Start or resume attempt
  useEffect(() => {
    if (currentUser && quiz && !attempt && quiz.published) {
      startAttempt();
    }
  }, [currentUser, quiz, attempt, startAttempt]);

  // Restore saved state from attempt (FIRST PRIORITY - before question order init)
  useEffect(() => {
    if (!attempt || !quiz || !quiz.questions) return;
    
    // Restore question order FIRST (if exists in attempt)
    if (attempt.questionOrder && Array.isArray(attempt.questionOrder) && attempt.questionOrder.length > 0) {
      setQuestionOrder(attempt.questionOrder);
      questionOrderInitialized.current = true;
    }
    
    // Restore current question index
    if (attempt.currentQuestionIndex !== undefined && attempt.currentQuestionIndex !== null) {
      setCurrentQuestionIndex(attempt.currentQuestionIndex);
    }
    
    // Restore answers
    if (attempt.answers && Array.isArray(attempt.answers) && attempt.answers.length > 0) {
      const savedAnswers: Record<string, unknown> = {};
      attempt.answers.forEach((ans: any) => {
        if (!ans) return;
        
        const questionId = ans.questionId?.toString ? ans.questionId.toString() : ans.questionId;
        if (!questionId) return;
        
        // Verify question exists in quiz
        const questionExists = quiz.questions.some((q: any) => {
          const qId = q._id?.toString ? q._id.toString() : q._id;
          return qId === questionId;
        });
        
        if (!questionExists) return;
        
        if (ans.selectedOptions && Array.isArray(ans.selectedOptions) && ans.selectedOptions.length > 0) {
          savedAnswers[questionId] = ans.selectedOptions[0];
        } else if (ans.trueFalseAnswer !== undefined && ans.trueFalseAnswer !== null) {
          savedAnswers[questionId] = ans.trueFalseAnswer;
        } else if (ans.fillInAnswers && Array.isArray(ans.fillInAnswers)) {
          savedAnswers[questionId] = ans.fillInAnswers;
        }
      });
      
      if (Object.keys(savedAnswers).length > 0) {
        setAnswers(savedAnswers);
      }
    }
  }, [attempt, quiz]);

  // Initialize question order (ONLY if not restored from attempt)
  useEffect(() => {
    if (!quiz || !quiz.questions || !attempt) return;
    
    // Skip if already initialized (restored from attempt or already set)
    if (questionOrderInitialized.current || questionOrder.length > 0) return;
    
    let order: number[] = [];
    
    // Check if should shuffle
    if (quiz.shuffleAnswers === true) {
      // Shuffle the questions using Fisher-Yates algorithm
      order = quiz.questions.map((_: any, index: number) => index);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
    } else {
      // Keep original order
      order = quiz.questions.map((_: any, index: number) => index);
    }
    
    setQuestionOrder(order);
    questionOrderInitialized.current = true;
    
    // Save the new order to backend immediately
    if (attempt._id && !attempt.submittedAt && !attempt.submitted) {
      attemptClient.updateAttempt(attempt._id, {
        questionOrder: order,
      }).catch((err) => {
        console.error("Error saving question order:", err);
      });
    }
  }, [quiz, attempt, questionOrder]);

  // Timer countdown - calculate remaining time continuously
  useEffect(() => {
    if (!quiz || !attempt) {
      setTimeRemaining(null);
      return;
    }
    
    if (!quiz.timeLimit || !quiz.timeLimitMinutes) {
      setTimeRemaining(null);
      return;
    }
    
    // Skip timer if attempt is already submitted
    if (attempt.submittedAt || attempt.submitted) {
      setTimeRemaining(0);
      return;
    }
    
    // Validate startedAt
    if (!attempt.startedAt) {
      console.error("No startedAt found in attempt!");
      setTimeRemaining(null);
      return;
    }
    
    // Parse startedAt
    let startedAtTimestamp: number;
    try {
      const startedAtDate = new Date(attempt.startedAt);
      if (isNaN(startedAtDate.getTime())) {
        console.error("Invalid startedAt date!", attempt.startedAt);
        setTimeRemaining(null);
        return;
      }
      startedAtTimestamp = startedAtDate.getTime();
    } catch (error) {
      console.error("Failed to parse startedAt", error);
      setTimeRemaining(null);
      return;
    }
    
    const computeRemaining = () => {
      const now = Date.now();
      const elapsedFromStart = Math.floor((now - startedAtTimestamp) / 1000);
      const timeLimitSeconds = quiz.timeLimitMinutes * 60;
      const remaining = timeLimitSeconds - elapsedFromStart;
      const clampedRemaining = Math.max(0, remaining);
      
      setTimeRemaining(clampedRemaining);
      
      // Trigger timer expired when reaching zero
      if (clampedRemaining === 0 && !hasAutoSubmitted.current) {
        setTimerExpired(true);
      }
    };
    
    // Compute immediately
    computeRemaining();
    
    // Then update every second
    const interval = setInterval(computeRemaining, 1000);
    return () => clearInterval(interval);
  }, [quiz, attempt]);

  // Auto-save attempt state on every change
  useEffect(() => {
    if (!attempt || !quiz || !attempt._id) return;
    
    // Skip if attempt is already submitted
    if (attempt.submittedAt || attempt.submitted) return;
    
    const startedAt = attempt.startedAt ? new Date(attempt.startedAt).getTime() : Date.now();
    const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
    const payloadAnswers = formatAnswersForSave();

    const updateData: any = {
      answers: payloadAnswers,
      currentQuestionIndex,
      elapsedSeconds,
    };
    
    // Include questionOrder if it exists
    if (questionOrder.length > 0) {
      updateData.questionOrder = questionOrder;
    }

    attemptClient
      .updateAttempt(attempt._id, updateData)
      .catch((err) => {
        console.error("Auto-save error:", err);
      });
  }, [answers, currentQuestionIndex, attempt, quiz, formatAnswersForSave, questionOrder]);

  // Auto-submit when timer expires
  useEffect(() => {
    if (timerExpired && attempt && !attempt.submittedAt && !attempt.submitted && !hasAutoSubmitted.current) {
      console.log("Timer expired - triggering auto-submit");
      // Small delay to ensure state is consistent
      const timeoutId = setTimeout(() => {
        handleSubmit(true);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [timerExpired, handleSubmit, attempt]);

  // 7. EARLY RETURNS (after ALL hooks)
  if (!quiz || !attempt) {
    return <div>Loading...</div>;
  }

  // 8. RENDER LOGIC (after ALL hooks and early returns)
  const questions = quiz?.questions || [];
  
  // Use questionOrder to map currentQuestionIndex to actual question
  const actualQuestionIndex = questionOrder.length > 0 && questionOrder[currentQuestionIndex] !== undefined
    ? questionOrder[currentQuestionIndex]
    : currentQuestionIndex;
  
  const currentQuestion = questionOrder.length > 0 && questions[actualQuestionIndex]
    ? questions[actualQuestionIndex]
    : questions[currentQuestionIndex] || null;

  if (questions.length === 0) {
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

  const handleAnswerChange = (questionId: string, answer: unknown) => {
    // Always use the original question ID for saving answers
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

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
          onClick={() => handleSubmit(false)}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Quiz"}
        </Button>
      </div>

      {quiz.timeLimit && quiz.timeLimitMinutes && (
        <div className="mb-3">
          <strong>Time Remaining: </strong>
          {timeRemaining !== null && timeRemaining !== undefined ? (
            <span className={timeRemaining <= 60 ? "text-danger fw-bold" : ""}>
              {Math.max(0, Math.floor(timeRemaining / 60))}m {Math.max(0, Math.floor(timeRemaining % 60))}s
            </span>
          ) : (
            <span>Calculating...</span>
          )}
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
                const optionKey = `take-opt-${currentQuestion._id}-${index}`;
                const originalQuestionId = currentQuestion._id;
                return (
                  <div key={optionKey} className="mb-2">
                    <Form.Check
                      type="radio"
                      id={`take-option-${currentQuestion._id}-${index}`}
                      name={`take-mc-${currentQuestion._id}`}
                      checked={answers[originalQuestionId] === index}
                      onChange={() => handleAnswerChange(originalQuestionId, index)}
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
                  onChange={() => handleAnswerChange(currentQuestion._id, true)}
                  label="True"
                />
              </div>
              <div className="mb-2">
                <Form.Check
                  type="radio"
                  id={`take-tf-false-${currentQuestion._id}`}
                  name={`take-tf-${currentQuestion._id}`}
                  checked={answers[currentQuestion._id] === false}
                  onChange={() => handleAnswerChange(currentQuestion._id, false)}
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
                const blankKey = `take-blank-${currentQuestion._id}-${blankIndex}`;
                const originalQuestionId = currentQuestion._id;
                return (
                  <div key={blankKey} className="mb-2">
                    <Form.Label htmlFor={`take-blank-${currentQuestion._id}-${blankIndex}`}>
                      {blank.text}
                    </Form.Label>
                    <Form.Control
                      type="text"
                      id={`take-blank-${currentQuestion._id}-${blankIndex}`}
                      value={answers[originalQuestionId]?.[blankIndex] || ""}
                      onChange={(e) => {
                        const currentAnswers = answers[originalQuestionId] || [];
                        const newAnswers = [...currentAnswers];
                        newAnswers[blankIndex] = e.target.value;
                        handleAnswerChange(originalQuestionId, newAnswers);
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
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>
        <Button
          variant="primary"
          onClick={handleNext}
          disabled={currentQuestionIndex === questions.length - 1}
        >
          Next
        </Button>
      </div>

      <div className="mt-4">
        <strong>Question Navigation:</strong>
        <ListGroup horizontal className="mt-2 flex-wrap">
          {questionOrder.length > 0 ? (
            questionOrder.map((originalIndex: number, displayIndex: number) => {
              const question = questions[originalIndex];
              return (
                <ListGroupItem
                  key={question?._id || originalIndex}
                  action
                  active={displayIndex === currentQuestionIndex}
                  onClick={() => handleJumpToQuestion(displayIndex)}
                  style={{ cursor: "pointer" }}
                >
                  {displayIndex + 1}
                </ListGroupItem>
              );
            })
          ) : (
            // Fallback if questionOrder not initialized yet
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            questions.map((q: any, index: number) => (
              <ListGroupItem
                key={q._id}
                action
                active={index === currentQuestionIndex}
                onClick={() => handleJumpToQuestion(index)}
                style={{ cursor: "pointer" }}
              >
                {index + 1}
              </ListGroupItem>
            ))
          )}
        </ListGroup>
      </div>
    </div>
  );
}
