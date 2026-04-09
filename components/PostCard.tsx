import { View, Text, StyleSheet } from 'react-native';

type Props = {
  title: string;
  body: string;
  userId: number;
};

export default function PostCard({ title, body, userId }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.userId}>User #{userId}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  userId: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  body: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
});