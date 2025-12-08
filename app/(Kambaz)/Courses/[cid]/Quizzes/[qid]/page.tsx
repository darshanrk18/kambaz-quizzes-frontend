"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "react-bootstrap";
import * as client from "../client";

export default function QuizDetails() {
  const { cid, qid } = useParams();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [quiz, setQuiz] = useState<any>(null);

  const fetchQuiz = useCallback(async () => {
    try {
      const quizData = await client.findQuizById(qid as string);
      setQuiz(quizData);
    } catch (error) {
      console.error("Error fetching quiz:", error);
    }
  }, [qid]);

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

  return (
    <div>
      <h3>{quiz.title}</h3>
      <div className="mb-3">
        <strong>Description:</strong>
        <p>{quiz.description || "No description"}</p>
      </div>
      <div className="mb-3">
        <strong>Points:</strong> {quiz.points}
      </div>
      <div className="mb-3">
        <strong>Shuffle Answers:</strong> {quiz.shuffleAnswers ? "Yes" : "No"}
      </div>
      {quiz.timeLimit && (
        <div className="mb-3">
          <strong>Time Limit:</strong> {quiz.timeLimitMinutes} minutes
        </div>
      )}
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

