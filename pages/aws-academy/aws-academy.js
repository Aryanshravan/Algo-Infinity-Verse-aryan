/* global checkAnswer, removeService */

const curriculum = window.awsCurriculum;
const labGuides = window.awsLabGuides;

let activeModule = 0;
let activeLesson = 0;
let userProgress = JSON.parse(localStorage.getItem('awsHubProgress')) || {
  completedLessons: [],
  completedQuizzes: [],
};

let deployedServices = [];
let serviceCounter = 1;

const DOM = {
  sidebarContent: document.getElementById('sidebar-content'),
  lessonContent: document.getElementById('lesson-content'),
  quizContent: document.getElementById('quiz-content'),
  labContent: document.getElementById('lab-content'),
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  progressBar: document.getElementById('progress-bar'),
  progressText: document.getElementById('progress-text'),
  mobileMenuBtn: document.getElementById('mobile-menu-btn'),
  sidebar: document.getElementById('sidebar'),
  sidebarOverlay: document.getElementById('sidebar-overlay'),
  addServiceBtns: document.querySelectorAll('.add-service-btn'),
  clearCanvasBtn: document.getElementById('clear-canvas-btn'),
  architectureCanvas: document.getElementById('architecture-canvas'),
  canvasEmptyState: document.getElementById('canvas-empty-state'),
  totalCost: document.getElementById('total-cost'),
  iacOutput: document.getElementById('iac-output'),
};

function init() {
  renderSidebar();
  loadLesson(activeModule, activeLesson);
  updateProgress();
  setupEventListeners();
  updateArchitectureUI();
}

function setupEventListeners() {
  DOM.tabBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const tab = e.target.closest('button').dataset.tab;
      switchTab(tab);
      if (tab === 'lab') loadLabGuide(activeModule);
    });
  });

  DOM.mobileMenuBtn.addEventListener('click', toggleSidebar);
  DOM.sidebarOverlay.addEventListener('click', toggleSidebar);

  DOM.addServiceBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const el = e.target.closest('button');
      addService(el.dataset.type, parseFloat(el.dataset.cost), el.dataset.icon);
    });
  });

  DOM.clearCanvasBtn.addEventListener('click', () => {
    deployedServices = [];
    serviceCounter = 1;
    updateArchitectureUI();
  });

  DOM.sidebarContent.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-module]');
    if (btn) {
      loadLesson(parseInt(btn.dataset.module), parseInt(btn.dataset.lesson));
    }
  });

  document.addEventListener('click', (e) => {
    const qBtn = e.target.closest('button[data-quiz-id]');
    if (qBtn) {
      checkAnswer(qBtn.dataset.quizId, parseInt(qBtn.dataset.module), parseInt(qBtn.dataset.option));
    }
  });

  document.addEventListener('click', (e) => {
    const sBtn = e.target.closest('button[data-service-id]');
    if (sBtn) {
      removeService(sBtn.dataset.serviceId);
    }
  });
}

function toggleSidebar() {
  const closed = DOM.sidebar.classList.contains('-translate-x-full');
  DOM.sidebar.classList.toggle('-translate-x-full', !closed);
  DOM.sidebarOverlay.classList.toggle('hidden', !closed);
}

function switchTab(tabId) {
  DOM.tabBtns.forEach((btn) => {
    const active = btn.dataset.tab === tabId;
    btn.classList.toggle('active', active);
    btn.classList.toggle('border-orange-500', active);
    btn.classList.toggle('text-orange-600', active);
    btn.classList.toggle('text-gray-500', !active);
    btn.classList.toggle('border-transparent', !active);
  });

  DOM.tabPanes.forEach((pane) => {
    if (pane.id === `${tabId}-tab`) {
      pane.classList.remove('hidden');
      pane.classList.add(tabId === 'simulator' ? 'flex' : 'block');
    } else {
      pane.classList.add('hidden');
      pane.classList.remove('block', 'flex');
    }
  });
}

