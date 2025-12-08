"use client";

import { useState, useEffect } from "react";
import { Button, Form } from "react-bootstrap";
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

  useEffect(() => {
    setEditedQuestion(question);
  }, [question]);

  const handleSave = () => {
    onSave(editedQuestion);
  };

  const handleQuestionTypeChange = (newType: string) => {
    const baseQuestion = {
      ...editedQuestion,
      questionType: newType,
    };

    if (newType === "Multiple Choice") {
      baseQuestion.options = editedQuestion.options || [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ];
      delete baseQuestion.correctAnswer;
      delete baseQuestion.blanks;
    } else if (newType === "True/False") {
      baseQuestion.correctAnswer = editedQuestion.correctAnswer ?? true;
      delete baseQuestion.options;
      delete baseQuestion.blanks;
    } else if (newType === "Fill in the Blank") {
      baseQuestion.blanks = editedQuestion.blanks || [
        { text: "", correctAnswers: [""] },
      ];
      delete baseQuestion.options;
      delete baseQuestion.correctAnswer;
    }

    setEditedQuestion(baseQuestion);
  };

  const addOption = () => {
    setEditedQuestion({
      ...editedQuestion,
      options: [...(editedQuestion.options || []), { text: "", isCorrect: false }],
    });
  };

  const removeOption = (index: number) => {
    const newOptions = editedQuestion.options.filter(
      (_: any, i: number) => i !== index
    );
    setEditedQuestion({ ...editedQuestion, options: newOptions });
  };

  const updateOption = (index: number, field: string, value: any) => {
    const newOptions = [...editedQuestion.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setEditedQuestion({ ...editedQuestion, options: newOptions });
  };

  const addBlank = () => {
    setEditedQuestion({
      ...editedQuestion,
      blanks: [
        ...(editedQuestion.blanks || []),
        { text: "", correctAnswers: [""] },
      ],
    });
  };

  const removeBlank = (index: number) => {
    const newBlanks = editedQuestion.blanks.filter(
      (_: any, i: number) => i !== index
    );
    setEditedQuestion({ ...editedQuestion, blanks: newBlanks });
  };

  const updateBlank = (index: number, field: string, value: any) => {
    const newBlanks = [...editedQuestion.blanks];
    newBlanks[index] = { ...newBlanks[index], [field]: value };
    setEditedQuestion({ ...editedQuestion, blanks: newBlanks });
  };

  const addCorrectAnswer = (blankIndex: number) => {
    const newBlanks = [...editedQuestion.blanks];
    newBlanks[blankIndex].correctAnswers.push("");
    setEditedQuestion({ ...editedQuestion, blanks: newBlanks });
  };

  const removeCorrectAnswer = (blankIndex: number, answerIndex: number) => {
    const newBlanks = [...editedQuestion.blanks];
    newBlanks[blankIndex].correctAnswers = newBlanks[blankIndex].correctAnswers.filter(
      (_: string, i: number) => i !== answerIndex
    );
    setEditedQuestion({ ...editedQuestion, blanks: newBlanks });
  };

  const updateCorrectAnswer = (
    blankIndex: number,
    answerIndex: number,
    value: string
  ) => {
    const newBlanks = [...editedQuestion.blanks];
    newBlanks[blankIndex].correctAnswers[answerIndex] = value;
    setEditedQuestion({ ...editedQuestion, blanks: newBlanks });
  };

  return (
    <div>
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
        <Form.Label>Title</Form.Label>
        <Form.Control
          type="text"
          value={editedQuestion.title || ""}
          onChange={(e) =>
            setEditedQuestion({ ...editedQuestion, title: e.target.value })
          }
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Question</Form.Label>
        <Form.Control
          as="textarea"
          rows={4}
          value={editedQuestion.question || ""}
          onChange={(e) =>
            setEditedQuestion({ ...editedQuestion, question: e.target.value })
          }
          placeholder="Enter question text"
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Points</Form.Label>
        <Form.Control
          type="number"
          value={editedQuestion.points || 1}
          onChange={(e) =>
            setEditedQuestion({
              ...editedQuestion,
              points: parseInt(e.target.value) || 1,
            })
          }
        />
      </Form.Group>

      {/* Multiple Choice */}
      {editedQuestion.questionType === "Multiple Choice" && (
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <strong>Options</strong>
            <Button variant="primary" size="sm" onClick={addOption}>
              <FaPlus className="me-1" />
              Add Option
            </Button>
          </div>
          {editedQuestion.options?.map((option: any, index: number) => (
            <div key={index} className="mb-2 d-flex align-items-center">
              <Form.Check
                type="checkbox"
                checked={option.isCorrect || false}
                onChange={(e) =>
                  updateOption(index, "isCorrect", e.target.checked)
                }
                className="me-2"
              />
              <Form.Control
                type="text"
                value={option.text || ""}
                onChange={(e) => updateOption(index, "text", e.target.value)}
                placeholder="Option text"
                className="me-2"
              />
              <Button
                variant="danger"
                size="sm"
                onClick={() => removeOption(index)}
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
          <Form.Label>Correct Answer</Form.Label>
          <div>
            <Form.Check
              type="radio"
              label="True"
              name={`tf-${question._id}`}
              checked={editedQuestion.correctAnswer === true}
              onChange={() =>
                setEditedQuestion({ ...editedQuestion, correctAnswer: true })
              }
            />
            <Form.Check
              type="radio"
              label="False"
              name={`tf-${question._id}`}
              checked={editedQuestion.correctAnswer === false}
              onChange={() =>
                setEditedQuestion({ ...editedQuestion, correctAnswer: false })
              }
            />
          </div>
        </Form.Group>
      )}

      {/* Fill in the Blank */}
      {editedQuestion.questionType === "Fill in the Blank" && (
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <strong>Blanks</strong>
            <Button variant="primary" size="sm" onClick={addBlank}>
              <FaPlus className="me-1" />
              Add Blank
            </Button>
          </div>
          {editedQuestion.blanks?.map((blank: any, blankIndex: number) => (
            <div key={blankIndex} className="mb-3 border p-3 rounded">
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
                <strong>Correct Answers:</strong>
                {blank.correctAnswers?.map((answer: string, answerIndex: number) => (
                  <div key={answerIndex} className="d-flex align-items-center mb-1">
                    <Form.Control
                      type="text"
                      value={answer}
                      onChange={(e) =>
                        updateCorrectAnswer(blankIndex, answerIndex, e.target.value)
                      }
                      placeholder="Correct answer"
                      className="me-2"
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => removeCorrectAnswer(blankIndex, answerIndex)}
                    >
                      <FaTrash />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => addCorrectAnswer(blankIndex)}
                  className="mt-1"
                >
                  <FaPlus className="me-1" />
                  Add Answer
                </Button>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => removeBlank(blankIndex)}
              >
                <FaTrash /> Remove Blank
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3">
        <Button variant="primary" onClick={handleSave} className="me-2">
          Update Question
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

