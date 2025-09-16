// Theme Configuration
const THEME_KEY = 'preferred-theme';
const THEME_LIGHT = 'light';
const THEME_DARK = 'dark';

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

// Global variables for pagination
let currentStartAt = 0;
const MAX_RESULTS = 5;
let totalResults = 0;

// Helper function to format status badge
function getStatusBadge(status) {
  const statusColors = {
    'to-do': '#BFC1C4',
    'open': '#CECFD2',
    'in progress': '#8FB8F6',
    'closed': '#B3DF72',
    'done': '#B3DF72'
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
    'epic': '#BF63F3'
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
async function generateTestCasesFromIssue(issue) {
  console.log('Starting test case generation for issue:', issue.key);
  
  try {
    
    // Don't show loading toast here - it's now handled in the click handler
    
    // Prepare the request payload with the full issue description
    const payload = {
      prompt: issue.description || '', // Send the full description as prompt
      issue_key: issue.key,
      summary: issue.summary || '',
      issue_type: issue.issue_type || '',
      status: issue.status || ''
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
    
    console.log('Generated test cases:', testCases);
    
    // Update the test cases table
    updateTestCasesTable(testCases);
    
    // Don't show success toast here - it's now handled in the click handler
    
    // Update test case count
    const testCaseCount = document.getElementById('testCaseCount');
    if (testCaseCount) {
      testCaseCount.textContent = testCases.length;
    }
    
    return testCases;
    
  } catch (error) {
    console.error('Error generating test cases:', error);
    
    // Show error message
    const errorToastEl = document.getElementById('errorToast');
    const errorToast = bootstrap.Toast.getOrCreateInstance(errorToastEl);
    const errorToastBody = errorToastEl.querySelector('.toast-body');
    errorToastBody.textContent = error.message || 'Failed to generate test cases. Please check the console for details.';
    errorToast.show();
    
    // Re-throw the error for further handling if needed
    throw error;
  }
}

// Update the test cases table with generated test cases
function updateTestCasesTable(testCases) {
  try {
    console.log('[updateTestCasesTable] Starting to update table with test cases:', testCases);
    
    const tbody = document.querySelector('#resultsTable tbody');
    if (!tbody) {
      console.error('[updateTestCasesTable] Error: Test cases table body not found');
      return;
    }
    
    tbody.innerHTML = ''; // Clear existing rows
    
    // Update the Import to Jira button state
    const importToJiraBtn = document.getElementById('importToJiraBtn');
    if (importToJiraBtn) {
      importToJiraBtn.disabled = !testCases || testCases.length === 0;
    }
    
    if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
      console.warn('[updateTestCasesTable] No test cases provided or empty array');
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4">
            <div class="text-muted">No test cases were generated. Please try again.</div>
          </td>
        </tr>`;
      return;
    }
    
    // Scroll to position the test cases in the middle of the screen
    setTimeout(() => {
      const anchor = document.getElementById('testCasesAnchor');
      if (anchor) {
        // Calculate the position to scroll to (70% from the top of the viewport)
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const anchorPosition = anchor.getBoundingClientRect().top + window.pageYOffset;
        const scrollTo = anchorPosition - (viewportHeight * 0.3); // Position at 30% from top (showing 70% below)
        
        // Smooth scroll to the calculated position
        window.scrollTo({
          top: scrollTo,
          behavior: 'smooth'
        });
      }
    }, 100);
    
    // Create table rows for each test case
    testCases.forEach((testCase, index) => {
      try {
        console.log(`[updateTestCasesTable] Processing test case ${index + 1}:`, testCase);
        
        const row = document.createElement('tr');
        row.className = 'fade-in';
        row.style.animationDelay = `${index * 50}ms`;
        
        // Extract test case data with fallbacks
        const testCaseId = testCase.id || testCase.testCaseId || `TC-${index + 1}`;
        const testCaseTitle = testCase.title || testCase.name || `Test Case ${index + 1}`;
        const priority = testCase.priority || 'medium';
        const executionStatus = testCase.executionStatus || 'UNEXECUTED';
        
        // Format steps - handle both string and array formats
        let steps = 'N/A';
        if (Array.isArray(testCase.steps)) {
          steps = testCase.steps.map((step, i) => `${i + 1}. ${step}`).join('<br>');
        } else if (testCase.steps) {
          steps = testCase.steps.toString().replace(/\n/g, '<br>');
        }
        
        // Format expected results - handle both string and array formats
        let expectedResults = 'N/A';
        if (Array.isArray(testCase.expectedResults)) {
          expectedResults = testCase.expectedResults.join('<br>');
        } else if (testCase.expectedResults) {
          expectedResults = testCase.expectedResults.toString().replace(/\n/g, '<br>');
        } else if (testCase.expectedResult) {
          expectedResults = Array.isArray(testCase.expectedResult) 
            ? testCase.expectedResult.join('<br>')
            : testCase.expectedResult.toString().replace(/\n/g, '<br>');
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
        
        // Function to create priority badge
        function createPriorityBadge(priority) {
          const priorityLower = priority ? priority.toLowerCase() : 'medium';
          let badgeClass = 'secondary';
          
          switch(priorityLower) {
            case 'high':
              badgeClass = 'bg-danger';
              break;
            case 'medium':
              badgeClass = 'bg-warning';
              break;
            case 'low':
              badgeClass = 'bg-success';
              break;
            default:
              badgeClass = 'bg-secondary';
          }
          
          return `<span class="badge ${badgeClass}">${priority || 'Medium'}</span>`;
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
        
        // Create the row content
        row.innerHTML = `
          <td class="text-nowrap">${testCaseId}</td>
          <td class="wrap-text">${testCaseTitle}</td>
          <td class="wrap-text">${steps}</td>
          <td class="wrap-text">${expectedResults}</td>
          <td class="text-nowrap">${createPriorityBadge(testCase.priority || 'medium')}</td>
          <td class="text-nowrap">
            ${statusStyles}
            <select class="form-select form-select-sm execution-status" 
                    data-test-id="${testCaseId}" 
                    style="background-color: ${executionStatus === 'UNEXECUTED' ? '#ffffff' : getStatusColor(executionStatus)}; color: ${executionStatus === 'UNEXECUTED' ? '#000000' : 'white'}; transition: background-color 0.3s ease, color 0.3s ease;">
              <option value="UNEXECUTED" ${executionStatus === 'UNEXECUTED' ? 'selected' : ''} style="background-color: #ffffff; color: #000000;">UNEXECUTED</option>
              <option value="PASS" ${executionStatus === 'PASS' ? 'selected' : ''} style="background-color: #198754; color: white;">PASS</option>
              <option value="FAIL" ${executionStatus === 'FAIL' ? 'selected' : ''} style="background-color: #dc3545; color: white;">FAIL</option>
              <option value="BLOCKED" ${executionStatus === 'BLOCKED' ? 'selected' : ''} style="background-color: #4a2d82; color: white;">BLOCKED</option>
            </select>
          </td>
          <td class="text-nowrap">
            <button class="btn btn-sm btn-outline-primary edit-test-case" data-test-id="${testCaseId}" title="Edit test case">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger delete-test-case" data-test-id="${testCaseId}" title="Delete test case">
              <i class="bi bi-trash"></i>
            </button>
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
          <td class="text-end">
            <div class="btn-group btn-group-sm" role="group">
              <button class="btn btn-outline-primary edit-test-case" data-test-id="${testCaseId}" title="Edit test case">
                <i class="bi bi-pencil"></i> Edit
              </button>
              <button class="btn btn-outline-danger delete-test-case" data-test-id="${testCaseId}" title="Delete test case">
                <i class="bi bi-trash"></i> Delete
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
            row.remove();
            
            // Update the test case count
            const testCaseCount = document.getElementById('testCaseCount');
            if (testCaseCount) {
              const currentCount = parseInt(testCaseCount.textContent) || 0;
              testCaseCount.textContent = Math.max(0, currentCount - 1);
              
              // If no test cases left, show empty state
              if (currentCount - 1 <= 0) {
                tbody.innerHTML = `
                  <tr>
                    <td colspan="6" class="text-center py-4">
                      <div class="text-muted">No test cases generated yet.</div>
                    </td>
                  </tr>`;
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
          }, 300);
        }
      });
    });
    
    // Scroll to the test cases section
    setTimeout(() => {
      testCasesSection?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    
  } catch (error) {
    console.error('Error updating test cases table:', error);
    
    // Show error in the table
    const tbody = document.querySelector('#resultsTable tbody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-4 text-danger">
            <div>Error displaying test cases</div>
            <div class="small text-muted">${error.message || 'Please check the console for details'}</div>
          </td>
        </tr>`;
    }
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
  return priorityColors[normalizedPriority] || '#6C757D';
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
    testCases.push({
      id: row.getAttribute('data-test-id'),
      title: row.cells[1].textContent.trim(),
      steps: row.cells[2].textContent.trim(),
      expectedResult: row.cells[3].textContent.trim(),
      priority: row.cells[4].textContent.trim()
    });
  });
  
  if (testCases.length === 0) {
    showError('No test cases to import');
    return;
  }
  
  // Prepare the data for import
  const importData = {
    version: versionSelect.value,
    testCycle: testCycleSelect.value,
    testCases: testCases
  };
  
  try {
    // Show loading state
    const importBtn = document.getElementById('confirmImportBtn');
    const originalBtnText = importBtn.innerHTML;
    importBtn.disabled = true;
    importBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Importing...';
    
    // TODO: Replace with actual API call to your backend
    const response = await fetch('/api/jira/import-test-cases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(importData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to import test cases to Jira');
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

// Helper function to get badge class based on priority
function getPriorityBadgeClass(priority) {
  if (!priority) return 'secondary';
  const priorityLower = priority.toLowerCase();
  return {
    'high': 'danger',
    'medium': 'warning',
    'low': 'success'
  }[priorityLower] || 'secondary';
}
