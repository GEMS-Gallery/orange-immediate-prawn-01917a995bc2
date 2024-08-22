import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useParams } from 'react-router-dom';
import { backend } from 'declarations/backend';
import { Box, Card, CardContent, Typography, Grid, Icon } from '@mui/material';
import * as Icons from '@mui/icons-material';

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        await backend.ensureDefaultCategories();
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

  if (loading) return <Box>Loading...</Box>;
  if (error) return <Box>{error}</Box>;

  return (
    <Box className="container">
      <Box className="header">
        <Typography variant="h1">Hacker Forum</Typography>
        <Typography variant="subtitle1">Welcome to the underground</Typography>
      </Box>
      <Grid container spacing={3} className="categories">
        {categories.map((category) => (
          <Grid item xs={12} sm={6} md={4} key={category.id}>
            <Card className="category">
              <CardContent>
                <Icon component={(Icons as any)[category.icon]} fontSize="large" />
                <Typography variant="h5">{category.name}</Typography>
                <Typography variant="body2">{category.description}</Typography>
                <Link to={`/category/${category.id}`}>Enter</Link>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
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

  if (loading) return <Box>Loading...</Box>;
  if (error) return <Box>{error}</Box>;

  return (
    <Box className="container">
      <Typography variant="h2">Topics</Typography>
      <Box className="topics">
        {topics.map((topic) => (
          <Card key={topic.id} className="topic">
            <CardContent>
              <Typography variant="h5">{topic.title}</Typography>
              <Typography variant="body2">{topic.content}</Typography>
              <Link to={`/topic/${topic.id}`}>View Replies</Link>
            </CardContent>
          </Card>
        ))}
      </Box>
      <form onSubmit={handleCreateTopic}>
        <Typography variant="h3">Create New Topic</Typography>
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
    </Box>
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
    <Box className="replies" style={{ marginLeft: `${depth * 20}px` }}>
      {replies
        .filter((reply) => reply.parentReplyId === parentId)
        .map((reply) => (
          <Box key={reply.id} className="reply">
            <Typography>{reply.content}</Typography>
            <button onClick={() => setNewReply({ ...newReply, parentReplyId: reply.id })}>
              Reply
            </button>
            {renderReplies(reply.id, depth + 1)}
          </Box>
        ))}
    </Box>
  );

  if (loading) return <Box>Loading...</Box>;
  if (error) return <Box>{error}</Box>;

  return (
    <Box className="container">
      <Typography variant="h2">Replies</Typography>
      {renderReplies()}
      <form onSubmit={handleCreateReply}>
        <Typography variant="h3">Post a Reply</Typography>
        <textarea
          placeholder="Your Reply"
          value={newReply.content}
          onChange={(e) => setNewReply({ ...newReply, content: e.target.value })}
        />
        <button type="submit">Post Reply</button>
      </form>
    </Box>
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
