import { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import PostCard from '../../components/PostCard';
import api from '../../services/api';

type Post = {
  id: number;
  title: string;
  body: string;
  userId: number;
};

export default function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/posts')
      .then(res => setPosts(res.data))
      .catch(() => setError('Failed to load posts.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <PostCard
          title={item.title}
          body={item.body}
          userId={item.userId}
        />
      )}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  error: {
    color: 'red',
    fontSize: 14,
  },
});