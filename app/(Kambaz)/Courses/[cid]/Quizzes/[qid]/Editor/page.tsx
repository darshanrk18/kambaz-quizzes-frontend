"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Tab, Tabs } from "react-bootstrap";
import * as client from "../../client";
import QuizDetailsEditor from "./QuizDetailsEditor";
import QuizQuestionsEditor from "./QuizQuestionsEditor";

export default function QuizEditor() {
  const { cid, qid } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("details"); // Default tab is "details"
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

  const handleSave = async () => {
    try {
      await client.updateQuiz(quiz._id, quiz);
      router.push(`/Courses/${cid}/Quizzes/${quiz._id}`);
    } catch (error) {
      console.error("Error saving quiz:", error);
    }
  };

  const handleSaveAndPublish = async () => {
    try {
      await client.updateQuiz(quiz._id, { ...quiz, published: true });
      router.push(`/Courses/${cid}/Quizzes`);
    } catch (error) {
      console.error("Error saving and publishing quiz:", error);
    }
  };

  const handleCancel = () => {
    router.push(`/Courses/${cid}/Quizzes`);
  };

  if (!quiz) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h3>Quiz Editor</h3>
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k || "details")}
        className="mb-3"
      >
        <Tab eventKey="details" title="Details">
          <QuizDetailsEditor quiz={quiz} setQuiz={setQuiz} />
        </Tab>
        <Tab eventKey="questions" title="Questions">
          <QuizQuestionsEditor
            quiz={quiz}
            setQuiz={setQuiz}
          />
        </Tab>
      </Tabs>
      <div className="mt-3">
        <Button variant="primary" onClick={handleSave} className="me-2">
          Save
        </Button>
        <Button variant="success" onClick={handleSaveAndPublish} className="me-2">
          Save & Publish
        </Button>
        <Button variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

