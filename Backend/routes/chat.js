const express = require('express');
const axios = require('axios');

const Session = require('../models/Session');
const Message = require('../models/Message');

const router = express.Router();

const RAG_SERVICE_URL =
  process.env.RAG_SERVICE_URL || 'http://localhost:8000';


// POST /api/chat/stream
router.post('/stream', async (req, res) => {

  try {

    const {
      question,
      sessionId = 'default'
    } = req.body;

    if (!question || !question.trim()) {

      return res.status(400).json({
        error: 'Question is required'
      });

    }

    console.log('----------------------------------------');
    console.log('[STREAM] Question:', question);
    console.log('[STREAM] Session:', sessionId);


    // UPDATE SESSION

    await Session.findOneAndUpdate(

      { sessionId },

      {
        sessionId,
        updatedAt: new Date()
      },

      {
        upsert: true,
        new: true
      }

    );


    // SAVE USER MESSAGE

    await Message.create({

      sessionId,

      role: 'user',

      content: question

    });


    // CALL PYTHON RAG STREAM

    console.log(
      `[STREAM] Calling RAG service: ${RAG_SERVICE_URL}/chat/stream`
    );

    const response = await axios({

      method: 'post',

      url: `${RAG_SERVICE_URL}/chat/stream`,

      data: {

        question,

        session_id: sessionId

      },

      responseType: 'stream',

      timeout: 600000

    });


    // STREAM HEADERS

    res.setHeader(
      'Content-Type',
      'text/plain; charset=utf-8'
    );

    res.setHeader(
      'Transfer-Encoding',
      'chunked'
    );

    res.setHeader(
      'Cache-Control',
      'no-cache'
    );


    // KEEP FULL ANSWER FOR DATABASE

    let fullAnswer = '';


    response.data.on(
      'data',
      (chunk) => {

        const text =
          chunk.toString();

        fullAnswer += text;

      }
    );


    response.data.on(
      'end',
      async () => {

        console.log(
          '[STREAM] Stream ended.'
        );

        console.log(
          '[STREAM] Saving assistant response...'
        );

        try {

          await Message.create({

            sessionId,

            role: 'assistant',

            content:
              fullAnswer ||
              'No response received.'

          });

          console.log(
            '[STREAM] Assistant response saved.'
          );

        } catch (saveError) {

          console.error(
            '[STREAM] Failed to save assistant message:',
            saveError.message
          );

        }

      }
    );


    response.data.on(
      'error',
      (err) => {

        console.error(
          '[STREAM] Python stream error:',
          err.message
        );

        if (!res.headersSent) {

          res.status(500).json({
            error: 'Stream error'
          });

        }

      }
    );


    // PIPE PYTHON STREAM TO FRONTEND

    response.data.pipe(res);


  } catch (error) {

    console.error(
      '[STREAM] ERROR:',
      error.message
    );

    if (error.response) {

      console.error(
        '[STREAM] Python status:',
        error.response.status
      );

    }

    if (!res.headersSent) {

      res.status(500).json({

        error:
          'Failed to stream chat',

        details:
          error.message

      });

    } else {

      res.end(
        '\n[ERROR] Stream interrupted'
      );

    }

  }

});


// POST /api/chat
router.post('/', async (req, res) => {

  try {

    const {
      question,
      sessionId = 'default'
    } = req.body;

    if (!question || !question.trim()) {

      return res.status(400).json({
        error: 'Question is required'
      });

    }

    console.log('----------------------------------------');

    console.log(
      'Incoming question:',
      question
    );

    console.log(
      'Session:',
      sessionId
    );


    // UPDATE SESSION

    await Session.findOneAndUpdate(

      { sessionId },

      {
        sessionId,
        updatedAt: new Date()
      },

      {
        upsert: true,
        new: true
      }

    );


    // SAVE USER MESSAGE

    await Message.create({

      sessionId,

      role: 'user',

      content: question

    });


    // CALL PYTHON RAG

    const ragResponse =
      await axios.post(

        `${RAG_SERVICE_URL}/chat`,

        {
          question,
          session_id: sessionId
        },

        {
          timeout: 800000
        }

      );


    const answer =
      ragResponse.data?.answer ||
      'No answer.';


    // SAVE ASSISTANT MESSAGE

    await Message.create({

      sessionId,

      role: 'assistant',

      content: answer

    });


    // RETURN COMPLETE RESPONSE

    res.json({

      answer,

      sessionId

    });


  } catch (error) {

    console.error(
      'ERROR IN /api/chat:',
      error.message
    );

    res.status(500).json({

      error:
        'Failed to process chat',

      details:
        error.message

    });

  }

});


// GET SESSION MESSAGES
router.get(
  '/messages/:sessionId',
  async (req, res) => {

    try {

      const {
        sessionId
      } = req.params;


      const messages =
        await Message
          .find({
            sessionId
          })
          .sort({
            timestamp: 1
          });


      res.json(messages);


    } catch (error) {

      console.error(
        'Error loading messages:',
        error.message
      );

      res.status(500).json({

        error:
          'Failed to load messages'

      });

    }

  }
);



// GET SESSIONS
router.get(
  '/sessions',
  async (req, res) => {

    try {

      const sessions =
        await Session
          .find()
          .sort({
            updatedAt: -1
          });


      res.json(sessions);


    } catch (error) {

      console.error(
        'Error loading sessions:',
        error.message
      );

      res.status(500).json({

        error:
          'Failed to load sessions'

      });

    }

  }
);


module.exports = router;