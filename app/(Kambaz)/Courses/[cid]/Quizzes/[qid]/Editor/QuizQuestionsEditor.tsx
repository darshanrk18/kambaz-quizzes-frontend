"use client";

import { useState } from "react";
import { Button } from "react-bootstrap";
import { FaPlus, FaTrash } from "react-icons/fa";
import * as client from "../../client";
import QuestionEditor from "./QuestionEditor";

export default function QuizQuestionsEditor({
  quiz,
  setQuiz,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  quiz: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setQuiz: (quiz: any) => void;
}) {
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const handleAddQuestion = async () => {
    try {
      const newQuestion = {
        title: "New Question",
        question: "",
        questionType: "Multiple Choice",
        points: 1,
        options: [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
      };
      const updated = await client.addQuestion(quiz._id, newQuestion);
      setQuiz(updated);
      // Set the new question to editing mode
      const newQuestionId = updated.questions[updated.questions.length - 1]._id;
      setEditingQuestionId(newQuestionId);
    } catch (error) {
      console.error("Error adding question:", error);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (globalThis.confirm("Are you sure you want to delete this question?")) {
      try {
        const updated = await client.deleteQuestion(quiz._id, questionId);
        setQuiz(updated);
        if (editingQuestionId === questionId) {
          setEditingQuestionId(null);
        }
      } catch (error) {
        console.error("Error deleting question:", error);
      }
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSaveQuestion = async (questionId: string, questionData: any) => {
    try {
      const updated = await client.updateQuestion(quiz._id, questionId, questionData);
      setQuiz(updated);
      setEditingQuestionId(null);
    } catch (error) {
      console.error("Error saving question:", error);
    }
  };

  return (
    <div className="mt-3">
      <div className="d-flex justify-content-end mb-3">
        <Button variant="danger" onClick={handleAddQuestion}>
          <FaPlus className="me-2" />
          New Question
        </Button>
      </div>

      {quiz.questions && quiz.questions.length > 0 ? (
        <div>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {quiz.questions.map((question: any, index: number) => (
            <div key={question._id} className="mb-3 border p-3 rounded">
              {editingQuestionId === question._id ? (
                <QuestionEditor
                  question={question}
                  onSave={(updatedQuestion) =>
                    handleSaveQuestion(question._id, updatedQuestion)
                  }
                  onCancel={() => setEditingQuestionId(null)}
                />
              ) : (
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <strong>Question {index + 1}</strong>
                      <span className="ms-2 text-muted">
                        ({question.questionType})
                      </span>
                      <span className="ms-2">- {question.points} points</span>
                    </div>
                    <div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setEditingQuestionId(question._id)}
                        className="me-2"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => handleDeleteQuestion(question._id)}
                        className="text-danger"
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </div>
                  <div className="mb-2">
                    <strong>Title:</strong> {question.title || "Untitled"}
                  </div>
                  <div>
                    <strong>Question:</strong>{" "}
                    <div
                      dangerouslySetInnerHTML={{ __html: question.question || "" }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-5">
          <p>No questions yet. Click &quot;New Question&quot; to add one.</p>
        </div>
      )}
    </div>
  );
}

