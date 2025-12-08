"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "react-bootstrap";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { useSelector } from "react-redux";
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
  const { currentUser } = useSelector((state: any) => state.accountReducer);

  const fetchData = useCallback(async () => {
    try {
      const [quizData, attemptData] = await Promise.all([
        quizClient.findQuizById(qid as string),
        attemptClient.findLatestAttempt(currentUser._id, qid as string),
      ]);
      setQuiz(quizData);
      setAttempt(attemptData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [qid, currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [fetchData, currentUser]);

  if (!quiz || !attempt) {
    return <div>Loading...</div>;
  }

  const questions = quiz.questions || [];
  const answers = attempt.answers || [];

  const isCorrect = (question: any, answer: any) => {
    if (!answer) return false;

    if (question.questionType === "Multiple Choice") {
      const correctOptions = question.options
        ?.map((opt: any, idx: number) => (opt.isCorrect ? idx : -1))
        .filter((idx: number) => idx !== -1) || [];
      const selectedOptions = answer.selectedOptions || [];
      return (
        correctOptions.length === selectedOptions.length &&
        correctOptions.every((idx: number) => selectedOptions.includes(idx)) &&
        selectedOptions.every((idx: number) => correctOptions.includes(idx))
      );
    } else if (question.questionType === "True/False") {
      return answer.trueFalseAnswer === question.correctAnswer;
    } else if (question.questionType === "Fill in the Blank") {
      let allCorrect = true;
      question.blanks?.forEach((blank: any, blankIndex: number) => {
        const userAnswer = (answer.fillInAnswers?.[blankIndex] || "").toLowerCase().trim();
        const correctAnswers = blank.correctAnswers?.map((a: string) =>
          a.toLowerCase().trim()
        ) || [];
        if (!correctAnswers.includes(userAnswer)) {
          allCorrect = false;
        }
      });
      return allCorrect;
    }
    return false;
  };

  return (
    <div>
      <h3>{quiz.title} - Results</h3>
      <div className="mb-3">
        <strong>
          Score: {attempt.score} / {attempt.totalPoints} (
          {attempt.totalPoints > 0
            ? Math.round((attempt.score / attempt.totalPoints) * 100)
            : 0}
          %)
        </strong>
      </div>
      <div className="mb-3">
        <strong>Attempt Number:</strong> {attempt.attemptNumber}
      </div>
      {attempt.submittedAt && (
        <div className="mb-3">
          <strong>Submitted:</strong> {new Date(attempt.submittedAt).toLocaleString()}
        </div>
      )}

      <div className="mt-4">
        <h4>Question Review</h4>
        {questions.map((question: any, index: number) => {
          const answer = answers.find((a: any) => a.questionId === question._id);
          const correct = isCorrect(question, answer);

          return (
            <div key={question._id} className="border p-3 rounded mb-3">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <strong>Question {index + 1}</strong>
                  <span className="ms-2 text-muted">
                    ({question.points} points)
                  </span>
                </div>
                {correct ? (
                  <FaCheckCircle className="text-success" />
                ) : (
                  <FaTimesCircle className="text-danger" />
                )}
              </div>
              <div className="mb-2">
                <strong>{question.title || "Untitled Question"}</strong>
              </div>
              <div className="mb-2">
                <div
                  dangerouslySetInnerHTML={{ __html: question.question || "" }}
                />
              </div>

              {/* Show user's answer and correct answer */}
              <div className="mt-2">
                <strong>Your Answer:</strong>
                {question.questionType === "Multiple Choice" && (
                  <div>
                    {(answer?.selectedOptions || []).length > 0 ? (
                      <div>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {question.options?.[answer.selectedOptions[0]]?.text || "(invalid option)"}
                      </div>
                    ) : (
                      <div className="text-muted">(no answer selected)</div>
                    )}
                  </div>
                )}
                {question.questionType === "True/False" && (
                  <div>
                    {answer?.trueFalseAnswer !== undefined
                      ? answer.trueFalseAnswer
                        ? "True"
                        : "False"
                      : "(no answer)"}
                  </div>
                )}
                {question.questionType === "Fill in the Blank" && (
                  <div>
                    {question.blanks?.map((blank: any, blankIndex: number) => (
                      <div key={blankIndex}>
                        {blank.text}: {answer?.fillInAnswers?.[blankIndex] || "(no answer)"}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!correct && (
                <div className="mt-2 text-danger">
                  <strong>Correct Answer:</strong>
                  {question.questionType === "Multiple Choice" && (
                    <div>
                      {question.options
                        ?.filter((opt: any) => opt.isCorrect)
                        .map((opt: any) => opt.text)
                        .join(", ")}
                    </div>
                  )}
                  {question.questionType === "True/False" && (
                    <div>{question.correctAnswer ? "True" : "False"}</div>
                  )}
                  {question.questionType === "Fill in the Blank" && (
                    <div>
                      {question.blanks?.map((blank: any, blankIndex: number) => (
                        <div key={blankIndex}>
                          {blank.text}: {blank.correctAnswers?.join(" or ")}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3">
        <Button
          variant="secondary"
          onClick={() => router.push(`/Courses/${cid}/Quizzes/${qid}`)}
        >
          Back to Quiz Details
        </Button>
      </div>
    </div>
  );
}

