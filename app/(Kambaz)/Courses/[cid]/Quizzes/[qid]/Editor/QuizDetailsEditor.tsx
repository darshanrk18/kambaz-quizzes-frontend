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
        <Form.Label>Title *</Form.Label>
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
        <Form.Label>Quiz Type</Form.Label>
        <Form.Select
          value={quiz.quizType || "Graded Quiz"}
          onChange={(e) => setQuiz({ ...quiz, quizType: e.target.value })}
        >
          <option value="Graded Quiz">Graded Quiz</option>
          <option value="Practice Quiz">Practice Quiz</option>
          <option value="Graded Survey">Graded Survey</option>
          <option value="Ungraded Survey">Ungraded Survey</option>
        </Form.Select>
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
        <Form.Text className="text-muted">
          Points will be calculated as the sum of all question points
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Assignment Group</Form.Label>
        <Form.Select
          value={quiz.assignmentGroup || "Quizzes"}
          onChange={(e) => setQuiz({ ...quiz, assignmentGroup: e.target.value })}
        >
          <option value="Quizzes">Quizzes</option>
          <option value="Exams">Exams</option>
          <option value="Assignments">Assignments</option>
          <option value="Project">Project</option>
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Check
          type="checkbox"
          label="Shuffle Answers"
          checked={quiz.shuffleAnswers !== false}
          onChange={(e) =>
            setQuiz({ ...quiz, shuffleAnswers: e.target.checked })
          }
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Check
          type="checkbox"
          label="Time Limit"
          checked={quiz.timeLimit !== false}
          onChange={(e) => setQuiz({ ...quiz, timeLimit: e.target.checked })}
        />
        {quiz.timeLimit !== false && (
          <Form.Control
            type="number"
            placeholder="Minutes"
            value={quiz.timeLimitMinutes || 20}
            onChange={(e) =>
              setQuiz({
                ...quiz,
                timeLimitMinutes: Number.parseInt(e.target.value, 10) || 20,
              })
            }
            className="mt-2"
          />
        )}
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Check
          type="checkbox"
          label="Multiple Attempts"
          checked={quiz.multipleAttempts || false}
          onChange={(e) => setQuiz({ ...quiz, multipleAttempts: e.target.checked })}
        />
        {quiz.multipleAttempts && (
          <Form.Control
            type="number"
            placeholder="How many attempts"
            value={quiz.attemptsAllowed || 1}
            onChange={(e) =>
              setQuiz({
                ...quiz,
                attemptsAllowed: Number.parseInt(e.target.value, 10) || 1,
              })
            }
            className="mt-2"
          />
        )}
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Show Correct Answers</Form.Label>
        <Form.Select
          value={quiz.showCorrectAnswers || "Never"}
          onChange={(e) => setQuiz({ ...quiz, showCorrectAnswers: e.target.value })}
        >
          <option value="Never">Never</option>
          <option value="Immediately">Immediately</option>
          <option value="After Due Date">After Due Date</option>
          <option value="After Submission">After Submission</option>
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Access Code</Form.Label>
        <Form.Control
          type="text"
          placeholder="Leave blank for no access code"
          value={quiz.accessCode || ""}
          onChange={(e) => setQuiz({ ...quiz, accessCode: e.target.value })}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Check
          type="checkbox"
          label="One Question at a Time"
          checked={quiz.oneQuestionAtATime !== false}
          onChange={(e) => setQuiz({ ...quiz, oneQuestionAtATime: e.target.checked })}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Check
          type="checkbox"
          label="Webcam Required"
          checked={quiz.webcamRequired || false}
          onChange={(e) => setQuiz({ ...quiz, webcamRequired: e.target.checked })}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Check
          type="checkbox"
          label="Lock Questions After Answering"
          checked={quiz.lockQuestionsAfterAnswering || false}
          onChange={(e) =>
            setQuiz({ ...quiz, lockQuestionsAfterAnswering: e.target.checked })
          }
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Due Date *</Form.Label>
        <Form.Control
          type="date"
          value={quiz.dueDate || ""}
          onChange={(e) => setQuiz({ ...quiz, dueDate: e.target.value })}
        />
        <Form.Text className="text-muted">
          Required for publishing
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Available From *</Form.Label>
        <Form.Control
          type="date"
          value={quiz.availableDate || ""}
          onChange={(e) => setQuiz({ ...quiz, availableDate: e.target.value })}
        />
        <Form.Text className="text-muted">
          Required for publishing
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Until *</Form.Label>
        <Form.Control
          type="date"
          value={quiz.untilDate || ""}
          onChange={(e) => setQuiz({ ...quiz, untilDate: e.target.value })}
        />
        <Form.Text className="text-muted">
          Required for publishing
        </Form.Text>
      </Form.Group>
    </div>
  );
}

