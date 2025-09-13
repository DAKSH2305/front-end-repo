//const { time } = require("console");

document.addEventListener("DOMContentLoaded", function () {
    const username = document.getElementById("userName");
    const questioncount = document.getElementById("questionCount");
    const questionTimer = document.getElementById("questionTimer");
    const question = document.getElementById("question");
    const quizOptions = document.getElementById("quizOptions");
    const finalscore = document.querySelector(".finalScore");
    const resultUserName = document.getElementById("resultUserName");
    const nextbtn = document.getElementById("nextButton");
    // HTML has .container (start card) and .containerplayground (quiz)
    const startCard = document.querySelector(".container");              // was .startScreen (null)
    const quizContainer = document.querySelector(".containerplayground");
    const startbtn = document.querySelector(".startquiz");


    //disabling options 
    function disableAllOptions() {
        quizOptions.querySelectorAll('li').forEach(li => {
            li.style.pointerEvents = "none";
            li.classList.add('disabled');
        });
    }
    function revealCorrect() {
        const currentQ = questions[currentQuestionIndex];
        const correct = decodeURIComponent(currentQ.correct_answer).trim();
        quizOptions.querySelectorAll("li").forEach(li => {
            if (li.innerText.trim() === correct) {
                li.classList.add("correct");
            }
        });

    }

    // select option logic
    let score = 0;

    function selectOption(selectedLi, correctAnswer) {
        stopTimer();                   // stop countdown
        disableAllOptions();           // prevent further clicks

        const picked = selectedLi.innerText.trim();
        const correct = correctAnswer.trim();

        if (picked === correct) {
            selectedLi.classList.add("correct");
            score += 1;
        } else {
            selectedLi.classList.add("wrong");
            // also highlight the correct one
            quizOptions.querySelectorAll("li").forEach(li => {
                if (li.innerText.trim() === correct) li.classList.add("correct");
            });
        }

        // enable next
        const nextBtn = document.getElementById('nextButton');
        nextBtn.disabled = false;
        nextBtn.style.opacity = "1";
    }



    // setting up a timer 
    let timeLeft = 10;
    let timerId = null;
    function starttimer() {
        if (timerId) {
            clearInterval(timerId);
            timerId = null;

        }
        timeLeft = 10;
        questionTimer.innerText = timeLeft;

        timerId = setInterval(() => {
            timeLeft--;
            questionTimer.innerText = Math.max(timeLeft, 0);
            if (timeLeft <= 0) {
                clearInterval(timerId);
                timerId = null;

                // time over , now options will be disabled and correct answer will be revealed.
                disableAllOptions();
                revealCorrect();




                // now next button will be enabled
                // now next question will appear and options are enabled;
                nextbtn.disabled = false;
                nextbtn.style.opacity = "1";
            }
        }, 1000);
    }
    function stopTimer() {
        if (timerId) {
            clearInterval(timerId);
            timerId = null
        }
    }






    // Safe guards (optional)
    if (!startbtn || !startCard || !quizContainer) {
        console.error("Required elements not found");
        return;
    }


    let questions = [];
    let currentQuestionIndex = 0;

    function shuffleArray(arr) {
        return arr.sort(() => Math.random() - 0.5);
    }

   

    function loadQuestions() {
        const currentQ = questions[currentQuestionIndex];
        question.innerText = decodeURIComponent(currentQ.question);
        quizOptions.innerHTML = "";
        let options = [...currentQ.incorrect_answers, currentQ.correct_answer];
        options = shuffleArray(options);
        options.forEach((opt) => {
            const li = document.createElement("li");
            li.innerText = decodeURIComponent(opt);
            li.addEventListener("click", () =>
                selectOption(li, decodeURIComponent(currentQ.correct_answer))
            );
            quizOptions.appendChild(li);
        });
        questioncount.innerText = currentQuestionIndex + 1;
        starttimer();


    }
    // fetching api
    let url = "https://opentdb.com/api.php?amount=5&category=18&encode=url3986";
    async function fetchQuestion() {
        const res = await fetch(url);
        const data = await res.json();
        questions = data.results;
        loadQuestions();
    }

    startbtn.addEventListener("click", function () {
        if (username.value.trim() === "") {
            alert("please enter the name!!");
            return;
        }
        // Hide start card, show quiz
        startCard.style.display = "none";
        quizContainer.style.display = "block";
        fetchQuestion();
    });
});
