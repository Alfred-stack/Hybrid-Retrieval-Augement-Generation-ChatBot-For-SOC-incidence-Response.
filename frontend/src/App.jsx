import React, {
  useState,
  useEffect,
  useRef
} from 'react';

import {
  sendMessage,
  fetchMessages,
  fetchSessions
} from './api';

import './App.css';

function App() {

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [sessions, setSessions] = useState([]);

  const [currentSession, setCurrentSession] =
    useState('default');

  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  const messagesEndRef = useRef(null);


 
  // LOAD SESSIONS
  useEffect(() => {
    loadSessions();
  }, []);


 
  // LOAD MESSAGES WHEN SESSION CHANGES
  useEffect(() => {

    if (currentSession) {
      loadMessages(currentSession);
    }

  }, [currentSession]);


  
  // AUTO SCROLL
  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });

  }, [messages]);


  
  // LOAD SESSIONS
  const loadSessions = async () => {

    try {

      const data = await fetchSessions();

      setSessions(data);

    } catch (error) {

      console.error(
        'Failed to load sessions:',
        error
      );

    }
  };


  
  // LOAD MESSAGES
 

  const loadMessages = async (sessionId) => {

    try {

      const data =
        await fetchMessages(sessionId);

      setMessages(data);

    } catch (error) {

      console.error(
        'Failed to load messages:',
        error
      );

      setMessages([]);
    }
  };


  
  // SEND MESSAGE
  const handleSend = async () => {

    const question = input.trim();

    if (!question || loading) {
      return;
    }

    // Show user message immediately
    const userMsg = {
      role: 'user',
      content: question,
      timestamp: new Date()
    };

    setMessages(prev => [
      ...prev,
      userMsg
    ]);

    setInput('');
    setLoading(true);

    try {

      const response =
        await sendMessage(
          question,
          currentSession
        );

      // Update session if backend returns one
      if (response.sessionId) {

        setCurrentSession(
          response.sessionId
        );

      }

      // Add assistant response
      const assistantMsg = {
        role: 'assistant',
        content: response.answer,
        timestamp: new Date()
      };

      setMessages(prev => [
        ...prev,
        assistantMsg
      ]);

      // Refresh sessions
      await loadSessions();

    } catch (error) {

      console.error(
        'Error sending message:',
        error
      );

      const errorMessage =
        error.response?.data?.error ||
        'Sorry, an error occurred while communicating with the server.';

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: errorMessage,
          timestamp: new Date()
        }
      ]);

    } finally {

      setLoading(false);

    }
  };


  // CREATE NEW SESSION
  const createNewSession = () => {

    const newId =
      'session_' + Date.now();

    setCurrentSession(newId);
    setMessages([]);

  };


  // SWITCH SESSION
  const switchSession = (sessionId) => {

    setCurrentSession(sessionId);

  };


  
  // ENTER KEY
  const handleKeyDown = (event) => {

    if (
      event.key === 'Enter' &&
      !event.shiftKey
    ) {

      event.preventDefault();

      handleSend();

    }

  };


 
  // RENDER ASSISTANT RESPONSE
  const renderAssistantMessage = (content) => {

    if (!content) {

      return (
        <div className="message-content">
          No response received.
        </div>
      );

    }

    /*
      The backend response contains:

      Source:
      Incident ID: ...
      Playbook: ...
      Source Type: ...

      We separate that section from the
      main assistant answer so that the
      source information can be displayed
      in its own verification box.
    */

    const sourceMarker = '\nSource:';

    const sourceIndex =
      content.indexOf(sourceMarker);


    // If no source section exists,
    // display the answer normally.
    if (sourceIndex === -1) {

      return (
        <div className="message-content">
          {content}
        </div>
      );

    }


    // Main answer
    const answer =
      content
        .substring(0, sourceIndex)
        .trim();


    // Source section
    const source =
      content
        .substring(sourceIndex)
        .trim();


    // Remove "Source:" heading
    const sourceLines =
      source
        .replace(/^Source:\s*/i, '')
        .split('\n');


    return (
      <>

        {/* MAIN ANSWER */}

        <div className="message-content">
          {answer}
        </div>


        {/* SOURCE / VERIFICATION */}

        <div className="source-info">

          <div className="source-info-title">
            Source & Verification
          </div>


          {sourceLines.map(
            (line, index) => {

              const separator =
                line.indexOf(':');


              // Handle a line without
              // a label/value separator.
              if (separator === -1) {

                return (
                  <div
                    key={index}
                    className="source-info-item"
                  >
                    {line}
                  </div>
                );

              }


              const label =
                line
                  .substring(
                    0,
                    separator
                  )
                  .trim();


              const value =
                line
                  .substring(
                    separator + 1
                  )
                  .trim();


              return (
                <div
                  key={index}
                  className="source-info-item"
                >

                  <span className="source-info-label">
                    {label}:
                  </span>

                  {' '}

                  {value}

                </div>
              );

            }
          )}

        </div>

      </>
    );

  };


  
  // UI
  return (

    <div className="App">

      {/* ========================================================
          SIDEBAR
          ======================================================== */}

      <div
        className={`sidebar ${
          sidebarOpen
            ? 'open'
            : 'closed'
        }`}
      >

        <div className="sidebar-header">

          <h2>Sessions</h2>

          <button
            onClick={createNewSession}
            className="new-session-btn"
          >
            + New
          </button>

        </div>


        <div className="session-list">

          {sessions.map(session => (

            <div
              key={session.sessionId}
              className={`session-item ${
                session.sessionId === currentSession
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                switchSession(
                  session.sessionId
                )
              }
            >

              <span className="session-id">
                {session.sessionId}
              </span>

              <span className="session-date">

                {new Date(
                  session.updatedAt
                ).toLocaleDateString()}

              </span>

            </div>

          ))}


          {sessions.length === 0 && (

            <div className="no-sessions">
              No sessions yet
            </div>

          )}

        </div>

      </div>


      {/* ========================================================
          CHAT AREA
          ======================================================== */}

      <div className="chat-area">


        {/* ======================================================
            HEADER
            ====================================================== */}

        <div className="chat-header">

          <button
            className="menu-toggle"
            onClick={() =>
              setSidebarOpen(
                !sidebarOpen
              )
            }
          >
            ☰
          </button>


          <h1>
            AL-RAG Assistant
          </h1>


          <div className="session-indicator">
            Session: {currentSession}
          </div>

        </div>


        {/* ======================================================
            MESSAGES
            ====================================================== */}

        <div className="chat-messages">


          {/* WELCOME MESSAGE */}

          {messages.length === 0 && (

            <div className="welcome-message">

              <h2>
                Welcome to AL-RAG Assistant
              </h2>

              <p>
                Ask me anything about
                incident response,
                security operations,
                or playbooks in a Network Environment. 
              </p>

            </div>

          )}


          {/* CHAT MESSAGES */}

          {messages.map(
            (message, index) => (

              <div
                key={index}
                className={`message-wrapper ${
                  message.role
                }`}
              >

                <div
                  className={`message ${
                    message.role
                  }`}
                >


                  {/* ASSISTANT */}

                  {message.role === 'assistant' ? (

                    renderAssistantMessage(
                      message.content
                    )

                  ) : (

                    /* USER */

                    <div className="message-content">
                      {message.content}
                    </div>

                  )}


                  {/* MESSAGE TIME */}

                  <div className="message-time">

                    {new Date(
                      message.timestamp
                    ).toLocaleTimeString()}

                  </div>


                </div>

              </div>

            )
          )}


          {/* ====================================================
              LOADING
              ==================================================== */}

          {loading && (

            <div className="message-wrapper assistant">

              <div className="message assistant loading-message">

                <div className="typing-indicator">

                  <span></span>
                  <span></span>
                  <span></span>

                </div>

              </div>

            </div>

          )}


          <div ref={messagesEndRef} />

        </div>


        {/* ======================================================
            INPUT
            ====================================================== */}

        <div className="chat-input-area">

          <input
            type="text"
            value={input}
            onChange={(event) =>
              setInput(event.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder="Type your question..."
            disabled={loading}
          />


          <button
            onClick={handleSend}
            disabled={
              loading ||
              !input.trim()
            }
          >
            {loading ? '⏳' : '➤'}
          </button>

        </div>

      </div>

    </div>

  );

}

export default App;