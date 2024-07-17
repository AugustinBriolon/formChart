
document.addEventListener('DOMContentLoaded', () => {

  let currentQuestionIndex = 0;
  let selectedOptions = [];
  let data;

  fetch('./data.json')
    .then(response => response.json())
    .then(json => {
      data = json;
      displayQuestion();
    });

  function displayQuestion() {
    const questionnaire = document.getElementById('questionnaire');
    questionnaire.innerHTML = '';

    const question = data.questions[currentQuestionIndex];
    const questionTitle = document.createElement('h2');
    questionTitle.innerText = question.question;
    questionnaire.appendChild(questionTitle);

    question.options.forEach(option => {
      const optionContainer = document.createElement('div');
      const optionInput = document.createElement('input');
      optionInput.type = 'radio';
      optionInput.name = 'option';
      optionInput.value = option.text;
      optionInput.checked = selectedOptions[currentQuestionIndex]?.text === option.text;
      optionContainer.appendChild(optionInput);

      const optionLabel = document.createElement('label');
      optionLabel.innerText = option.text;
      optionContainer.appendChild(optionLabel);

      questionnaire.appendChild(optionContainer);

      optionInput.addEventListener('change', () => {
        selectedOptions[currentQuestionIndex] = option;
      });
    });

    const buttonContainer = document.createElement('div');

    if (currentQuestionIndex > 0) {
      const backButton = document.createElement('button');
      backButton.innerText = 'Retour';
      backButton.addEventListener('click', handleBack);
      buttonContainer.appendChild(backButton);
    }

    const nextButton = document.createElement('button');
    nextButton.innerText = currentQuestionIndex < data.questions.length - 1 ? 'Suivant' : 'Soumettre';
    nextButton.addEventListener('click', handleNext);
    buttonContainer.appendChild(nextButton);

    questionnaire.appendChild(buttonContainer);
  }

  function handleNext() {
    if (!selectedOptions[currentQuestionIndex]) {
      alert('Veuillez sélectionner une option avant de continuer.');
      return;
    }

    if (currentQuestionIndex < data.questions.length - 1) {
      currentQuestionIndex++;
      displayQuestion();
    } else {
      calculateResults();
    }
  }

  function handleBack() {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      displayQuestion();
    }
  }

  function calculateResults() {
    const scores = data.options.reduce((acc, option) => {
      acc[option] = 0;
      return acc;
    }, {});

    selectedOptions.forEach(answer => {
      for (const [option, weight] of Object.entries(answer.weights)) {
        scores[option] += weight;
      }
    });

    const totalScores = Object.values(scores).reduce((acc, score) => acc + score, 0);
    const percentages = data.options.map(option => ({
      label: option,
      percentage: (scores[option] / totalScores) * 100
    }));

    displayGraph(percentages);
  }

  function displayGraph(results) {
    const graph = document.getElementById('graph');
    graph.innerHTML = '<canvas id="resultsChart"></canvas>';

    const ctx = document.getElementById('resultsChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: results.map(result => result.label),
        datasets: [{
          label: 'Pourcentage',
          data: results.map(result => result.percentage),
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
});
