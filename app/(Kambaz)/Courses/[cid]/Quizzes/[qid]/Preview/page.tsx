"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, ListGroup, ListGroupItem } from "react-bootstrap";
import * as client from "../../client";

export default function QuizPreview() {
  const { cid, qid } = useParams();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [quiz, setQuiz] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [answers, setAnswers] = useState<any>({});

  const fetchQuiz = async () => {
    try {
      const quizData = await client.findQuizById(qid as string);
      setQuiz(quizData);
    } catch (error) {
      console.error("Error fetching quiz:", error);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [qid]);

  if (!quiz) {
    return <div>Loading...</div>;
  }

  const questions = quiz.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerChange = (questionId: string, answer: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setAnswers({ ...answers, [questionId]: answer });
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

  if (questions.length === 0) {
    return (
      <div>
        <h3>{quiz.title}</h3>
        <p>No questions in this quiz yet.</p>
        <Button onClick={() => router.push(`/Courses/${cid}/Quizzes/${qid}/Editor`)}>
          Add Questions
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>{quiz.title}</h3>
        <Button
          variant="secondary"
          onClick={() => router.push(`/Courses/${cid}/Quizzes/${qid}`)}
        >
          Back to Details
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
              {currentQuestion.options?.map((option: any, index: number) => (
                <div key={index} className="mb-2">
                  <input
                    type="checkbox"
                    checked={
                      answers[currentQuestion._id]?.includes(index) || false
                    }
                    onChange={(e) => {
                      const currentAnswers =
                        answers[currentQuestion._id] || [];
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
                    className="me-2"
                  />
                  <label>{option.text}</label>
                </div>
              ))}
            </div>
          )}

          {/* True/False */}
          {currentQuestion.questionType === "True/False" && (
            <div>
              <div className="mb-2">
                <input
                  type="radio"
                  name={`tf-${currentQuestion._id}`}
                  checked={answers[currentQuestion._id] === true}
                  onChange={() => handleAnswerChange(currentQuestion._id, true)}
                  className="me-2"
                />
                <label>True</label>
              </div>
              <div className="mb-2">
                <input
                  type="radio"
                  name={`tf-${currentQuestion._id}`}
                  checked={answers[currentQuestion._id] === false}
                  onChange={() => handleAnswerChange(currentQuestion._id, false)}
                  className="me-2"
                />
                <label>False</label>
              </div>
            </div>
          )}

          {/* Fill in the Blank */}
          {currentQuestion.questionType === "Fill in the Blank" && (
            <div>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {currentQuestion.blanks?.map((blank: any, blankIndex: number) => (
                <div key={blankIndex} className="mb-2">
                  <label>{blank.text}</label>
                  <input
                    type="text"
                    value={answers[currentQuestion._id]?.[blankIndex] || ""}
                    onChange={(e) => {
                      const currentAnswers = answers[currentQuestion._id] || [];
                      const newAnswers = [...currentAnswers];
                      newAnswers[blankIndex] = e.target.value;
                      handleAnswerChange(currentQuestion._id, newAnswers);
                    }}
                    className="form-control"
                    placeholder="Enter your answer"
                  />
                </div>
              ))}
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

