import { Session } from './types';

const saveButton = document.getElementById('save-session') as HTMLButtonElement;
const restoreButton = document.getElementById('restore-session') as HTMLButtonElement;
const sessionNameInput = document.getElementById('sessionName') as HTMLInputElement;
const sessionList = document.getElementById('session-list') as HTMLUListElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;
const deleteAllButton = document.getElementById('delete-all-sessions') as HTMLButtonElement;
// Utility function to update status messages
function updateStatus(message: string, isError = false) {
  statusDiv.textContent = message;
  statusDiv.style.color = isError ? 'red' : 'green';
  setTimeout(() => {
    statusDiv.textContent = '';
  }, 3000);
}

// Function to load sessions from storage and update the UI
async function loadSessions() {
  const result = await chrome.storage.local.get('sessions');
  const sessions: Session[] = result.sessions || [];
  sessionList.innerHTML = ''; // Clear the current list
  sessions.forEach(session => {
    const li = document.createElement('li');
    li.textContent = `${session.name} (${new Date(session.createdAt).toLocaleString()}) `;
    
    // Create a restore button for each session
    const restoreBtn = document.createElement('button');
    restoreBtn.textContent = 'Restore';
    restoreBtn.addEventListener('click', () => {
      restoreSession(session);
    });
    li.appendChild(restoreBtn);
    // Create a delete button for each session
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.style.marginLeft = '5px'; // Optional: adds some spacing
    deleteBtn.addEventListener('click', () => {
      deleteSession(session.id);
    });
    li.appendChild(deleteBtn);

    sessionList.appendChild(li);
  });
}

// Save session when the Save button is clicked
saveButton.addEventListener('click', async () => {
  // Retrieve all tabs in the current window
  const tabs = await chrome.tabs.query({ currentWindow: true });
  // Build a session object
  const session: Session = {
    id: Date.now().toString(),
    name: sessionNameInput.value || `Session ${new Date().toLocaleTimeString()}`,
    createdAt: new Date().toISOString(),
    tabs: tabs.map(tab => ({
      title: tab.title || '',
      url: tab.url || ''
    }))
  };
  
  // Retrieve any existing sessions and add the new session
  const result = await chrome.storage.local.get('sessions');
  const sessions: Session[] = result.sessions || [];
  sessions.push(session);
  await chrome.storage.local.set({ sessions });
  
  updateStatus('Session saved!');
  sessionNameInput.value = '';
  loadSessions(); // Refresh the list of sessions
});

// Restore session when the global Restore button is clicked (restores the most recent session)
restoreButton.addEventListener('click', async () => {
  const result = await chrome.storage.local.get('sessions');
  const sessions: Session[] = result.sessions || [];
  if (sessions.length > 0) {
    const lastSession = sessions[sessions.length - 1];
    restoreSession(lastSession);
  } else {
    updateStatus('No sessions to restore.', true);
  }
});

// Delete all sessions when the Delete All button is clicked
deleteAllButton.addEventListener('click', async () => {
  await chrome.storage.local.set({ sessions: [] });
  updateStatus('All sessions deleted!');
  loadSessions();
});

// Function to restore a session by opening all its URLs in a new window
function restoreSession(session: Session) {
  const urls = session.tabs.map(tab => tab.url);
  chrome.windows.create({ url: urls }, () => {
    updateStatus(`Restored session: ${session.name}`);
  });
}

async function deleteSession(sessionId: string) {
    const result = await chrome.storage.local.get('sessions');
    let sessions: Session[] = result.sessions || [];
    sessions = sessions.filter(session => session.id !== sessionId);
    await chrome.storage.local.set({ sessions });
    updateStatus('Session deleted!');
    loadSessions();
  }

// Load sessions when the popup is first opened
loadSessions();
