import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { backend } from 'declarations/backend';

interface Category {
  id: string;
  name: string;
  description: string;
}

interface Topic {
  id: string;
  categoryId: string;
  title: string;
  content: string;
  createdAt: bigint;
}

interface Reply {
  id: string;
  topicId: string;
  content: string;
  parentReplyId: string | null;
  createdAt: bigint;
}

const Home: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const result = await backend.getCategories();
      setCategories(result);
    };
    fetchCategories();
  }, []);

  return (
    <div className="container">
      <header className="header">
        <h1>Hacker Forum</h1>
        <p>Welcome to the underground</p>
      </header>
      <div className="categories">
        {categories.map((category) => (
          <div key={category.id} className="category">
            <h2>{category.name}</h2>
            <p>{category.description}</p>
            <Link to={`/category/${category.id}`}>Enter</Link>
          </div>
        ))}
      </div>
    </div>
  );
};

const Category: React.FC<{ categoryId: string }> = ({ categoryId }) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [newTopic, setNewTopic] = useState({ title: '', content: '' });

  useEffect(() => {
    const fetchTopics = async () => {
      const result = await backend.getTopics(categoryId);
      setTopics(result);
    };
    fetchTopics();
  }, [categoryId]);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    const topicId = await backend.createTopic(categoryId, newTopic.title, newTopic.content);
    setTopics([...topics, { ...newTopic, id: topicId, categoryId, createdAt: BigInt(Date.now()) }]);
    setNewTopic({ title: '', content: '' });
  };

  return (
    <div className="container">
      <h2>Topics</h2>
      <div className="topics">
        {topics.map((topic) => (
          <div key={topic.id} className="topic">
            <h3>{topic.title}</h3>
            <p>{topic.content}</p>
            <Link to={`/topic/${topic.id}`}>View Replies</Link>
          </div>
        ))}
      </div>
      <form onSubmit={handleCreateTopic}>
        <input
          type="text"
          placeholder="Topic Title"
          value={newTopic.title}
          onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
        />
        <textarea
          placeholder="Topic Content"
          value={newTopic.content}
          onChange={(e) => setNewTopic({ ...newTopic, content: e.target.value })}
        />
        <button type="submit">Create Topic</button>
      </form>
    </div>
  );
};

const Topic: React.FC<{ topicId: string }> = ({ topicId }) => {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState({ content: '', parentReplyId: null });

  useEffect(() => {
    const fetchReplies = async () => {
      const result = await backend.getReplies(topicId);
      setReplies(result);
    };
    fetchReplies();
  }, [topicId]);

  const handleCreateReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const replyId = await backend.createReply(topicId, newReply.content, newReply.parentReplyId);
    setReplies([...replies, { ...newReply, id: replyId, topicId, createdAt: BigInt(Date.now()) }]);
    setNewReply({ content: '', parentReplyId: null });
  };

  const renderReplies = (parentId: string | null = null, depth: number = 0): JSX.Element => (
    <div className="replies" style={{ marginLeft: `${depth * 20}px` }}>
      {replies
        .filter((reply) => reply.parentReplyId === parentId)
        .map((reply) => (
          <div key={reply.id} className="reply">
            <p>{reply.content}</p>
            <button onClick={() => setNewReply({ ...newReply, parentReplyId: reply.id })}>
              Reply
            </button>
            {renderReplies(reply.id, depth + 1)}
          </div>
        ))}
    </div>
  );

  return (
    <div className="container">
      <h2>Replies</h2>
      {renderReplies()}
      <form onSubmit={handleCreateReply}>
        <textarea
          placeholder="Your Reply"
          value={newReply.content}
          onChange={(e) => setNewReply({ ...newReply, content: e.target.value })}
        />
        <button type="submit">Post Reply</button>
      </form>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/category/:categoryId" element={<Category categoryId="" />} />
      <Route path="/topic/:topicId" element={<Topic topicId="" />} />
    </Routes>
  );
};

export default App;