function renderSidebar() {
  let html = '';
  curriculum.forEach((mod, mIndex) => {
    html += `
      <div class="sidebar-module">
        <h3 class="sidebar-module-title">${mod.title}</h3>
        <ul class="space-y-1">`;
    mod.lessons.forEach((lesson, lIndex) => {
      const completed = userProgress.completedLessons.includes(lesson.id);
      const active = mIndex === activeModule && lIndex === activeLesson;
      html += `
        <li>
          <button class="w-full text-left sidebar-lesson ${active ? 'active' : ''}"
                  data-module="${mIndex}" data-lesson="${lIndex}">
            <i class="${completed ? 'fas fa-check-circle text-orange-500' : 'far fa-circle text-gray-400'} mr-2 w-4"></i>
            ${lesson.title}
          </button>
        </li>`;
    });
    html += `</ul></div>`;
  });
  DOM.sidebarContent.innerHTML = html;
}

function loadLesson(mIndex, lIndex) {
  activeModule = mIndex;
  activeLesson = lIndex;
  const lesson = curriculum[mIndex].lessons[lIndex];

  if (!userProgress.completedLessons.includes(lesson.id)) {
    markLessonComplete(lesson.id);
  }

  const eli5 = window.eli5Toggle;
  const simpleContent = window.eli5AwsData && lesson.id ? (window.eli5AwsData[lesson.id] || '') : '';
  DOM.lessonContent.innerHTML = eli5 ? eli5.wrapContent(lesson.content, simpleContent) : lesson.content;

  const oldToggle = DOM.lessonContent.querySelector('.eli5-toggle');
  if (oldToggle) oldToggle.remove();

  if (eli5) eli5.initToggle('aws', DOM.lessonContent);

  window.copyCode.init(DOM.lessonContent);
  renderQuiz(mIndex);
  loadLabGuide(mIndex);
  renderSidebar();

  if (window.innerWidth < 768 && !DOM.sidebar.classList.contains('-translate-x-full')) {
    toggleSidebar();
  }
}

function renderQuiz(mIndex) {
  const quiz = curriculum[mIndex].quiz;
  let html = '<h2 class="text-2xl font-bold mb-6 text-gray-800">Module Knowledge Check</h2>';

  if (!quiz || quiz.length === 0) {
    DOM.quizContent.innerHTML = html + '<p>No quiz for this module.</p>';
    return;
  }

  quiz.forEach((q, i) => {
    html += `
      <div class="mb-8 p-6 bg-orange-50 rounded-lg border border-orange-100 quiz-question" id="q-container-${q.id}">
        <p class="font-semibold text-lg text-gray-800 mb-4">${i + 1}. ${q.question}</p>
        <div class="space-y-2">`;
    q.options.forEach((opt, oIndex) => {
      html += `
        <label class="flex items-center p-3 bg-white border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition-colors">
          <input type="radio" name="quiz-${q.id}" value="${oIndex}" class="mr-3 w-4 h-4 text-orange-500">
          <span class="text-gray-700">${opt}</span>
        </label>`;
    });
    html += `
        </div>
        <button data-quiz-id="${q.id}" data-module="${mIndex}" data-option="${i}" class="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors">Submit Answer</button>
        <div id="q-feedback-${q.id}" class="mt-3 hidden text-sm font-medium"></div>
      </div>`;
  });

  DOM.quizContent.innerHTML = html;
}

