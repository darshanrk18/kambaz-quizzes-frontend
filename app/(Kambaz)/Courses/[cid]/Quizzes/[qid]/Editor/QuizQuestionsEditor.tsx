"use client";

import { useState } from "react";
import { Button, Alert } from "react-bootstrap";
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
  const [errors, setErrors] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [newQuestions, setNewQuestions] = useState<any[]>([]);

  const handleAddQuestion = () => {
    setErrors([]);
    // Create a new question locally with a temporary ID
    // NO validation should happen here - just create and open editor
    const tempId = `new-question-${Date.now()}`;
    const newQuestion = {
      _id: tempId,
      title: "New Question",
      question: "",
      questionType: "Multiple Choice",
      points: 1,
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
    };
    // Add to local new questions array
    setNewQuestions([...newQuestions, newQuestion]);
    // Open the editor for this new question
    setEditingQuestionId(tempId);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (globalThis.confirm("Are you sure you want to delete this question?")) {
      setErrors([]);
      try {
        const updated = await client.deleteQuestion(quiz._id, questionId);
        setQuiz(updated);
        if (editingQuestionId === questionId) {
          setEditingQuestionId(null);
        }
      } catch (error: unknown) {
        console.error("Error deleting question:", error);
        const errorMessage = 
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Failed to delete question. Please try again.";
        setErrors([errorMessage]);
      }
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSaveQuestion = async (questionId: string, questionData: any) => {
    setErrors([]);
    try {
      // Check if this is a new question (starts with "new-question-")
      const isNewQuestion = questionId.startsWith("new-question-");
      
      if (isNewQuestion) {
        // Create new question via API
        const updated = await client.addQuestion(quiz._id, questionData);
        setQuiz(updated);
        // Remove from local new questions array
        setNewQuestions(newQuestions.filter((q) => q._id !== questionId));
        // Set the new question ID from the response
        const savedQuestionId = updated.questions[updated.questions.length - 1]._id;
        setEditingQuestionId(null);
      } else {
        // Update existing question
        const updated = await client.updateQuestion(quiz._id, questionId, questionData);
        setQuiz(updated);
        setEditingQuestionId(null);
      }
    } catch (error: unknown) {
      console.error("Error saving question:", error);
      const errorMessage = 
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to save question. Please try again.";
      setErrors([errorMessage]);
    }
  };

  return (
    <div className="mt-3">
      {errors.length > 0 && (
        <Alert variant="danger" dismissible onClose={() => setErrors([])} className="mb-3">
          {errors.map((err, i) => (
            <div key={i}>{err}</div>
          ))}
        </Alert>
      )}
      <div className="d-flex justify-content-end mb-3">
        <Button variant="danger" onClick={handleAddQuestion}>
          <FaPlus className="me-2" />
          New Question
        </Button>
      </div>

      {/* Combine existing questions and new questions for display */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {[...(quiz.questions || []), ...newQuestions].length > 0 ? (
        <div>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {[...(quiz.questions || []), ...newQuestions].map((question: any, index: number) => (
            <div key={question._id} className="mb-3 border p-3 rounded">
              {editingQuestionId === question._id ? (
                <QuestionEditor
                  question={question}
                  onSave={(updatedQuestion) =>
                    handleSaveQuestion(question._id, updatedQuestion)
                  }
                  onCancel={() => {
                    setEditingQuestionId(null);
                    // If it's a new question, remove it from local state on cancel
                    if (question._id.startsWith("new-question-")) {
                      setNewQuestions(newQuestions.filter((q) => q._id !== question._id));
                    }
                  }}
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
                      {question._id.startsWith("new-question-") && (
                        <span className="ms-2 badge bg-warning text-dark">New (unsaved)</span>
                      )}
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
                        onClick={() => {
                          if (question._id.startsWith("new-question-")) {
                            // Remove from local state if it's a new question
                            setNewQuestions(newQuestions.filter((q) => q._id !== question._id));
                          } else {
                            // Delete existing question
                            handleDeleteQuestion(question._id);
                          }
                        }}
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

