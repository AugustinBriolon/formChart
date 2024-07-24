document.addEventListener('DOMContentLoaded', () => {
  let currentQuestionIndex = 0;
  let selectedOptions = [];
  let data;
  let chartInstance;

  fetch('data.json')
    .then(response => response.json())
    .then(json => {
      data = json;
      displayQuestion();
    })
    .catch(error => console.error('Error loading data:', error));

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
      if (selectedOptions[currentQuestionIndex] && selectedOptions[currentQuestionIndex].text === option.text) {
        optionInput.checked = true;
      }
      optionContainer.appendChild(optionInput);

      const optionLabel = document.createElement('label');
      optionLabel.innerText = option.text;
      optionContainer.appendChild(optionLabel);

      questionnaire.appendChild(optionContainer);

      optionInput.addEventListener('change', () => {
        selectedOptions[currentQuestionIndex] = option;
      });
    });

    const buttonsContainer = document.createElement('div');

    if (currentQuestionIndex > 0) {
      const backButton = document.createElement('button');
      backButton.innerText = 'Back';
      backButton.addEventListener('click', () => {
        currentQuestionIndex--;
        displayQuestion();
      });
      buttonsContainer.appendChild(backButton);
    }

    const nextButton = document.createElement('button');
    nextButton.innerText = currentQuestionIndex < data.questions.length - 1 ? 'Next' : 'Submit';
    nextButton.addEventListener('click', () => {
      if (selectedOptions[currentQuestionIndex]) {
        if (currentQuestionIndex < data.questions.length - 1) {
          currentQuestionIndex++;
          displayQuestion();
        } else {
          calculateResults();
        }
      } else {
        alert('Please select an option before proceeding.');
      }
    });

    buttonsContainer.appendChild(nextButton);
    questionnaire.appendChild(buttonsContainer);
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
    if (chartInstance) {
      chartInstance.destroy();
    }
    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: results.map(result => result.label),
        datasets: [{
          label: 'Percentage',
          data: results.map(result => result.percentage),
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',  // This makes the bar chart horizontal
        scales: {
          x: {
            beginAtZero: true
          }
        }
      }
    });

    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.style.display = 'block';
    downloadBtn.addEventListener('click', () => downloadPDF(results));
  }

  function downloadPDF(results) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add the logo
    const logoImg = new Image();
    logoImg.src = './2BRH.png'; // Assurez-vous que le chemin de l'image est correct
    logoImg.onload = () => {
      doc.addImage(logoImg, 'PNG', 10, 10, 50, 20);
      addContentToPDF(doc, results);
    };
  }

  function addContentToPDF(doc, results) {
    let yPosition = 40;

    // Add questions and answers
    data.questions.forEach((question, index) => {
      doc.text(10, yPosition, `Q${index + 1}: ${question.question}`);
      yPosition += 10;
      doc.text(20, yPosition, `A: ${selectedOptions[index].text}`);
      yPosition += 10;
    });

    // Add the chart image
    const chartCanvas = document.getElementById('resultsChart');
    const chartImg = chartCanvas.toDataURL('image/png');
    doc.addImage(chartImg, 'PNG', 10, yPosition, 180, 100);

    // Save the PDF
    doc.save('results.pdf');
  }
});