window.checkAnswer = function (qId, mIndex, qIndex) {
  const selected = document.querySelector(`input[name="quiz-${qId}"]:checked`);
  const feedback = document.getElementById(`q-feedback-${qId}`);
  const container = document.getElementById(`q-container-${qId}`);

  if (!selected) {
    feedback.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i> Please select an answer.';
    feedback.className = 'mt-3 text-sm font-medium text-amber-600 block';
    return;
  }

  const correctAns = curriculum[mIndex].quiz[qIndex].correct;

  if (parseInt(selected.value) === correctAns) {
    feedback.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Correct! Great job.';
    feedback.className = 'mt-3 text-sm font-medium text-orange-600 block';
    container.classList.replace('bg-orange-50', 'bg-green-50');
    container.classList.replace('border-orange-100', 'border-green-200');

    if (!userProgress.completedQuizzes.includes(qId)) {
      userProgress.completedQuizzes.push(qId);
      saveProgress();
    }
  } else {
    feedback.innerHTML = '<i class="fas fa-times-circle mr-1"></i> Incorrect. Try again.';
    feedback.className = 'mt-3 text-sm font-medium text-red-600 block';
  }
};

function markLessonComplete(lessonId) {
  if (!userProgress.completedLessons.includes(lessonId)) {
    userProgress.completedLessons.push(lessonId);
    saveProgress();
  }
}

function saveProgress() {
  localStorage.setItem('awsHubProgress', JSON.stringify(userProgress));
  updateProgress();
}

function updateProgress() {
  let totalItems = 0;
  curriculum.forEach((m) => {
    totalItems += m.lessons.length;
    if (m.quiz) totalItems += m.quiz.length;
  });
  const completed = userProgress.completedLessons.length + userProgress.completedQuizzes.length;
  const pct = totalItems > 0 ? Math.round((completed / totalItems) * 100) : 0;
  DOM.progressBar.style.width = `${pct}%`;
  DOM.progressText.textContent = `${pct}%`;
}

/* Lab Guide */
function loadLabGuide(mIndex) {
  const guide = labGuides[mIndex];
  if (!guide) {
    DOM.labContent.innerHTML = '<p class="text-gray-500">No lab guide available for this module.</p>';
    return;
  }

  let html = `
    <h2 class="text-2xl font-bold mb-2 text-gray-800">${guide.title}</h2>
    <p class="text-gray-600 mb-6">${guide.description}</p>
    <h3 class="text-lg font-semibold text-gray-700 mb-3"><i class="fas fa-bullseye text-orange-500 mr-2"></i>Lab Objectives</h3>
    <ul class="list-disc ml-6 mb-6 text-gray-600 space-y-1">`;
  guide.objectives.forEach((o) => { html += `<li>${o}</li>`; });
  html += `</ul>
    <h3 class="text-lg font-semibold text-gray-700 mb-3"><i class="fas fa-list-ol text-orange-500 mr-2"></i>Step-by-Step Instructions</h3>
    <ol class="list-decimal ml-6 mb-6 text-gray-600 space-y-2">`;
  guide.steps.forEach((s) => { html += `<li>${s}</li>`; });
  html += `</ol>
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <h3 class="font-semibold text-yellow-800 mb-2"><i class="fas fa-lightbulb mr-2"></i>CloudFormation / CDK Template</h3>
      <pre class="text-sm text-gray-700 bg-white p-3 rounded border border-yellow-100 overflow-x-auto">${guide.template}</pre>
    </div>
    <h3 class="text-lg font-semibold text-gray-700 mb-3"><i class="fas fa-clipboard-check text-orange-500 mr-2"></i>Validation Checklist</h3>
    <ul class="list-none ml-2 space-y-2">`;
  guide.validation.forEach((v) => { html += `<li><i class="far fa-square text-gray-400 mr-2"></i>${v}</li>`; });
  html += `</ul>`;

  DOM.labContent.innerHTML = html;
}

/* Simulator Engine */
function addService(type, cost, icon) {
  const id = `${type.toLowerCase()}-${serviceCounter++}`;
  deployedServices.push({ id, type, cost, icon });
  updateArchitectureUI();
}

window.removeService = function (id) {
  deployedServices = deployedServices.filter((s) => s.id !== id);
  updateArchitectureUI();
};

function updateArchitectureUI() {
  renderCanvas();
  updateEstimator();
  generateIaC();
}

