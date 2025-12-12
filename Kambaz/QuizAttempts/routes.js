import express from "express";
import * as dao from "./dao.js";
import * as quizzesDao from "../Quizzes/dao.js";

const router = express.Router();

/**
 * POST /api/quizzes/:quizId/attempts
 * Create a new quiz attempt or return existing unsubmitted attempt
 */
router.post("/quizzes/:quizId/attempts", async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.session.currentUser?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Check for existing unsubmitted attempt
    const existingAttempt = await dao.findUnsubmittedAttempt(userId, quizId);

    if (existingAttempt) {
      // Return existing attempt with saved state
      return res.json(existingAttempt);
    }

    // Verify quiz exists and is published
    const quiz = await quizzesDao.findQuizById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    if (!quiz.published) {
      return res.status(403).json({ message: "Quiz is not published" });
    }

    // Check attempt limits
    const userAttempts = await dao.findAttemptsByUser(userId);
    const quizAttempts = userAttempts.filter(
      (attempt) => attempt.quiz.toString() === quizId
    );

    if (quiz.attemptsAllowed && quizAttempts.length >= quiz.attemptsAllowed) {
      return res.status(403).json({
        message: "Maximum attempts reached for this quiz",
      });
    }

    // Create new attempt
    const newAttempt = await dao.createAttempt({
      user: userId,
      quiz: quizId,
      startedAt: new Date(),
      submitted: false,
      answers: [],
      currentQuestionIndex: 0,
      elapsedSeconds: 0,
    });

    res.json(newAttempt);
  } catch (error) {
    console.error("Error creating attempt:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * PUT /api/attempts/:attemptId
 * Update an attempt with answers, currentQuestionIndex, and elapsedSeconds
 */
router.put("/attempts/:attemptId", async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.session.currentUser?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const attempt = await dao.findAttemptById(attemptId);

    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }

    if (attempt.user.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (attempt.submitted) {
      return res.status(400).json({ message: "Attempt already submitted" });
    }

    // Extract updates from request body
    const updates = {
      answers: req.body.answers,
      currentQuestionIndex: req.body.currentQuestionIndex,
      elapsedSeconds: req.body.elapsedSeconds,
    };

    // Calculate elapsedSeconds if not provided but startedAt exists
    if (updates.elapsedSeconds === undefined && attempt.startedAt) {
      const now = new Date();
      const startedAt = new Date(attempt.startedAt);
      updates.elapsedSeconds = Math.floor((now - startedAt) / 1000);
    }

    const updatedAttempt = await dao.updateAttempt(attemptId, updates);

    res.json(updatedAttempt);
  } catch (error) {
    console.error("Error updating attempt:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * POST /api/attempts/:attemptId/submit
 * Submit an attempt with final answers and score
 */
router.post("/attempts/:attemptId/submit", async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.session.currentUser?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const attempt = await dao.findAttemptById(attemptId);

    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }

    if (attempt.user.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (attempt.submitted) {
      return res.status(400).json({ message: "Attempt already submitted" });
    }

    // Get quiz to validate time limit
    const quiz = await quizzesDao.findQuizById(attempt.quiz);

    // Calculate elapsed time
    let elapsedSeconds = req.body.elapsedSeconds;
    if (elapsedSeconds === undefined && attempt.startedAt) {
      const now = new Date();
      const startedAt = new Date(attempt.startedAt);
      elapsedSeconds = Math.floor((now - startedAt) / 1000);
    }

    // Validate time limit if quiz has one
    if (quiz && quiz.timeLimit && quiz.timeLimitMinutes) {
      const timeLimitSeconds = quiz.timeLimitMinutes * 60;

      // If time exceeded, cap at time limit (don't allow extra time)
      if (elapsedSeconds > timeLimitSeconds) {
        elapsedSeconds = timeLimitSeconds;
      }
    }

    // Submit the attempt
    const submissionData = {
      answers: req.body.answers,
      score: req.body.score,
      totalPoints: req.body.totalPoints,
      elapsedSeconds: elapsedSeconds,
    };

    const submittedAttempt = await dao.submitAttempt(attemptId, submissionData);

    res.json(submittedAttempt);
  } catch (error) {
    console.error("Error submitting attempt:", error);
    if (error.message === "Attempt not found") {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === "Attempt already submitted") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /api/attempts/:attemptId
 * Get an attempt by ID
 */
router.get("/attempts/:attemptId", async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.session.currentUser?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const attempt = await dao.findAttemptById(attemptId);

    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }

    if (attempt.user.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json(attempt);
  } catch (error) {
    console.error("Error fetching attempt:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /api/quizzes/:quizId/attempts
 * Get all attempts for a quiz (for instructor view)
 */
router.get("/quizzes/:quizId/attempts", async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.session.currentUser?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // TODO: Add instructor check here
    const attempts = await dao.findAttemptsByQuiz(quizId);

    res.json(attempts);
  } catch (error) {
    console.error("Error fetching attempts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;

