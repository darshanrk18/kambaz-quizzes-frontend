import mongoose from "mongoose";

/**
 * QuizAttempt Schema
 * Stores quiz attempt information including progress state
 */
const quizAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
    },
    submitted: {
      type: Boolean,
      default: false,
    },
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
        },
        selectedOptions: [Number], // For Multiple Choice
        trueFalseAnswer: Boolean, // For True/False
        fillInAnswers: [String], // For Fill in the Blank
      },
    ],
    score: {
      type: Number,
      default: 0,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    // NEW: Current question index for resume functionality
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    // NEW: Elapsed time in seconds
    elapsedSeconds: {
      type: Number,
      default: 0,
    },
  },
  { collection: "quizAttempts" }
);

export default mongoose.model("QuizAttempt", quizAttemptSchema);

