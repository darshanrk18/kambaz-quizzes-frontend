"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, Table } from "react-bootstrap";
import { useSelector } from "react-redux";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import * as quizClient from "../../client";
import * as attemptClient from "../Take/client";

export default function QuizResults() {
  const { cid, qid } = useParams();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [quiz, setQuiz] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attempt, setAttempt] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attemptHistory, setAttemptHistory] = useState<any[]>([]);
  const [attemptInfo, setAttemptInfo] = useState<{
    currentAttempt: number;
    totalAllowed: number;
    attemptsRemaining: number;
  } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { currentUser } = useSelector((state: any) => state.accountReducer);

  const fetchLatestAttempt = useCallback(async () => {
    if (!currentUser) return;
    try {
      console.log("=== LOADING QUIZ RESULTS ===");
      console.log("User ID:", currentUser._id);
      console.log("Quiz ID:", qid);

      // Fetch the quiz
      const quizData = await quizClient.findQuizById(qid as string);
      console.log("Quiz loaded:", quizData);
      console.log("Number of questions:", quizData.questions?.length);
      setQuiz(quizData);

      // Fetch ALL attempts for this user and quiz
      console.log("=== FETCHING ALL ATTEMPTS ===");
      const allAttempts = await attemptClient.getAttemptHistory(
        currentUser._id,
        qid as string
      );
      console.log("All attempts returned from backend:", allAttempts);
      console.log("Number of attempts:", allAttempts?.length || 0);

      // Filter for ONLY submitted attempts (submittedAt is NOT null)
      console.log("=== FILTERING FOR SUBMITTED ATTEMPTS ===");
      const submittedAttempts = (allAttempts || []).filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (attempt: any) => attempt.submittedAt !== null && attempt.submittedAt !== undefined
      );
      console.log("Submitted attempts after filtering:", submittedAttempts);
      console.log("Number of submitted attempts:", submittedAttempts.length);

      if (submittedAttempts.length === 0) {
        console.log("⚠️ No submitted attempts found!");
        alert("No submitted attempt found. Please submit a quiz first.");
        router.push(`/Courses/${cid}/Quizzes/${qid}`);
        return;
      }

      // Sort by submittedAt date descending (most recent first)
      console.log("=== SORTING BY SUBMITTED DATE (DESCENDING) ===");
      submittedAttempts.sort((a: any, b: any) => {
        const dateA = new Date(a.submittedAt).getTime();
        const dateB = new Date(b.submittedAt).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
      console.log("Sorted submitted attempts:", submittedAttempts);

      // Get the most recent submitted attempt
      const attemptData = submittedAttempts[0];
      console.log("=== FINAL SUBMITTED ATTEMPT SELECTED ===");
      console.log("Attempt ID:", attemptData._id);
      console.log("Score:", attemptData.score);
      console.log("Total Points:", attemptData.totalPoints);
      console.log("Submitted At:", attemptData.submittedAt);
      console.log("Answers array:", attemptData.answers);
      console.log("Number of answers:", attemptData.answers?.length);

      // Check if we have isCorrect in the response
      console.log("isCorrect array from backend:", attemptData.isCorrect);
      console.log("isCorrect array length:", attemptData.isCorrect?.length);
      console.log("isCorrect array type:", typeof attemptData.isCorrect);

      // If isCorrect not in attempt, log warning
      if (!attemptData.isCorrect || !Array.isArray(attemptData.isCorrect)) {
        console.log("⚠️ No isCorrect array! Will calculate on frontend...");
      } else {
        console.log("✓ isCorrect array found with", attemptData.isCorrect.length, "entries");
        console.log("isCorrect values:", attemptData.isCorrect);
      }

      setAttempt(attemptData);
    } catch (error) {
      console.error("=== ERROR LOADING RESULTS ===", error);
      alert("No attempt found. Please take the quiz first.");
      router.push(`/Courses/${cid}/Quizzes/${qid}`);
    }
  }, [currentUser, qid, router, cid]);

  useEffect(() => {
    fetchLatestAttempt();
  }, [fetchLatestAttempt]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentUser?._id || !qid) return;
      try {
        const history = await attemptClient.getAttemptHistory(currentUser._id, qid as string);
        setAttemptHistory(history);
      } catch (error) {
        console.error("Error fetching attempt history:", error);
      }
    };
    fetchHistory();
  }, [currentUser, qid]);

  // Calculate attempt information from quiz settings and attempt history
  useEffect(() => {
    const loadAttemptInfo = async () => {
      if (!currentUser?._id || !qid || !quiz) {
        console.log("=== LOAD ATTEMPT INFO SKIPPED - Missing data ===");
        return;
      }

      try {
        console.log("=== LOADING ATTEMPT INFO ===");
        console.log("Quiz multiple attempts:", quiz.multipleAttempts);
        console.log("Quiz attempts allowed:", quiz.attemptsAllowed);
        console.log("Number of submitted attempts:", attemptHistory.length);

        // Filter to only submitted attempts
        const submittedAttempts = attemptHistory.filter((att: any) => att.submittedAt);
        console.log("Number of submitted attempts:", submittedAttempts.length);

        const totalAllowed = quiz.multipleAttempts
          ? (quiz.attemptsAllowed || 1)
          : 1;
        const attemptsRemaining = totalAllowed - submittedAttempts.length;

        console.log("Total allowed:", totalAllowed);
        console.log("Attempts remaining:", attemptsRemaining);

        setAttemptInfo({
          currentAttempt: submittedAttempts.length,
          totalAllowed,
          attemptsRemaining: Math.max(0, attemptsRemaining),
        });
      } catch (error) {
        console.error("Error loading attempt info:", error);
      }
    };

    if (currentUser && qid && quiz && attemptHistory.length >= 0) {
      loadAttemptInfo();
    }
  }, [currentUser, qid, quiz, attemptHistory]);

  if (!quiz || !attempt) {
    return <div>Loading...</div>;
  }

  // Log attempt details for debugging
  console.log("=== RESULTS PAGE RENDER CHECK ===");
  console.log("Loaded attempt ID:", attempt._id);
  console.log("submittedAt value:", attempt.submittedAt);
  console.log("submittedAt type:", typeof attempt.submittedAt);
  console.log("Is submitted:", !!attempt.submittedAt);

  // Check if attempt is submitted
  if (!attempt.submittedAt) {
    console.log("⚠️ Showing UNSUBMITTED state - attempt has not been submitted yet");
    console.log("Attempt data:", attempt);
    return (
      <div>
        <h3>Quiz Results</h3>
        <p>This quiz has not been submitted yet. Please complete and submit the quiz.</p>
        <Button onClick={() => router.push(`/Courses/${cid}/Quizzes/${qid}/Take`)}>
          Continue Quiz
        </Button>
      </div>
    );
  }

  console.log("✓ Showing SUBMITTED state - displaying results");

  const percentage =
    attempt.totalPoints > 0
      ? Math.round((attempt.score / attempt.totalPoints) * 100)
      : 0;

  // Helper function to check if answer is correct
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isAnswerCorrect = (question: any, userAnswer: any): boolean => {
    if (!userAnswer) return false;

    if (question.questionType === "Multiple Choice") {
      // userAnswer is a number (index) for Multiple Choice
      const correctOptionIndex = (question.options || []).findIndex(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (opt: any) => opt.isCorrect
      );
      return userAnswer === correctOptionIndex;
    }

    if (question.questionType === "True/False") {
      return userAnswer === question.correctAnswer;
    }

    if (question.questionType === "Fill in the Blank") {
      // Check if all blanks are correct
      let allCorrect = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (question.blanks || []).forEach((blank: any, index: number) => {
        const userBlankAnswer = userAnswer[index]?.toLowerCase().trim() || "";
        const correctAnswers = (blank.correctAnswers || []).map((a: string) =>
          a.toLowerCase().trim()
        );
        if (!correctAnswers.includes(userBlankAnswer)) {
          allCorrect = false;
        }
      });
      return allCorrect;
    }

    return false;
  };

  // Get user's answer for a question
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getUserAnswer = (questionId: string): any => {
    const answer = (attempt.answers || []).find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a: any) => a.questionId === questionId
    );
    if (!answer) return null;

    if (answer.selectedOptions !== undefined) {
      return answer.selectedOptions;
    }
    if (answer.trueFalseAnswer !== undefined) {
      return answer.trueFalseAnswer;
    }
    if (answer.fillInAnswers !== undefined) {
      return answer.fillInAnswers;
    }
    return null;
  };

  // Get answer for question with logging
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getAnswerForQuestion = (questionId: string): any => {
    const answer = (attempt.answers || []).find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a: any) => a.questionId === questionId
    );
    console.log(`Answer for question ${questionId}:`, answer);
    if (!answer) {
      console.log(`No answer found for question ${questionId}`);
      return null;
    }

    let result = null;
    if (answer.selectedOptions !== undefined) {
      result = answer.selectedOptions;
      console.log(`Multiple Choice answer (index):`, result);
    } else if (answer.trueFalseAnswer !== undefined) {
      result = answer.trueFalseAnswer;
      console.log(`True/False answer:`, result);
    } else if (answer.fillInAnswers !== undefined) {
      result = answer.fillInAnswers;
      console.log(`Fill in the Blank answers:`, result);
    }
    return result;
  };

  // Render answer for display
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderUserAnswer = (question: any, userAnswer: any) => {
    if (!userAnswer) {
      return <em className="text-muted">No answer provided</em>;
    }

    if (question.questionType === "Multiple Choice") {
      // userAnswer is a number (index)
      const selectedOption = question.options[userAnswer];
      return (
        <div>
          <strong>Your answer:</strong> {selectedOption?.text || "N/A"}
        </div>
      );
    }

    if (question.questionType === "True/False") {
      return (
        <div>
          <strong>Your answer:</strong> {userAnswer === true ? "True" : "False"}
        </div>
      );
    }

    if (question.questionType === "Fill in the Blank") {
      return (
        <div>
          <strong>Your answers:</strong>
          <ul>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(question.blanks || []).map((blank: any, index: number) => (
              <li key={`user-blank-${index}`}>
                <strong>{blank.text}:</strong> {userAnswer[index] || <em className="text-muted">No answer</em>}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    return null;
  };

  // Render correct answer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCorrectAnswer = (question: any) => {
    if (question.questionType === "Multiple Choice") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const correctOption = question.options?.find((opt: any) => opt.isCorrect);
      return (
        <div className="text-success">
          <strong>Correct answer:</strong> {correctOption?.text || "N/A"}
        </div>
      );
    }

    if (question.questionType === "True/False") {
      return (
        <div className="text-success">
          <strong>Correct answer:</strong>{" "}
          {question.correctAnswer === true ? "True" : "False"}
        </div>
      );
    }

    if (question.questionType === "Fill in the Blank") {
      return (
        <div className="text-success">
          <strong>Correct answers:</strong>
          <ul>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(question.blanks || []).map((blank: any, index: number) => (
              <li key={`correct-blank-${index}`}>
                <strong>{blank.text}:</strong>{" "}
                {blank.correctAnswers?.join(" or ") || "N/A"}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    return null;
  };

  // Comprehensive function to display each question type's result
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderQuestionResult = (question: any, answer: any, isCorrect: boolean) => {
    console.log("=== RENDERING QUESTION RESULT ===");
    console.log("Question type:", question.questionType);
    console.log("Answer:", answer);
    console.log("Is correct:", isCorrect);

    switch (question.questionType) {
      case "Multiple Choice": {
        console.log("Rendering Multiple Choice");
        console.log("Options:", question.options);
        console.log("Selected index:", answer?.selectedOptions?.[0]);

        const selectedIndex = answer?.selectedOptions?.[0];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const correctIndex = question.options?.findIndex((opt: any) => opt.isCorrect) ?? -1;

        console.log("Correct option index:", correctIndex);

        return (
          <div>
            <p><strong>{question.title || "Untitled"}</strong></p>
            <div
              dangerouslySetInnerHTML={{ __html: question.question || "" }}
              className="mb-3"
            />
            <div className="options-list">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {question.options?.map((option: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-2 mb-2 border rounded ${
                    idx === correctIndex
                      ? "bg-success-subtle border-success"
                      : idx === selectedIndex && idx !== correctIndex
                      ? "bg-danger-subtle border-danger"
                      : ""
                  }`}
                >
                  {idx === selectedIndex && (
                    <i className="bi bi-hand-index me-2"></i>
                  )}
                  {idx === correctIndex && (
                    <i className="bi bi-check-circle-fill text-success me-2"></i>
                  )}
                  {option.text || option.content}
                </div>
              ))}
            </div>
            {selectedIndex !== correctIndex && (
              <div className="alert alert-info mt-2">
                <strong>Your answer:</strong> Option {selectedIndex !== undefined ? selectedIndex + 1 : "N/A"}
                <br />
                <strong>Correct answer:</strong> Option {correctIndex !== -1 ? correctIndex + 1 : "N/A"}
              </div>
            )}
          </div>
        );
      }

      case "True/False": {
        console.log("Rendering True/False");
        console.log("Correct answer:", question.correctAnswer);
        console.log("Student answer:", answer?.trueFalseAnswer);

        return (
          <div>
            <p><strong>{question.title || "Untitled"}</strong></p>
            <div
              dangerouslySetInnerHTML={{ __html: question.question || "" }}
              className="mb-3"
            />
            <div className="mt-2">
              <div
                className={`p-2 border rounded ${
                  answer?.trueFalseAnswer === true
                    ? question.correctAnswer === true
                      ? "bg-success-subtle border-success"
                      : "bg-danger-subtle border-danger"
                    : ""
                }`}
              >
                {answer?.trueFalseAnswer === true && (
                  <i className="bi bi-hand-index me-2"></i>
                )}
                {question.correctAnswer === true && (
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                )}
                True
              </div>
              <div
                className={`p-2 border rounded mt-2 ${
                  answer?.trueFalseAnswer === false
                    ? question.correctAnswer === false
                      ? "bg-success-subtle border-success"
                      : "bg-danger-subtle border-danger"
                    : ""
                }`}
              >
                {answer?.trueFalseAnswer === false && (
                  <i className="bi bi-hand-index me-2"></i>
                )}
                {question.correctAnswer === false && (
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                )}
                False
              </div>
            </div>
            {answer?.trueFalseAnswer !== question.correctAnswer && (
              <div className="alert alert-info mt-2">
                <strong>Your answer:</strong>{" "}
                {answer?.trueFalseAnswer !== undefined
                  ? answer.trueFalseAnswer
                    ? "True"
                    : "False"
                  : "No answer"}
                <br />
                <strong>Correct answer:</strong>{" "}
                {question.correctAnswer ? "True" : "False"}
              </div>
            )}
          </div>
        );
      }

      case "Fill in the Blank": {
        console.log("Rendering Fill in the Blank");
        console.log("Blanks:", question.blanks);
        console.log("Student answers:", answer?.fillInAnswers);

        const isCaseSensitive = question.caseSensitive === true;
        console.log("Case sensitive:", isCaseSensitive);

        return (
          <div>
            <p><strong>{question.title || "Untitled"}</strong></p>
            <div
              dangerouslySetInnerHTML={{ __html: question.question || "" }}
              className="mb-3"
            />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {question.blanks?.map((blank: any, idx: number) => {
              const studentAnswer = answer?.fillInAnswers?.[idx] || "";

              const correctAnswers = blank.correctAnswers || [];

              const normalize = (val: string) => {
                const trimmed = val.trim();
                return isCaseSensitive ? trimmed : trimmed.toLowerCase();
              };

              const isBlankCorrect = correctAnswers.some(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (correct: string) => normalize(correct) === normalize(studentAnswer)
              );

              console.log(`Blank ${idx + 1}:`, {
                studentAnswer,
                correctAnswers,
                isBlankCorrect,
              });

              return (
                <div key={idx} className="mb-3">
                  <label className="form-label">
                    <strong>Blank {idx + 1}:</strong>
                  </label>
                  <div
                    className={`p-2 border rounded ${
                      isBlankCorrect
                        ? "bg-success-subtle border-success"
                        : "bg-danger-subtle border-danger"
                    }`}
                  >
                    {isBlankCorrect ? (
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                    ) : (
                      <i className="bi bi-x-circle-fill text-danger me-2"></i>
                    )}
                    <strong>Your answer:</strong> {studentAnswer || "(no answer)"}
                  </div>
                  {!isBlankCorrect && (
                    <div className="alert alert-info mt-2">
                      <strong>Correct answer(s):</strong> {correctAnswers.join(", ")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      }

      default:
        console.error("Unknown question type:", question.questionType);
        return <div>Unknown question type</div>;
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h3>{quiz.title} - Results</h3>
          <p className="text-muted">
            Attempt #{attempt.attemptNumber || 1} - Submitted{" "}
            {new Date(attempt.submittedAt).toLocaleString()}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => router.push(`/Courses/${cid}/Quizzes/${qid}`)}
        >
          Back to Quiz
        </Button>
      </div>

      {/* Attempt Information */}
      {attemptInfo && (
        <Card className="mb-4">
          <Card.Body>
            <h5 className="card-title">Attempt Information</h5>
            <div className="row">
              <div className="col-md-4">
                <strong>Current Attempt:</strong> {attemptInfo.currentAttempt}
              </div>
              <div className="col-md-4">
                <strong>Total Allowed:</strong> {attemptInfo.totalAllowed}
              </div>
              <div className="col-md-4">
                <strong>Remaining:</strong>{" "}
                <span
                  className={
                    attemptInfo.attemptsRemaining > 0
                      ? "text-success"
                      : "text-danger"
                  }
                >
                  {attemptInfo.attemptsRemaining}
                </span>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Attempt History */}
      {attemptHistory.length > 0 && (
        <Card className="mb-4">
          <Card.Body>
            <h5>Attempt History</h5>
            <Table striped>
              <thead>
                <tr>
                  <th>Attempt</th>
                  <th>Score</th>
                  <th>Date</th>
                  <th>Final Score</th>
                </tr>
              </thead>
              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {attemptHistory.map((att: any) => (
                  <tr
                    key={att._id}
                    style={
                      att.isFinalScore
                        ? { backgroundColor: "#d4edda" }
                        : undefined
                    }
                  >
                    <td>#{att.attemptNumber || 1}</td>
                    <td>
                      {att.score}/{att.totalPoints}
                    </td>
                    <td>
                      {att.submittedAt
                        ? new Date(att.submittedAt).toLocaleString()
                        : "Not submitted"}
                    </td>
                    <td>{att.isFinalScore ? "✓ Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Score Summary */}
      <div className="card mb-4">
        <div className="card-body">
          <h4 className="card-title">Your Score</h4>
          <div className="d-flex align-items-center">
            <h2 className="mb-0 me-3">
              {attempt.score} / {attempt.totalPoints}
            </h2>
            <h3 className="mb-0 text-muted">({percentage}%)</h3>
          </div>
          {percentage >= 70 ? (
            <p className="text-success mt-2 mb-0">
              <FaCheckCircle className="me-2" />
              Great job! You passed the quiz.
            </p>
          ) : (
            <p className="text-warning mt-2 mb-0">
              <FaTimesCircle className="me-2" />
              You may want to review the material and try again.
            </p>
          )}
        </div>
      </div>

      {/* Questions and Answers */}
      <h4 className="mb-3">Questions and Answers</h4>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {(quiz.questions || []).map((question: any, index: number) => {
        // Get the answer object from attempt.answers (not the processed value)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const answerObject = (attempt.answers || []).find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (a: any) => a.questionId === question._id
        );
        
        // Also get the processed answer value for logging
        const answer = getAnswerForQuestion(question._id);
        
        // Try to get isCorrect from backend array first
        // The isCorrect array should be in the same order as quiz.questions
        let isCorrect = false;
        if (attempt.isCorrect && Array.isArray(attempt.isCorrect) && attempt.isCorrect[index] !== undefined) {
          isCorrect = attempt.isCorrect[index];
          console.log(`=== QUESTION ${index + 1} DISPLAY ===`);
          console.log("Question ID:", question._id);
          console.log("Question type:", question.questionType);
          console.log("Question points:", question.points);
          console.log("Is correct (from backend):", isCorrect);
          console.log("Student answer:", answer);
          console.log("Answer object:", answerObject);
        } else {
          // Fallback to frontend calculation if backend doesn't have isCorrect
          isCorrect = isAnswerCorrect(question, answer);
          console.log(`=== QUESTION ${index + 1} DISPLAY ===`);
          console.log("Question ID:", question._id);
          console.log("Question type:", question.questionType);
          console.log("Question points:", question.points);
          console.log("Is correct (calculated on frontend):", isCorrect);
          console.log("Student answer:", answer);
          console.log("Answer object:", answerObject);
        }
        
        const questionPoints = question.points || 0;

        return (
          <div
            key={question._id}
            className={`card mb-3 border-${isCorrect ? "success" : "danger"}`}
          >
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>
                <strong>Question {index + 1}</strong>
                {isCorrect ? (
                  <span className="badge bg-success ms-2">
                    <i className="bi bi-check-circle-fill"></i> Correct
                  </span>
                ) : (
                  <span className="badge bg-danger ms-2">
                    <i className="bi bi-x-circle-fill"></i> Incorrect
                  </span>
                )}
              </span>
              <span className="text-muted">{questionPoints} points</span>
            </div>
            <div className="card-body">
              {/* Use the comprehensive renderQuestionResult function */}
              {renderQuestionResult(question, answerObject || {}, isCorrect)}
            </div>
          </div>
        );
      })}

      {/* Action Buttons */}
      <div className="mt-4">
        {attemptInfo && attemptInfo.attemptsRemaining > 0 ? (
          <Button
            variant="primary"
            size="lg"
            onClick={() => router.push(`/Courses/${cid}/Quizzes/${qid}/Take`)}
            className="me-2"
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Retake Quiz ({attemptInfo.attemptsRemaining} attempts remaining)
          </Button>
        ) : attemptInfo && attemptInfo.attemptsRemaining === 0 ? (
          <div className="alert alert-warning mb-3">
            <i className="bi bi-exclamation-triangle me-2"></i>
            You have used all {attemptInfo.totalAllowed} attempt(s) for this quiz.
          </div>
        ) : null}
        <Button
          variant="secondary"
          onClick={() => router.push(`/Courses/${cid}/Quizzes`)}
        >
          Back to Quizzes
        </Button>
      </div>
    </div>
  );
}
