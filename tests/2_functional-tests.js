const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {
  this.timeout(10000);

  let threadId, replyId;
  const board = 'testboard';

  test('Creating a new thread', done => {
    chai.request(server).post(`/api/threads/${board}`)
      .send({ text: 'Test thread', delete_password: 'pass' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body.text, 'Test thread');
        threadId = res.body._id;
        done();
      });
  });

  test('Viewing the 10 most recent threads with 3 replies each', done => {
    chai.request(server).get(`/api/threads/${board}`)
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.isAtMost(res.body.length, 10);
        assert.isAtMost(res.body[0].replies.length, 3);
        assert.notProperty(res.body[0], 'delete_password');
        assert.notProperty(res.body[0], 'reported');
        done();
      });
  });

  test('Creating a new reply', done => {
    chai.request(server).post(`/api/replies/${board}`)
      .send({ text: 'Test reply', delete_password: 'rpass', thread_id: threadId })
      .end((err, res) => {
        assert.equal(res.status, 200);
        const replies = res.body.replies;
        assert.equal(replies[replies.length - 1].text, 'Test reply');
        replyId = replies[replies.length - 1]._id;
        done();
      });
  });

  test('Viewing a single thread with all replies', done => {
    chai.request(server).get(`/api/replies/${board}`)
      .query({ thread_id: threadId })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body._id, threadId);
        assert.isArray(res.body.replies);
        assert.notProperty(res.body, 'delete_password');
        done();
      });
  });

  test('Reporting a reply', done => {
    chai.request(server).put(`/api/replies/${board}`)
      .send({ thread_id: threadId, reply_id: replyId })
      .end((err, res) => {
        assert.equal(res.text, 'reported');
        done();
      });
  });

  test('Deleting a reply with the incorrect password', done => {
    chai.request(server).delete(`/api/replies/${board}`)
      .send({ thread_id: threadId, reply_id: replyId, delete_password: 'wrong' })
      .end((err, res) => {
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  test('Deleting a reply with the correct password', done => {
    chai.request(server).delete(`/api/replies/${board}`)
      .send({ thread_id: threadId, reply_id: replyId, delete_password: 'rpass' })
      .end((err, res) => {
        assert.equal(res.text, 'success');
        done();
      });
  });

  test('Reporting a thread', done => {
    chai.request(server).put(`/api/threads/${board}`)
      .send({ thread_id: threadId })
      .end((err, res) => {
        assert.equal(res.text, 'reported');
        done();
      });
  });

  test('Deleting a thread with the incorrect password', done => {
    chai.request(server).delete(`/api/threads/${board}`)
      .send({ thread_id: threadId, delete_password: 'wrong' })
      .end((err, res) => {
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  test('Deleting a thread with the correct password', done => {
    chai.request(server).delete(`/api/threads/${board}`)
      .send({ thread_id: threadId, delete_password: 'pass' })
      .end((err, res) => {
        assert.equal(res.text, 'success');
        done();
      });
  });
});