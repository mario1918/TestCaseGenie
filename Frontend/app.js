// Theme Configuration
const THEME_KEY = 'preferred-theme';
const THEME_LIGHT = 'light';
const THEME_DARK = 'dark';

// Conversation history for maintaining context between test case generations
let conversationHistory = [];

// Pagination
let currentStartAt = 0;
const MAX_RESULTS = 50; // Default number of results per page

// Initialize theme from localStorage or system preference
function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = savedTheme || (prefersDark ? THEME_DARK : THEME_LIGHT);
  
  setTheme(theme);
  updateThemeButton(theme);
  return theme;
}

// Set the theme
function setTheme(theme) {
  document.documentElement.setAttribute('data-bs-theme', theme);
  const themeStylesheet = document.getElementById('theme-stylesheet');
  if (theme === THEME_DARK) {
    themeStylesheet.media = 'all';
  } else {
    themeStylesheet.media = 'not all';
  }
  localStorage.setItem(THEME_KEY, theme);
}

// Update the theme toggle button icon
function updateThemeButton(theme) {
  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;
  
  const moonIcon = themeToggle.querySelector('.bi-moon-fill');
  const sunIcon = themeToggle.querySelector('.bi-sun-fill');
  
  if (theme === THEME_DARK) {
    moonIcon.classList.remove('d-none');
    sunIcon.classList.add('d-none');
    themeToggle.title = 'Switch to light theme';
  } else {
    moonIcon.classList.add('d-none');
    sunIcon.classList.remove('d-none');
    themeToggle.title = 'Switch to dark theme';
  }
}

// Toggle between light and dark theme
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-bs-theme') || THEME_LIGHT;
  const newTheme = currentTheme === THEME_LIGHT ? THEME_DARK : THEME_LIGHT;
  setTheme(newTheme);
  updateThemeButton(newTheme);
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  
  // Add event listener to theme toggle button
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
});

// API Configuration
const JIRA_API_BASE_URL = 'http://localhost:8000/api/jira';
const JIRA_PROJECT_KEY = 'SE2';

// Initialize Bootstrap Toasts
const loadingToastEl = document.getElementById('loadingToast');
const successToastEl = document.getElementById('successToast');
const loadingToast = new bootstrap.Toast(loadingToastEl, { autohide: false });
const successToast = new bootstrap.Toast(successToastEl);

// Load Jira Components
async function loadJiraComponents() {
  const componentFilter = document.getElementById('componentFilter');
  const loadingOption = document.createElement('option');
  loadingOption.value = '';
  loadingOption.textContent = 'Loading components...';
  componentFilter.innerHTML = '';
  componentFilter.appendChild(loadingOption);

  try {
    const response = await fetch(`${JIRA_API_BASE_URL}/components?project_key=${JIRA_PROJECT_KEY}`);
    if (!response.ok) throw new Error('Failed to load components');
    
    const components = await response.json();
    componentFilter.innerHTML = '<option value="">Component</option>';
    
    components.forEach(component => {
      if (component.name) {
        const option = document.createElement('option');
        option.value = component.name;
        option.textContent = component.name;
        componentFilter.appendChild(option);
      }
    });
  } catch (error) {
    console.error('Error loading Jira components:', error);
    componentFilter.innerHTML = '<option value="">Error loading components</option>';
  }
}

// Load Jira Boards
async function loadJiraBoards() {
  const boardFilter = document.getElementById('boardFilter');
  if (!boardFilter) return;

  // Show loading state
  const defaultOption = boardFilter.querySelector('option[value=""]');
  if (defaultOption) {
    defaultOption.textContent = 'Loading boards...';
  }

  try {
    const response = await fetch('http://localhost:8000/api/jira/boards?project_key=SE2');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const boards = await response.json();
    
    // Clear existing options except the first one
    while (boardFilter.options.length > 1) {
      boardFilter.remove(1);
    }
    
    // Add boards to dropdown
    if (Array.isArray(boards)) {
      boards.forEach(board => {
        if (board.name) {
          const option = document.createElement('option');
          option.value = board.name;
          option.textContent = board.name;
          boardFilter.appendChild(option);
        }
      });
    }
    
    // Reset default option text
    if (defaultOption) {
      defaultOption.textContent = 'Board';
    }
  } catch (error) {
    console.error('Error loading boards:', error);
    if (defaultOption) {
      defaultOption.textContent = 'Error loading boards';
    }
  }
}

// Load Jira Sprints
async function loadJiraSprints() {
  const sprintFilter = document.getElementById('sprintFilter');
  if (!sprintFilter) return;

  // Show loading state
  const defaultOption = sprintFilter.querySelector('option[value=""]');
  if (defaultOption) {
    defaultOption.textContent = 'Loading sprints...';
  }

  try {
    const response = await fetch('http://localhost:8000/api/jira/sprints/ordered?board_id=942');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    // Clear existing options except the first one
    while (sprintFilter.options.length > 1) {
      sprintFilter.remove(1);
    }
    
    // Add sprints to dropdown
    if (data.sprints && Array.isArray(data.sprints)) {
      data.sprints.forEach(sprint => {
        const option = document.createElement('option');
        option.value = sprint.name;
        option.textContent = sprint.name;
        sprintFilter.appendChild(option);
      });
    }
    
    // Reset default option text
    if (defaultOption) {
      defaultOption.textContent = 'Sprint';
    }
  } catch (error) {
    console.error('Error loading sprints:', error);
    if (defaultOption) {
      defaultOption.textContent = 'Error loading sprints';
    }
  }
}

// Helper function to format status badge
function getStatusBadge(status) {
  const statusColors = {
    'to-do': '#BFC1C4',
    'open': '#CECFD2',
    'in progress': '#8FB8F6',
    'closed': '#B3DF72',
    'done': '#B3DF72',
    'resolved': '#B3DF72',
    'reopened': '#BFC1C4',
    'in qa': '#8FB8F6'
  };
  
  const normalizedStatus = status?.toLowerCase() || '';
  const bgColor = statusColors[normalizedStatus] || '#E9ECEF';
  
  return `<span class="badge" style="background-color: ${bgColor}; color: #000;">${status || 'N/A'}</span>`;
}

// Helper function to format issue type badge
function getIssueTypeBadge(issueType) {
  const issueTypeColors = {
    'story': '#82B536',
    'bug': '#E2483D',
    'new feature': '#82B536',
    'sub-task': '#4688EC',
    'subtask': '#4688EC',
    'test': '#8FB8F6',
    'epic': '#BF63F3',
    'task': '#669DF1'
  };
  
  const normalizedType = issueType?.toLowerCase() || '';
  const bgColor = issueTypeColors[normalizedType] || '#E9ECEF';
  
  return `<span class="badge" style="background-color: ${bgColor}; color: #fff;">${issueType || 'N/A'}</span>`;
}

// Helper function to format priority badge
function getPriorityBadge(priority) {
  const priorityColors = {
    'critical': '#E2483D',
    'highest': '#E2483D',
    'high': '#E2483D',
    'major': '#F68909',
    'medium': '#F68909',
    'minor': '#4688EC',
    'low': '#4688EC',
    'lowest': '#6C757D'
  };
  
  const normalizedPriority = priority?.toLowerCase() || '';
  const bgColor = priorityColors[normalizedPriority] || '#6C757D'; // Default gray
  
  return `<span class="badge" style="background-color: ${bgColor}; color: #fff;">${priority || 'N/A'}</span>`;
}

// Show error message to the user
function showError(message) {
  const errorDiv = document.getElementById('error');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('d-none');
    setTimeout(() => errorDiv.classList.add('d-none'), 5000);
  }
  console.error(message);
}

