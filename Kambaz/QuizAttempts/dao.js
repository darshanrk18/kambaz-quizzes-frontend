import quizAttemptsModel from "./model.js";

/**
 * Creates a new quiz attempt
 * @param {Object} attempt - The attempt object to create
 * @returns {Promise<Object>} The created attempt
 */
export const createAttempt = async (attempt) => {
  const newAttempt = await quizAttemptsModel.create(attempt);
  return newAttempt;
};

/**
 * Finds an attempt by ID
 * @param {string} attemptId - The attempt ID
 * @returns {Promise<Object|null>} The attempt or null if not found
 */
export const findAttemptById = async (attemptId) => {
  const attempt = await quizAttemptsModel.findById(attemptId);
  return attempt;
};

/**
 * Finds an existing unsubmitted attempt for a user and quiz
 * @param {string} userId - The user ID
 * @param {string} quizId - The quiz ID
 * @returns {Promise<Object|null>} The existing attempt or null if not found
 */
export const findUnsubmittedAttempt = async (userId, quizId) => {
  const attempt = await quizAttemptsModel.findOne({
    user: userId,
    quiz: quizId,
    submitted: false,
  });
  return attempt;
};

/**
 * Updates an attempt with new data
 * @param {string} attemptId - The attempt ID
 * @param {Object} updates - The updates to apply
 * @param {Array} updates.answers - The answers array
 * @param {Number} updates.currentQuestionIndex - The current question index
 * @param {Number} updates.elapsedSeconds - The elapsed time in seconds
 * @returns {Promise<Object>} The updated attempt
 */
export const updateAttempt = async (attemptId, updates) => {
  const updateData = {};
  
  if (updates.answers !== undefined) {
    updateData.answers = updates.answers;
  }
  
  if (updates.currentQuestionIndex !== undefined) {
    updateData.currentQuestionIndex = updates.currentQuestionIndex;
  }
  
  if (updates.elapsedSeconds !== undefined) {
    updateData.elapsedSeconds = updates.elapsedSeconds;
  }
  
  const updatedAttempt = await quizAttemptsModel.findByIdAndUpdate(
    attemptId,
    { $set: updateData },
    { new: true }
  );
  
  return updatedAttempt;
};

/**
 * Submits an attempt
 * @param {string} attemptId - The attempt ID
 * @param {Object} submissionData - The submission data
 * @param {Array} submissionData.answers - The final answers
 * @param {Number} submissionData.score - The calculated score
 * @param {Number} submissionData.totalPoints - The total points possible
 * @returns {Promise<Object>} The submitted attempt
 */
export const submitAttempt = async (attemptId, submissionData) => {
  const attempt = await quizAttemptsModel.findById(attemptId);
  
  if (!attempt) {
    throw new Error("Attempt not found");
  }
  
  if (attempt.submitted) {
    throw new Error("Attempt already submitted");
  }
  
  // Calculate elapsed time if not provided
  let elapsedSeconds = submissionData.elapsedSeconds;
  if (elapsedSeconds === undefined && attempt.startedAt) {
    const now = new Date();
    const startedAt = new Date(attempt.startedAt);
    elapsedSeconds = Math.floor((now - startedAt) / 1000);
  }
  
  // Get quiz to check time limit
  const Quiz = (await import("../Quizzes/model.js")).default;
  const quiz = await Quiz.findById(attempt.quiz);
  
  if (quiz && quiz.timeLimit && quiz.timeLimitMinutes) {
    const timeLimitSeconds = quiz.timeLimitMinutes * 60;
    
    // If time exceeded, cap at time limit (don't allow extra time)
    if (elapsedSeconds > timeLimitSeconds) {
      elapsedSeconds = timeLimitSeconds;
    }
  }
  
  const updatedAttempt = await quizAttemptsModel.findByIdAndUpdate(
    attemptId,
    {
      $set: {
        answers: submissionData.answers,
        score: submissionData.score,
        totalPoints: submissionData.totalPoints,
        submitted: true,
        submittedAt: new Date(),
        elapsedSeconds: elapsedSeconds,
      },
    },
    { new: true }
  );
  
  return updatedAttempt;
};

/**
 * Finds all attempts for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} Array of attempts
 */
export const findAttemptsByUser = async (userId) => {
  const attempts = await quizAttemptsModel.find({ user: userId });
  return attempts;
};

/**
 * Finds all attempts for a quiz
 * @param {string} quizId - The quiz ID
 * @returns {Promise<Array>} Array of attempts
 */
export const findAttemptsByQuiz = async (quizId) => {
  const attempts = await quizAttemptsModel.find({ quiz: quizId });
  return attempts;
};

