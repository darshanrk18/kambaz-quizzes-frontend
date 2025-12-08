"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "react-bootstrap";
import { FaPlus } from "react-icons/fa";
import * as client from "./client";

export default function QuizzesControls() {
  const { cid } = useParams();
  const router = useRouter();

  const handleAddQuiz = async () => {
    try {
      const newQuiz = await client.createQuiz(cid as string, {
        title: "New Quiz",
        description: "",
        points: 0,
        shuffleAnswers: false,
        timeLimit: false,
        timeLimitMinutes: 0,
        dueDate: "",
        availableDate: "",
        untilDate: "",
      });
      router.push(`/Courses/${cid}/Quizzes/${newQuiz._id}/Editor`);
    } catch (error) {
      console.error("Error creating quiz:", error);
    }
  };

  return (
    <div className="d-flex justify-content-end mb-3">
      <Button variant="danger" onClick={handleAddQuiz}>
        <FaPlus className="me-2" />
        Quiz
      </Button>
    </div>
  );
}

