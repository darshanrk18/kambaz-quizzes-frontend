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

  const fetchLatestAttempt = useCallback(async () => {
    if (!currentUser) return;
    try {
      const attemptData = await attemptClient.findLatestAttempt(
        currentUser._id,
        qid as string
      );
      setAttempt(attemptData);
    } catch (error) {
      console.error("Error fetching attempt:", error);
      alert("No attempt found. Please take the quiz first.");
      router.push(`/Courses/${cid}/Quizzes/${qid}`);
    }
  }, [currentUser, qid, router, cid]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

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

  if (!quiz || !attempt) {
    return <div>Loading...</div>;
  }

  if (!attempt.submittedAt) {
    return (
      <div>
        <h3>Quiz Results</h3>
        <p>This attempt has not been submitted yet.</p>
        <Button onClick={() => router.push(`/Courses/${cid}/Quizzes/${qid}/Take`)}>
          Continue Quiz
        </Button>
      </div>
    );
  }

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
        const userAnswer = getUserAnswer(question._id);
        const isCorrect = isAnswerCorrect(question, userAnswer);
        const questionPoints = question.points || 0;

        return (
          <div
            key={question._id}
            className={`card mb-3 border-${isCorrect ? "success" : "danger"}`}
          >
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="flex-grow-1">
                  <h5 className="card-title mb-2">
                    Question {index + 1}: {question.title || "Untitled"}
                  </h5>
                  <div
                    className="mb-2"
                    dangerouslySetInnerHTML={{ __html: question.question || "" }}
                  />
                  <small className="text-muted">
                    {question.questionType} - {questionPoints} point
                    {questionPoints !== 1 ? "s" : ""}
                  </small>
                </div>
                <div className="text-end">
                  {isCorrect ? (
                    <>
                      <FaCheckCircle
                        className="text-success"
                        size={32}
                        title="Correct"
                      />
                      <div className="text-success small mt-1">
                        +{questionPoints} pts
                      </div>
                    </>
                  ) : (
                    <>
                      <FaTimesCircle
                        className="text-danger"
                        size={32}
                        title="Incorrect"
                      />
                      <div className="text-danger small mt-1">0 pts</div>
                    </>
                  )}
                </div>
              </div>

              <hr />

              {/* User's Answer */}
              <div className={`mb-2 ${isCorrect ? "text-success" : "text-danger"}`}>
                {renderUserAnswer(question, userAnswer)}
              </div>

              {/* Correct Answer (show if incorrect or if quiz setting allows) */}
              {(!isCorrect || quiz.showCorrectAnswers === "Immediately" || 
                quiz.showCorrectAnswers === "After Submission") && (
                <div className="mt-2">
                  {renderCorrectAnswer(question)}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Action Buttons */}
      <div className="mt-4">
        {quiz.multipleAttempts &&
          (attempt.attemptNumber || 0) < (quiz.attemptsAllowed || 1) && (
            <Button
              variant="primary"
              onClick={() => router.push(`/Courses/${cid}/Quizzes/${qid}/Take`)}
              className="me-2"
            >
              Retake Quiz (Attempt {(attempt.attemptNumber || 0) + 1} of{" "}
              {quiz.attemptsAllowed || 1})
            </Button>
          )}
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
