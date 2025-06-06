// Inputs e outputs
const videoURLInput = document.getElementById('input-video-url');
const summaryText = document.getElementById('summary-text');

// Containers
const form = document.getElementById('form');
const summaryContainer = document.getElementById('summary-container');
const loadingDiv = document.querySelector('.loader-container');

// Butões
const submitButton = document.getElementById('btn-submit');
const btnCopy = document.getElementById('btn-copy');
const btnDownload = document.getElementById('btn-download');
const btnUpFont = document.getElementById('btn-up');
const btnDownFont = document.getElementById('btn-down');
const btnToTop = document.getElementById('btn-top');

// Variáveis de controle
let summary = '';
let title = '';
let errorControl = false;
let fetchControl = false;
let errorCount = 0;

const retryFetch = async (url, options, maxRetries = 3) => {
  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return response;
    } catch (error) {
      lastError = error;
      const delay = Math.min(1000 * Math.pow(2, attempt), 3000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};

// Funções
const getSummary = async (videoURL, promptType) => {
  if (fetchControl) return;
  if (errorCount >= 3) {
    errorHandler(
      'Muitas tentativas de requisição. Por favor, tente novamente mais tarde.',
    );
    return;
  }
  fetchControl = true;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30 segundos

  try {
    summary = '';
    title = '';
    summaryText.innerHTML = '';

    submitButton.disabled = true;
    submitButton.textContent = 'Carregando...';
    if (summaryContainer.classList.contains('active')) {
      summaryContainer.classList.remove('active');
    }
    loadingDiv.classList.add('active');
    const response = await retryFetch('/api/summarizer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoURL, promptType }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) {
      throw new Error('Erro ao processar a resposta do servidor.');
    }

    try {
      const json = await response.json();
      if (!json.status) {
        throw new Error(json.error);
      }

      summaryContainer.classList.add('active');
      summary = json.data.text;
      title = json.data.title;
      errorCount = 0;
      return json.data;
    } catch (err) {
      throw new Error('Erro ao processar a resposta do servidor.');
    }
  } catch (error) {
    console.error(error.message);
    errorCount++;
    if (error.name === 'AbortError') {
      errorHandler('O tempo da requisição expirou.');
    } else {
      errorHandler(error.message);
    }
    return null;
  } finally {
    loadingDiv.classList.remove('active');
    submitButton.disabled = false;
    submitButton.textContent = 'Resumir';
    fetchControl = false;
  }
};

function downloadMarkdown() {
  if (summaryText.textContent.length === 0) {
    alert('Não há texto para baixar.');
    return;
  }
  btnDownload.disabled = true;

  // Cria um blob com o conteúdo em formato Markdown
  const blob = new Blob([summary], { type: 'text/markdown' });

  // Cria um link temporário para download
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  title = title.replace(/[\/\\?%*:|"<>]/g, '_');
  link.download = `${title}.md`;

  // Adiciona o link ao corpo, clica nele e remove em seguida
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Revoga a URL do objeto para liberar recursos
  URL.revokeObjectURL(link.href);

  alert('Texto baixado com sucesso!');
  setTimeout(() => {
    btnDownload.disabled = false;
  }, 3000);
}

async function formHandler(event) {
  event.preventDefault();
  const videoURL = videoURLInput.value.trim();
  if (
    !videoURL ||
    videoURL.length === 0 ||
    !/^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)[\w\-]{11}(\?[\S]*)?$/.test(
      videoURL,
    )
  ) {
    errorHandler('Por favor, coloque uma URL de video do Youtube válida.');
    return;
  }
  const selectedOption = form.querySelector('input[type="radio"]:checked');
  let promptType;
  if (selectedOption) {
    switch (selectedOption.id) {
      case 'form-summary':
        promptType = 'summarize';
        break;
      case 'form-analysis':
        promptType = 'analysis';
        break;
      case 'form-transcript':
        promptType = 'transcript';
        break;
      default:
        promptType = 'summarize';
        break;
    }
  } else {
    promptType = 'summarize';
  }

  const summary = await getSummary(videoURL, promptType);
  if (!summary || !summaryText) {
    return;
  }
  summaryText.innerHTML = summary.html;
}

function increseFontSize() {
  if (btnDownFont.disabled) {
    btnDownFont.disabled = false;
  }
  if (summaryText.textContent.length === 0) {
    errorHandler('Não há texto para aumentar o tamanho da fonte.');
    return;
  }
  const currentFontSize = parseFloat(
    getComputedStyle(summaryContainer).fontSize,
  );
  if (currentFontSize >= 24) {
    alert('O tamanho da fonte já está no máximo.');
    btnUpFont.disabled = true;
    return;
  }
  const newFontSize = currentFontSize + 1;

  summaryContainer.style.setProperty('--font-size', `${newFontSize}px`);
  if (currentFontSize + 1 >= 24) {
    btnUpFont.disabled = true;
  }
}

function decreaseFontSize() {
  if (btnUpFont.disabled) {
    btnUpFont.disabled = false;
  }
  if (summaryText.textContent.length === 0) {
    errorHandler('Não há texto para diminuir o tamanho da fonte.');
    return;
  }

  const currentFontSize = parseFloat(
    getComputedStyle(summaryContainer).fontSize,
  );
  if (currentFontSize <= 12) {
    alert('O tamanho da fonte já está no minimo.');
    btnDownFont.disabled = true;
    return;
  }

  summaryContainer.style.setProperty('--font-size', `${currentFontSize - 1}px`);
  if (currentFontSize - 1 === 12) {
    btnDownFont.disabled = true;
  }
}

function copyToClipboard() {
  if (summaryText.textContent.length === 0) {
    errorHandler('Não há texto para copiar.');
    return;
  }
  btnCopy.disabled = true;

  const textToCopy = summaryText.textContent;
  if (!navigator.clipboard) {
    alert(
      'A cópia para a área de transferência não é suportada neste navegador.',
    );
    return;
  }
  navigator.clipboard
    .writeText(textToCopy)
    .then(() => {
      alert('Texto copiado para a área de transferência!');
    })
    .catch((error) => {
      console.error('Erro ao copiar texto:', error);
    })
    .finally(() => {
      btnCopy.disabled = false;
    });
}

function errorHandler(error) {
  if (errorControl) {
    return;
  }
  errorControl = true;
  let errorDiv = document.querySelector('.error-container');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.setAttribute('role', 'alert');
    errorDiv.classList.add('error-container');
    document.body.appendChild(errorDiv);
  }
  errorDiv.textContent = error;

  const timerIn = setTimeout(() => {
    errorDiv.classList.add('hide');
    const timerOut = setTimeout(() => {
      errorDiv.remove();
      errorControl = false;
      clearTimeout(timerOut);
    }, 500);
    clearTimeout(timerIn);
  }, 3200);
}

// Event Listeners
form.addEventListener('submit', async (event) => {
  await formHandler(event);
});
btnCopy.addEventListener('click', copyToClipboard);
btnUpFont.addEventListener('click', increseFontSize);
btnDownFont.addEventListener('click', decreaseFontSize);
btnDownload.addEventListener('click', downloadMarkdown);
btnToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
window.addEventListener('scroll', () => {
  if (window.scrollY > 120) {
    btnToTop.classList.add('active');
  } else {
    btnToTop.classList.remove('active');
  }
});

// Estilização do strong

document.querySelectorAll('#summary-container li').forEach((li) => {
  if (
    li.querySelector('strong') &&
    (li.querySelector('ul') || li.querySelector('ol'))
  ) {
    li.classList.add('has-sublist-title');
  }
});
