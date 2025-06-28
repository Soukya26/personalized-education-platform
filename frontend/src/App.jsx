import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [question, setQuestion] = useState(null);
  const [message, setMessage] = useState('Loading...');
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  // New state to manage the current view: 'quiz' or 'dashboard'
  const [currentView, setCurrentView] = useState('quiz');
  // New state to store history of attempted questions
  const [questionHistory, setQuestionHistory] = useState([]);


  // Function to fetch the first question when the component mounts or quiz restarts
  const fetchFirstQuestion = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/quiz/start');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setQuestion(data.question);
      setMessage(data.message);
      setIsAnswerSubmitted(false);
      setIsCorrect(null);
      setUserAnswer('');
      // Reset question history when starting a new quiz
      setQuestionHistory([]);
      setCurrentView('quiz'); // Ensure we are on the quiz view
    } catch (error) {
      setMessage('Failed to load the quiz. Please check if the backend is running.');
      console.error('Fetch error:', error);
    }
  };

  useEffect(() => {
    fetchFirstQuestion();
  }, []);

  // Function to submit the answer to the backend
  const handleSubmitAnswer = async () => {
    if (!userAnswer) {
      setMessage('Please select an answer.');
      // Reset message after a delay if no question is present or message is just a placeholder
      setTimeout(() => {
        if (question && !isAnswerSubmitted) {
          setMessage(question.question_text); // Or a generic quiz in progress message
        } else if (!question) {
          setMessage('Quiz in progress...');
        }
      }, 2000); 
      return;
    }

    const isAnswerCorrect = userAnswer === question.correct_option;
    setIsCorrect(isAnswerCorrect);
    setIsAnswerSubmitted(true);
    
    // Add the current question to history
    setQuestionHistory(prevHistory => [
      ...prevHistory,
      {
        id: question.id,
        question_text: question.question_text,
        user_answer: userAnswer,
        correct_answer: question.correct_option,
        is_correct: isAnswerCorrect,
        topic: question.topic,
        difficulty: question.difficulty
      }
    ]);

    if (isAnswerCorrect) {
      setScore(prevScore => prevScore + 1);
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/quiz/submit-answer?last_question_id=${question.id}&is_correct=${isAnswerCorrect}`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      
      // Delay fetching the next question to show feedback
      setTimeout(() => {
        if (data.question) {
          setQuestion(data.question);
          setMessage(data.message);
          setIsAnswerSubmitted(false);
          setIsCorrect(null);
          setUserAnswer('');
        } else {
          // If no more questions, end the quiz and go to dashboard
          setQuestion(null);
          setMessage(data.message);
          setCurrentView('dashboard'); // Switch to dashboard when quiz is completed
        }
      }, 2000); // 2-second delay
    } catch (error) {
      setMessage('Failed to get the next question.');
      console.error('Fetch error:', error);
    }
  };

  const handleOptionChange = (event) => {
    setUserAnswer(event.target.value);
  };

  const handleRestartQuiz = () => {
    setScore(0);
    setQuestionHistory([]); // Clear history for a fresh start
    fetchFirstQuestion();
    setCurrentView('quiz'); // Ensure we return to quiz view
  };

  // Function to navigate to dashboard
  const goToDashboard = () => {
    setCurrentView('dashboard');
  };

  // Function to navigate back to quiz (or start new if quiz ended)
  const goToQuiz = () => {
    if (!question) { // If quiz ended, restart it
      handleRestartQuiz();
    } else { // Otherwise, go back to the current quiz state
      setCurrentView('quiz');
    }
  };

  if (!question && message.includes('Loading') && currentView === 'quiz') {
    return <div className="loading">{message}</div>;
  }

  return (
    <div className="app-container">
      <div className="header">
        <h1>AI-Powered Adaptive Quiz</h1>
        <div className="score-board">
          <p>Score: {score}</p>
        </div>
        <div className="navigation-buttons">
          {currentView === 'quiz' ? (
            <button onClick={goToDashboard} className="nav-button">View Dashboard</button>
          ) : (
            <button onClick={goToQuiz} className="nav-button">Back to Quiz</button>
          )}
        </div>
      </div>

      {currentView === 'quiz' && (
        <div className="quiz-container">
          {question ? (
            <>
              <div className="question-card">
                <p className="question-text">{question.question_text}</p>
                <div className="options">
                  {question.options.map((option, index) => (
                    <label key={index} className="option-label">
                      <input
                        type="radio"
                        name="answer"
                        value={option}
                        checked={userAnswer === option}
                        onChange={handleOptionChange}
                        disabled={isAnswerSubmitted}
                      />
                      <span className="option-text">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="feedback-section">
                {isAnswerSubmitted && (
                  isCorrect ? (
                    <p className="feedback correct">Correct! Moving to the next question...</p>
                  ) : (
                    <p className="feedback incorrect">Incorrect. Let's try a different question.</p>
                  )
                )}
              </div>
              {!isAnswerSubmitted ? (
                <button onClick={handleSubmitAnswer} className="submit-button">Submit Answer</button>
              ) : (
                <p className="message">{message}</p>
              )}
            </>
          ) : (
            <div className="quiz-end-screen">
              <h2>Quiz Completed!</h2>
              <p className="final-score">Your final score is: {score}</p>
              <button onClick={handleRestartQuiz} className="restart-button">Restart Quiz</button>
              <button onClick={goToDashboard} className="nav-button view-dashboard-button">View Full Results</button>
            </div>
          )}
        </div>
      )}

      {currentView === 'dashboard' && (
        <div className="dashboard-container">
          <h2>Quiz Results Dashboard</h2>
          <p className="dashboard-total-score">Your Score: {score} out of {questionHistory.length}</p>
          <div className="question-history">
            {questionHistory.length > 0 ? (
              questionHistory.map((item, index) => (
                <div key={index} className={`history-item ${item.is_correct ? 'correct-answer' : 'incorrect-answer'}`}>
                  <p className="history-question">Q{index + 1}: {item.question_text}</p>
                  <p className="history-your-answer">Your Answer: {item.user_answer}</p>
                  <p className="history-correct-answer">Correct Answer: {item.correct_answer}</p>
                  <p className="history-status">{item.is_correct ? 'Correct' : 'Incorrect'} (Topic: {item.topic}, Difficulty: {item.difficulty})</p>
                </div>
              ))
            ) : (
              <p>No questions attempted yet in this session.</p>
            )}
          </div>
          <button onClick={handleRestartQuiz} className="restart-button dashboard-restart-button">Start New Quiz</button>
        </div>
      )}
    </div>
  );
}

export default App;
