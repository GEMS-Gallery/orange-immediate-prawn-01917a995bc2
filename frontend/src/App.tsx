import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useParams } from 'react-router-dom';
import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from 'declarations/backend/backend.did.js';
import { _SERVICE } from 'declarations/backend/backend.did';
import { Box, Card, CardContent, Typography, Grid, Icon, CircularProgress, Snackbar, Button } from '@mui/material';
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

const agent = new HttpAgent();
const backend = Actor.createActor<_SERVICE>(idlFactory, { agent, canisterId: process.env.BACKEND_CANISTER_ID });

const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      console.error('Uncaught error:', error);
      setHasError(true);
    };

    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
    return <Box>Something went wrong. Please refresh the page and try again.</Box>;
  }

  return <>{children}</>;
};

const useBackendConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const result = await backend.ping();
        setIsConnected(result === 'pong');
      } catch (error) {
        console.error('Backend connection error:', error);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return { isConnected, isLoading };
};

const Home: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const { isConnected, isLoading } = useBackendConnection();

  useEffect(() => {
    const fetchCategories = async () => {
      if (!isConnected) return;
      try {
        setLoading(true);
        await backend.ensureDefaultCategories();
        const result = await backend.getCategories();
        setCategories(result);
        setError(null);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to fetch categories. Please try again.');
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [isConnected]);

  const retryFetch = () => {
    setError(null);
    setLoading(true);
    fetchCategories();
  };

  if (isLoading) return <Box display="flex" justifyContent="center"><CircularProgress /></Box>;
  if (!isConnected) return <Box>Unable to connect to the backend. Please check your internet connection and try again.</Box>;
  if (loading) return <Box display="flex" justifyContent="center"><CircularProgress /></Box>;
  if (error) return (
    <Box>
      {error}
      <Button onClick={retryFetch}>Retry</Button>
    </Box>
  );

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
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message="Error fetching data. Please check your connection and try again."
      />
    </Box>
  );
};

const Category: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [newTopic, setNewTopic] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isConnected } = useBackendConnection();

  useEffect(() => {
    const fetchTopics = async () => {
      if (!isConnected) return;
      try {
        setLoading(true);
        const result = await backend.getTopics(categoryId!);
        setTopics(result);
        setError(null);
      } catch (err) {
        console.error('Error fetching topics:', err);
        setError('Failed to fetch topics. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, [categoryId, isConnected]);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      setError('Unable to create topic. Please check your connection.');
      return;
    }
    try {
      const topicId = await backend.createTopic(categoryId!, newTopic.title, newTopic.content);
      setTopics([...topics, { ...newTopic, id: topicId, categoryId: categoryId!, createdAt: BigInt(Date.now()) }]);
      setNewTopic({ title: '', content: '' });
    } catch (err) {
      console.error('Error creating topic:', err);
      setError('Failed to create topic. Please try again.');
    }
  };

  if (!isConnected) return <Box>Unable to connect to the backend. Please check your internet connection and try again.</Box>;
  if (loading) return <Box display="flex" justifyContent="center"><CircularProgress /></Box>;
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
        <Button type="submit" variant="contained" color="primary">Create Topic</Button>
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
  const { isConnected } = useBackendConnection();

  useEffect(() => {
    const fetchReplies = async () => {
      if (!isConnected) return;
      try {
        setLoading(true);
        const result = await backend.getReplies(topicId!);
        setReplies(result);
        setError(null);
      } catch (err) {
        console.error('Error fetching replies:', err);
        setError('Failed to fetch replies. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchReplies();
  }, [topicId, isConnected]);

  const handleCreateReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      setError('Unable to create reply. Please check your connection.');
      return;
    }
    try {
      const replyId = await backend.createReply(topicId!, newReply.content, newReply.parentReplyId);
      setReplies([...replies, { ...newReply, id: replyId, topicId: topicId!, createdAt: BigInt(Date.now()) }]);
      setNewReply({ content: '', parentReplyId: null });
    } catch (err) {
      console.error('Error creating reply:', err);
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
            <Button onClick={() => setNewReply({ ...newReply, parentReplyId: reply.id })}>
              Reply
            </Button>
            {renderReplies(reply.id, depth + 1)}
          </Box>
        ))}
    </Box>
  );

  if (!isConnected) return <Box>Unable to connect to the backend. Please check your internet connection and try again.</Box>;
  if (loading) return <Box display="flex" justifyContent="center"><CircularProgress /></Box>;
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
        <Button type="submit" variant="contained" color="primary">Post Reply</Button>
      </form>
    </Box>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/category/:categoryId" element={<Category />} />
        <Route path="/topic/:topicId" element={<Topic />} />
      </Routes>
    </ErrorBoundary>
  );
};

export default App;
