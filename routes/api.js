'use strict';
const bcrypt = require('bcrypt');
const { Thread } = require('../models');

module.exports = function (app) {

  app.route('/api/threads/:board')

    // Create thread
    .post(async (req, res) => {
      const { text, delete_password } = req.body;
      const board = req.params.board;
      const hash = await bcrypt.hash(delete_password, 10);
      const now = new Date();
      const thread = await Thread.create({
        board, text, delete_password: hash,
        created_on: now, bumped_on: now, reported: false, replies: []
      });
      res.json(thread);
    })

    // 10 most recent threads, 3 replies each
    .get(async (req, res) => {
      const threads = await Thread.find({ board: req.params.board })
        .sort({ bumped_on: -1 })
        .limit(10)
        .lean();
      const cleaned = threads.map(t => ({
        _id: t._id,
        text: t.text,
        created_on: t.created_on,
        bumped_on: t.bumped_on,
        replycount: t.replies.length,
        replies: t.replies
          .sort((a, b) => b.created_on - a.created_on)
          .slice(0, 3)
          .map(r => ({ _id: r._id, text: r.text, created_on: r.created_on }))
      }));
      res.json(cleaned);
    })

    // Delete thread
    .delete(async (req, res) => {
      const { thread_id, delete_password } = req.body;
      const thread = await Thread.findById(thread_id);
      if (!thread) return res.send('incorrect password');
      const ok = await bcrypt.compare(delete_password, thread.delete_password);
      if (!ok) return res.send('incorrect password');
      await Thread.findByIdAndDelete(thread_id);
      res.send('success');
    })

    // Report thread
    .put(async (req, res) => {
      const { thread_id } = req.body;
      await Thread.findByIdAndUpdate(thread_id, { reported: true });
      res.send('reported');
    });

  app.route('/api/replies/:board')

    // Create reply
    .post(async (req, res) => {
      const { text, delete_password, thread_id } = req.body;
      const hash = await bcrypt.hash(delete_password, 10);
      const now = new Date();
      const thread = await Thread.findById(thread_id);
      if (!thread) return res.send('thread not found');
      thread.replies.push({
        text, delete_password: hash, created_on: now, reported: false
      });
      thread.bumped_on = now;
      await thread.save();
      res.json(thread);
    })

    // Whole thread with all replies
    .get(async (req, res) => {
      const t = await Thread.findById(req.query.thread_id).lean();
      if (!t) return res.json({});
      res.json({
        _id: t._id,
        text: t.text,
        created_on: t.created_on,
        bumped_on: t.bumped_on,
        replies: t.replies.map(r => ({
          _id: r._id, text: r.text, created_on: r.created_on
        }))
      });
    })

    // Delete reply (text becomes [deleted])
    .delete(async (req, res) => {
      const { thread_id, reply_id, delete_password } = req.body;
      const thread = await Thread.findById(thread_id);
      if (!thread) return res.send('incorrect password');
      const reply = thread.replies.id(reply_id);
      if (!reply) return res.send('incorrect password');
      const ok = await bcrypt.compare(delete_password, reply.delete_password);
      if (!ok) return res.send('incorrect password');
      reply.text = '[deleted]';
      await thread.save();
      res.send('success');
    })

    // Report reply
    .put(async (req, res) => {
      const { thread_id, reply_id } = req.body;
      const thread = await Thread.findById(thread_id);
      if (thread) {
        const reply = thread.replies.id(reply_id);
        if (reply) {
          reply.reported = true;
          await thread.save();
        }
      }
      res.send('reported');
    });
};