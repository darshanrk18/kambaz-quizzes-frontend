"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "react-bootstrap";
import { useSelector } from "react-redux";
import * as client from "../client";
import * as attemptClient from "./Take/client";

export default function QuizDetails() {
  const { cid, qid } = useParams();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [quiz, setQuiz] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { currentUser } = useSelector((state: any) => state.accountReducer);
  const isFaculty = currentUser?.role === "FACULTY";

  const fetchQuiz = useCallback(async () => {
    try {
      const quizData = await client.findQuizById(qid as string);
      setQuiz(quizData);
    } catch (error) {
      console.error("Error fetching quiz:", error);
    }
  }, [qid]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [latestAttempt, setLatestAttempt] = useState<any>(null);

  const fetchLatestAttempt = useCallback(async () => {
    if (!isFaculty && currentUser) {
      try {
        const attempt = await attemptClient.findLatestAttempt(currentUser._id, qid as string);
        setLatestAttempt(attempt);
      } catch {
        // No attempt yet, that's okay
        setLatestAttempt(null);
      }
    }
  }, [qid, currentUser, isFaculty]);

  useEffect(() => {
    if (!isFaculty) {
      fetchLatestAttempt();
    }
  }, [fetchLatestAttempt, isFaculty]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  const handlePublishToggle = async () => {
    try {
      const updated = await client.publishQuiz(quiz._id, !quiz.published);
      setQuiz(updated);
    } catch (error) {
      console.error("Error toggling publish:", error);
    }
  };

  if (!quiz) {
    return <div>Loading...</div>;
  }

  if (isFaculty) {
    return (
      <div>
        <h3>{quiz.title}</h3>
        <div className="mb-3">
          <strong>Quiz Type:</strong> {quiz.quizType || "Graded Quiz"}
        </div>
        <div className="mb-3">
          <strong>Points:</strong> {quiz.points || 0} (sum of all question points)
        </div>
        <div className="mb-3">
          <strong>Assignment Group:</strong> {quiz.assignmentGroup || "Quizzes"}
        </div>
        <div className="mb-3">
          <strong>Shuffle Answers:</strong> {quiz.shuffleAnswers !== false ? "Yes" : "No"}
        </div>
        {quiz.timeLimit !== false && (
          <div className="mb-3">
            <strong>Time Limit:</strong> {quiz.timeLimitMinutes || 20} minutes
          </div>
        )}
        <div className="mb-3">
          <strong>Multiple Attempts:</strong> {quiz.multipleAttempts ? `Yes (${quiz.attemptsAllowed || 1} attempts)` : "No"}
        </div>
        {quiz.showCorrectAnswers && (
          <div className="mb-3">
            <strong>Show Correct Answers:</strong> {quiz.showCorrectAnswers}
          </div>
        )}
        {quiz.accessCode && (
          <div className="mb-3">
            <strong>Access Code:</strong> {quiz.accessCode}
          </div>
        )}
        <div className="mb-3">
          <strong>One Question at a Time:</strong> {quiz.oneQuestionAtATime === false ? "No" : "Yes"}
        </div>
        <div className="mb-3">
          <strong>Webcam Required:</strong> {quiz.webcamRequired ? "Yes" : "No"}
        </div>
        <div className="mb-3">
          <strong>Lock Questions After Answering:</strong> {quiz.lockQuestionsAfterAnswering ? "Yes" : "No"}
        </div>
        {quiz.dueDate && (
          <div className="mb-3">
            <strong>Due Date:</strong> {quiz.dueDate}
          </div>
        )}
        {quiz.availableDate && (
          <div className="mb-3">
            <strong>Available:</strong> {quiz.availableDate}
          </div>
        )}
        {quiz.untilDate && (
          <div className="mb-3">
            <strong>Until:</strong> {quiz.untilDate}
          </div>
        )}
        <div className="mb-3">
          <strong>Questions:</strong> {quiz.questions?.length || 0}
        </div>
        <div className="mb-3">
          <Button
            variant={quiz.published ? "warning" : "success"}
            onClick={handlePublishToggle}
            className="me-2"
          >
            {quiz.published ? "Unpublish" : "Publish"}
          </Button>
          <Button
            variant="primary"
            onClick={() => router.push(`/Courses/${cid}/Quizzes/${qid}/Preview`)}
            className="me-2"
          >
            Preview
          </Button>
          <Button
            variant="primary"
            onClick={() => router.push(`/Courses/${cid}/Quizzes/${qid}/Editor`)}
          >
            Edit
          </Button>
        </div>
      </div>
    );
  }

  // Student view
  const getAvailabilityStatus = () => {
    if (!quiz.availableDate) return "Available";
    const now = new Date();
    const available = new Date(quiz.availableDate);
    const until = quiz.untilDate ? new Date(quiz.untilDate) : null;

    if (now < available) {
      return `Not available until ${quiz.availableDate}`;
    }
    if (until && now > until) {
      return "Closed";
    }
    return "Available";
  };

  const availabilityStatus = getAvailabilityStatus();
  const canTakeQuiz = quiz.published && availabilityStatus === "Available";
  const hasAttempt = latestAttempt && latestAttempt.submittedAt;
  const canRetake = quiz.multipleAttempts && latestAttempt && 
    (latestAttempt.attemptNumber || 0) < (quiz.attemptsAllowed || 1);

  return (
    <div>
      <h3>{quiz.title}</h3>
      <div className="mb-3">
        <strong>Status:</strong> {availabilityStatus}
      </div>
      <div className="mb-3">
        <strong>Points:</strong> {quiz.points || 0}
      </div>
      {quiz.timeLimit !== false && (
        <div className="mb-3">
          <strong>Time Limit:</strong> {quiz.timeLimitMinutes || 20} minutes
        </div>
      )}
      {quiz.dueDate && (
        <div className="mb-3">
          <strong>Due:</strong> {quiz.dueDate}
        </div>
      )}
      <div className="mb-3">
        <strong>Questions:</strong> {quiz.questions?.length || 0}
      </div>
      {hasAttempt && (
        <div className="mb-3">
          <strong>Last Score:</strong> {latestAttempt.score} / {latestAttempt.totalPoints} (
            {latestAttempt.totalPoints > 0
              ? Math.round((latestAttempt.score / latestAttempt.totalPoints) * 100)
              : 0}
          %)
        </div>
      )}
      <div className="mb-3">
        {canTakeQuiz && (
          <Button
            variant="primary"
            onClick={() => router.push(`/Courses/${cid}/Quizzes/${qid}/Take`)}
            className="me-2"
          >
            {hasAttempt ? (canRetake ? "Retake Quiz" : "View Results") : "Start Quiz"}
          </Button>
        )}
        {hasAttempt && (
          <Button
            variant="secondary"
            onClick={() => router.push(`/Courses/${cid}/Quizzes/${qid}/Results`)}
          >
            View Results
          </Button>
        )}
      </div>
    </div>
  );
}

