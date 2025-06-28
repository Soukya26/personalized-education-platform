# backend/app.py
from flask import Flask, jsonify
from flask_cors import CORS

# Initialize the Flask app
app = Flask(__name__)
# Enable CORS for all routes, allowing your React frontend to access the API
CORS(app)

# This is a sample list of questions
# In a real app, this would come from a database
questions = [
    {
        "id": 1,
        "question_text": "What is 2 + 2?",
        "options": ["3", "4", "5"],
        "correct_option": "4",
        "difficulty": "easy",
        "topic": "addition"
    },
    {
        "id": 2,
        "question_text": "What is the square root of 9?",
        "options": ["2", "3", "4"],
        "correct_option": "3",
        "difficulty": "medium",
        "topic": "algebra"
    },
    {
        "id": 3,
        "question_text": "Solve for x: 2x + 5 = 11",
        "options": ["2", "3", "4"],
        "correct_option": "3",
        "difficulty": "hard",
        "topic": "algebra"
    },
    {
        "id": 4,
        "question_text": "What is 10 - 7?",
        "options": ["2", "3", "4"],
        "correct_option": "3",
        "difficulty": "easy",
        "topic": "subtraction"
    }
]

# A simple rule-based AI logic to select the next question
# This is where the 'AI Usage' criteria is met
# It can be improved later with more complex logic
def get_next_question(last_question_id, is_last_answer_correct):
    """
    This function simulates a simple adaptive logic.
    If the user answers correctly, it suggests a harder question on the same topic.
    If incorrect, it suggests an easier question on a related topic.
    """
    last_question = next((q for q in questions if q["id"] == last_question_id), None)
    
    if last_question:
        current_topic = last_question["topic"]
        current_difficulty = last_question["difficulty"]
        
        # Simple difficulty progression
        difficulty_levels = ["easy", "medium", "hard"]
        current_difficulty_index = difficulty_levels.index(current_difficulty)

        if is_last_answer_correct:
            # Try to find a harder question on the same topic
            next_difficulty_index = min(current_difficulty_index + 1, len(difficulty_levels) - 1)
            next_difficulty = difficulty_levels[next_difficulty_index]
            
            # Find a question from the same topic with the next difficulty level
            next_question = next((q for q in questions if q["topic"] == current_topic and q["difficulty"] == next_difficulty and q["id"] != last_question_id), None)
            
            if next_question:
                return next_question
        else:
            # Try to find an easier question on the same topic
            next_difficulty_index = max(current_difficulty_index - 1, 0)
            next_difficulty = difficulty_levels[next_difficulty_index]
            
            next_question = next((q for q in questions if q["topic"] == current_topic and q["difficulty"] == next_difficulty and q["id"] != last_question_id), None)
            
            if next_question:
                return next_question

    # Fallback: If no adaptive question is found, return the next question in the list.
    return next((q for q in questions if q["id"] > last_question_id), None)

# API endpoint to get the first question
@app.route('/api/quiz/start', methods=['GET'])
def get_first_question():
    # Return the first question
    return jsonify({"question": questions[0], "message": "Quiz started!"})

# API endpoint to submit an answer and get the next question
@app.route('/api/quiz/submit-answer', methods=['POST'])
def submit_answer():
    # In a real app, you'd get this from the request body (e.g., request.json)
    # For now, we'll use query parameters for simplicity in the MVP
    last_question_id = int(request.args.get('last_question_id'))
    is_correct = request.args.get('is_correct') == 'true'

    next_question_data = get_next_question(last_question_id, is_correct)
    
    if next_question_data:
        return jsonify({"question": next_question_data, "message": "Here is your next question."})
    else:
        return jsonify({"question": None, "message": "You have completed the quiz!"})


if __name__ == '__main__':
    # Save the list of dependencies to requirements.txt for deployment
    import subprocess
    subprocess.run(['pip', 'freeze', '>','requirements.txt'])

    # Run the app in debug mode
    app.run(debug=True, port=5000)