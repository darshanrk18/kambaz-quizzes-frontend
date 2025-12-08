"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, ListGroup, ListGroupItem, Form } from "react-bootstrap";
import { useSelector } from "react-redux";
import * as quizClient from "../../client";
import * as attemptClient from "./client";

export default function TakeQuiz() {
  const { cid, qid } = useParams();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [quiz, setQuiz] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attempt, setAttempt] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [answers, setAnswers] = useState<any>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { currentUser } = useSelector((state: any) => state.accountReducer);

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

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  useEffect(() => {
    if (currentUser && quiz && !attempt && quiz.published) {
      startAttempt();
    }
  }, [currentUser, quiz, attempt, startAttempt]);

  if (!quiz || !attempt) {
    return <div>Loading...</div>;
  }

  const questions = quiz.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerChange = (questionId: string, answer: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setAnswers({ ...answers as any, [questionId]: answer });
    // Auto-save answers to attempt
    if (attempt) {
      const isNumberArray = (arr: unknown): arr is number[] => {
        return Array.isArray(arr) && arr.every((a) => typeof a === "number");
      };
      const isStringArray = (arr: unknown): arr is string[] => {
        return Array.isArray(arr) && arr.length > 0 && arr.every((a) => typeof a === "string");
      };
      
      const answerData = {
        questionId,
        selectedOptions: isNumberArray(answer) ? answer : undefined,
        trueFalseAnswer: typeof answer === "boolean" ? answer : undefined,
        fillInAnswers: isStringArray(answer) ? answer : undefined,
      };
      attemptClient.updateAttempt(attempt._id, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        answers: [...(attempt.answers || []).filter((a: any) => a.questionId !== questionId), answerData],
      }).catch((err) => console.error("Error auto-saving:", err));
    }
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

  const calculateScore = () => {
    let totalScore = 0;
    let totalPoints = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    questions.forEach((question: any) => {
      totalPoints += question.points || 0;
      const answer = answers[question._id];
      if (!answer) return;

      if (question.questionType === "Multiple Choice") {
        const correctOptions = (question.options || [])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((opt: any, idx: number) => (opt.isCorrect ? idx : -1))
          .filter((idx: number) => idx !== -1);
        const selectedOptions = Array.isArray(answer) ? answer : [];
        const isCorrect =
          correctOptions.length === selectedOptions.length &&
          correctOptions.every((idx: number) => selectedOptions.includes(idx)) &&
          selectedOptions.every((idx: number) => correctOptions.includes(idx));
        if (isCorrect) {
          totalScore += question.points || 0;
        }
      } else if (question.questionType === "True/False") {
        if (answer === question.correctAnswer) {
          totalScore += question.points || 0;
        }
      } else if (question.questionType === "Fill in the Blank") {
        let blankScore = 0;
        const pointsPerBlank = (question.points || 0) / (question.blanks?.length || 1);
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
  };

  const handleSubmit = async () => {
    if (globalThis.confirm("Are you sure you want to submit this quiz? You cannot change your answers after submitting.")) {
      try {
        const { score, totalPoints } = calculateScore();
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
              selectedOptions: Array.isArray(answer) ? answer : [],
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
        router.push(`/Courses/${cid}/Quizzes/${qid}/Results`);
      } catch (error) {
        console.error("Error submitting quiz:", error);
        alert("Error submitting quiz. Please try again.");
      }
    }
  };

  if (questions.length === 0) {
    return (
      <div>
        <h3>{quiz.title}</h3>
        <p>No questions in this quiz yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>{quiz.title}</h3>
        <Button variant="danger" onClick={handleSubmit}>
          Submit Quiz
        </Button>
      </div>

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
                    type="checkbox"
                    id={`take-option-${currentQuestion._id}-${index}`}
                    checked={
                      (answers[currentQuestion._id] || []).includes(index)
                    }
                    onChange={(e) => {
                      const currentAnswers = answers[currentQuestion._id] || [];
                      if (e.target.checked) {
                        handleAnswerChange(currentQuestion._id, [
                          ...currentAnswers,
                          index,
                        ]);
                      } else {
                        handleAnswerChange(
                          currentQuestion._id,
                          currentAnswers.filter((i: number) => i !== index)
                        );
                      }
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
        <ListGroup horizontal className="mt-2">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {questions.map((q: any, index: number) => (
            <ListGroupItem
              key={q._id}
              action
              active={index === currentQuestionIndex}
              onClick={() => handleJumpToQuestion(index)}
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

