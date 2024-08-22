import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useParams } from 'react-router-dom';
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
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const result = await backend.getCategories();
        setCategories(result);
        setError(null);
      } catch (err) {
        setError('Failed to fetch categories. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const categoryId = await backend.createCategory(newCategory.name, newCategory.description);
      setCategories([...categories, { ...newCategory, id: categoryId }]);
      setNewCategory({ name: '', description: '' });
    } catch (err) {
      setError('Failed to create category. Please try again.');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

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
      <form onSubmit={handleCreateCategory}>
        <h3>Create New Category</h3>
        <input
          type="text"
          placeholder="Category Name"
          value={newCategory.name}
          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
        />
        <textarea
          placeholder="Category Description"
          value={newCategory.description}
          onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
        />
        <button type="submit">Create Category</button>
      </form>
    </div>
  );
};

const Category: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [newTopic, setNewTopic] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true);
        const result = await backend.getTopics(categoryId!);
        setTopics(result);
        setError(null);
      } catch (err) {
        setError('Failed to fetch topics. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, [categoryId]);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const topicId = await backend.createTopic(categoryId!, newTopic.title, newTopic.content);
      setTopics([...topics, { ...newTopic, id: topicId, categoryId: categoryId!, createdAt: BigInt(Date.now()) }]);
      setNewTopic({ title: '', content: '' });
    } catch (err) {
      setError('Failed to create topic. Please try again.');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

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
        <h3>Create New Topic</h3>
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

const Topic: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState({ content: '', parentReplyId: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReplies = async () => {
      try {
        setLoading(true);
        const result = await backend.getReplies(topicId!);
        setReplies(result);
        setError(null);
      } catch (err) {
        setError('Failed to fetch replies. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchReplies();
  }, [topicId]);

  const handleCreateReply = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const replyId = await backend.createReply(topicId!, newReply.content, newReply.parentReplyId);
      setReplies([...replies, { ...newReply, id: replyId, topicId: topicId!, createdAt: BigInt(Date.now()) }]);
      setNewReply({ content: '', parentReplyId: null });
    } catch (err) {
      setError('Failed to create reply. Please try again.');
    }
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="container">
      <h2>Replies</h2>
      {renderReplies()}
      <form onSubmit={handleCreateReply}>
        <h3>Post a Reply</h3>
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
      <Route path="/category/:categoryId" element={<Category />} />
      <Route path="/topic/:topicId" element={<Topic />} />
    </Routes>
  );
};

export default App;