function renderCanvas() {
  DOM.architectureCanvas.querySelectorAll('.service-node').forEach((n) => n.remove());
  if (deployedServices.length === 0) {
    DOM.canvasEmptyState.classList.remove('hidden');
    return;
  }
  DOM.canvasEmptyState.classList.add('hidden');
  deployedServices.forEach((srv) => {
    const node = document.createElement('div');
    node.className = `service-node service-${srv.type.toLowerCase()}`;
    node.innerHTML = `
      <div class="icon-container"><i class="fas ${srv.icon}"></i></div>
      <div class="details">
        <div class="name">${srv.type} Instance</div>
        <div class="cost">$${srv.cost.toFixed(2)}/mo</div>
      </div>
      <button class="remove-btn" data-service-id="${srv.id}" title="Remove Service"><i class="fas fa-times"></i></button>`;
    DOM.architectureCanvas.appendChild(node);
  });
}

function updateEstimator() {
  const total = deployedServices.reduce((sum, s) => sum + s.cost, 0);
  let start = null;
  const duration = 500;
  const startVal = parseFloat(DOM.totalCost.textContent);
  function step(ts) {
    if (!start) start = ts;
    const p = Math.min((ts - start) / duration, 1);
    DOM.totalCost.textContent = (startVal + (total - startVal) * p).toFixed(2);
    if (p < 1) window.requestAnimationFrame(step);
  }
  window.requestAnimationFrame(step);
}

const RESOURCE_MAP = {
  EC2: 'AWS::EC2::Instance',
  S3: 'AWS::S3::Bucket',
  RDS: 'AWS::RDS::DBInstance',
  Lambda: 'AWS::Lambda::Function',
  APIGateway: 'AWS::ApiGateway::RestApi',
  DynamoDB: 'AWS::DynamoDB::Table',
  ECS: 'AWS::ECS::Service',
  CloudFront: 'AWS::CloudFront::Distribution',
  Kinesis: 'AWS::Kinesis::Stream',
};

const PROP_MAP = {
  EC2: { InstanceType: 't3.micro', ImageId: 'ami-0abcdef1234567890' },
  S3: { AccessControl: 'Private' },
  RDS: { DBInstanceClass: 'db.t3.micro', Engine: 'mysql' },
  Lambda: { Runtime: 'nodejs18.x', Handler: 'index.handler' },
  APIGateway: { Name: 'MyAPI', EndpointConfiguration: 'REGIONAL' },
  DynamoDB: { BillingMode: 'PAY_PER_REQUEST', AttributeDefinitions: [{ AttributeName: 'PK', AttributeType: 'S' }], KeySchema: [{ AttributeName: 'PK', KeyType: 'HASH' }] },
  ECS: { LaunchType: 'FARGATE', DesiredCount: 2 },
  CloudFront: { Enabled: true, DefaultCacheBehavior: { TargetOriginId: 'myOrigin', ViewerProtocolPolicy: 'redirect-to-https' } },
  Kinesis: { ShardCount: 2, RetentionPeriodHours: 24 },
};

function generateIaC() {
  if (deployedServices.length === 0) {
    DOM.iacOutput.innerHTML = '<span class="text-gray-400 italic">// Add services to generate IaC...</span>';
    return;
  }
  const resources = {};
  deployedServices.forEach((srv) => {
    const type = RESOURCE_MAP[srv.type] || 'AWS::Custom::Resource';
    const idx = srv.id.split('-')[1];
    resources[`${srv.type}Resource_${idx}`] = {
      Type: type,
      Properties: PROP_MAP[srv.type] || {},
    };
  });
  const tmpl = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'Auto-generated template from AWS Academy Simulator',
    Resources: resources,
  };
  const json = JSON.stringify(tmpl, null, 2);
  DOM.iacOutput.innerHTML = json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (m) => {
      let c = 'text-blue-600';
      if (/^"/.test(m)) c = /:$/.test(m) ? 'text-gray-800 font-semibold' : 'text-green-700';
      return '<span class="' + c + '">' + m + '</span>';
    }
  );
}

document.addEventListener('DOMContentLoaded', init);
