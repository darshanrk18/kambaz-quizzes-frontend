"use client";

import { Form } from "react-bootstrap";

export default function QuizDetailsEditor({
  quiz,
  setQuiz,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  quiz: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setQuiz: (quiz: any) => void;
}) {
  return (
    <div className="mt-3">
      <Form.Group className="mb-3">
        <Form.Label>Title</Form.Label>
        <Form.Control
          type="text"
          value={quiz.title || ""}
          onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          rows={4}
          value={quiz.description || ""}
          onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Points</Form.Label>
        <Form.Control
          type="number"
          value={quiz.points || 0}
          onChange={(e) =>
            setQuiz({ ...quiz, points: Number.parseInt(e.target.value, 10) || 0 })
          }
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Check
          type="checkbox"
          label="Shuffle Answers"
          checked={quiz.shuffleAnswers || false}
          onChange={(e) =>
            setQuiz({ ...quiz, shuffleAnswers: e.target.checked })
          }
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Check
          type="checkbox"
          label="Time Limit"
          checked={quiz.timeLimit || false}
          onChange={(e) => setQuiz({ ...quiz, timeLimit: e.target.checked })}
        />
        {quiz.timeLimit && (
          <Form.Control
            type="number"
            placeholder="Minutes"
            value={quiz.timeLimitMinutes || 0}
            onChange={(e) =>
              setQuiz({
                ...quiz,
                timeLimitMinutes: Number.parseInt(e.target.value, 10) || 0,
              })
            }
            className="mt-2"
          />
        )}
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Due Date</Form.Label>
        <Form.Control
          type="date"
          value={quiz.dueDate || ""}
          onChange={(e) => setQuiz({ ...quiz, dueDate: e.target.value })}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Available Date</Form.Label>
        <Form.Control
          type="date"
          value={quiz.availableDate || ""}
          onChange={(e) => setQuiz({ ...quiz, availableDate: e.target.value })}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Until Date</Form.Label>
        <Form.Control
          type="date"
          value={quiz.untilDate || ""}
          onChange={(e) => setQuiz({ ...quiz, untilDate: e.target.value })}
        />
      </Form.Group>
    </div>
  );
}