// Function to fetch Jira issues with current filters
async function fetchJiraIssues() {
  try {
    const issueType = document.getElementById('issueTypeFilter')?.value || '';
    const component = document.getElementById('componentFilter')?.value || '';
    const sprint = document.getElementById('sprintFilter')?.value || '';
    const jqlQuery = document.getElementById('jqlFilter')?.value.trim() || '';

    // Build query parameters
    const params = new URLSearchParams({
      project_key: JIRA_PROJECT_KEY,
      start_at: currentStartAt,
      max_results: MAX_RESULTS
    });

    // Add optional parameters if they exist
    if (issueType) params.append('issue_type', issueType);
    if (component) params.append('component', component);
    if (sprint) params.append('sprint', sprint);
    // If there's a JQL query, use it directly
    if (jqlQuery) {
      params.append('jql_filter', jqlQuery);
    } else {
      // Otherwise, build JQL from individual filters
      const jqlFilter = [];
      if (issueType) jqlFilter.push(`issuetype = "${issueType}"`);
      if (component) jqlFilter.push(`component = "${component}"`);
      if (sprint) jqlFilter.push(`sprint = "${sprint}"`);
      
      if (jqlFilter.length > 0) {
        params.append('jql_filter', jqlFilter.join(' AND '));
      }
    }

    const response = await fetch(`${JIRA_API_BASE_URL}/test-cases/paginated?${params}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching Jira issues:', error);
    showError(error.message || 'Failed to load issues. Please try again.');
    return { issues: [], total: 0 }; // Return empty result on error
  }
}

// Function to render issues in the table
function renderJiraIssues(issues) {
  const tbody = document.getElementById('jiraIssuesTableBody');
  const resultCount = document.getElementById('jiraIssuesCount');
  
  if (!issues || !issues.issues || issues.issues.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">No issues found</td></tr>';
    resultCount.textContent = '0 items';
    return;
  }

  // Update pagination controls
  totalResults = issues.total || 0;
  const startItem = currentStartAt + 1;
  const endItem = Math.min(currentStartAt + issues.issues.length, totalResults);
  resultCount.textContent = `${startItem}-${endItem} of ${totalResults} items`;
  
  // Enable/disable pagination buttons
  document.getElementById('prevJiraPage').disabled = currentStartAt === 0;
  document.getElementById('nextJiraPage').disabled = currentStartAt + MAX_RESULTS >= totalResults;

  // Clear existing rows
  tbody.innerHTML = '';

  // Add new rows
  issues.issues.forEach(issue => {
    const row = document.createElement('tr');
    
    // Truncate long text for better display
    const truncate = (text, maxLength = 100) => {
      if (!text) return '';
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    // Using globally defined badge functions

    // Store the full issue data in a data attribute
    row.setAttribute('data-issue', JSON.stringify(issue));
    
    row.innerHTML = `
      <td><a href="https://arrowecommerce.atlassian.net/browse/${issue.key}" target="_blank" class="text-decoration-none fw-semibold">${issue.key || 'N/A'}</a></td>
      <td class="fw-medium">${truncate(issue.summary, 50)}</td>
      <td class="text-muted">${truncate(issue.description, 100)}</td>
      <td>${getIssueTypeBadge(issue.issue_type)}</td>
      <td>${getStatusBadge(issue.status)}</td>
      <td>${getPriorityBadge(issue.priority)}</td>
      <td><span class="badge bg-light text-dark border">${issue.assignee || 'Unassigned'}</span></td>
      <td><span class="badge bg-light text-dark border">${issue.reporter || 'N/A'}</span></td>
      <td class="text-end">
        <button class="btn btn-sm btn-primary generate-btn d-flex align-items-center gap-2" data-bs-toggle="modal" data-bs-target="#issueDetailsModal" style="background: linear-gradient(90deg, #4f46e5, #7c3aed); border: none;">
          <i class="bi bi-magic"></i>
          <span>Generate</span>
        </button>
      </td>
    `;
    
    tbody.appendChild(row);
  });
}

// Function to load and display issues
async function loadJiraIssues() {
  const loadingToastJira = bootstrap.Toast.getOrCreateInstance(document.getElementById('loadingToastJira'));
  const toastBody = document.querySelector('#loadingToastJira .toast-body');
  
  try {
    // Show loading state
    toastBody.textContent = 'Please wait while we load your Jira issues...';
    loadingToastJira.show();
    
    console.log('Loading Jira issues...');
    const data = await fetchJiraIssues();
    console.log('Received Jira issues data:', data);
    
    if (data && data.issues) {
      console.log(`Rendering ${data.issues.length} Jira issues`);
      renderJiraIssues(data);
    } else {
      console.warn('No issues data received or invalid format:', data);
      renderJiraIssues({ issues: [], total: 0 });
    }
  } catch (error) {
    console.error('Error:', error);
    showError('An error occurred while loading issues.');
  } finally {
    loadingToastJira.hide();
  }
}

// Function to handle filter application
function applyFilters() {
  currentStartAt = 0; // Reset to first page when filters change
  loadJiraIssues();
}

// Function to clear all filters
function clearFilters() {
  document.getElementById('issueTypeFilter').value = 'Story';
  document.getElementById('componentFilter').value = '';
  document.getElementById('sprintFilter').value = '';
  document.getElementById('globalSearch').value = '';
  currentStartAt = 0;
  loadJiraIssues();
}

// Show issue details in modal
function showIssueDetails(issue) {
  const modal = document.getElementById('issueDetailsModal');
  const modalTitle = modal.querySelector('.modal-title');
  const modalBody = modal.querySelector('.modal-body');
  
  // Set modal title with issue key and summary
  modalTitle.innerHTML = `
    <div class="d-flex justify-content-between align-items-center w-100">
      <span>${issue.summary || 'No summary'}</span>
      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
  `;
  
  // Format the description with line breaks and preserve formatting
  const formatText = (text) => {
    if (!text) return 'No description provided';
    return text
      .replace(/\n{2,}/g, '<br><br>')  // Preserve double line breaks
      .replace(/\n/g, ' ');            // Convert single line breaks to spaces
  };
  
  const description = formatText(issue.description);
  
  // Create modal body content with all issue details
  // Format sprint name (if available)
  const sprintName = (issue.sprint && issue.sprint !== 'N/A') ? issue.sprint : 'No Sprint';
  
  modalBody.innerHTML = `
    <div class="row mb-3">
      <div class="col-md-6">
        <div class="mb-3">
          <h6 class="text-muted mb-1 small">Issue Key</h6>
          <div><span class="badge bg-primary">${issue.key}</span></div>
        </div>
        <div class="mb-3">
          <h6 class="text-muted mb-1 small">Sprint</h6>
          <div><span class="badge bg-info text-dark">${sprintName}</span></div>
        </div>
        <div class="mb-3">
          <h6 class="text-muted mb-1 small">Issue Type</h6>
          <div>${getIssueTypeBadge(issue.issue_type)}</div>
        </div>
        <div class="mb-3">
          <h6 class="text-muted mb-1 small">Status</h6>
          <div>${getStatusBadge(issue.status)}</div>
        </div>
        <div class="mb-3">
          <h6 class="text-muted mb-1 small">Priority</h6>
          <div>${getPriorityBadge(issue.priority)}</div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="mb-3">
          <h6 class="text-muted mb-1 small">Assignee</h6>
          <div>${issue.assignee ? `<span class="badge bg-light text-dark border">${issue.assignee}</span>` : '<span class="badge bg-light text-muted border">Unassigned</span>'}</div>
        </div>
        <div class="mb-3">
          <h6 class="text-muted mb-1 small">Reporter</h6>
          <div>${issue.reporter ? `<span class="badge bg-light text-dark border">${issue.reporter}</span>` : '<span class="badge bg-light text-muted border">N/A</span>'}</div>
        </div>
      </div>
    </div>
    <div class="mb-3">
      <h6 class="text-muted mb-2">Description</h6>
      <div class="p-3 bg-light rounded">
        <pre style="white-space: pre-wrap; font-family: inherit; margin: 0;">${description}</pre>
      </div>
    </div>`;
  
  // Store the current issue in the modal for later use
  modal.dataset.currentIssue = JSON.stringify(issue);
  
  // Show the modal
  const modalInstance = new bootstrap.Modal(modal);
  
  // Add event listener for when the modal is fully hidden
  modal.addEventListener('hidden.bs.modal', function onModalHidden() {
    // Clean up modal backdrop and re-enable scrolling
    document.body.classList.remove('modal-open');
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
    document.body.style.overflow = 'auto';
    document.body.style.paddingRight = '';
    
    // Remove the event listener to prevent memory leaks
    modal.removeEventListener('hidden.bs.modal', onModalHidden);
  });
  
  modalInstance.show();
  
  return modal;
}

// Generate test cases from issue
async function generateTestCasesFromIssue(issue, isAdditional = false, existingTestCases = []) {
  console.log('Starting test case generation for issue:', issue.key);
  
  try {
    // If this is not an additional generation, reset the conversation history
    if (!isAdditional) {
      conversationHistory = [];
    }
    
    // Prepare the request payload with the full issue description, existing test cases, and conversation history
    const payload = {
      prompt: issue.description || '',
      issue_key: issue.key,
      summary: issue.summary || '',
      issue_type: issue.issue_type || '',
      status: issue.status || '',
      existing_test_cases: existingTestCases,
      conversation_history: conversationHistory,
      is_additional_generation: isAdditional
    };
    
    console.log('Sending request to generate test cases with payload:', payload);
    
    // Call the generate API endpoint
    const response = await fetch('http://localhost:5000/generate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('API response status:', response.status);
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If we can't parse the error as JSON, use the status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(`Failed to generate test cases: ${errorMessage}`);
    }
    
    const result = await response.json();
    console.log('API response data:', result);
    
    // Handle different response formats
    const testCases = Array.isArray(result) ? result : (result.testCases || result.data || []);
    
    if (!testCases || testCases.length === 0) {
      throw new Error('No test cases were generated. The response was empty or in an unexpected format.');
    }
    
    // Update conversation history with the new interaction
    if (isAdditional) {
      // For additional generations, we want to maintain the full context
      conversationHistory.push({
        role: 'user',
        content: issue.description || ''
      });
      
      if (result.conversation_history) {
        // If the server returns updated conversation history, use that
        conversationHistory = result.conversation_history;
      } else {
        // Otherwise, add the AI's response to the history
        conversationHistory.push({
          role: 'assistant',
          content: JSON.stringify(testCases)
        });
      }
    }
    
    console.log('Generated test cases:', testCases);
    
    // Update the conversation history with the last interaction
    conversationHistory.push({
      role: 'user',
      content: issue.description || ''
    });
    
    if (result.conversation_history) {
      // If the server returns updated conversation history, use that
      conversationHistory = result.conversation_history;
    } else {
      // Otherwise, add the AI's response to the history
      conversationHistory.push({
        role: 'assistant',
        content: JSON.stringify(testCases)
      });
    }
    
    // Update the test cases table
    updateTestCasesTable(testCases, isAdditional);
    
    // Update the heading with issue key and sprint badges
    const heading = document.getElementById('generatedTestCasesHeading');
    if (heading) {
      const sprintName = (issue.sprint && issue.sprint !== 'N/A') ? issue.sprint : 'No Sprint';
      
      heading.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <span>Generated Test Cases</span>
          <span class="badge bg-primary">${issue.key}</span>
          <span class="badge bg-info text-dark">${sprintName}</span>
        </div>
      `;
    }
    
    // Don't show success toast here - it's now handled in the click handler
    
    // Update test case count
    const testCaseCount = document.getElementById('testCaseCount');
    if (testCaseCount) {
      testCaseCount.textContent = testCases.length;
    }
    
    return testCases;
    
  } catch (error) {
    console.error('Error generating test cases:', error);
    
    try {
      // Safely show error message if toast elements exist
      const errorToastEl = document.getElementById('errorToast');
      if (errorToastEl) {
        const errorToast = bootstrap.Toast.getOrCreateInstance(errorToastEl);
        const errorToastBody = errorToastEl.querySelector('.toast-body');
        if (errorToastBody) {
          errorToastBody.textContent = error.message || 'Failed to generate test cases. Please check the console for details.';
          errorToast.show();
        } else {
          console.warn('Could not find error toast body element');
        }
      } else {
        console.warn('Could not find error toast element');
      }
    } catch (uiError) {
      console.error('Error showing error message:', uiError);
    }
    
    // Re-throw the error for further handling if needed
    throw error;
  }
}

