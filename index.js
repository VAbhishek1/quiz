import express from "express";
import bodyParser from "body-parser";
import pg from 'pg';

const pool = new pg.Pool({
  user: "za_user",
  host: "dpg-crmidi5umphs739eu04g-a.oregon-postgres.render.com",
  database: "za",
  password: "zTVyc3oZJqDpP8gKHvnanMUpEQvt8Juo",
  port: 5432,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
});

let quiz=[];
// Fetch quiz questions
async function connectAndFetchQuestions() {
  try {
    const client = await pool.connect(); // Get a client from the pool
    console.log('Connected to the database');

    const res = await client.query("SELECT * FROM capitals");
    quiz = res.rows;

    client.release(); // Release the client back to the pool
  } catch (err) {
    console.error("Error connecting to the database or executing query:", err.stack);
  }
}

// ... rest of your code remains the same


// Initialize Express application
const app = express();
const port = 3000;

let totalCorrect = 0;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentQuestion = {};

// Fetch quiz questions from the database on server start
connectAndFetchQuestions();

// GET home page
app.get("/", async (req, res) => {
  totalCorrect = 0; // Reset score for new game
  await nextQuestion();
  console.log(currentQuestion); // Log current question for debugging
  res.render("index.ejs", { question: currentQuestion });
});

// POST a new answer submission
app.post("/submit", async (req, res) => {
  let answer = req.body.answer.trim();
  let isCorrect = false;

  if (currentQuestion.capital.toLowerCase() === answer.toLowerCase()) {
    totalCorrect++;
    console.log("Total correct answers:", totalCorrect);
    isCorrect = true;
  }

  await nextQuestion();
  res.render("index.ejs", {
    question: currentQuestion,
    wasCorrect: isCorrect,
    totalScore: totalCorrect,
  });
});

// Function to set the next question randomly from the quiz
async function nextQuestion() {
  if (quiz.length === 0) {
    console.error("Quiz is empty. Please check the database.");
    return;
  }
  const randomCountry = quiz[Math.floor(Math.random() * quiz.length)];
  currentQuestion = randomCountry;
}

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
