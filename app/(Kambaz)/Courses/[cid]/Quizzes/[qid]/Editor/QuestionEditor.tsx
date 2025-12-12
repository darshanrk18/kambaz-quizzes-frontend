"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button, Form, Alert } from "react-bootstrap";
import { FaPlus, FaTrash } from "react-icons/fa";

export default function QuestionEditor({
  question,
  onSave,
  onCancel,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  question: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (question: any) => void;
  onCancel: () => void;
}) {
  const [editedQuestion, setEditedQuestion] = useState(question);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    setEditedQuestion(question);
    setErrors([]);
  }, [question]);

  // Generate stable IDs for options and blanks if they don't have them
  const questionId = useMemo(() => editedQuestion._id || `q-${Date.now()}`, [editedQuestion._id]);

  const validateQuestion = useCallback((): boolean => {
    const validationErrors: string[] = [];

    if (!editedQuestion.title || editedQuestion.title.trim() === "") {
      validationErrors.push("Question Title is required");
    }

    if (!editedQuestion.question || editedQuestion.question.trim() === "") {
      validationErrors.push("Question Text is required");
    }

    if (!editedQuestion.points || editedQuestion.points <= 0) {
      validationErrors.push("Question Points must be greater than 0");
    }

    if (editedQuestion.questionType === "Multiple Choice") {
      if (!editedQuestion.options || editedQuestion.options.length === 0) {
        validationErrors.push("At least one answer option is required for Multiple Choice");
      } else {
        const hasCorrectAnswer = editedQuestion.options.some(
          (opt: { isCorrect: boolean }) => opt.isCorrect
        );
        if (!hasCorrectAnswer) {
          validationErrors.push("At least one correct answer must be selected for Multiple Choice");
        }
      }
    } else if (editedQuestion.questionType === "True/False") {
      if (editedQuestion.correctAnswer === undefined || editedQuestion.correctAnswer === null) {
        validationErrors.push("True/False selection is required");
      }
    } else if (editedQuestion.questionType === "Fill in the Blank") {
      if (!editedQuestion.blanks || editedQuestion.blanks.length === 0) {
        validationErrors.push("At least one blank is required for Fill in the Blank");
      } else {
        const hasBlankAnswer = editedQuestion.blanks.some(
          (blank: { correctAnswers: string[] }) =>
            blank.correctAnswers && blank.correctAnswers.length > 0 && blank.correctAnswers.some((ans: string) => ans.trim() !== "")
        );
        if (!hasBlankAnswer) {
          validationErrors.push("At least one blank must have a correct answer");
        }
      }
    }

    setErrors(validationErrors);
    return validationErrors.length === 0;
  }, [editedQuestion]);

  const handleSave = useCallback(() => {
    if (validateQuestion()) {
      onSave(editedQuestion);
    }
  }, [editedQuestion, onSave, validateQuestion]);

  const handleQuestionTypeChange = useCallback((newType: string) => {
    setEditedQuestion((prev) => {
      const baseQuestion = {
        ...prev,
        questionType: newType,
      };

      if (newType === "Multiple Choice") {
        baseQuestion.options = prev.options || [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ];
        delete baseQuestion.correctAnswer;
        delete baseQuestion.blanks;
      } else if (newType === "True/False") {
        baseQuestion.correctAnswer = prev.correctAnswer ?? true;
        delete baseQuestion.options;
        delete baseQuestion.blanks;
      } else if (newType === "Fill in the Blank") {
        baseQuestion.blanks = prev.blanks || [
          { text: "", correctAnswers: [""] },
        ];
        delete baseQuestion.options;
        delete baseQuestion.correctAnswer;
      }

      return baseQuestion;
    });
  }, []);

  const addOption = useCallback(() => {
    setEditedQuestion((prev) => ({
      ...prev,
      options: [...(prev.options || []), { text: "", isCorrect: false }],
    }));
  }, []);

  const removeOption = useCallback((index: number) => {
    setEditedQuestion((prev) => {
      const newOptions = prev.options.filter(
        (_: unknown, i: number) => i !== index
      );
      return { ...prev, options: newOptions };
    });
  }, []);

  const updateOption = useCallback((index: number, field: string, value: unknown) => {
    setEditedQuestion((prev) => {
      const newOptions = [...prev.options];
      newOptions[index] = { ...newOptions[index], [field]: value };
      return { ...prev, options: newOptions };
    });
  }, []);

  const addBlank = useCallback(() => {
    setEditedQuestion((prev) => ({
      ...prev,
      blanks: [
        ...(prev.blanks || []),
        { text: "", correctAnswers: [""] },
      ],
    }));
  }, []);

  const removeBlank = useCallback((index: number) => {
    setEditedQuestion((prev) => {
      const newBlanks = prev.blanks.filter(
        (_: unknown, i: number) => i !== index
      );
      return { ...prev, blanks: newBlanks };
    });
  }, []);

  const updateBlank = useCallback((index: number, field: string, value: unknown) => {
    setEditedQuestion((prev) => {
      const newBlanks = [...prev.blanks];
      newBlanks[index] = { ...newBlanks[index], [field]: value };
      return { ...prev, blanks: newBlanks };
    });
  }, []);

  const addCorrectAnswer = useCallback((blankIndex: number) => {
    setEditedQuestion((prev) => {
      const newBlanks = [...prev.blanks];
      newBlanks[blankIndex].correctAnswers.push("");
      return { ...prev, blanks: newBlanks };
    });
  }, []);

  const removeCorrectAnswer = useCallback((blankIndex: number, answerIndex: number) => {
    setEditedQuestion((prev) => {
      const newBlanks = [...prev.blanks];
      newBlanks[blankIndex].correctAnswers = newBlanks[blankIndex].correctAnswers.filter(
        (_: string, i: number) => i !== answerIndex
      );
      return { ...prev, blanks: newBlanks };
    });
  }, []);

  const updateCorrectAnswer = useCallback((
    blankIndex: number,
    answerIndex: number,
    value: string
  ) => {
    setEditedQuestion((prev) => {
      const newBlanks = [...prev.blanks];
      newBlanks[blankIndex].correctAnswers[answerIndex] = value;
      return { ...prev, blanks: newBlanks };
    });
  }, []);

  return (
    <div>
      {errors.length > 0 && (
        <Alert variant="danger" dismissible onClose={() => setErrors([])} className="mb-3">
          {errors.map((err, i) => (
            <div key={i}>{err}</div>
          ))}
        </Alert>
      )}
      <div className="d-flex justify-content-end mb-3">
        <Button variant="secondary" onClick={onCancel} className="me-2">
          Cancel
        </Button>
        <Button variant="success" onClick={handleSave}>
          Update Question
        </Button>
      </div>
      <hr />
      <Form.Group className="mb-3">
        <Form.Label>Question Type</Form.Label>
        <Form.Select
          value={editedQuestion.questionType || "Multiple Choice"}
          onChange={(e) => handleQuestionTypeChange(e.target.value)}
        >
          <option value="Multiple Choice">Multiple Choice</option>
          <option value="True/False">True/False</option>
          <option value="Fill in the Blank">Fill in the Blank</option>
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Title *</Form.Label>
        <Form.Control
          type="text"
          value={editedQuestion.title || ""}
          onChange={(e) =>
            setEditedQuestion((prev) => ({ ...prev, title: e.target.value }))
          }
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Question *</Form.Label>
        <Form.Control
          as="textarea"
          rows={4}
          value={editedQuestion.question || ""}
          onChange={(e) =>
            setEditedQuestion((prev) => ({ ...prev, question: e.target.value }))
          }
          placeholder="Enter question text"
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Points *</Form.Label>
        <Form.Control
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={editedQuestion.points || 1}
          onChange={(e) => {
            const val = e.target.value;
            const numVal = val === "" ? 1 : parseInt(val, 10);
            if (!isNaN(numVal)) {
              setEditedQuestion((prev) => ({
                ...prev,
                points: numVal,
              }));
            }
          }}
        />
        <Form.Text className="text-muted">
          Must be greater than 0
        </Form.Text>
      </Form.Group>

      {editedQuestion.questionType === "Fill in the Blank" && (
        <Form.Group className="mb-3">
          <Form.Check
            type="checkbox"
            label="Case Sensitive Matching"
            checked={editedQuestion.caseSensitive || false}
            onChange={(e) =>
              setEditedQuestion((prev) => ({
                ...prev,
                caseSensitive: e.target.checked,
              }))
            }
          />
          <Form.Text className="text-muted">
            If checked, answers must match exact case (e.g., "JavaScript" vs "javascript")
          </Form.Text>
        </Form.Group>
      )}

      {/* Multiple Choice */}
      {editedQuestion.questionType === "Multiple Choice" && (
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Form.Label className="mb-0"><strong>Answers *</strong></Form.Label>
            <Button variant="primary" size="sm" onClick={addOption}>
              <FaPlus className="me-1" />
              Add Another Answer
            </Button>
          </div>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {editedQuestion.options?.map((option: any, index: number) => (
            <div key={`${questionId}-option-${index}`} className="mb-2 d-flex align-items-center">
              <Form.Check
                type="radio"
                name={`correct-answer-${questionId}`}
                checked={option.isCorrect || false}
                onChange={(e) => {
                  // Uncheck all other options first
                  setEditedQuestion((prev) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const newOptions = prev.options.map((opt: any, idx: number) => ({
                      ...opt,
                      isCorrect: idx === index ? e.target.checked : false,
                    }));
                    return { ...prev, options: newOptions };
                  });
                }}
                className="me-2"
              />
              <Form.Control
                type="text"
                value={option.text || ""}
                onChange={(e) => updateOption(index, "text", e.target.value)}
                placeholder={`Answer ${index + 1}`}
                className="me-2"
              />
              <Button
                variant="link"
                size="sm"
                onClick={() => removeOption(index)}
                className="text-danger"
              >
                <FaTrash />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* True/False */}
      {editedQuestion.questionType === "True/False" && (
        <Form.Group className="mb-3">
          <Form.Label>Correct Answer *</Form.Label>
          <div>
            <Form.Check
              type="radio"
              label="True"
              name={`tf-${questionId}`}
              checked={editedQuestion.correctAnswer === true}
              onChange={() =>
                setEditedQuestion((prev) => ({ ...prev, correctAnswer: true }))
              }
            />
            <Form.Check
              type="radio"
              label="False"
              name={`tf-${questionId}`}
              checked={editedQuestion.correctAnswer === false}
              onChange={() =>
                setEditedQuestion((prev) => ({ ...prev, correctAnswer: false }))
              }
            />
          </div>
        </Form.Group>
      )}

      {/* Fill in the Blank */}
      {editedQuestion.questionType === "Fill in the Blank" && (
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <strong>Blanks *</strong>
            <Button variant="primary" size="sm" onClick={addBlank}>
              <FaPlus className="me-1" />
              Add Blank
            </Button>
          </div>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {editedQuestion.blanks?.map((blank: any, blankIndex: number) => (
            <div key={`${questionId}-blank-${blankIndex}`} className="mb-3 border p-3 rounded">
              <Form.Group className="mb-2">
                <Form.Label>Blank Text</Form.Label>
                <Form.Control
                  type="text"
                  value={blank.text || ""}
                  onChange={(e) =>
                    updateBlank(blankIndex, "text", e.target.value)
                  }
                  placeholder="Enter blank text"
                />
              </Form.Group>
              <div className="mb-2">
                <Form.Label className="mb-1"><strong>Possible Answers:</strong></Form.Label>
                {blank.correctAnswers?.map((answer: string, answerIndex: number) => (
                  <div key={`${questionId}-blank-${blankIndex}-answer-${answerIndex}`} className="d-flex align-items-center mb-1">
                    <Form.Control
                      type="text"
                      value={answer}
                      onChange={(e) =>
                        updateCorrectAnswer(blankIndex, answerIndex, e.target.value)
                      }
                      placeholder={`Answer ${answerIndex + 1}`}
                      className="me-2"
                    />
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => removeCorrectAnswer(blankIndex, answerIndex)}
                      className="text-danger"
                    >
                      <FaTrash />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => addCorrectAnswer(blankIndex)}
                  className="mt-2"
                >
                  <FaPlus className="me-1" />
                  Add Another Answer
                </Button>
              </div>
              <Button
                variant="link"
                size="sm"
                onClick={() => removeBlank(blankIndex)}
                className="text-danger"
              >
                <FaTrash className="me-1" /> Remove Blank
              </Button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