// Handle generating more test cases
async function handleGenerateMoreTestCases() {
  console.log('=== Starting handleGenerateMoreTestCases ===');
  const generateMoreBtn = document.getElementById('generateMoreBtn');
  if (!generateMoreBtn) {
    console.error('❌ Generate More button not found in the DOM');
    return false;
  }
  
  console.log('✅ Generate More button found');
  
  try {
    console.log('Getting current issue details...');
    // Get the current issue key from the heading
    console.log('🔍 Looking for test cases heading...');
    const heading = document.getElementById('generatedTestCasesHeading');
    if (!heading) {
      const errorMsg = '❌ Could not find test cases section';
      console.error(errorMsg);
      console.log('Available elements with ID "generatedTestCasesHeading":', document.querySelectorAll('#generatedTestCasesHeading'));
      throw new Error(errorMsg);
    }
    console.log('✅ Found test cases heading:', heading.textContent);
    
    // Get the issue key from the heading
    console.log('🔍 Looking for issue key badge...');
    const badge = heading.querySelector('.badge.bg-primary');
    if (!badge) {
      const errorMsg = '❌ Could not find issue key in the test cases section';
      console.error(errorMsg);
      console.log('Available badges in heading:', heading.querySelectorAll('*'));
      throw new Error(errorMsg);
    }
    
    const issueKey = badge.textContent.trim();
    if (!issueKey) {
      const errorMsg = 'Issue key is empty';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    console.log('Found issue key:', issueKey);
    
    // Show loading state
    generateMoreBtn.disabled = true;
    generateMoreBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Generating...';
    
    // Show loading toast
    const loadingToastEl = document.getElementById('loadingToast');
    if (loadingToastEl) {
      const loadingToast = bootstrap.Toast.getOrCreateInstance(loadingToastEl);
      const loadingToastBody = loadingToastEl.querySelector('.toast-body');
      if (loadingToastBody) {
        loadingToastBody.textContent = 'Generating additional test cases...';
      }
      loadingToast.show();
    }
    
    // Try to get the issue from the issue details modal first
    let issueRow = null;
    const modal = document.getElementById('issueDetailsModal');
    if (modal) {
      const modalIssueKey = modal.getAttribute('data-current-issue') ? 
        JSON.parse(modal.getAttribute('data-current-issue'))?.key : null;
      
      if (modalIssueKey === issueKey) {
        console.log('Found issue in modal');
        // Create a dummy row with the data from the modal
        const issueData = JSON.parse(modal.getAttribute('data-current-issue'));
        issueRow = {
          getAttribute: (attr) => {
            switch(attr) {
              case 'data-summary': return issueData.summary || '';
              case 'data-description': return issueData.description || '';
              case 'data-issue-type': return issueData.issue_type || 'Task';
              case 'data-status': return issueData.status || 'To Do';
              case 'data-sprint': return issueData.sprint || '';
              default: return '';
            }
          }
        };
      }
    }
    
    // If not found in the modal, try to find it in the issues table
    if (!issueRow) {
      console.log('Issue not found in modal, searching in tables...');
      issueRow = document.querySelector(`#jiraIssuesTable tr[data-issue-key="${issueKey}"]`);
      
      // If not found in the main table, try to find it in any other tables
      if (!issueRow) {
        console.log('Issue not found in main table, searching in all tables...');
        issueRow = document.querySelector(`tr[data-issue-key="${issueKey}"]`);
      }
    }
    
    // If we still can't find the issue, try to get it from the issue details modal
    if (!issueRow) {
      const modal = document.getElementById('issueDetailsModal');
      if (modal) {
        const modalIssueKey = modal.getAttribute('data-issue-key');
        if (modalIssueKey === issueKey) {
          // Get data from the modal
          issueRow = {
            getAttribute: (attr) => {
              switch(attr) {
                case 'data-summary': return modal.querySelector('.issue-summary')?.textContent || '';
                case 'data-description': return modal.querySelector('.issue-description')?.textContent || '';
                case 'data-issue-type': return modal.querySelector('.issue-type')?.textContent || '';
                case 'data-status': return modal.querySelector('.issue-status')?.textContent || '';
                case 'data-sprint': return modal.querySelector('.issue-sprint')?.textContent || '';
                default: return '';
              }
            }
          };
        }
      }
    }
    
    if (!issueRow) {
      throw new Error(`Could not find details for issue ${issueKey}. Please make sure the issue is visible in the table.`);
    }
    
    // Get issue data with fallbacks
    const getSafeAttribute = (element, attr, defaultValue = '') => {
      try {
        return element?.getAttribute?.(attr) || defaultValue;
      } catch (e) {
        console.warn(`Error getting attribute ${attr}:`, e);
        return defaultValue;
      }
    };
    
    const issue = {
      key: issueKey,
      summary: getSafeAttribute(issueRow, 'data-summary', issueKey),
      description: getSafeAttribute(issueRow, 'data-description', ''),
      issue_type: getSafeAttribute(issueRow, 'data-issue-type', 'Task'),
      status: getSafeAttribute(issueRow, 'data-status', 'To Do'),
      sprint: getSafeAttribute(issueRow, 'data-sprint', '')
    };
    
    console.log('Using issue data:', issue);
    
    // Get existing test cases from the table
    const existingTestCases = [];
    const testCaseRows = document.querySelectorAll('#resultsTable tbody tr');
    
    if (testCaseRows.length === 0) {
      console.warn('No existing test cases found in the table');
    } else {
      console.log(`Found ${testCaseRows.length} existing test cases`);
      testCaseRows.forEach((row, index) => {
        try {
          const testCase = {
            id: row.getAttribute('data-test-id') || `temp-${Date.now()}-${index}`,
            title: row.querySelector('.test-case')?.textContent?.trim() || `Test Case ${index + 1}`,
            description: row.querySelector('.test-description')?.textContent?.trim() || '',
            priority: row.querySelector('.test-priority')?.textContent?.trim() || 'Medium',
            steps: row.querySelector('.test-steps')?.textContent?.trim() || '',
            expectedResult: row.querySelector('.expected-result')?.textContent?.trim() || ''
          };
          existingTestCases.push(testCase);
        } catch (error) {
          console.error('Error parsing test case row:', error);
        }
      });
    }
    
    console.log('Existing test cases to include:', existingTestCases);
    
    // Generate more test cases with append mode and include existing test cases
    const newTestCases = await generateTestCasesFromIssue(issue, true, existingTestCases);
    
    if (newTestCases && newTestCases.length > 0) {
      // Show success message
      const successToastEl = document.getElementById('successToast');
      const successToast = bootstrap.Toast.getOrCreateInstance(successToastEl);
      const successToastBody = successToastEl.querySelector('.toast-body');
      successToastBody.textContent = `Successfully generated ${newTestCases.length} more test cases.`;
      successToast.show();
    }
    
  } catch (error) {
    console.error('Error generating more test cases:', error);
    
    // Show error message
    const errorToastEl = document.getElementById('errorToast');
    const errorToast = bootstrap.Toast.getOrCreateInstance(errorToastEl);
    const errorToastBody = errorToastEl.querySelector('.toast-body');
    errorToastBody.textContent = error.message || 'Failed to generate more test cases. Please check the console for details.';
    errorToast.show();
    
  } finally {
    // Reset button state
    if (generateMoreBtn) {
      generateMoreBtn.disabled = false;
      generateMoreBtn.innerHTML = '<i class="bi bi-magic me-1"></i> Generate More';
    }
    
    // Hide the loading toast
    const loadingToastEl = document.getElementById('loadingToast');
    if (loadingToastEl) {
      const loadingToast = bootstrap.Toast.getInstance(loadingToastEl);
      if (loadingToast) {
        loadingToast.hide();
      }
    }
  }
}

function createTestCaseRow(testCase) {
  const row = document.createElement('tr');
  row.setAttribute('data-test-case-id', testCase.id);
  
  // Format priority badge with correct class
  const priorityClass = getPriorityBadgeClass(testCase.priority);
  const priorityBadge = `<span class="badge bg-${priorityClass} text-white">
    ${(testCase.priority || 'Medium').toUpperCase()}
  </span>`;
  
  // Format steps with proper numbering
  let formattedSteps = 'N/A';
  if (testCase.steps) {
    const stepsStr = String(testCase.steps);
    // Split by newlines and clean up each line
    const stepLines = stepsStr.split('\n')
      .map(step => {
        // Remove any existing numbering pattern (1., 2., etc.) at the start of the line
        return step.replace(/^\s*\d+\.?\s*/, '').trim();
      })
      .filter(step => step !== ''); // Remove any empty lines
    
    // Add numbering back if there are any steps
    if (stepLines.length > 0) {
      formattedSteps = stepLines.map((step, i) => `${i + 1}. ${step}`).join('<br>');
    }
  }
  
  // Format expected results
  const formattedExpectedResults = testCase.expectedResult 
    ? String(testCase.expectedResult).replace(/\n/g, '<br>') 
    : 'N/A';
  
  // Create table cells in the correct order to match table headers
  const cells = [
    { class: 'text-nowrap', content: testCase.id || 'N/A' },
    { class: 'wrap-text', content: testCase.title || 'No title' },
    { class: 'wrap-text', content: formattedSteps },
    { class: 'wrap-text', content: formattedExpectedResults },
    { class: 'text-nowrap', content: priorityBadge },
    { 
      class: 'text-nowrap', 
      content: `
        <select class="form-select form-select-sm execution-status" 
                data-test-id="${testCase.id}" 
                style="background-color: ${getStatusColor(testCase.executionStatus || 'UNEXECUTED')}; 
                       color: white; 
                       border: 1px solid ${getStatusColor(testCase.executionStatus || 'UNEXECUTED')}; 
                       border-radius: 0.25rem;
                       padding: 0.25rem 0.5rem;
                       font-size: 0.75rem;
                       width: 120px;">
          <option value="UNEXECUTED" ${(testCase.executionStatus || 'UNEXECUTED') === 'UNEXECUTED' ? 'selected' : ''}>UNEXECUTED</option>
          <option value="PASS" ${testCase.executionStatus === 'PASS' ? 'selected' : ''}>PASS</option>
          <option value="FAIL" ${testCase.executionStatus === 'FAIL' ? 'selected' : ''}>FAIL</option>
          <option value="BLOCKED" ${testCase.executionStatus === 'BLOCKED' ? 'selected' : ''}>BLOCKED</option>
        </select>
      `
    },
    { 
      class: 'text-nowrap', 
      content: createActionButtons(testCase.id) 
    }
  ];
  
  // Add each cell to the row
  cells.forEach(cellData => {
    const cell = document.createElement('td');
    cell.className = cellData.class;
    cell.innerHTML = cellData.content;
    row.appendChild(cell);
  });
  
  return row;
}

// Helper function to get color for execution status
function getStatusColor(status) {
  switch(status) {
    case 'PASS': return '#198754'; // Green
    case 'FAIL': return '#dc3545'; // Red
    case 'WIP': return '#ffc107';  // Yellow
    case 'BLOCKED': return '#6f42c1'; // Purple
    default: return '#6c757d'; // Gray for UNEXECUTED
  }
}

function createActionButtons(testCaseId) {
  return `
    <div class="btn-group btn-group-sm" role="group">
      <button type="button" class="btn btn-outline-primary edit-test-case" data-test-id="${testCaseId}" title="Edit test case">
        <i class="bi bi-pencil"></i>
      </button>
      <button type="button" class="btn btn-outline-danger delete-test-case" data-test-id="${testCaseId}" title="Delete test case">
        <i class="bi bi-trash"></i>
      </button>
    </div>
  `;
}

function updateTestCasesTable(testCases, append = false) {
  try {
    const tbody = document.querySelector('#resultsTable tbody');
    if (!tbody) {
      console.error('Table body not found');
      return false;
    }
  
  // If appending, find the highest existing test case number
  let highestId = 0;
  if (append) {
    document.querySelectorAll('#resultsTable tbody tr').forEach(row => {
      const id = row.getAttribute('data-test-id');
      if (id) {
        const match = id.match(/\d+$/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (num > highestId) highestId = num;
        }
      }
    });
  } else {
    // Clear existing rows if not appending
    tbody.innerHTML = '';
  }
  
    console.log('[updateTestCasesTable] Starting to update table. Append mode:', append, 'Highest ID:', highestId);
    
    if (!Array.isArray(testCases)) {
      throw new Error('testCases must be an array');
    }
    
    // Process each test case
    testCases.forEach((testCase, index) => {
      try {
        // Preserve the original ID from the API response
        if (!testCase.id) {
          // Only generate a new ID if one doesn't exist
          testCase.id = `test-case-${append ? highestId + index + 1 : index + 1}`;
        }
        
        // Create and append the row
        const row = createTestCaseRow(testCase);
        tbody.appendChild(row);
      } catch (error) {
        console.error(`Error processing test case ${index}:`, error);
      }
    });
    
    console.log(`[updateTestCasesTable] Successfully processed ${testCases.length} test cases`);
    
  } catch (error) {
    console.error('Error in updateTestCasesTable:', error);
    throw error;
  }
}

// Update the Import to Jira button state
function updateImportButtonState() {
  const importToJiraBtn = document.getElementById('importToJiraBtn');
  if (importToJiraBtn) {
    const hasTestCases = document.querySelectorAll('#resultsTable tbody tr').length > 0;
    importToJiraBtn.disabled = !hasTestCases;
  }
  return true;
}

// Handle empty test cases
function handleEmptyTestCases(tbody) {
  if (!tbody) return true;
  
  tbody.innerHTML = `
    <tr>
      <td colspan="7" class="text-center py-4">
        <div class="text-muted">No test cases were generated. Please try again.</div>
      </td>
    </tr>`;
  
  // Update the import button state
  updateImportButtonState();
  return true;
}

// Scroll to position the test cases in the middle of the screen
function scrollToTestCases() {
  const anchor = document.getElementById('testCasesAnchor');
  if (anchor) {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const anchorPosition = anchor.getBoundingClientRect().top + window.pageYOffset;
    const scrollTo = anchorPosition - (viewportHeight * 0.3); // Position at 30% from top
    
    // Smooth scroll to the calculated position
    window.scrollTo({
      top: scrollTo,
      behavior: 'smooth'
    });
  }
}

// Process test cases and update the UI
function processTestCases(testCases, tbody, append = false) {
  console.log('[processTestCases] Raw test cases data:', JSON.stringify(testCases, null, 2));
  
  // Handle case where test cases are nested in a testCases property
  if (testCases && testCases.testCases && Array.isArray(testCases.testCases)) {
    console.log('[processTestCases] Found test cases in testCases property');
    testCases = testCases.testCases;
  } else if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
    console.warn('[processTestCases] No test cases provided or empty array');
    handleEmptyTestCases(tbody);
    return;
  }

  // Call scroll function after a short delay
  setTimeout(scrollToTestCases, 100);
  
  // Clear existing rows if not appending
  if (!append) {
    tbody.innerHTML = '';
  }
  
  // Create table rows for each test case
  testCases.forEach((testCase, index) => {
    try {
      console.log(`[processTestCases] Processing test case ${index + 1}:`, testCase);
      
      // Log the raw test case object before normalization
      console.log(`[processTestCases] Raw test case ${index}:`, testCase);
      
      // Normalize the test case data with proper fallbacks
      const normalizedTestCase = {
        id: testCase.id || testCase.testCaseId || `TC-${append ? tbody.children.length + index + 1 : index + 1}`,
        title: testCase.title || testCase.name || `Test Case ${index + 1}`,
        priority: (testCase.priority || 'medium').toLowerCase(),
        executionStatus: (testCase.executionStatus || 'UNEXECUTED').toUpperCase(),
        // Handle both steps as string and array
        steps: Array.isArray(testCase.steps) ? testCase.steps.join('\n') : (testCase.steps || testCase.step || ''),
        expectedResult: testCase.expectedResult || testCase.expectedResults || ''
      };
      
      console.log(`[processTestCases] Normalized test case ${index}:`, normalizedTestCase);
      
      console.log(`[processTestCases] Normalized test case ${index}:`, normalizedTestCase);
      
      const row = document.createElement('tr');
      row.className = 'fade-in';
      row.setAttribute('data-test-case-id', normalizedTestCase.id);
      row.style.animationDelay = `${index * 50}ms`;
      
      // Format steps - convert newlines to <br> and ensure proper numbering
      let formattedSteps = 'N/A';
      if (normalizedTestCase.steps) {
        // Convert to string in case it's a number or other type
        const stepsStr = String(normalizedTestCase.steps);
        // Split by newlines, filter out empty lines, and add numbering
        const stepLines = stepsStr.split('\n').filter(step => step.trim() !== '');
        formattedSteps = stepLines.map((step, i) => `${i + 1}. ${step.trim()}`).join('<br>');
      }
      
      // Format expected results - ensure proper line breaks
      let formattedExpectedResults = 'N/A';
      if (normalizedTestCase.expectedResult) {
        // Convert to string and replace newlines with <br>
        formattedExpectedResults = String(normalizedTestCase.expectedResult).replace(/\n/g, '<br>');
      }
        
        // Function to get status color
        function getStatusColor(status) {
          switch(status) {
            case 'PASS': return '#198754'; // Green
            case 'FAIL': return '#dc3545'; // Red
            case 'WIP': return '#ffc107';  // Yellow
            case 'BLOCKED': return '#6f42c1'; // Purple
            default: return '#6c757d'; // Gray for UNEXECUTED
          }
        }
        
        // Add styles for the execution status dropdown
        const statusStyles = `
          <style>
            .execution-status option[value="UNEXECUTED"] { background-color: #ffffff; color: #000000; }
            .execution-status option[value="PASS"] { background-color: #198754; color: white; }
            .execution-status option[value="FAIL"] { background-color: #dc3545; color: white; }
            .execution-status option[value="BLOCKED"] { background-color: #4a2d82; color: white; }
          </style>
        `;
        
        // Create the row content with proper data mapping
        // Make sure the order of <td> elements matches the <th> order in the HTML
        row.innerHTML = `
          <td class="text-nowrap">${normalizedTestCase.id}</td>
          <td class="wrap-text">${normalizedTestCase.title}</td>
          <td class="wrap-text">${formattedSteps}</td>
          <td class="wrap-text">${formattedExpectedResults}</td>
          <td class="text-nowrap">
            <span class="badge ${getPriorityBadgeClass(normalizedTestCase.priority)}">
              ${normalizedTestCase.priority.toUpperCase()}
            </span>
          </td>
          <td class="text-nowrap">
            <select class="form-select form-select-sm execution-status" 
                    data-test-id="${normalizedTestCase.id}" 
                    style="background-color: ${getStatusColor(normalizedTestCase.executionStatus)}; 
                           color: white; 
                           border: 1px solid ${getStatusColor(normalizedTestCase.executionStatus)}; 
                           border-radius: 0.25rem;
                           padding: 0.25rem 0.5rem;
                           font-size: 0.75rem;
                           width: 120px;">
              <option value="UNEXECUTED" ${normalizedTestCase.executionStatus === 'UNEXECUTED' ? 'selected' : ''}>UNEXECUTED</option>
              <option value="PASS" ${normalizedTestCase.executionStatus === 'PASS' ? 'selected' : ''}>PASS</option>
              <option value="FAIL" ${normalizedTestCase.executionStatus === 'FAIL' ? 'selected' : ''}>FAIL</option>
              <option value="BLOCKED" ${normalizedTestCase.executionStatus === 'BLOCKED' ? 'selected' : ''}>BLOCKED</option>
            </select>
          </td>
          <td class="text-nowrap">
            <div class="btn-group btn-group-sm" role="group">
              <button type="button" class="btn btn-outline-primary edit-test-case" data-test-id="${normalizedTestCase.id}" title="Edit test case">
                <i class="bi bi-pencil"></i>
              </button>
              <button type="button" class="btn btn-outline-danger delete-test-case" data-test-id="${normalizedTestCase.id}" title="Delete test case">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </td>
        `;
        
        // Add event listener to update background color when selection changes
        const statusSelect = row.querySelector('.execution-status');
        if (statusSelect) {
          statusSelect.addEventListener('change', function() {
            this.style.backgroundColor = getStatusColor(this.value);
          });
        }
        
        tbody.appendChild(row);
      } catch (rowError) {
        console.error(`Error rendering test case ${index}:`, rowError, testCase);
      }
    });
    
    // Show the test cases section if it was hidden
    const testCasesSection = document.getElementById('testCasesSection');
    if (testCasesSection) {
      testCasesSection.classList.remove('d-none');
    }
    
    // Enable the export button
    const exportBtn = document.getElementById('exportToExcelBtn');
    if (exportBtn) {
      exportBtn.disabled = testCases.length === 0;
    }
    
    // Initialize modals
    const addTestCaseModal = new bootstrap.Modal(document.getElementById('addTestCaseModal'));
    const editTestCaseModal = new bootstrap.Modal(document.getElementById('editTestCaseModal'));
    let currentEditingRow = null;
    
    // Add Test Case button click handler
    document.getElementById('addTestCaseBtn').addEventListener('click', function() {
      // Reset the form
      document.getElementById('addTestCaseForm').reset();
      // Set default priority
      document.getElementById('newTestCasePriority').value = 'medium';
      // Show the modal
      addTestCaseModal.show();
    });
    
    // Save New Test Case button click handler
    document.getElementById('saveNewTestCase').addEventListener('click', function() {
      // Get form values
      const title = document.getElementById('newTestCaseTitle').value.trim();
      const steps = document.getElementById('newTestCaseSteps').value.trim();
      const expectedResult = document.getElementById('newTestCaseExpected').value.trim();
      const priority = document.getElementById('newTestCasePriority').value;
      
      // Validate required fields
      if (!title || !steps || !expectedResult) {
        alert('Please fill in all required fields');
        return;
      }
      
      try {
        // Get the tbody element
        const tbody = document.querySelector('#resultsTable tbody');
        if (!tbody) return;
        
        // Get all existing test case IDs to find the highest number
        const existingIds = [];
        const idCells = tbody.querySelectorAll('td:first-child');
        idCells.forEach(cell => {
          const idNum = parseInt(cell.textContent.trim());
          if (!isNaN(idNum)) {
            existingIds.push(idNum);
          }
        });
        
        // Calculate the next ID (1 if no existing IDs, otherwise max + 1)
        const testCaseId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
        
        // Create a new test case object
        const newTestCase = {
          id: testCaseId,
          title: title,
          steps: steps,
          expectedResult: expectedResult,
          priority: priority
        };
        
        // Create a new row for the test case
        const newRow = document.createElement('tr');
        newRow.className = 'fade-in';
        newRow.style.animationDelay = '0ms';
        
        // Format steps for display
        const stepsHtml = steps.split('\n').map(step => step.trim()).filter(step => step).join('<br>');
        const expectedHtml = expectedResult.split('\n').map(line => line.trim()).filter(line => line).join('<br>');
        
        // Set the row HTML
        newRow.innerHTML = `
          <td class="text-nowrap">${testCaseId.id || testCaseId}</td>
          <td class="font-weight-medium">${title}</td>
          <td class="small">${stepsHtml}</td>
          <td class="small">${expectedHtml}</td>
          <td class="text-nowrap">
            ${getPriorityBadge(priority)}
          </td>
          <td>
            <select class="form-select form-select-sm execution-status" data-test-id="${testCaseId}">
              <option value="UNEXECUTED">UNEXECUTED</option>
              <option value="PASS">PASS</option>
              <option value="FAIL">FAIL</option>
              <option value="WIP">WIP</option>
              <option value="BLOCKED">BLOCKED</option>
            </select>
          </td>
          <td class="text-end">
            <div class="btn-group btn-group-sm" role="group">
              <button class="btn btn-sm btn-outline-primary edit-test-case" data-test-id="${testCaseId}" title="Edit test case">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger delete-test-case" data-test-id="${testCaseId}" title="Delete test case">
              <i class="bi bi-trash"></i>
            </button>
            </div>
          </td>
        `;
        
        // Add the new row to the table
        tbody.appendChild(newRow);
        
        // Add event listeners to the new buttons
        addRowEventListeners(newRow);
        
        // Close the modal
        addTestCaseModal.hide();
        
        // Enable the export and import buttons if they were disabled
        const exportBtn = document.getElementById('exportToExcelBtn');
        if (exportBtn) {
          exportBtn.disabled = false;
        }
        
        const importToJiraBtn = document.getElementById('importToJiraBtn');
        if (importToJiraBtn) {
          importToJiraBtn.disabled = false;
        }
        
        // Show success message
        const toast = new bootstrap.Toast(document.getElementById('successToast'));
        const toastBody = document.querySelector('#successToast .toast-body');
        toastBody.textContent = 'Test case added successfully!';
        toast.show();
        
      } catch (error) {
        console.error('Error adding test case:', error);
        alert('An error occurred while adding the test case');
      }
    });
    
    // Function to add event listeners to a table row
    function addRowEventListeners(row) {
      // Add edit button event listener
      const editBtn = row.querySelector('.edit-test-case');
      if (editBtn) {
        editBtn.addEventListener('click', handleEditTestCase);
      }
      
      // Add delete button event listener
      const deleteBtn = row.querySelector('.delete-test-case');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', handleDeleteTestCase);
      }
    }
    
    // Handle edit test case
    function handleEditTestCase(e) {
      e.stopPropagation();
      const row = this.closest('tr');
      if (!row) return;
      
      // Store the reference to the current row being edited
      currentEditingRow = row;
      
      // Get the test case data from the row
      const testCaseId = this.getAttribute('data-test-id');
      const testCase = {
        id: testCaseId,
        title: row.cells[1].textContent.trim(),
        steps: row.cells[2].innerHTML.replace(/<br\s*\/?>/g, '\n').trim(),
        expectedResult: row.cells[3].innerHTML.replace(/<br\s*\/?>/g, '\n').trim(),
        priority: row.cells[4].querySelector('.badge').textContent.trim().toLowerCase()
      };
      
      // Populate the edit form
      document.getElementById('editTestCaseId').value = testCase.id;
      document.getElementById('editTestCaseTitle').value = testCase.title;
      document.getElementById('editTestCaseSteps').value = testCase.steps;
      document.getElementById('editTestCaseExpected').value = testCase.expectedResult;
      document.getElementById('editTestCasePriority').value = testCase.priority || 'medium';
      
      // Show the edit modal
      editTestCaseModal.show();
    }
    
    // Handle delete test case
    function handleDeleteTestCase(e) {
      e.stopPropagation();
      const row = this.closest('tr');
      if (!row) return;
      
      // Add fade out effect
      row.style.transition = 'opacity 0.3s ease';
      row.style.opacity = '0';
      
      // Remove the row after the fade out completes
      setTimeout(() => {
        row.remove();
        
        // Check if there are any test cases left
        const tbody = document.querySelector('#resultsTable tbody');
        if (tbody && tbody.rows.length === 0) {
          // If no test cases left, disable the export and import buttons
          const exportBtn = document.getElementById('exportToExcelBtn');
          if (exportBtn) {
            exportBtn.disabled = true;
          }
          const importToJiraBtn = document.getElementById('importToJiraBtn');
          if (importToJiraBtn) {
            importToJiraBtn.disabled = true;
          }
        }
      }, 300);
    }

    // Add event listeners for edit buttons
    document.querySelectorAll('.edit-test-case').forEach(button => {
      button.addEventListener('click', function(e) {
        e.stopPropagation();
        const row = this.closest('tr');
        if (!row) return;
        
        // Store the reference to the current row being edited
        currentEditingRow = row;
        
        // Get the test case data from the row
        const testCaseId = this.getAttribute('data-test-id');
        const testCase = {
          id: testCaseId,
          title: row.cells[1].textContent.trim(),
          steps: row.cells[2].innerHTML.replace(/<br\s*\/?>/g, '\n').trim(),
          expectedResult: row.cells[3].innerHTML.replace(/<br\s*\/?>/g, '\n').trim(),
          priority: row.cells[4].querySelector('.badge').textContent.trim().toLowerCase()
        };
        
        // Populate the modal form
        document.getElementById('editTestCaseId').value = testCase.id;
        document.getElementById('editTestCaseTitle').value = testCase.title;
        document.getElementById('editTestCaseSteps').value = testCase.steps;
        document.getElementById('editTestCaseExpected').value = testCase.expectedResult;
        document.getElementById('editTestCasePriority').value = testCase.priority || 'medium';
        
        // Show the modal
        editTestCaseModal.show();
      });
    });

    // Handle save changes button click
    document.getElementById('saveTestCaseChanges').addEventListener('click', function() {
      if (!currentEditingRow) return;
      
      // Get the updated values from the form
      const title = document.getElementById('editTestCaseTitle').value.trim();
      const steps = document.getElementById('editTestCaseSteps').value.trim();
      const expectedResult = document.getElementById('editTestCaseExpected').value.trim();
      const priority = document.getElementById('editTestCasePriority').value;
      
      if (!title || !steps || !expectedResult) {
        alert('Please fill in all required fields');
        return;
      }
      
      try {
        // Update the table row with the edited values
        currentEditingRow.cells[1].textContent = title;
        currentEditingRow.cells[2].innerHTML = steps.replace(/\n/g, '<br>');
        currentEditingRow.cells[3].innerHTML = expectedResult.replace(/\n/g, '<br>');
        currentEditingRow.cells[4].innerHTML = getPriorityBadge(priority);
        
        // Close the modal
        editTestCaseModal.hide();
        
        // Show success message
        const toast = new bootstrap.Toast(document.getElementById('successToast'));
        const toastBody = document.querySelector('#successToast .toast-body');
        toastBody.textContent = 'Test case updated successfully!';
        toast.show();
        
      } catch (error) {
        console.error('Error updating test case:', error);
        alert('An error occurred while updating the test case');
      }
    });
    
    // Reset the form when the modal is hidden
    document.getElementById('editTestCaseModal').addEventListener('hidden.bs.modal', function () {
      document.getElementById('editTestCaseForm').reset();
      currentEditingRow = null;
    });
    
    // Reset the form when the add modal is hidden
    document.getElementById('addTestCaseModal').addEventListener('hidden.bs.modal', function () {
      document.getElementById('addTestCaseForm').reset();
    });

    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-test-case').forEach(button => {
      button.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent any parent click events
        
        const row = this.closest('tr');
        if (row) {
          // Add fade out effect
          row.style.transition = 'opacity 0.3s ease';
          row.style.opacity = '0';
          
          // Remove the row after the fade out completes
          setTimeout(() => {
            try {
              row.remove();
              
              // Update the test case count
              const testCaseCount = document.getElementById('testCaseCount');
              if (testCaseCount) {
                const currentCount = parseInt(testCaseCount.textContent) || 0;
                testCaseCount.textContent = Math.max(0, currentCount - 1);
                
                // If no test cases left, show empty state
                if (currentCount - 1 <= 0) {
                  const tbody = document.querySelector('#resultsTable tbody');
                  if (tbody) {
                    tbody.innerHTML = `
                      <tr>
                        <td colspan="6" class="text-center py-4">
                          <div class="text-muted">No test cases generated yet.</div>
                        </td>
                      </tr>`;
                  }
                }
              }
              
              // Show a success toast
              const successToastEl = document.getElementById('successToast');
              if (successToastEl) {
                const successToast = bootstrap.Toast.getOrCreateInstance(successToastEl);
                const toastBody = successToastEl.querySelector('.toast-body');
                if (toastBody) {
                  toastBody.textContent = 'Test case deleted successfully';
                }
                successToast.show();
              }
            } catch (error) {
              console.error('Error deleting test case:', error);
            }
          }, 300);
        }
      });
    });

    // Scroll to the test cases section
    try {
      setTimeout(() => {
        const testCasesSection = document.getElementById('testCasesSection');
        if (testCasesSection) {
          testCasesSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return true;
    } catch (error) {
      console.error('Error in scroll operation:', error);
      return true; // Continue even if scroll fails
    }
}

// Helper function to get priority badge HTML
function getPriorityBadge(priority) {
  const priorityColors = {
    'critical': '#E2483D',
    'highest': '#E2483D',
    'high': '#E2483D',
    'major': '#F68909',
    'medium': '#F68909',
    'minor': '#4688EC',
    'low': '#4688EC',
    'lowest': '#6C757D'
  };
  
  const normalizedPriority = priority?.toLowerCase() || '';
  const bgColor = priorityColors[normalizedPriority] || '#6C757D';
  const displayText = priority ? (priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase()) : 'N/A';
  
  return `<span class="badge" style="background-color: ${bgColor}; color: #fff;">${displayText}</span>`;
}

// Helper function to get badge class for test case priority
function getPriorityBadgeClass(priority) {
  const priorityClasses = {
    'critical': 'danger',
    'highest': 'danger',
    'high': 'danger',
    'major': 'warning',
    'medium': 'warning',
    'minor': 'info',
    'low': 'info',
    'lowest': 'secondary'
  };
  
  const normalizedPriority = priority?.toLowerCase() || '';
  return priorityClasses[normalizedPriority] || 'secondary';
}

// Load Jira versions for the import dropdown
async function loadJiraVersions() {
  try {
    const response = await fetch('http://localhost:8000/api/jira/versions?all=true&max_per_page=50');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const versions = await response.json();
    
    const versionSelect = document.getElementById('versionSelect');
    if (!versionSelect) return;
    
    // Clear existing options except the first one (the default/placeholder)
    while (versionSelect.options.length > 1) {
      versionSelect.remove(1);
    }
    
    // Sort versions by release date in descending order (newest first)
    versions.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
    
    // Add versions to the dropdown
    versions.forEach(version => {
      const option = document.createElement('option');
      option.value = version.id;
      option.textContent = version.name;
      // Store the full version object as a data attribute for later use
      option.dataset.versionData = JSON.stringify(version);
      versionSelect.appendChild(option);
    });
    
    return versions;
  } catch (error) {
    console.error('Error loading Jira versions:', error);
    showError('Failed to load Jira versions. Please try again later.');
    return [];
  }
}

// Load Zephyr test cycles for the import dropdown
async function loadZephyrTestCycles(versionId = -1) {
  try {
    const response = await fetch(`http://localhost:8000/api/zephyr/cycles?version_id=${versionId}&offset=0&limit=50`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    const testCycleSelect = document.getElementById('testCycleSelect');
    if (!testCycleSelect) return [];
    
    // Clear existing options except the first one (the default/placeholder)
    while (testCycleSelect.options.length > 1) {
      testCycleSelect.remove(1);
    }
    
    // Sort test cycles by name
    const sortedCycles = [...data.items].sort((a, b) => a.name.localeCompare(b.name));
    
    // Add test cycles to the dropdown
    sortedCycles.forEach(cycle => {
      const option = document.createElement('option');
      option.value = cycle.id;
      option.textContent = cycle.name;
      // Store the full cycle object as a data attribute for later use
      option.dataset.cycleData = JSON.stringify(cycle);
      testCycleSelect.appendChild(option);
    });
    
    return sortedCycles;
  } catch (error) {
    console.error('Error loading Zephyr test cycles:', error);
    showError('Failed to load test cycles. Please try again later.');
    return [];
  }
}

// Handle Import to Jira button click
async function handleImportToJira() {
  // Show the import modal
  const importModal = new bootstrap.Modal(document.getElementById('importToJiraModal'));
  importModal.show();
  
  // Show loading state for versions
  const versionSelect = document.getElementById('versionSelect');
  if (versionSelect) {
    const loadingOption = document.createElement('option');
    loadingOption.value = '';
    loadingOption.textContent = 'Loading versions...';
    loadingOption.disabled = true;
    loadingOption.selected = true;
    
    // Clear existing options except the first one
    while (versionSelect.options.length > 1) {
      versionSelect.remove(1);
    }
    
    // Add loading message
    versionSelect.add(loadingOption);
  }
  
  // Show loading state for test cycles
  const testCycleSelect = document.getElementById('testCycleSelect');
  if (testCycleSelect) {
    const loadingOption = document.createElement('option');
    loadingOption.value = '';
    loadingOption.textContent = 'Loading test cycles...';
    loadingOption.disabled = true;
    loadingOption.selected = true;
    
    // Clear existing options except the first one
    while (testCycleSelect.options.length > 1) {
      testCycleSelect.remove(1);
    }
    
    // Add loading message
    testCycleSelect.add(loadingOption);
  }
  
  // Load data from APIs
  try {
    // Load versions and then test cycles
    await Promise.all([
      loadJiraVersions(),
      loadZephyrTestCycles(-1) // Load test cycles with version_id=-1 by default
    ]);
  } catch (error) {
    console.error('Error in handleImportToJira:', error);
    showError('Failed to load data. Please try again.');
  }
}

// Handle confirm import button click
async function handleConfirmImport() {
  const versionSelect = document.getElementById('versionSelect');
  const testCycleSelect = document.getElementById('testCycleSelect');
  
  // Validate selections
  if (!versionSelect.value) {
    showError('Please select a version');
    versionSelect.focus();
    return;
  }
  
  if (!testCycleSelect.value) {
    showError('Please select a test cycle');
    testCycleSelect.focus();
    return;
  }
  
  // Get all test cases from the table
  const testCases = [];
  document.querySelectorAll('#resultsTable tbody tr').forEach(row => {
    const statusBadge = row.cells[5].querySelector('.badge');
    let statusId = -1; // Default to UNEXECUTED
    
    if (statusBadge) {
      const statusText = statusBadge.textContent.trim().toUpperCase();
      if (statusText === 'PASS') {
        statusId = 1;
      } else if (statusText === 'FAIL') {
        statusId = 2;
      } else if (statusText === 'WIP') {
        statusId = 3;
      } else if (statusText === 'UNEXECUTED') {
        statusId = -1;
      }
    }
    
    // Get the issue key from the heading if available
    const heading = document.getElementById('generatedTestCasesHeading');
    let relatedIssues = [];
    if (heading) {
      const issueKeyBadge = heading.querySelector('.badge.bg-primary');
      if (issueKeyBadge) {
        relatedIssues = [issueKeyBadge.textContent.trim()];
      }
    }
    
    // Get components from the original issue if available
    let components = [];
    const currentIssue = JSON.parse(document.getElementById('issueDetailsModal')?.dataset?.currentIssue || '{}');
    if (currentIssue && currentIssue.components && Array.isArray(currentIssue.components)) {
      components = currentIssue.components;
    }
    
    // Format steps
    const steps = [];
    const stepTexts = row.cells[2].textContent.trim().split('\n');
    const expectedResults = row.cells[3].textContent.trim().split('\n');
    
    stepTexts.forEach((step, index) => {
      if (step.trim()) {
        steps.push({
          step: step.trim(),
          stepDescription: step.trim(),
          data: "",
          result: expectedResults[index] ? expectedResults[index].trim() : ""
        });
      }
    });
    
    testCases.push({
      summary: row.cells[1].textContent.trim(),
      description: row.cells[1].textContent.trim(),
      components: components,
      related_issues: relatedIssues,
      steps: steps,
      version_id: parseInt(versionSelect.value),
      cycle_id: parseInt(testCycleSelect.value),
      execution_status: {
        id: statusId
      }
    });
  });
  
  if (testCases.length === 0) {
    showError('No test cases to import');
    return;
  }
  
  // Prepare the data for import
  const importData = {
    TestCases: testCases,
    version_id: parseInt(versionSelect.value),
    cycle_id: parseInt(testCycleSelect.value)
  };
  
  try {
    // Show loading state
    const importBtn = document.getElementById('confirmImportBtn');
    const originalBtnText = importBtn.innerHTML;
    importBtn.disabled = true;
    importBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Importing...';
    
    // Call the API to import test cases
    const response = await fetch('http://localhost:8000/api/test-cases/bulk/full-create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(importData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to import test cases to Jira');
    }
    
    // Show success message
    const successToast = new bootstrap.Toast(document.getElementById('successToast'));
    const toastBody = document.querySelector('#successToast .toast-body');
    if (toastBody) {
      toastBody.textContent = `Successfully imported ${testCases.length} test cases to Jira`;
    }
    successToast.show();
    
    // Close the modal
    const importModal = bootstrap.Modal.getInstance(document.getElementById('importToJiraModal'));
    importModal.hide();
    
  } catch (error) {
    console.error('Error importing test cases to Jira:', error);
    showError(error.message || 'Failed to import test cases to Jira');
  } finally {
    // Reset button state
    const importBtn = document.getElementById('confirmImportBtn');
    if (importBtn) {
      importBtn.disabled = false;
      importBtn.innerHTML = '<i class="bi bi-cloud-upload me-1"></i>Import';
    }
  }
}

// Initialize event listeners
function initializeEventListeners() {
  console.log('Initializing event listeners...');
  // Handle Import to Jira button click
  const importToJiraBtn = document.getElementById('importToJiraBtn');
  if (importToJiraBtn) {
    importToJiraBtn.addEventListener('click', handleImportToJira);
  }

  // Handle Import button in the modal
  const confirmImportBtn = document.getElementById('confirmImportBtn');
  if (confirmImportBtn) {
    confirmImportBtn.addEventListener('click', handleConfirmImport);
  }

  // Handle Execution Status dropdown changes
  document.addEventListener('change', (e) => {
    if (e.target.matches('.execution-status')) {
      const testId = e.target.getAttribute('data-test-id');
      const status = e.target.value;
      console.log(`Test case ${testId} status changed to:`, status);
      
      // Update the test case data with the new status
      const testCases = Array.from(document.querySelectorAll('#resultsTable tbody tr')).map(row => {
        const testId = row.querySelector('.execution-status')?.getAttribute('data-test-id');
        const status = row.querySelector('.execution-status')?.value || 'UNEXECUTED';
        return { id: testId, executionStatus: status };
      });
      
      // You can add additional logic here to save the status to your data store
      // For example: saveTestCases(testCases);
    }
  });

  // Handle click on Generate button in the table
  document.addEventListener('click', async (e) => {
    if (e.target.closest('.generate-btn')) {
      e.preventDefault();
      e.stopPropagation();
      
      try {
        const row = e.target.closest('tr');
        if (!row) {
          console.error('Could not find parent row for the generate button');
          return;
        }
        
        // Get the issue data from the row's data attribute
        const issueDataStr = row.getAttribute('data-issue');
        if (!issueDataStr) {
          console.error('No data-issue attribute found on the row');
          return;
        }
        
        // Parse the issue data
        let issueData;
        try {
          issueData = JSON.parse(issueDataStr);
        } catch (parseError) {
          console.error('Error parsing issue data:', parseError);
          return;
        }
        
        console.log('Showing details for issue:', issueData.key);
        
        // Show the issue details in the modal
        const modal = showIssueDetails(issueData);
        
        // Ensure the modal is shown
        const modalInstance = bootstrap.Modal.getInstance(modal) || new bootstrap.Modal(modal);
        modalInstance.show();
        
      } catch (error) {
        console.error('Error handling generate button click:', error);
        
        // Show error toast
        const errorToastEl = document.getElementById('errorToast');
        if (errorToastEl) {
          const errorToast = bootstrap.Toast.getOrCreateInstance(errorToastEl);
          const errorToastBody = errorToastEl.querySelector('.toast-body');
          errorToastBody.textContent = 'Failed to load issue details. Please try again.';
          errorToast.show();
        }
      }
    }
  });
  
  // Use event delegation for the Generate More button since it might be dynamically added
  document.addEventListener('click', async function(e) {
    console.log('📌 Document click event detected');
    const generateMoreBtn = e.target.closest('#generateMoreBtn');
    
    if (!generateMoreBtn) {
      console.log('Click was not on Generate More button');
      return;
    }
    
    console.log('✅ Generate More button clicked (delegated)');
    e.preventDefault();
    e.stopPropagation();
    
    // Disable button and show loading state
    console.log('🔄 Updating button state to loading...');
    const originalHtml = generateMoreBtn.innerHTML;
    generateMoreBtn.disabled = true;
    generateMoreBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Generating...';
    
    console.log('Button state updated, calling handleGenerateMoreTestCases...');
    
    try {
      await handleGenerateMoreTestCases();
    } catch (error) {
      console.error('Error in handleGenerateMoreTestCases:', error);
      
      // Show error message to the user
      let errorMessage = error.message || 'Failed to generate more test cases.';
      
      // More specific error messages for common issues
      if (errorMessage.includes('Could not find details for issue')) {
        errorMessage = `Could not find the issue details. Please make sure the issue is still visible on the page.`;
      } else if (errorMessage.includes('NetworkError')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      const errorToastEl = document.getElementById('errorToast');
      if (errorToastEl) {
        const errorToast = bootstrap.Toast.getOrCreateInstance(errorToastEl);
        const errorToastBody = errorToastEl.querySelector('.toast-body');
        if (errorToastBody) {
          errorToastBody.innerHTML = `
            <div class="d-flex align-items-center">
              <i class="bi bi-exclamation-triangle-fill text-danger me-2"></i>
              <span>${errorMessage}</span>
            </div>
          `;
          errorToast.show();
        }
      }
    } finally {
      // Always re-enable the button
      if (generateMoreBtn) {
        generateMoreBtn.disabled = false;
        generateMoreBtn.innerHTML = originalHtml;
      }
    }
  });
  
  // Handle Generate Test Cases button in the modal
  const generateBtn = document.getElementById('generateTestCasesBtn');
  if (generateBtn) {
    // Remove any existing event listeners to prevent duplicates
    const newGenerateBtn = generateBtn.cloneNode(true);
    generateBtn.parentNode.replaceChild(newGenerateBtn, generateBtn);
    
    newGenerateBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('Generate Test Cases button clicked');
      const modal = document.getElementById('issueDetailsModal');
      if (!modal) {
        console.error('Modal element not found');
        return;
      }
      
      // Close the modal
      const modalInstance = bootstrap.Modal.getInstance(modal);
      if (modalInstance) {
        modalInstance.hide();
      }
      
      try {
        const issueData = modal.dataset.currentIssue;
        if (!issueData) {
          throw new Error('No issue data found in modal');
        }
        
        const issue = JSON.parse(issueData);
        console.log('Generating test cases for issue:', issue.key);
        
        if (!issue.key) {
          throw new Error('Invalid issue data: missing key');
        }
        
        // Show loading toast
        const loadingToastEl = document.getElementById('loadingToast');
        const loadingToast = bootstrap.Toast.getOrCreateInstance(loadingToastEl);
        loadingToast.show();
        
        try {
          // Generate test cases
          const testCases = await generateTestCasesFromIssue(issue);
          
          // Show success toast with test case count
          const successToastEl = document.getElementById('successToast');
          const successToast = bootstrap.Toast.getOrCreateInstance(successToastEl);
          const testCaseCountEl = document.getElementById('testCaseCount');
          
          if (testCaseCountEl) {
            testCaseCountEl.textContent = testCases.length;
          }
          
          successToast.show();
          
          return testCases;
        } finally {
          // Hide loading toast if still showing
          loadingToast.hide();
        }
        
        // Scroll to the test cases section
        if (testCases && testCases.length > 0) {
          const resultsSection = document.getElementById('testCasesSection');
          if (resultsSection) {
            setTimeout(() => {
              resultsSection.scrollIntoView({ behavior: 'smooth' });
            }, 300);
          }
        }
        
      } catch (error) {
        console.error('Error in generate button click handler:', error);
        // Show error message
        const errorToastEl = document.getElementById('errorToast');
        if (errorToastEl) {
          const errorToast = bootstrap.Toast.getOrCreateInstance(errorToastEl);
          const errorToastBody = errorToastEl.querySelector('.toast-body');
          errorToastBody.textContent = error.message || 'Failed to process request. Check console for details.';
          errorToast.show();
        }
      }
    });
  } else {
    console.error('Generate Test Cases button not found');
  }
  // Apply filters button
  document.getElementById('applyFilters')?.addEventListener('click', applyFilters);
  
  // Add Enter key event listener for jqlFilter input
  document.getElementById('jqlFilter')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      applyFilters();
    }
  });
  
  // Clear filters button
  document.getElementById('clearFilters')?.addEventListener('click', clearFilters);
  
  // Search input (debounced)
  let searchTimeout;
  document.getElementById('globalSearch')?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFilters, 500);
  });
  
  // Pagination
  document.getElementById('prevJiraPage')?.addEventListener('click', () => {
    if (currentStartAt >= MAX_RESULTS) {
      currentStartAt -= MAX_RESULTS;
      loadJiraIssues();
    }
  });
  
  document.getElementById('nextJiraPage')?.addEventListener('click', () => {
    if (currentStartAt + MAX_RESULTS < totalResults) {
      currentStartAt += MAX_RESULTS;
      loadJiraIssues();
    }
  });
}

// Export test cases to Excel
function exportToExcel() {
  try {
    const table = document.getElementById('resultsTable');
    if (!table) {
      console.error('Results table not found');
      return;
    }
    
    // Get all rows from the table (skip the header)
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    if (rows.length === 0) {
      showError('No test cases to export');
      return;
    }
    
    // Prepare the data for export
    const data = [
      ['ID', 'Title', 'Steps', 'Expected Result', 'Priority', 'Execution Status'] // Header row
    ];
    
    // Add data rows
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 5) {
        // Get the selected value from the execution status dropdown
        const executionStatus = cells[5]?.querySelector('select')?.value || 'UNEXECUTED';
        
        data.push([
          cells[0]?.textContent?.trim() || '',
          cells[1]?.textContent?.trim() || '',
          cells[2]?.textContent?.trim() || '',
          cells[3]?.textContent?.trim() || '',
          cells[4]?.querySelector('.badge')?.textContent?.trim() || '',
          executionStatus
        ]);
      }
    });
    
    // Create a new workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // ID
      { wch: 40 }, // Title
      { wch: 60 }, // Steps
      { wch: 60 }, // Expected Result
      { wch: 15 }, // Priority
      { wch: 15 }  // Execution Status
    ];
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Test Cases');
    
    // Generate the Excel file
    const fileName = `TestCases_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    // Show success message
    const successToastEl = document.getElementById('successToast');
    if (successToastEl) {
      const successToast = bootstrap.Toast.getOrCreateInstance(successToastEl);
      const toastBody = successToastEl.querySelector('.toast-body');
      if (toastBody) {
        toastBody.textContent = `Exported ${rows.length} test cases to ${fileName}`;
      }
      successToast.show();
    }
    
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    showError('Failed to export test cases to Excel');
  }
}

// Make table columns resizable
function makeResizableColumns() {
  const resizableColumns = document.querySelectorAll('th[data-resizable="true"]');
  
  resizableColumns.forEach((header, index) => {
    let startX, startWidth;
    const column = header;
    const nextColumn = column.nextElementSibling;
    
    const onMouseDown = (e) => {
      startX = e.pageX;
      startWidth = column.offsetWidth;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      e.preventDefault();
    };
    
    const onMouseMove = (e) => {
      const newWidth = startWidth + (e.pageX - startX);
      
      // Set minimum width
      if (newWidth > 50) {
        column.style.width = `${newWidth}px`;
        
        // Update the col element width if it exists
        const colgroup = document.querySelector('colgroup');
        if (colgroup && colgroup.children[index]) {
          colgroup.children[index].style.width = `${newWidth}px`;
        }
      }
    };
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    column.addEventListener('mousedown', onMouseDown);
    
    // Prevent text selection while resizing
    column.addEventListener('selectstart', (e) => {
      e.preventDefault();
    });
  });
}

// Initialize the page
function initializePage() {
  loadJiraBoards();
  loadJiraComponents();
  loadJiraSprints();
  initializeEventListeners();
  loadJiraIssues(); // Load issues on page load
  
  // Add event listener for export button
  const exportBtn = document.getElementById('exportToExcelBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportToExcel);
  }
  
  // Initialize toast timestamps
  updateToastTimestamps();
  setInterval(updateToastTimestamps, 30000); // Update timestamps every 30 seconds
  
  // Make columns resizable after table is loaded
  makeResizableColumns();
}

// Run initialization when DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePage);
} else {
  initializePage();
}

// Update the timestamp in toasts
function updateToastTimestamps() {
  const timeElements = document.querySelectorAll('.toast-header small');
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  
  timeElements.forEach(el => {
    el.textContent = timeString;
  });
}

document.getElementById("generateBtn")?.addEventListener("click", async () => {
  const userStory = document.getElementById("userStory")?.value.trim();
  const loading = document.getElementById("loading");
  const errorDiv = document.getElementById("error");
  const resultsTable = document.querySelector("#resultsTable tbody");
  const testCaseCountElement = document.getElementById("testCaseCount");
  const successToastEl = document.getElementById('successToast');
  const successToast = successToastEl ? new bootstrap.Toast(successToastEl) : null;
  const loadingToastEl = document.getElementById('loadingToast');
  const loadingToast = loadingToastEl ? new bootstrap.Toast(loadingToastEl) : null;

  try {
    console.log('Generate button clicked');
    
    // Reset UI
    errorDiv?.classList.add("d-none");
    resultsTable.innerHTML = "";
    document.querySelectorAll('.toast').forEach(toast => {
      const bsToast = bootstrap.Toast.getInstance(toast);
      if (bsToast) bsToast.hide();
    });

    if (!userStory) {
      showError("Please enter a user story.");
      return;
    }

    // Show loading state
    console.log('Showing loading state');
    loading?.classList.remove("d-none");
    updateToastTimestamps();
    loadingToast?.show();

    console.log('Sending request to /generate endpoint');
    const response = await fetch("http://localhost:5000/generate", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ 
        description: userStory,
        summary: userStory.substring(0, 100)
      }),
    });

    console.log('Received response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      let errorMessage = `Failed to generate test cases: ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Response data:', data);
    
    console.log('Raw API response data:', data);

    let testCases = [];
    if (Array.isArray(data)) {
      testCases = data;
    } else if (data && typeof data === 'object') {
      testCases = data.testCases || data.data || [];
      
      // If we have a single test case object, wrap it in an array
      if (testCases && !Array.isArray(testCases)) {
        testCases = [testCases];
      }
    }
    
    console.log('Processed test cases:', testCases);
    
    if (!testCases || testCases.length === 0) {
      throw new Error('No test cases were generated. The response was empty or in an unexpected format.');
    }
    
    // Update the test cases table
    console.log('Updating test cases table with', testCases.length, 'test cases');
    
    // Force reflow to ensure the table is properly updated
    const table = document.querySelector('#resultsTable');
    if (table) {
      table.style.display = 'none';
      table.offsetHeight; // Trigger reflow
      table.style.display = '';
    }
    
    updateTestCasesTable(testCases);
    
    // Update test case count
    if (testCaseCountElement) {
      testCaseCountElement.textContent = testCases.length;
    }
    
    // Show success message
    updateToastTimestamps();
    successToast?.show();
    
    // Show the test cases section if it was hidden
    const testCasesSection = document.getElementById('testCasesSection');
    if (testCasesSection) {
      testCasesSection.classList.remove('d-none');
    }
  } catch (error) {
    console.error('Error generating test cases:', error);
    showError(error.message || 'Failed to generate test cases. Please check the console for details.');
    
    // Hide loading state if it's still visible
    const loading = document.getElementById("loading");
    const loadingToastEl = document.getElementById('loadingToast');
    const loadingToast = bootstrap.Toast.getOrCreateInstance(loadingToastEl);
    
    loading?.classList.add("d-none");
    loadingToast?.hide();
  }
});

